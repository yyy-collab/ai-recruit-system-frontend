<template>
  <el-container class="layout-shell">
    <el-aside width="168px" class="app-sidebar">
      <div>
        <div class="brand">
          <span class="brand-mark">
            <el-icon><DataAnalysis /></el-icon>
          </span>
          <span class="brand-name">{{ brandText }}</span>
        </div>

        <el-menu
          :default-active="activeMenu"
          router
          class="side-menu"
          background-color="#ffffff"
          text-color="#7f8da3"
          active-text-color="#4f46e5"
        >
          <template v-if="userStore.role === 'hr'">
            <el-menu-item index="/hr/jobs">
              <el-icon><Briefcase /></el-icon>
              <span>职位管理</span>
            </el-menu-item>
            <el-menu-item index="/hr/smart-pool">
              <el-icon><Search /></el-icon>
              <span>智能筛选池</span>
            </el-menu-item>
            <el-menu-item index="/hr/messages">
              <el-icon><Bell /></el-icon>
              <span>消息通知</span>
            </el-menu-item>
          </template>

          <template v-else-if="userStore.role === 'seeker'">
            <el-menu-item index="/seeker/jobs">
              <el-icon><Briefcase /></el-icon>
              <span>发现职位</span>
            </el-menu-item>
            <el-menu-item index="/seeker/resume">
              <el-icon><Document /></el-icon>
              <span>我的简历</span>
            </el-menu-item>
            <el-menu-item index="/seeker/messages">
              <el-icon><ChatDotRound /></el-icon>
              <span>消息通知</span>
            </el-menu-item>
          </template>

          <template v-else>
            <el-menu-item index="/">
              <el-icon><HomeFilled /></el-icon>
              <span>首页</span>
            </el-menu-item>
          </template>

          <div class="menu-section-title">设置</div>
          <el-menu-item :index="settingsPath">
            <el-icon><Setting /></el-icon>
            <span>账号设置</span>
          </el-menu-item>
        </el-menu>
      </div>

      <el-dropdown trigger="click" @command="handleUserCommand" placement="top-start">
        <div class="profile-entry">
          <el-avatar :size="26" :src="userStore.userInfo?.avatar_url || defaultAvatar">
            {{ userName.slice(0, 1) }}
          </el-avatar>
          <div class="profile-text">
            <strong>{{ userName }}</strong>
            <span>{{ userStore.role === 'hr' ? '招聘经理' : '候选人' }}</span>
          </div>
          <el-icon class="profile-arrow"><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="logout">退出登录</el-dropdown-item>
            <el-dropdown-item command="delete">注销账号</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </el-aside>

    <el-main class="page-main">
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useUserStore } from '@/stores/user';
import { valueOf } from '@/utils/view';
import {
  ArrowDown,
  Bell,
  Briefcase,
  ChatDotRound,
  DataAnalysis,
  Document,
  HomeFilled,
  Search,
  Setting,
} from '@element-plus/icons-vue';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png';

const activeMenu = computed(() => route.path);
const settingsPath = computed(() => (userStore.role === 'seeker' ? '/seeker/settings' : '/hr/settings'));
function readCachedUserInfo() {
  const cached = localStorage.getItem('user_info');
  if (!cached) return {};

  try {
    return JSON.parse(cached);
  } catch (error) {
    return {};
  }
}

const brandText = computed(() => {
  const info = userStore.userInfo || readCachedUserInfo();
  const currentUserLabel = valueOf(
    info,
    ['username', 'id', 'user_id', 'userId', 'hr_id', 'hrId', 'seeker_id', 'seekerId'],
  );
  return currentUserLabel ? String(currentUserLabel) : 'AI-Hire';
});

const userName = computed(() => {
  const info = userStore.userInfo || readCachedUserInfo();
  if (info.real_name || info.realName || info.username) {
    return info.real_name || info.realName || info.username;
  }

  const cachedInfo = readCachedUserInfo();
  if (cachedInfo.real_name || cachedInfo.realName || cachedInfo.username) {
    return cachedInfo.real_name || cachedInfo.realName || cachedInfo.username;
  }

  const cached = localStorage.getItem('user_info');
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      return parsed.real_name || parsed.realName || parsed.username || '用户';
    } catch (error) {
      return '用户';
    }
  }
  return '用户';
});

async function handleUserCommand(command) {
  if (command === 'logout') {
    try {
      await ElMessageBox.confirm('确定退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      });

      try {
        if (userStore.role === 'hr') {
          const { logoutHr } = await import('@/api/modules/hr');
          await logoutHr();
        } else if (userStore.role === 'seeker') {
          const { logoutSeeker } = await import('@/api/modules/seeker');
          await logoutSeeker();
        }
      } catch (error) {
        console.warn('登出接口调用失败，继续清理本地状态', error);
      }

      userStore.logout();
      ElMessage.success('已退出登录');
      router.push('/role-select');
    } catch (error) {
      // User cancelled.
    }
    return;
  }

  if (command === 'delete') {
    try {
      const { value } = await ElMessageBox.prompt('请输入登录密码以确认注销账号', '注销账号', {
        confirmButtonText: '确认注销',
        cancelButtonText: '取消',
        inputType: 'password',
        inputPlaceholder: '请输入密码',
        inputValidator: (value) => Boolean(value) || '密码不能为空',
      });

      const currentRole = userStore.role;
      let res;
      if (currentRole === 'hr') {
        const { deleteHr } = await import('@/api/modules/hr');
        res = await deleteHr({ password: value });
      } else if (currentRole === 'seeker') {
        const { deleteSeeker } = await import('@/api/modules/seeker');
        res = await deleteSeeker({ password: value });
      }

      if (res?.code === 0) {
        userStore.logout();
        ElMessage.success('账号已注销');
        router.push(`/register?role=${currentRole || ''}`);
      }
    } catch (error) {
      if (error !== 'cancel' && error !== 'close') {
        ElMessage.error(error?.msg || '注销失败');
      }
    }
  }
}
</script>

<style scoped>
.layout-shell {
  min-height: 100vh;
  background: #f6f7fb;
}

.app-sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: #ffffff;
  border-right: 1px solid #edf0f5;
  box-shadow: 2px 0 8px rgba(33, 44, 69, 0.04);
}

.brand {
  height: 58px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 20px;
}

.brand-mark {
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  color: #ffffff;
  background: #4f46e5;
  font-size: 15px;
}

.brand-name {
  font-size: 14px;
  font-weight: 800;
  color: #171923;
  font-style: italic;
}

.side-menu {
  border-right: 0;
  padding: 12px 10px;
}

.side-menu :deep(.el-menu-item) {
  height: 34px;
  margin: 8px 2px;
  padding: 0 12px !important;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
}

.side-menu :deep(.el-menu-item .el-icon) {
  width: 16px;
  margin-right: 9px;
  color: #8b9ab0;
}

.side-menu :deep(.el-menu-item.is-active) {
  background: #eef0ff !important;
  color: #4f46e5 !important;
  box-shadow: inset -2px 0 0 #4f46e5;
}

.side-menu :deep(.el-menu-item.is-active .el-icon) {
  color: #4f46e5;
}

.side-menu :deep(.el-menu-item:hover) {
  background: #f4f6ff !important;
  color: #4f46e5 !important;
}

.menu-section-title {
  margin: 24px 12px 8px;
  font-size: 10px;
  line-height: 1;
  color: #b5c0cf;
  font-weight: 800;
}

.profile-entry {
  min-height: 58px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  cursor: pointer;
  border-top: 1px solid #f0f2f6;
}

.profile-text {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.profile-text strong {
  overflow: hidden;
  color: #202536;
  font-size: 11px;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-text span {
  overflow: hidden;
  color: #9aa6b8;
  font-size: 10px;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-arrow {
  color: #b4bdcc;
  font-size: 12px;
}

.page-main {
  min-width: 0;
  min-height: 100vh;
  padding: 0;
  background: #f6f7fb;
  color: #141824;
}
</style>
