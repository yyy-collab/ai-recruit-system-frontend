<template>
  <el-dialog
    class="message-detail-dialog"
    title="面试邀请详情"
    v-model="visible"
    width="560px"
    @close="handleClose"
  >
<el-descriptions :column="1" border>
  <el-descriptions-item label="招聘企业">{{ detail.hr_info?.company_name || '未知' }}</el-descriptions-item>
  <el-descriptions-item label="应聘岗位">{{ detail.job_info?.job_name || '未知' }}</el-descriptions-item>
  <el-descriptions-item label="面试轮次">{{ detail.interview_info?.interview_round }}</el-descriptions-item>
  <el-descriptions-item label="面试方式">{{ detail.interview_info?.interview_type }}</el-descriptions-item>
  <el-descriptions-item label="面试日期">{{ detail.interview_info?.interview_date }}</el-descriptions-item>
  <el-descriptions-item label="面试时段">{{ detail.interview_info?.interview_time }}</el-descriptions-item>
  <el-descriptions-item label="面试地点/链接">{{ detail.interview_info?.interview_address }}</el-descriptions-item>
  <el-descriptions-item label="联系人">{{ detail.hr_info?.contact_name }}</el-descriptions-item>
  <el-descriptions-item label="联系电话">{{ detail.hr_info?.contact_phone }}</el-descriptions-item>
  <el-descriptions-item label="备注">{{ detail.interview_info?.remark || '无' }}</el-descriptions-item>
  <el-descriptions-item label="当前状态">
    <el-tag :type="getStatusType(detail.status)">
      {{ getStatusText(detail.status) }}
    </el-tag>
  </el-descriptions-item>
  <el-descriptions-item v-if="detail.reject_reason" label="拒绝原因">{{ detail.reject_reason }}</el-descriptions-item>
</el-descriptions>

    <template #footer v-if="detail.status === 0">
      <el-button @click="handleReject">拒绝邀请</el-button>
      <el-button type="primary" @click="handleAccept">接受邀请</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { getSeekerMessageDetail, handleInterview } from '@/api/modules/interview'
import { ElMessage, ElMessageBox } from 'element-plus'

const props = defineProps({ modelValue: Boolean, messageId: Number })
const emit = defineEmits(['update:modelValue', 'refresh'])
const visible = ref(false)
const detail = ref({})

const getStatusText = (status) => {
  if (status === 0) return '待确认'
  if (status === 1) return '已接受'
  if (status === 2) return '已拒绝'
  return '未知'
}

watch(() => props.modelValue, (val) => {
  visible.value = val
  if (val && props.messageId) fetchDetail()
})

const fetchDetail = async () => {
  try {
    const res = await getSeekerMessageDetail(props.messageId)
    console.log('完整响应：', res)
    if (res.code === 0) {detail.value = res.data
    console.log('详情数据：', JSON.stringify(detail.value, null, 2))}
    else { ElMessage.error(res.msg); handleClose() }
  } catch (error) { console.error(error) }
}

const handleClose = () => {
  visible.value = false
  emit('update:modelValue', false)
}

const handleAccept = async () => {
  try {
    const res = await handleInterview({ message_id: props.messageId, status: 1 })
    if (res.code === 0) {
      ElMessage.success('已接受面试邀请')
      handleClose()
      emit('refresh')
    } else ElMessage.error(res.msg)
  } catch (error) { console.error(error) }
}

const handleReject = async () => {
  try {
    const { value: reason } = await ElMessageBox.prompt('请输入拒绝原因', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputType: 'textarea',
      inputPattern: /^[\s\S]{1,200}$/,
      inputErrorMessage: '拒绝原因不能为空且不超过200字'
    })
    const res = await handleInterview({ message_id: props.messageId, status: 2, reject_reason: reason })
    if (res.code === 0) {
      ElMessage.success('已拒绝面试邀请')
      handleClose()
      emit('refresh')
    } else ElMessage.error(res.msg)
  } catch (err) {
    if (err !== 'cancel') console.error(err)
  }
}

const getStatusType = (status) => {
  if (status === 0) return 'warning'
  if (status === 1) return 'success'
  if (status === 2) return 'danger'
  return 'info'
}
</script>

<style scoped>
:global(.message-detail-dialog) {
  border-radius: 18px;
  overflow: hidden;
}

:global(.message-detail-dialog .el-dialog__header) {
  margin-right: 0;
  padding: 20px 24px 14px;
  border-bottom: 1px solid #eceffd;
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.1), rgba(255, 255, 255, 0.98));
}

:global(.message-detail-dialog .el-dialog__title) {
  color: #1f2540;
  font-size: 20px;
  font-weight: 800;
}

:global(.message-detail-dialog .el-dialog__body) {
  padding: 20px 24px;
}

:global(.message-detail-dialog .el-dialog__footer) {
  padding: 14px 24px 22px;
}

:deep(.el-descriptions__label) {
  width: 128px;
  color: #5f6c84;
  font-weight: 700;
  background: #f7f8fe;
}

:deep(.el-descriptions__content) {
  color: #1f2540;
}

:global(.message-detail-dialog .el-dialog__footer .el-button--primary) {
  border-color: #4f46e5;
  background: #4f46e5;
}

:global(.message-detail-dialog .el-dialog__footer .el-button--primary:hover),
:global(.message-detail-dialog .el-dialog__footer .el-button--primary:focus-visible) {
  border-color: #4338ca;
  background: #4338ca;
}
</style>
