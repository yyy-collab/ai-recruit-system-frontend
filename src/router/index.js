import { createRouter, createWebHistory } from 'vue-router';
import { constantRoutes, hrRoutes, seekerRoutes } from './routes';
import { useUserStore } from '@/stores/user';
import { ElMessage } from 'element-plus';

const router = createRouter({
  history: createWebHistory(),
  routes: [...constantRoutes, hrRoutes, seekerRoutes],
});

router.beforeEach((to, from, next) => {
  const userStore = useUserStore();
  let token = userStore.token;
  let role = userStore.role;

  // 如果 token 存在但 role 为空，尝试从 localStorage 恢复（保险）
  if (token && !role) {
    const savedRole = localStorage.getItem('user_role');
    if (savedRole) {
      userStore.setRole(savedRole);
      role = savedRole;
    }
  }

  // 公开页面放行（包括重置密码）
  if (to.path === '/role-select' || to.path === '/login' || to.path === '/register' || to.path === '/reset-pwd') {
    next();
    return;
  }

  if (!token) {
    ElMessage.warning('请先登录');
    next('/role-select');
    return;
  }

  if (to.path.startsWith('/hr') && role !== 'hr') {
    ElMessage.error('无权限');
    next('/role-select');
    return;
  }

  if (to.path.startsWith('/seeker') && role !== 'seeker') {
    ElMessage.error('无权限');
    next('/role-select');
    return;
  }

  next();
});

export default router;