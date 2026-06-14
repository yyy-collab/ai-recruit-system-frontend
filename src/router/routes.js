import Layout from '@/components/Layout.vue';
import HrMessages from '@/views/hr/HRMessageList.vue';
import SeekerMessages from '@/views/seeker/SeekerMessageList.vue';
import HrSettings from '@/views/hr/Settings.vue';
import HrJobs from '@/views/hr/Jobs.vue';
import HrCreateJob from '@/views/hr/jobs/CreateJob.vue';
import HrSmartPool from '@/views/hr/SmartPool.vue';
import SeekerResume from '@/views/seeker/ResumeCenter.vue';
import SeekerJobs from '@/views/seeker/Jobs.vue';
import SeekerSettings from '@/views/seeker/Settings.vue';
import Placeholder from '@/views/common/Placeholder.vue';

export const constantRoutes = [
  { path: '/', redirect: '/role-select' },
  { path: '/role-select', name: 'RoleSelect', component: () => import('@/views/common/RoleSelect.vue') },
  { path: '/login', name: 'Login', component: () => import('@/views/common/Login.vue') },
  { path: '/register', name: 'Register', component: () => import('@/views/common/Register.vue') },
  { path: '/reset-pwd', name: 'ResetPwd', component: () => import('@/views/common/ResetPwd.vue') }
];

export const hrRoutes = {
  path: '/hr',
  component: Layout,
  redirect: '/hr/messages',   // 临时重定向到消息页
  children: [
    { path: 'messages', component: HrMessages, meta: { title: '消息通知' } },
    { path: 'jobs', component: HrJobs, meta: { title: '职位管理' } },
    { path: 'jobs/create', name: 'HrCreateJob', component: HrCreateJob, meta: { title: '发布新职位' } },
    { path: 'smart-pool', component: HrSmartPool, meta: { title: '智能筛选池' } },
    { path: 'settings', component: HrSettings, meta: { title: '账号设置' } },
  ]
};

export const seekerRoutes = {
  path: '/seeker',
  component: Layout,
  redirect: '/seeker/messages',   // 临时重定向到消息页
  children: [
    { path: 'resume', component: SeekerResume, meta: { title: '我的简历' } },
    { path: 'jobs', component: SeekerJobs, meta: { title: '发现职位' } },
    { path: 'messages', component: SeekerMessages, meta: { title: '消息通知' } },
    { path: 'settings', component: SeekerSettings, meta: { title: '账号设置' } },
  ]
};