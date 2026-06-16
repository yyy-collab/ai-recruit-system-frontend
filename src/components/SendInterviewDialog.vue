<template>
  <el-dialog
    v-model="visible"
    class="interview-dialog"
    width="768px"
    align-center
    :show-close="true"
    :close-on-click-modal="false"
    @closed="resetForm"
  >
    <template #header>
      <div class="dialog-title">发送面试邀请</div>
    </template>

    <div class="dialog-body">
      <section class="section-block">
        <div class="section-heading">
          <el-icon><UserFilled /></el-icon>
          <span>候选人信息</span>
        </div>
        <div class="candidate-card">
          <div class="candidate-avatar">{{ initials(candidateName, '候') }}</div>
          <div class="candidate-meta">
            <strong>{{ candidateName }}</strong>
            <p>应聘岗位：{{ jobName }}</p>
            <div class="tag-row" v-if="skillTags.length">
              <span v-for="tag in skillTags" :key="tag">{{ tag }}</span>
            </div>
          </div>
        </div>
      </section>

      <section class="section-block">
        <div class="section-heading">
          <el-icon><Calendar /></el-icon>
          <span>面试安排</span>
        </div>

        <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="invite-form">
          <el-form-item label="面试日期" prop="interview_date" required>
            <el-date-picker
              v-model="form.interview_date"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="请选择面试日期"
              :clearable="false"
            />
          </el-form-item>
          <el-form-item label="面试时间" prop="interview_time" required>
            <el-time-picker
              v-model="form.interview_time"
              value-format="HH:mm"
              format="HH:mm"
              placeholder="请选择面试时间"
              :clearable="false"
            />
          </el-form-item>
          <div class="form-grid">
            <el-form-item label="面试轮次" prop="interview_round" required>
              <el-select v-model="form.interview_round" placeholder="请选择">
                <el-option label="初试" value="初试" />
                <el-option label="复试" value="复试" />
                <el-option label="终试" value="终试" />
              </el-select>
            </el-form-item>
            <el-form-item label="面试方式" prop="interview_type" required>
              <el-select v-model="form.interview_type" placeholder="请选择">
                <el-option label="线上面试" value="线上面试" />
                <el-option label="现场面试" value="现场面试" />
                <el-option label="电话面试" value="电话面试" />
              </el-select>
            </el-form-item>
          </div>
          <el-form-item label="面试地点/链接" prop="interview_address" required>
            <el-input v-model="form.interview_address" placeholder="例如：腾讯会议：http://meeting.tencent.com/xxx" />
          </el-form-item>
          <div class="form-grid">
            <el-form-item label="联系人" prop="contact_name" required>
              <el-input v-model="form.contact_name" placeholder="请输入联系人" />
            </el-form-item>
            <el-form-item label="联系电话" prop="contact_phone" required>
              <el-input v-model="form.contact_phone" placeholder="请输入联系电话" />
            </el-form-item>
          </div>
          <el-form-item label="备注" prop="remark">
            <el-input
              v-model="form.remark"
              type="textarea"
              :rows="3"
              resize="none"
              placeholder="例如：请提前10分钟进入会议，准备自我介绍及项目作品"
            />
          </el-form-item>
        </el-form>
      </section>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button class="ghost-button" @click="visible = false">取消</el-button>
        <el-button class="primary-button" type="primary" :loading="submitting" @click="submit">
          发送邀请
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Calendar, UserFilled } from '@element-plus/icons-vue';
import { sendInterview } from '@/api/modules/interview';
import { initials, normalizeTimeForApi, valueOf } from '@/utils/view';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  candidate: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(['update:modelValue', 'success']);

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const formRef = ref(null);
const submitting = ref(false);
const form = reactive({
  interview_date: '2026-05-12',
  interview_time: '09:00',
  interview_type: '线上面试',
  interview_round: '初试',
  interview_address: '腾讯会议：http://meeting.tencent.com/xxx',
  contact_name: '',
  contact_phone: '',
  remark: '请提前10分钟进入会议，准备自我介绍及项目作品',
});

const rules = {
  interview_date: [{ required: true, message: '请选择面试日期', trigger: 'change' }],
  interview_time: [{ required: true, message: '请选择面试时间', trigger: 'change' }],
  interview_type: [{ required: true, message: '请选择面试方式', trigger: 'change' }],
  interview_round: [{ required: true, message: '请选择面试轮次', trigger: 'change' }],
  interview_address: [{ required: true, message: '请输入面试地点或链接', trigger: 'blur' }],
  contact_name: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
  contact_phone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }],
};

const candidateName = computed(() => valueOf(props.candidate, ['realName', 'real_name', 'seekerName', 'seeker_name'], '赵志远'));
const jobName = computed(() => valueOf(props.candidate, ['jobName', 'job_name', 'targetTitle', 'target_title'], '高级前端工程师/AI架构师'));
const skillTags = computed(() => {
  const raw = valueOf(props.candidate, ['skills', 'skillTags', 'skill_tags'], ['LLM应用专家', '架构能力强', '英语流利']);
  if (Array.isArray(raw)) return raw.slice(0, 3);
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.slice(0, 3);
    } catch (error) {
      return raw.split(/[,，/]/).filter(Boolean).slice(0, 3);
    }
  }
  return [];
});

watch(
  () => props.candidate,
  (candidate) => {
    form.contact_name = valueOf(candidate, ['contactName', 'contact_name', 'hrName', 'hr_name'], form.contact_name);
    form.contact_phone = valueOf(candidate, ['contactPhone', 'contact_phone', 'phone'], form.contact_phone);
  },
  { immediate: true, deep: true },
);

function resetForm() {
  formRef.value?.clearValidate();
}

async function submit() {
  await formRef.value?.validate();
  const deliveryId = Number(valueOf(props.candidate, ['deliveryId', 'delivery_id']));
  if (!deliveryId) {
    ElMessage.error('缺少投递ID，无法发送面试邀请');
    return;
  }

  submitting.value = true;
  try {
    await sendInterview({
      delivery_id: deliveryId,
      interview_date: form.interview_date,
      interview_time: normalizeTimeForApi(form.interview_time),
      interview_type: form.interview_type,
      interview_round: form.interview_round,
      interview_address: form.interview_address,
      contact_name: form.contact_name || '林秋雅',
      contact_phone: form.contact_phone || '13800000000',
      remark: form.remark,
    });
    ElMessage.success('面试邀请已发送');
    emit('success', { deliveryId });
    visible.value = false;
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
:global(.interview-dialog) {
  --el-dialog-border-radius: 0;
  overflow: hidden;
}

:global(.interview-dialog .el-dialog__header) {
  position: relative;
  margin: 0;
  padding: 20px 56px 22px;
  border-bottom: 3px solid #3d73ff;
}

:global(.interview-dialog .el-dialog__headerbtn) {
  top: 16px;
  right: 18px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.34);
}

:global(.interview-dialog .el-dialog__headerbtn .el-dialog__close) {
  color: #ffffff;
  font-size: 22px;
}

:global(.interview-dialog .el-dialog__body) {
  padding: 0;
}

:global(.interview-dialog .el-dialog__footer) {
  padding: 16px 42px;
  border-top: 1px solid #eef0f6;
}

.dialog-title {
  text-align: center;
  color: #111111;
  font-size: 27px;
  font-weight: 900;
  line-height: 1.25;
}

.dialog-body {
  max-height: min(70vh, 640px);
  overflow: auto;
  background: #ffffff;
}

.section-block + .section-block {
  border-top: 12px solid #faf9fd;
}

.section-heading {
  height: 66px;
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 0 52px;
  background: #fbfaff;
  color: #181b23;
  font-size: 21px;
  font-weight: 800;
}

.section-heading .el-icon {
  color: #4642a8;
  font-size: 28px;
}

.candidate-card {
  min-height: 124px;
  display: flex;
  align-items: center;
  gap: 42px;
  margin: 20px 50px 48px;
  padding: 18px 48px;
  border-radius: 8px;
  background: #eeeeef;
}

.candidate-avatar {
  width: 84px;
  height: 84px;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #ffffff;
  background: #4f46e5;
  font-size: 31px;
  font-weight: 900;
}

.candidate-meta {
  min-width: 0;
}

.candidate-meta strong {
  display: block;
  color: #151923;
  font-size: 19px;
  line-height: 1.4;
  font-weight: 900;
}

.candidate-meta p {
  margin: 4px 0 10px;
  color: #85858d;
  font-size: 16px;
  line-height: 1.4;
  font-weight: 800;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.tag-row span {
  min-width: 70px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 9px;
  border-radius: 3px;
  color: #2f61db;
  background: #cddaff;
  font-size: 11px;
  font-weight: 800;
}

.invite-form {
  padding: 24px 52px 16px;
}

.invite-form :deep(.el-form-item) {
  margin-bottom: 16px;
}

.invite-form :deep(.el-form-item__label) {
  margin-bottom: 7px;
  color: #121722;
  font-size: 15px;
  font-weight: 900;
}

.invite-form :deep(.el-input__wrapper),
.invite-form :deep(.el-textarea__inner) {
  min-height: 44px;
  border-radius: 8px;
  box-shadow: 0 0 0 1px #d7dae1 inset;
}

.invite-form :deep(.el-date-editor.el-input),
.invite-form :deep(.el-date-editor.el-input__wrapper),
.invite-form :deep(.el-select) {
  width: 100%;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 34px;
}

.ghost-button,
.primary-button {
  min-width: 88px;
  height: 58px;
  border-radius: 8px;
  font-size: 19px;
  font-weight: 700;
}

.primary-button {
  min-width: 128px;
  border-color: #4f46e5;
  background: #4f46e5;
}

@media (max-width: 820px) {
  :global(.interview-dialog) {
    width: calc(100vw - 28px) !important;
  }

  .section-heading,
  .invite-form {
    padding-left: 24px;
    padding-right: 24px;
  }

  .candidate-card {
    margin: 18px 24px 32px;
    padding: 18px;
    gap: 18px;
  }

  .candidate-avatar {
    width: 70px;
    height: 70px;
    font-size: 26px;
  }

  .form-grid {
    grid-template-columns: 1fr;
    gap: 0;
  }
}
</style>
