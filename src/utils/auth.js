//Token管理+自动刷新

import { jwtDecode } from 'jwt-decode';

const TOKEN_KEY = import.meta.env.VITE_TOKEN_KEY || 'ai_hr_token';
let refreshTimer = null;

// 获取 token
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

// 存储 token
export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
  startRefreshTimer(token);
}

// 移除 token
export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
  clearRefreshTimer();
}

// 解析 token payload
export function parseToken(token) {
  if (!token) return null;
  try {
    return jwtDecode(token);
  } catch {
    return null;
  }
}

// 启动自动刷新定时器（过期前5秒尝试刷新）
export function startRefreshTimer(token = getToken()) {
  clearRefreshTimer();
  if (!token) return;
  const decoded = parseToken(token);
  if (!decoded || !decoded.exp) return;
  const expTime = decoded.exp * 1000;
  const now = Date.now();
  const timeToExpire = expTime - now;
  // 仅在剩余时间小于30分钟且大于0时启动定时器
  if (timeToExpire <= 30 * 60 * 1000 && timeToExpire > 0) {
    const refreshDelay = timeToExpire - 5000; // 提前5秒刷新
    if (refreshDelay > 0) {
      refreshTimer = setTimeout(async () => {
        // 动态导入避免循环依赖
        const { refreshToken } = await import('@/api/modules/common');
        try {
          const res = await refreshToken();
          if (res.code === 0) {
            setToken(res.data.token);
          } else {
            // 刷新失败（如超出次数），强制登出
            removeToken();
            window.location.href = '/login';
          }
        } catch (err) {
          console.error('自动刷新token失败', err);
          removeToken();
          window.location.href = '/login';
        }
      }, refreshDelay);
    }
  }
}

// 清除定时器
export function clearRefreshTimer() {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
}