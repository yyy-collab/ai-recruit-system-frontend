<template>
  <div class="login-container">
    <el-card class="login-card">
      <h2>{{ role === 'hr' ? 'HR登录' : '求职者登录' }}</h2>
      <el-form :model="form" :rules="rules" ref="formRef">
        <el-form-item prop="username"><el-input v-model="form.username" placeholder="用户名" /></el-form-item>
        <el-form-item prop="password"><el-input type="password" v-model="form.password" placeholder="密码" show-password /></el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleLogin" style="width:100%">登录</el-button>
          <div class="login-links">
            <el-link @click="$router.push('/register?role='+role)">去注册</el-link>
            <el-link @click="$router.push('/reset-pwd?role='+role)">忘记密码？</el-link>
          </div>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/stores/user';
import { seekerLogin } from '@/api/modules/seeker.js';
import { hrLogin } from '@/api/modules/hr.js';
import { validateUsername, validatePassword } from '@/utils/validator';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const role = computed(() => route.query.role === 'hr' ? 'hr' : 'seeker');

const formRef = ref();
const loading = ref(false);
const form = reactive({ username: '', password: '' });
const rules = {
  username: [{ required: true, validator: (_, v, cb) => validateUsername(v) ? cb() : cb(new Error('5~16位字母数字下划线')) }],
  password: [{ required: true, validator: (_, v, cb) => validatePassword(v) ? cb() : cb(new Error('8~16位含字母数字')) }],
};

const handleLogin = async () => {
  await formRef.value.validate();
  loading.value = true;
  try {
    const loginApi = role.value === 'hr' ? hrLogin : seekerLogin;
    const res = await loginApi(form);
    if (res.code === 0) {
      const { token } = res.data;
      userStore.setToken(token);
      userStore.setRole(role.value);
      userStore.setUserInfo({ username: form.username });
      try {
        await userStore.fetchUserInfo();
      } catch (err) {
        console.warn('获取用户信息失败', err);
      }
      ElMessage.success('登录成功');
      router.push(role.value === 'hr' ? '/hr' : '/seeker');
    } else {
      ElMessage.error(res.msg || '登录失败');
    }
  } catch (err) {
    let errorMsg = '登录失败';
    if (err && typeof err === 'object') {
      errorMsg = err.msg || err.message || err.response?.data?.msg || '登录失败';
    }
    ElMessage.error(errorMsg);
    console.error('登录异常', err);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, #667eea, #764ba2);
}
.login-card {
  width: 400px;
  padding: 20px;
}
h2 {
  text-align: center;
  margin-bottom: 24px;
}
.el-button {
  width: 100%;
}
.login-links {
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
}
/* 清除el-link的浮动和边距 */
.login-links .el-link {
  float: none;
  margin: 0;
}
</style>