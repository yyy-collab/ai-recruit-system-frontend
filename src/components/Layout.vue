<template>
  <el-container class="layout-container">
    <!-- 左侧边栏（白色背景） -->
    <el-aside width="240px" class="sidebar">
      <div class="logo">
        <el-icon :size="28" color="#4F46E5"><DataAnalysis /></el-icon>
        <h2>AI-Hire</h2>
      </div>

      <!-- 动态菜单：根据角色渲染不同顺序 -->
      <el-menu
        :default-active="activeMenu"
        router
        class="menu"
        background-color="#ffffff"
        text-color="#000000"
        active-text-color="#4F46E5"
      >
        <!-- HR 菜单 -->
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
          <el-icon><Message /></el-icon>
          <span>消息通知</span>
        </el-menu-item>
        <el-menu-item index="/hr/settings">
          <el-icon><Setting /></el-icon>
          <span>账号设置</span>
        </el-menu-item>
      </template>

      <!-- 求职者菜单 -->
      <template v-else-if="userStore.role === 'seeker'">
        <el-menu-item index="/seeker/resume">
          <el-icon><Document /></el-icon>
          <span>我的简历</span>
        </el-menu-item>
        <el-menu-item index="/seeker/jobs">
          <el-icon><Search /></el-icon>
          <span>发现职位</span>
        </el-menu-item>
        <el-menu-item index="/seeker/messages">
          <el-icon><Message /></el-icon>
          <span>消息通知</span>
        </el-menu-item>
        <el-menu-item index="/seeker/settings">
          <el-icon><Setting /></el-icon>
          <span>账号设置</span>
        </el-menu-item>
      </template>

        <!-- 未登录或角色未知时显示默认菜单（可选） -->
        <template v-else>
          <el-menu-item index="/">
            <el-icon><HomeFilled /></el-icon>
            <span>首页</span>
          </el-menu-item>
        </template>
      </el-menu>

      <!-- 底部用户信息 -->
      <div class="user-section">
        <el-dropdown trigger="click" @command="handleUserCommand" placement="top-end">
          <div class="user-info">
            <el-avatar :size="36" :src="userStore.userInfo?.avatar_url || defaultAvatar">
              {{ userName.charAt(0) }}
            </el-avatar>
            <div class="user-details">
              <div class="user-name">{{ userName }}</div>
              <div class="user-role">{{ userStore.role === 'hr' ? '招聘经理' : '求职者' }}</div>
            </div>
            <el-icon class="arrow-icon"><ArrowDown /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              <el-dropdown-item command="delete">注销账号</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-aside>

    <!-- 右侧主内容区 -->
    <el-container>
      <el-header class="header">
        <!-- 右上角预留 -->
      </el-header>
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useUserStore } from '@/stores/user';
import {
  Briefcase, Search, Message, Setting, ArrowDown, DataAnalysis, Document, HomeFilled
} from '@element-plus/icons-vue';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png';

const activeMenu = computed(() => route.path);
const userName = computed(() => {
  const info = userStore.userInfo;
  if (info) {
    return info.username || info.real_name || '用户';
  }
  // 降级：从 localStorage 读取缓存的用户名
  const cached = localStorage.getItem('user_info');
  if (cached) {
    try {
      const { username, real_name } = JSON.parse(cached);
      return username || real_name || '用户';
    } catch (e) {}
  }
  return '用户';
});
const handleUserCommand = async (command) => {
  if (command === 'logout') {
    ElMessageBox.confirm('确定退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }).then(async () => {
      try {
        if (userStore.role === 'hr') {
          const { logoutHr } = await import('@/api/modules/hr');
          await logoutHr();
        } else if (userStore.role === 'seeker') {
          const { logoutSeeker } = await import('@/api/modules/seeker');
          await logoutSeeker();
        }
      } catch (error) {
        console.error('登出接口调用失败', error);
      }
      userStore.logout();
      ElMessage.success('已退出登录');
      router.push('/role-select');
    }).catch(() => {});
  } else if (command === 'delete') {
    ElMessageBox.prompt('请输入登录密码以确认注销账号', '注销账号', {
      confirmButtonText: '确认注销',
      cancelButtonText: '取消',
      inputType: 'password',
      inputPlaceholder: '请输入密码',
      inputValidator: (value) => {
        if (!value) return '密码不能为空';
        return true;
      },
    }).then(async ({ value }) => {
      try {
        let res;
        if (userStore.role === 'hr') {
          const { deleteHr } = await import('@/api/modules/hr');
          res = await deleteHr({ password: value });
        } else if (userStore.role === 'seeker') {
          const { deleteSeeker } = await import('@/api/modules/seeker');
          res = await deleteSeeker({ password: value });
        }
        if (res && res.code === 0) {
          userStore.logout();
          ElMessage.success('账号已注销');
          // 根据当前角色跳转到对应角色的注册页
          const roleParam = userStore.role; // 注销前保存的角色
          router.push(`/register?role=${roleParam}`);
        } else if (res && res.code === 10024) {
          ElMessage.error('请先下线所有岗位后再注销账号');
        } else if (res && res.code === 10003) {
          ElMessage.error('密码错误，注销失败');
        } else {
          ElMessage.error(res?.msg || '注销失败');
        }
      } catch (error) {
        console.error('注销异常', error);
        ElMessage.error(error.msg || '注销失败');
      }
    }).catch(() => {});
  }
};
</script>

<style scoped>
/* 样式与之前相同，可保持不变 */
.layout-container {
  height: 100vh;
}
.sidebar {
  background-color: #ffffff;
  color: #000000;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: 2px 0 8px rgba(0,0,0,0.05);
}
.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding-left: 25px;
  gap: 8px;
  border-bottom: 1px solid #f0f0f0;
}
.logo h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #000000;
}
.menu {
  flex: 1;
  border-right: none;
}
.menu .el-menu-item {
  font-size: 14px;
  height: 48px;
  line-height: 48px;
  margin: 4px 8px;
  border-radius: 8px;
}
.menu .el-menu-item.is-active {
  background-color: #f0efff !important;
  color: #4F46E5 !important;
}
.menu .el-menu-item:hover {
  background-color: #f9f9ff;
  color: #4F46E5;
}
.user-section {
  padding: 16px;
  border-top: 1px solid #f0f0f0;
  cursor: pointer;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #000000;
}
.user-avatar {
  background-color: #4F46E5;
  color: white;
  font-weight: bold;
}
.user-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;   /* 上下行间距 */
}
.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #000000;
}
.user-role {
  font-size: 12px;
  color: #666666;
}
.arrow-icon {
  font-size: 12px;
  color: #666666;
}
.header {
  background-color: #ffffff;
  border-bottom: 1px solid #e8e8e8;
  padding: 0 24px;
}
.main-content {
  background-color: #f5f7fa;
  padding: 20px;
  overflow-y: auto;
}
</style>