import Layout from '@/components/Layout.vue';
import Placeholder from '@/views/common/Placeholder.vue';
import HrSettings from '@/views/hr/Settings.vue';
import SeekerSettings from '@/views/seeker/Settings.vue';

export const constantRoutes = [
  { path: '/', redirect: '/role-select' },
  { path: '/role-select', name: 'RoleSelect', component: () => import('@/views/common/RoleSelect.vue') },
  { path: '/login', name: 'Login', component: () => import('@/views/common/Login.vue') },
  { path: '/register', name: 'Register', component: () => import('@/views/common/Register.vue') },
  { path: '/reset-pwd',name: 'ResetPwd',component: () => import('@/views/common/ResetPwd.vue')}
];

export const hrRoutes = {
  path: '/hr',
  component: Layout,
  redirect: '/hr/jobs',   // 重定向到职位管理
  children: [
    { path: 'messages', component: Placeholder, meta: { title: '消息通知' } },
    { path: 'jobs', component: Placeholder, meta: { title: '职位管理' } },
    { path: 'smart-pool', component: Placeholder, meta: { title: '智能筛选池' } },
    { path: 'settings', component: HrSettings, meta: { title: '账号设置' } },
  ]
};

export const seekerRoutes = {
  path: '/seeker',
  component: Layout,
  redirect: '/seeker/resume',
  children: [
    { path: 'resume', component: Placeholder, meta: { title: '我的简历' } },
    { path: 'jobs', component: Placeholder, meta: { title: '发现职位' } },
    { path: 'messages', component: Placeholder, meta: { title: '消息通知' } },
    { path: 'settings', component: SeekerSettings, meta: { title: '账号设置' } },
  ]
};