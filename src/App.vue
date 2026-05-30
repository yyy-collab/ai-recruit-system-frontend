<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();

onMounted(() => {
  if (userStore.token && userStore.role) {
    userStore.fetchUserInfo(); // 刷新用户信息到 store 和 localStorage
  }
});
</script>