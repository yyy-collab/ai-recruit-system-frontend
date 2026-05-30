// src/composables/useRole.js
import { useUserStore } from '@/stores/user';
import { computed } from 'vue';

export function useRole() {
  const userStore = useUserStore();
  const isSeeker = computed(() => userStore.role === 'seeker');
  const isHr = computed(() => userStore.role === 'hr');
  const isLogin = computed(() => !!userStore.token);
  return { isSeeker, isHr, isLogin };
}