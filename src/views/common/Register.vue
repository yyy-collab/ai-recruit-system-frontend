<template>
  <div class="register-container">
    <el-card class="register-card">
      <h2>{{ role === 'hr' ? 'HR注册' : '求职者注册' }}</h2>
      <el-form :model="form" :rules="rules" ref="formRef">
        <el-form-item prop="username"><el-input v-model="form.username" placeholder="用户名" /></el-form-item>
        <el-form-item prop="password"><el-input type="password" v-model="form.password" placeholder="密码" show-password /></el-form-item>
        <el-form-item prop="confirmPassword"><el-input type="password" v-model="form.confirmPassword" placeholder="确认密码" show-password /></el-form-item>
        <el-form-item><el-button type="primary" :loading="loading" @click="handleRegister">注册</el-button><el-link @click="$router.push('/login?role='+role)">去登录</el-link></el-form-item>
      </el-form>
    </el-card>
  </div>
</template>
<script setup>
import { ref, reactive, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { seekerRegister } from '@/api/modules/seeker.js';
import { hrRegister } from '@/api/modules/hr.js';
import { validateUsername, validatePassword } from '@/utils/validator';

const route = useRoute();
const router = useRouter();
const role = computed(() => route.query.role === 'hr' ? 'hr' : 'seeker');

const formRef = ref();
const loading = ref(false);
const form = reactive({ username: '', password: '', confirmPassword: '' });
const validateConfirm = (_, v, cb) => (v === form.password ? cb() : cb(new Error('两次密码不一致')));
const rules = {
  username: [{ required: true, validator: (_, v, cb) => validateUsername(v) ? cb() : cb(new Error('5~16位字母数字下划线')) }],
  password: [{ required: true, validator: (_, v, cb) => validatePassword(v) ? cb() : cb(new Error('8~16位含字母数字')) }],
  confirmPassword: [{ required: true, validator: validateConfirm }],
};

const handleRegister = async () => {
  await formRef.value.validate();
  loading.value = true;
  try {
    const regApi = role.value === 'hr' ? hrRegister : seekerRegister;
    const res = await regApi({ username: form.username, password: form.password });
    if (res.code === 0) {
      ElMessage.success('注册成功，请登录');
      router.push('/login?role=' + role.value);
    } else {
      ElMessage.error(res.msg);
    }
  } catch (err) {
    ElMessage.error('注册失败');
  } finally {
    loading.value = false;
  }
};
</script>
<style scoped>
.register-container { display: flex; justify-content: center; align-items: center; height: 100vh; background: linear-gradient(135deg,#667eea,#764ba2); }
.register-card { width: 420px; padding: 20px; }
h2 { text-align: center; margin-bottom: 24px; }
.el-button { width: 100%; }
.el-link { float: right; margin-top: 8px; }
</style>