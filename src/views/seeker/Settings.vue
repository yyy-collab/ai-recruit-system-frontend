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

        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="profileForm.phone" placeholder="请输入手机号码" />
        </el-form-item>

        <el-form-item label="邮箱" prop="email">
          <el-input v-model="profileForm.email" placeholder="请输入邮箱" />
        </el-form-item>

        <el-form-item label="年龄" prop="age">
          <el-input v-model.number="profileForm.age" placeholder="请输入年龄（16-65）" class="full-width-input" />
        </el-form-item>

        <el-form-item label="居住地址" prop="address">
          <el-input v-model="profileForm.address" placeholder="请输入居住地址" />
        </el-form-item>

        <el-form-item label="学历" prop="eduBack">
          <el-select v-model="profileForm.eduBack" placeholder="请选择学历" class="full-width-input" clearable>
            <el-option label="专科" value="专科" />
            <el-option label="本科" value="本科" />
            <el-option label="硕士" value="硕士" />
            <el-option label="博士" value="博士" />
          </el-select>
        </el-form-item>

        <el-form-item label="毕业院校" prop="almaMater">
          <el-input v-model="profileForm.almaMater" placeholder="请输入毕业院校" />
        </el-form-item>

        <el-form-item label="求职状态" prop="state">
          <el-select v-model="profileForm.state" placeholder="请选择求职状态" class="full-width-input" clearable>
            <el-option label="在职" value="在职" />
            <el-option label="离职" value="离职" />
            <el-option label="应届毕业生" value="应届毕业生" />
          </el-select>
        </el-form-item>

        <el-form-item label="期望职位" prop="exPosition">
          <el-input v-model="profileForm.exPosition" placeholder="例如：Java开发工程师" />
        </el-form-item>

        <el-form-item label="期望城市" prop="exCity">
          <el-input v-model="profileForm.exCity" placeholder="例如：北京" />
        </el-form-item>

        <!-- 期望薪资：非必填，无红色星号 -->
        <el-form-item label="期望薪资">
          <div class="salary-range">
            <el-input-number
              v-model="profileForm.exSalaryMin"
              :min="0"
              :step="1"
              controls-position="right"
              placeholder="最低"
              class="salary-input"
            />
            <span class="salary-separator">~</span>
            <el-input-number
              v-model="profileForm.exSalaryMax"
              :min="0"
              :step="1"
              controls-position="right"
              placeholder="最高"
              class="salary-input"
            />
            <span class="salary-unit">K</span>
          </div>
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

    <!-- 更换头像弹窗（不变） -->
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
import { getSeekerInfo, updateSeekerInfo, updateSeekerPwd } from '@/api/modules/seeker';
import { uploadFile } from '@/api/modules/common';
import { validatePhone, validateEmail } from '@/utils/validator';

const userStore = useUserStore();

const profileFormRef = ref();
const profileLoading = ref(false);
const profileForm = reactive({
  avatarUrl: '',
  realName: '',
  phone: '',
  email: '',
  age: null,
  address: '',
  eduBack: null,   
  almaMater: '',
  state: null,
  exPosition: '',
  exCity: '',
  exSalaryMin: null,
  exSalaryMax: null,
});

const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png';
const avatarDialogVisible = ref(false);
const avatarTempUrl = ref('');
const avatarFile = ref(null);
const uploadLoading = ref(false);

// 校验规则：只有真实姓名、电话、邮箱为必填
const profileRules = {
  realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { validator: (_, val, cb) => validatePhone(val) ? cb() : cb(new Error('手机号格式不正确')), trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { validator: (_, val, cb) => validateEmail(val) ? cb() : cb(new Error('邮箱格式不正确')), trigger: 'blur' }
  ],
  // 学历、求职状态等不再必填
  age: [
    {
      validator: (rule, value, callback) => {
        // 允许空值
        if (value === null || value === undefined || value === '') {
          callback();
        } else if (typeof value === 'number' && value >= 16 && value <= 65) {
          callback();
        } else {
          callback(new Error('年龄应在16~65之间'));
        }
      },
      trigger: 'blur'
    }
  ],
};

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

const fetchUserInfo = async () => {
  try {
    const res = await getSeekerInfo();
    if (res.code === 0) {
      const data = res.data;
      profileForm.avatarUrl = data.avatar_url || '';
      profileForm.realName = data.real_name || '';
      profileForm.phone = data.phone || '';
      profileForm.email = data.email || '';
      profileForm.age = data.age || null;
      profileForm.address = data.address || '';
      profileForm.eduBack = data.edu_back || null;
      profileForm.almaMater = data.alma_mater || '';
      profileForm.state = data.state || null;
      profileForm.exPosition = data.ex_postion || '';
      profileForm.exCity = data.ex_city || '';
      profileForm.exSalaryMin = data.ex_salary_min || null;
      profileForm.exSalaryMax = data.ex_salary_max || null;
    } else {
      ElMessage.error(res.msg || '获取用户信息失败');
    }
  } catch (error) {
    console.error('获取用户信息失败', error);
    ElMessage.error('获取用户信息失败');
  }
};

const saveProfile = async () => {
  try {
    await profileFormRef.value.validate();
  } catch {
    return;
  }
  profileLoading.value = true;
  try {
    const requestData = {
      real_name: profileForm.realName,
      phone: profileForm.phone,
      email: profileForm.email,
      age: profileForm.age,
      address: profileForm.address,
      edu_back: profileForm.eduBack,
      alma_mater: profileForm.almaMater,
      state: profileForm.state,
      ex_postion: profileForm.exPosition,
      ex_city: profileForm.exCity,
      ex_salary_min: profileForm.exSalaryMin,
      ex_salary_max: profileForm.exSalaryMax,
    };
    if (profileForm.avatarUrl && profileForm.avatarUrl.trim() !== '') {
      requestData.avatar_url = profileForm.avatarUrl;
    }
    if (profileForm.eduBack && profileForm.eduBack.trim()) {
      requestData.edu_back = profileForm.eduBack;
    }
    if (profileForm.state && profileForm.state.trim()) {
      requestData.state = profileForm.state;
    }
    const res = await updateSeekerInfo(requestData);
    if (res.code === 0) {
      ElMessage.success('信息更新成功');
      await userStore.fetchUserInfo();
    } else {
      ElMessage.error(res.msg || '更新失败');
      console.error('更新失败响应:', res);
    }
  } catch (error) {
    console.error('保存信息异常:', error);
    ElMessage.error('保存失败，请稍后重试');
  } finally {
    profileLoading.value = false;
  }
};

const updatePassword = async () => {
  try {
    await pwdFormRef.value.validate();
  } catch { return; }
  pwdLoading.value = true;
  const currentRole = userStore.role;
  try {
    const res = await updateSeekerPwd({
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
/* 样式与之前相同，无变化 */
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
.full-width-input {
  width: 100%;
}
.salary-range {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: nowrap;
}
.salary-input {
  width: 150px;
}
.salary-separator {
  font-size: 16px;
  color: #666;
  line-height: 1;
}
.salary-unit {
  font-size: 14px;
  color: #666;
  margin-left: 4px;
  line-height: 1;
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
:deep(.el-input-number) {
  width: 100%;
}
:deep(.el-input-number .el-input__inner) {
  text-align: left;
}
:deep(.el-button--primary) {
  background-color: #4F46E5;
  border-color: #4F46E5;
}
:deep(.el-button--primary:hover) {
  background-color: #4338ca;
  border-color: #4338ca;
}
@media (max-width: 600px) {
  .salary-range {
    flex-wrap: wrap;
    gap: 8px;
  }
  .salary-input {
    width: 120px;
  }
}
</style>