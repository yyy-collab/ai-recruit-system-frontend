<template>
  <div class="reset-container">
    <el-card class="reset-card">
      <h2>{{ role === 'hr' ? 'HR重置密码' : '求职者重置密码' }}</h2>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="0">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="用户名" prefix-icon="User" size="large" />
        </el-form-item>
        <el-form-item prop="email">
          <el-input v-model="form.email" placeholder="注册邮箱" prefix-icon="Message" size="large" />
        </el-form-item>
        <el-form-item prop="code">
          <div class="code-wrapper">
            <el-input v-model="form.code" placeholder="验证码" prefix-icon="Key" size="large" />
            <el-button :disabled="codeSending" @click="sendCode" class="code-btn" size="large">
              {{ codeBtnText }}
            </el-button>
          </div>
        </el-form-item>
        <el-form-item prop="newPwd">
          <el-input type="password" v-model="form.newPwd" placeholder="新密码" prefix-icon="Lock" size="large" show-password />
        </el-form-item>
        <el-form-item prop="rePwd">
          <el-input type="password" v-model="form.rePwd" placeholder="确认新密码" prefix-icon="Lock" size="large" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="resetting" @click="handleReset" size="large" style="width:100%">重置密码</el-button>
        </el-form-item>
        <div style="text-align: center">
          <el-link @click="$router.push('/login?role='+role)">返回登录</el-link>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { getEmailCode } from '@/api/modules/common';
import { resetSeekerPwd } from '@/api/modules/seeker.js';
import { resetHrPwd } from '@/api/modules/hr.js';
import { validateUsername, validateEmail, validatePassword } from '@/utils/validator';

const route = useRoute();
const router = useRouter();
const role = computed(() => route.query.role === 'hr' ? 'hr' : 'seeker');

const formRef = ref();
const resetting = ref(false);
const codeSending = ref(false);
const countdown = ref(0);
let timer = null;

const form = reactive({
  username: '',
  email: '',
  code: '',
  newPwd: '',
  rePwd: '',
});

const validateConfirm = (rule, value, callback) => {
  if (value !== form.newPwd) {
    callback(new Error('两次输入的密码不一致'));
  } else {
    callback();
  }
};

const rules = {
  username: [
    { required: true, validator: (_, val, cb) => validateUsername(val) ? cb() : cb(new Error('用户名5~16位字母数字下划线')), trigger: 'blur' }
  ],
  email: [
    { required: true, validator: (_, val, cb) => validateEmail(val) ? cb() : cb(new Error('邮箱格式不正确')), trigger: 'blur' }
  ],
  code: [{ required: true, message: '请输入验证码', trigger: 'blur' }],
  newPwd: [
    { required: true, validator: (_, val, cb) => validatePassword(val) ? cb() : cb(new Error('密码8~16位含字母数字')), trigger: 'blur' }
  ],
  rePwd: [{ required: true, validator: validateConfirm, trigger: 'blur' }],
};

const codeBtnText = computed(() => {
  if (codeSending.value) return '发送中...';
  if (countdown.value > 0) return `${countdown.value}秒后重试`;
  return '发送验证码';
});

// 发送验证码
const sendCode = async () => {
  // 先验证邮箱格式
  if (!validateEmail(form.email)) {
    ElMessage.error('请输入正确的邮箱');
    return;
  }
  if (!form.username) {
    ElMessage.error('请输入用户名');
    return;
  }
  codeSending.value = true;
  try {
    const type = role.value === 'hr' ? 'hr_reset' : 'seeker_reset';
    const res = await getEmailCode(form.email, type);
    if (res.code === 0) {
      ElMessage.success('验证码已发送至邮箱，5分钟内有效');
      // 倒计时
      countdown.value = 60;
      timer = setInterval(() => {
        if (countdown.value <= 1) {
          clearInterval(timer);
          countdown.value = 0;
        } else {
          countdown.value--;
        }
      }, 1000);
    } else {
      ElMessage.error(res.msg || '发送失败');
    }
  } catch (err) {
    ElMessage.error(err.msg || '发送失败');
  } finally {
    codeSending.value = false;
  }
};

// 重置密码
const handleReset = async () => {
  await formRef.value.validate();
  resetting.value = true;
  try {
    let res;
    const reqData = {
      username: form.username,
      email: form.email,
      code: form.code,
      new_pwd: form.newPwd,
      re_pwd: form.rePwd,
    };
    if (role.value === 'hr') {
      res = await resetHrPwd(reqData);
    } else {
      res = await resetSeekerPwd(reqData);
    }
    if (res.code === 0) {
      ElMessage.success('密码重置成功，请重新登录');
      router.push('/login?role=' + role.value);
    } else {
      ElMessage.error(res.msg || '重置失败');
    }
  } catch (err) {
    ElMessage.error(err.msg || '重置失败');
  } finally {
    resetting.value = false;
  }
};

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<style scoped>
.reset-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, #667eea, #764ba2);
}
.reset-card {
  width: 450px;
  padding: 20px;
}
h2 {
  text-align: center;
  margin-bottom: 24px;
}
.code-wrapper {
  display: flex;
  gap: 12px;
}
.code-btn {
  width: 120px;
}
</style>