<template>
  <div class="settings-page">
    <h1 class="page-title">账号设置</h1>

    <!-- 基础信息卡片 -->
    <el-card class="info-card" shadow="hover">
      <template #header><span class="card-header-title">基础信息</span></template>
      <el-form :model="profileForm" :rules="profileRules" ref="profileFormRef" label-width="110px">
        <el-form-item label="头像">
          <div class="avatar-container">
            <el-avatar :size="80" :src="profileForm.avatarUrl || defaultAvatar" class="avatar" />
            <div class="avatar-actions">
              <el-button class="change-avatar-btn" round @click="handleChangeAvatar">
                <el-icon><Camera /></el-icon> 更换头像
              </el-button>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="真实姓名" prop="realName">
          <el-input v-model="profileForm.realName" placeholder="请输入真实姓名" />
        </el-form-item>

        <el-form-item label="公司名称" prop="companyName">
          <el-input v-model="profileForm.companyName" placeholder="请输入公司名称" />
        </el-form-item>

        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="profileForm.phone" placeholder="请输入手机号码" />
        </el-form-item>

        <el-form-item label="邮箱" prop="email">
          <el-input v-model="profileForm.email" placeholder="请输入邮箱" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="profileLoading" @click="saveProfile">保存修改</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 账号安全卡片 -->
    <el-card class="info-card" shadow="hover">
      <template #header><span class="card-header-title">账号安全</span></template>
      <el-form :model="pwdForm" :rules="pwdRules" ref="pwdFormRef" label-width="110px">
        <el-form-item label="当前密码" prop="oldPwd">
          <el-input type="password" v-model="pwdForm.oldPwd" placeholder="请输入原密码" show-password />
        </el-form-item>
        <el-form-item label="新密码" prop="newPwd">
          <el-input type="password" v-model="pwdForm.newPwd" placeholder="请输入新密码" show-password />
        </el-form-item>
        <el-form-item label="确认新密码" prop="confirmPwd">
          <el-input type="password" v-model="pwdForm.confirmPwd" placeholder="请再次输入新密码" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="pwdLoading" @click="updatePassword">保存修改</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 更换头像弹窗 -->
    <el-dialog v-model="avatarDialogVisible" title="更换头像" width="400px">
      <el-upload
        class="avatar-uploader"
        action="#"
        :auto-upload="false"
        :on-change="handleAvatarChange"
        :show-file-list="false"
        accept="image/jpeg,image/png,image/jpg"
      >
        <img v-if="avatarTempUrl" :src="avatarTempUrl" class="avatar-preview" />
        <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
      </el-upload>
      <template #footer>
        <el-button @click="avatarDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="uploadLoading" @click="uploadAvatar">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus, Camera } from '@element-plus/icons-vue';
import { useUserStore } from '@/stores/user';
import { getHrInfo, updateHrInfo, updateHrPwd } from '@/api/modules/hr';
import { uploadFile } from '@/api/modules/common';
import { validatePhone, validateEmail } from '@/utils/validator';

const userStore = useUserStore();

// 基础信息表单
const profileFormRef = ref();
const profileLoading = ref(false);
const profileForm = reactive({
  avatarUrl: '',
  realName: '',
  companyName: '',
  phone: '',
  email: '',
});

const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png';
const avatarDialogVisible = ref(false);
const avatarTempUrl = ref('');
const avatarFile = ref(null);
const uploadLoading = ref(false);

// 校验规则
const profileRules = {
  realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  companyName: [{ required: true, message: '请输入公司名称', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { validator: (_, val, cb) => validatePhone(val) ? cb() : cb(new Error('手机号格式不正确')), trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { validator: (_, val, cb) => validateEmail(val) ? cb() : cb(new Error('邮箱格式不正确')), trigger: 'blur' }
  ],
};

// 密码表单
const pwdFormRef = ref();
const pwdLoading = ref(false);
const pwdForm = reactive({ oldPwd: '', newPwd: '', confirmPwd: '' });
const validateConfirm = (rule, value, callback) => {
  if (value !== pwdForm.newPwd) callback(new Error('两次输入的密码不一致'));
  else callback();
};
const pwdRules = {
  oldPwd: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPwd: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 8, max: 16, message: '密码长度8~16位', trigger: 'blur' },
    { pattern: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,16}$/, message: '密码必须包含字母和数字', trigger: 'blur' }
  ],
  confirmPwd: [{ required: true, validator: validateConfirm, trigger: 'blur' }],
};

// 获取用户信息
const fetchUserInfo = async () => {
  try {
    const res = await getHrInfo();
    if (res.code === 0) {
      const data = res.data;
      profileForm.avatarUrl = data.avatar_url || '';
      profileForm.realName = data.real_name || '';
      profileForm.companyName = data.company_name || '';
      profileForm.phone = data.phone || '';
      profileForm.email = data.email || '';
    } else {
      ElMessage.error(res.msg || '获取用户信息失败');
    }
  } catch (error) {
    console.error('获取用户信息失败', error);
    ElMessage.error('获取用户信息失败');
  }
};

// 保存基础信息
const saveProfile = async () => {
  try { await profileFormRef.value.validate(); } catch { return; }
  profileLoading.value = true;
  try {
    const requestData = {
      real_name: profileForm.realName,
      company_name: profileForm.companyName,
      phone: profileForm.phone,
      email: profileForm.email,
    };
    // 如果头像有值才添加
    if (profileForm.avatarUrl && profileForm.avatarUrl.trim() !== '') {
      requestData.avatar_url = profileForm.avatarUrl;
    }
    const res = await updateHrInfo(requestData);
    if (res.code === 0) {
      ElMessage.success('信息更新成功');
      await userStore.fetchUserInfo();
    } else {
      ElMessage.error(res.msg || '更新失败');
    }
  } catch (error) {
    ElMessage.error('保存失败');
  } finally {
    profileLoading.value = false;
  }
};

// 修改密码
const updatePassword = async () => {
  try {
    await pwdFormRef.value.validate();
  } catch {
    return;
  }
  pwdLoading.value = true;
  const currentRole = userStore.role;
  try {
    const res = await updateHrPwd({
      old_pwd: pwdForm.oldPwd,
      new_pwd: pwdForm.newPwd,
      re_pwd: pwdForm.confirmPwd,
    });
    if (res.code === 0) {
      ElMessage.success(res.msg || '密码修改成功，请重新登录');
      userStore.logout();
      window.location.href = `/login?role=${currentRole}`;
    } else {
      ElMessage.error(res.msg || '密码修改失败');
    }
  } catch (err) {
    if (err && (err.code === 10023 || err.code === 0)) {
      ElMessage.success(err.msg || '密码修改成功，请重新登录');
      userStore.logout();
      window.location.href = `/login?role=${currentRole}`;
    } else {
      ElMessage.error(err?.msg || '修改密码失败');
      console.error('修改密码异常:', err);
    }
  } finally {
    pwdLoading.value = false;
  }
};

// 头像上传
const handleChangeAvatar = () => {
  avatarTempUrl.value = '';
  avatarFile.value = null;
  avatarDialogVisible.value = true;
};

const handleAvatarChange = (file) => {
  const isImage = file.raw.type.startsWith('image/');
  const isLt5M = file.raw.size / 1024 / 1024 < 5;
  if (!isImage) {
    ElMessage.error('只能上传图片文件');
    return false;
  }
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB');
    return false;
  }
  avatarFile.value = file.raw;
  avatarTempUrl.value = URL.createObjectURL(file.raw);
};

const uploadAvatar = async () => {
  if (!avatarFile.value) {
    ElMessage.warning('请先选择图片');
    return;
  }
  uploadLoading.value = true;
  try {
    const res = await uploadFile(avatarFile.value, 'avatar');
    if (res.code === 0 && res.data && res.data.file_url) {
      const newAvatarUrl = res.data.file_url;
      profileForm.avatarUrl = newAvatarUrl;
      userStore.setUserInfo({ avatar_url: newAvatarUrl });
      avatarDialogVisible.value = false;
      ElMessage.success('头像更新成功');
    } else {
      ElMessage.error(res.msg || '上传失败');
      console.error('上传头像失败:', res);
    }
  } catch (error) {
    console.error('上传头像异常:', error);
    ElMessage.error('上传失败，请稍后重试');
  } finally {
    uploadLoading.value = false;
  }
};

onMounted(() => {
  fetchUserInfo();
});
</script>

<style scoped>
.settings-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}
.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #1E1E2F;
  margin-bottom: 24px;
}
.info-card {
  margin-bottom: 30px;
  border-radius: 16px;
  border: 1px solid #f0eef7;
}
.card-header-title {
  font-size: 18px;
  font-weight: 600;
  color: #1E1E2F;
}
.avatar-container {
  display: flex;
  align-items: center;
  gap: 24px;
}
.avatar {
  flex-shrink: 0;
}
.avatar-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.change-avatar-btn {
  background-color: #ffffff;
  border: 1px solid #4F46E5;
  color: #4F46E5;
  padding: 8px 20px;
  font-size: 14px;
  border-radius: 20px;
  transition: all 0.3s;
}
.change-avatar-btn:hover {
  background-color: #f5f3ff;
  border-color: #4338ca;
  color: #4338ca;
}
.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 150px;
  height: 150px;
  text-align: center;
  line-height: 150px;
  border: 1px dashed #d9d9d9;
  border-radius: 50%;
  cursor: pointer;
}
.avatar-preview {
  width: 150px;
  height: 150px;
  object-fit: cover;
  border-radius: 50%;
}
:deep(.el-button--primary) {
  background-color: #4F46E5;
  border-color: #4F46E5;
}
:deep(.el-button--primary:hover) {
  background-color: #4338ca;
  border-color: #4338ca;
}
</style>