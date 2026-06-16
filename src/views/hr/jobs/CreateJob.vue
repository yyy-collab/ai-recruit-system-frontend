<template>
  <div class="create-job-page">
    <el-card shadow="always" class="create-job-card">
      <div class="page-title">
        <h2>发布新职位</h2>
        <p class="page-desc">填写以下信息并发布岗位，发布后可在职位管理列表中查看。</p>
      </div>
      <el-form :model="form" :rules="rules" ref="jobForm" label-width="120px" size="medium">
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="职位名称" prop="jobName">
              <el-input v-model="form.jobName" placeholder="例如：高级前端开发工程师" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="工作地点" prop="workAddress">
              <el-input v-model="form.workAddress" placeholder="例如：杭州" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="薪资范围" prop="salary">
              <el-input v-model="form.salary" placeholder="例如：15k-25k" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="经验要求" prop="workExperience">
              <el-select v-model="form.workExperience" placeholder="请选择经验要求">
                <el-option label="不限" value="不限" />
                <el-option label="应届" value="应届" />
                <el-option label="1-3年" value="1-3年" />
                <el-option label="3-5年" value="3-5年" />
                <el-option label="5年以上" value="5年以上" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :span="24">
            <el-form-item label="核心关键词" prop="keywords">
              <el-input
                v-model="form.keywords"
                placeholder="例如：Java,Vue,前端开发"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="24" v-if="!isProfileComplete">
          <el-col :span="24">
            <el-alert
              title="请先完善真实姓名、电话和公司名称后再发布岗位"
              type="warning"
              show-icon
              :closable="false"
            >
              <template #description>
                <el-button type="text" @click="goToSettings">前往完善个人信息</el-button>
              </template>
            </el-alert>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :span="24">
            <el-form-item label="岗位描述" prop="jobDesc">
              <el-input
                type="textarea"
                v-model="form.jobDesc"
                :rows="4"
                placeholder="请填写岗位职责和描述"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :span="24">
            <el-form-item label="任职要求" prop="requirement">
              <el-input
                type="textarea"
                v-model="form.requirement"
                :rows="4"
                placeholder="请填写任职要求、技能和经验要求"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item class="form-actions">
          <el-button @click="cancel">取消</el-button>
          <el-button
            type="primary"
            :loading="loading"
            :disabled="!isProfileComplete"
            @click="submitForm"
          >发布</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { addJob } from '@/api/modules/job';
import { useUserStore } from '@/stores/user';

const router = useRouter();
const userStore = useUserStore();
const loading = ref(false);
const jobForm = ref(null);
const form = reactive({
  jobName: '',
  jobDesc: '',
  requirement: '',
  keywords: '',
  salary: '',
  workAddress: '',
  workExperience: '',
});

const isProfileComplete = computed(() => {
  const info = userStore.userInfo || {};
  const realName = info.realName || info.real_name;
  const companyName = info.companyName || info.company_name;
  const phone = info.phone;
  return Boolean(realName && companyName && phone);
});

const rules = {
  jobName: [{ required: true, message: '请输入职位名称', trigger: 'blur' }],
  salary: [{ required: true, message: '请输入薪资范围', trigger: 'blur' }],
  workAddress: [{ required: true, message: '请输入工作地点', trigger: 'blur' }],
  workExperience: [{ required: true, message: '请选择经验要求', trigger: 'change' }],
  jobDesc: [{ required: true, message: '请输入岗位描述', trigger: 'blur' }],
  requirement: [{ required: true, message: '请输入任职要求', trigger: 'blur' }],
  keywords: [{ required: true, message: '请输入核心关键词', trigger: 'blur' }],
};

const cancel = () => {
  router.push('/hr/jobs');
};

const goToSettings = () => {
  router.push('/hr/settings');
};

const submitForm = async () => {
  if (!jobForm.value) return;

  if (!isProfileComplete.value) {
    ElMessage.warning('请先完善真实姓名、电话和公司名称后再发布岗位');
    return;
  }

  const valid = await jobForm.value.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;
  const payload = {
    job_name: form.jobName,
    job_desc: form.jobDesc,
    requirement: form.requirement,
    keywords: form.keywords,
    salary: form.salary,
    work_address: form.workAddress,
    work_experience: form.workExperience,
  };

  try {
    const res = await addJob(payload);
    if (res && res.code === 0) {
      ElMessage.success('发布成功');
      router.push('/hr/jobs');
    } else {
      console.error('发布失败，后端返回：', res);
      ElMessage.error(`发布失败：${res?.code || 'unknown'} ${res?.msg || '未知错误'}`);
    }
  } catch (error) {
    console.error('发布失败', error);
    const msg = error?.msg || error?.response?.data?.msg || error?.message || JSON.stringify(error) || '发布失败，请稍后重试';
    ElMessage.error(`发布失败：${msg}`);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.create-job-page {
  padding: 20px;
}
.create-job-card {
  max-width: 960px;
  margin: 0 auto;
}
.page-title {
  margin-bottom: 24px;
}
.page-title h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
}
.page-desc {
  margin: 8px 0 0;
  color: #666;
}
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}
</style>
