// Axios实例与拦截器
import axios from 'axios';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/stores/user';
import { getToken, setToken, removeToken, startRefreshTimer } from '@/utils/auth';
import { getErrorMessage } from '@/utils/errorCodes';

const baseURL = '/api';

const request = axios.create({
  baseURL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

// 是否正在刷新 token
let isRefreshing = false;
let refreshSubscribers = [];

function onTokenRefreshed(newToken) {
  refreshSubscribers.forEach(cb => cb(newToken));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb) {
  refreshSubscribers.push(cb);
}

async function callRefreshToken() {
  const { refreshToken } = await import('@/api/modules/common');
  return refreshToken();
}

// 绝对公开的路径（不需要 token）
const publicPaths = [
  '/seeker/login', '/seeker/register', '/seeker/resetPwd',
  '/hr/login', '/hr/register', '/hr/resetPwd',
  '/common/verify/code', '/common/file/upload'
];

// 请求拦截器
request.interceptors.request.use(
  config => {
    // 如果不是公开路径，则添加 token
    const isPublic = publicPaths.some(path => config.url.includes(path));
    if (!isPublic) {
      const token = getToken();
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
        console.log(`[请求] ${config.url} 已添加 token`);
      } else {
        console.warn(`[请求] ${config.url} 需要 token 但未找到`);
      }
    } else {
      console.log(`[请求] ${config.url} 为公开接口，不携带 token`);
    }
    
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  error => Promise.reject(error)
);

// 响应拦截器
request.interceptors.response.use(
  response => {
    const res = response.data;
    if (res.code === 0) return res;

    // token 过期处理（不针对 /userInfo）
    if (res.code === 10005) {
      // 如果是 /userInfo 接口，不自动清除 token
      if (response.config.url && response.config.url.includes('/userInfo')) {
        console.warn('/userInfo 返回 10005，但保留 token 尝试继续');
        return Promise.reject(res);
      }
      removeToken();
      const userStore = useUserStore();
      userStore.clearUserInfo();
      ElMessage.error(res.msg || '登录已过期，请重新登录');
      window.location.href = '/login';
      return Promise.reject(res);
    }

    return Promise.reject(res);
  },
  async error => {
    const originalRequest = error.config;
    const { response } = error;

    const isRefreshRequest = originalRequest.url.includes('refreshToken');
    if (isRefreshRequest) {
      removeToken();
      const userStore = useUserStore();
      userStore.clearUserInfo();
      ElMessage.error('登录状态已失效，请重新登录');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // 对于 /userInfo 的 401，不进行任何重试，只打印错误
    if (response?.status === 401 && originalRequest.url.includes('/userInfo')) {
      console.error('/userInfo 返回 401，请检查 token 是否正确携带');
      return Promise.reject(error);
    }

    // 401 处理其他接口
    if (response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(resolve => {
          addRefreshSubscriber(newToken => {
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            resolve(request(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshRes = await callRefreshToken();
        if (refreshRes.code === 0) {
          const newToken = refreshRes.data.token;
          setToken(newToken);
          startRefreshTimer();
          onTokenRefreshed(newToken);
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          return request(originalRequest);
        } else {
          removeToken();
          const userStore = useUserStore();
          userStore.clearUserInfo();
          ElMessage.error(getErrorMessage(refreshRes.code, '登录已过期，请重新登录'));
          window.location.href = '/login';
          return Promise.reject(refreshRes);
        }
      } catch (err) {
        removeToken();
        const userStore = useUserStore();
        userStore.clearUserInfo();
        ElMessage.error('认证失败，请重新登录');
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    if (response?.status === 403) {
      ElMessage.error('无权限操作');
      return Promise.reject(error);
    }

    const msg = response?.data?.msg || error.message || '网络错误';
    ElMessage.error(msg);
    return Promise.reject(error);
  }
);

export default request;