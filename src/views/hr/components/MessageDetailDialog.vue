<template>
  <el-dialog
    title="面试邀请详情"
    v-model="visible"
    width="560px"
    @close="handleClose"
  >
    <el-descriptions :column="1" border>
      <el-descriptions-item label="候选人姓名">{{ detail.seeker_info?.real_name || detail.real_name }}</el-descriptions-item>
      <el-descriptions-item label="应聘岗位">{{ detail.job_info?.job_name }}</el-descriptions-item>
      <el-descriptions-item label="面试轮次">{{ detail.interview_info?.interview_round }}</el-descriptions-item>
      <el-descriptions-item label="面试方式">{{ detail.interview_info?.interview_type }}</el-descriptions-item>
      <el-descriptions-item label="面试日期">{{ detail.interview_info?.interview_date }}</el-descriptions-item>
      <el-descriptions-item label="面试时段">{{ detail.interview_info?.interview_time }}</el-descriptions-item>
      <el-descriptions-item label="面试地点/链接">{{ detail.interview_info?.interview_address }}</el-descriptions-item>
      <el-descriptions-item label="联系人">{{ contactName }}</el-descriptions-item>
      <el-descriptions-item label="联系电话">{{ contactPhone }}</el-descriptions-item>
      <el-descriptions-item label="备注">{{ detail.interview_info?.remark || '无' }}</el-descriptions-item>
      <el-descriptions-item label="当前状态">
        <el-tag :type="getStatusType(detail.status)">
          {{ getStatusText(detail.status) }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item v-if="detail.reject_reason" label="拒绝原因">{{ detail.reject_reason }}</el-descriptions-item>
    </el-descriptions>
  </el-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { getHrMessageDetail } from '@/api/modules/interview'
import { ElMessage } from 'element-plus'

const props = defineProps({ modelValue: Boolean, messageId: Number })
const emit = defineEmits(['update:modelValue', 'refresh'])
const visible = ref(false)
const detail = ref({})

const contactName = computed(() => (
  detail.value?.interview_info?.contact_name
  || detail.value?.hr_info?.contact_name
  || detail.value?.contact_name
  || '无'
))

const contactPhone = computed(() => (
  detail.value?.interview_info?.contact_phone
  || detail.value?.hr_info?.contact_phone
  || detail.value?.contact_phone
  || '无'
))

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
    const res = await getHrMessageDetail(props.messageId)
    if (res.code === 0) detail.value = res.data
    else { ElMessage.error(res.msg); handleClose() }
  } catch (error) { console.error(error) }
}

const handleClose = () => {
  visible.value = false
  emit('update:modelValue', false)
}

const getStatusType = (status) => {
  if (status === 0) return 'warning'
  if (status === 1) return 'success'
  if (status === 2) return 'danger'
  return 'info'
}
</script>
