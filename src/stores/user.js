import { defineStore } from 'pinia';
import { getSeekerInfo } from '@/api/modules/seeker';
import { getHrInfo } from '@/api/modules/hr';
import { setToken as setTokenToStorage, removeToken as removeTokenFromStorage } from '@/utils/auth';

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('ai_hr_token') || null,
    role: localStorage.getItem('user_role') || null,           
    userInfo: (() => {
      const saved = localStorage.getItem('user_info');
      return saved ? JSON.parse(saved) : null;
    })(),                                                     
    isInfoComplete: false,
  }),
  actions: {
    setToken(token) {
      this.token = token;
      localStorage.setItem('ai_hr_token', token);
    },
    setRole(role) {
      this.role = role;
      if (role) {
        localStorage.setItem('user_role', role);
      } else {
        localStorage.removeItem('user_role');
      }
    },
    setUserInfo(info) {
      this.userInfo = { ...this.userInfo, ...info };
      // 持久化用户名、头像等（不存敏感信息）
      const persistData = {
        id: this.userInfo.id,
        user_id: this.userInfo.user_id,
        userId: this.userInfo.userId,
        hr_id: this.userInfo.hr_id,
        hrId: this.userInfo.hrId,
        seeker_id: this.userInfo.seeker_id,
        seekerId: this.userInfo.seekerId,
        username: this.userInfo.username,
        real_name: this.userInfo.real_name,
        realName: this.userInfo.realName,
        avatar_url: this.userInfo.avatar_url,
      };
      localStorage.setItem('user_info', JSON.stringify(persistData));
    },
    async fetchUserInfo() {
      if (!this.token || !this.role) return;
      try {
        const res = this.role === 'seeker' ? await getSeekerInfo() : await getHrInfo();
        if (res.code === 0 && res.data) {
          this.setUserInfo(res.data);
        } else {
          console.warn('获取用户信息失败', res);
        }
      } catch (error) {
        console.error('fetchUserInfo 网络错误', error);
      }
    },
    logout() {
      this.token = null;
      this.role = null;
      this.userInfo = null;
      this.isInfoComplete = false;
      localStorage.removeItem('ai_hr_token');
      localStorage.removeItem('user_role');
      localStorage.removeItem('user_info');
    },
    clearUserInfo() {
      this.logout();
    },
  },
});
