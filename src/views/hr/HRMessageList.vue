<template>
  <div class="message-container">
    <div class="page-header">
      <h2 class="page-title">消息通知</h2>
      <div class="search-wrapper">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索候选人姓名或岗位"
          clearable
          class="search-input"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="handleSearch" style="margin-left: 10px;">搜索</el-button>
      </div>
    </div>

    <div class="filter-bar">
      <el-radio-group v-model="statusFilter" @change="handleFilterChange">
        <el-radio-button label="">全部</el-radio-button>
        <el-radio-button label="0">待确认</el-radio-button>
        <el-radio-button label="1">已接受</el-radio-button>
        <el-radio-button label="2">已拒绝</el-radio-button>
      </el-radio-group>
    </div>

    <div class="message-list" v-loading="loading">
      <div
        v-for="item in paginatedList"
        :key="item.message_id"
        class="message-item"
        @click="showDetail(item.message_id)"
      >
        <div class="avatar-wrapper">
          <el-avatar :size="48" :src="item.avatar_url || defaultAvatar">
            {{ getInitials(item.real_name) }}
          </el-avatar>
        </div>
        <div class="message-content">
          <div class="message-header">
            <span class="candidate-name">{{ item.real_name }}</span>
            <el-tag :type="getStatusTagType(item.status)">
              {{ getStatusText(item.status) }}
            </el-tag>
          </div>
          <div class="message-body">
            <div>应聘：{{ item.job_name }}</div>
            <div class="message-desc">{{ getDescription(item) }}</div>
            <div class="message-time">{{ formatTime(item.create_time) }}</div>
          </div>
        </div>
      </div>
      <el-empty v-if="(!paginatedList || paginatedList.length === 0) && !loading" description="暂无消息" />
    </div>

    <el-pagination
      v-if="filteredTotal > 0"
      v-model:current-page="pageNum"
      v-model:page-size="pageSize"
      :total="filteredTotal"
      layout="prev, pager, next"
      @current-change="handlePageChange"
      class="pagination"
    />
    <MessageDetailDialog
      v-model="detailVisible"
      :message-id="currentMessageId"
      @refresh="fetchList"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { getHrMessageList } from '@/api/modules/interview'
import MessageDetailDialog from './components/MessageDetailDialog.vue'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'

const loading = ref(false)
const rawMessageList = ref([])
const searchKeyword = ref('')
const statusFilter = ref('')
const pageNum = ref(1)
const pageSize = ref(10)
const detailVisible = ref(false)
const currentMessageId = ref(null)
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'

// 获取姓名首字母（用于头像占位）
const getInitials = (name) => {
  if (!name) return 'U'
  return name.charAt(0).toUpperCase()
}

// 状态文本映射
const getStatusText = (status) => {
  if (status === 0) return '待确认'
  if (status === 1) return '已接受'
  if (status === 2) return '已拒绝'
  return '未知'
}

// 过滤后的数据（前端过滤）
const filteredList = computed(() => {
  let list = rawMessageList.value
  // 按状态筛选
  if (statusFilter.value !== '') {
    list = list.filter(item => item.status === parseInt(statusFilter.value))
  }
  // 按关键词筛选
  if (searchKeyword.value.trim()) {
    const kw = searchKeyword.value.trim().toLowerCase()
    list = list.filter(item =>
      (item.real_name && item.real_name.toLowerCase().includes(kw)) ||
      (item.job_name && item.job_name.toLowerCase().includes(kw))
    )
  }
  return list
})
const filteredTotal = computed(() => filteredList.value.length)
const paginatedList = computed(() => {
  const start = (pageNum.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredList.value.slice(start, end)
})

// 获取消息列表（一次性拉取所有，前端分页过滤）
const fetchList = async () => {
  loading.value = true
  try {
    const params = { pageNum: 1, pageSize: 999 }
    if (statusFilter.value !== '') params.status = statusFilter.value
    const res = await getHrMessageList(params)
    if (res.code === 0) {
      rawMessageList.value = res.data.list || res.data.items || []
      // 重置页码
      pageNum.value = 1
    } else {
      ElMessage.error(res.msg)
    }
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 搜索（重置页码，computed会自动重新过滤）
const handleSearch = () => {
  pageNum.value = 1
}

// 状态筛选变化时重新拉取数据
const handleFilterChange = () => {
  pageNum.value = 1
  fetchList()
}

const handlePageChange = () => {
  // 页码变化时，displayList 会自动重新计算
}

const showDetail = (messageId) => {
  currentMessageId.value = messageId
  detailVisible.value = true
}

const getStatusTagType = (status) => {
  if (status === 0) return 'warning'
  if (status === 1) return 'success'
  if (status === 2) return 'danger'
  return 'info'
}

const getDescription = (item) => {
  if (item.status === 0) return '等待候选人确认'
  if (item.status === 1) return `候选人已接受邀请，面试时间：${item.interview_date} ${item.interview_time}`
  if (item.status === 2) return `候选人已拒绝，原因：${item.reject_reason || '无'}`
  return ''
}

const formatTime = (time) => {
  if (!time) return ''
  return time.replace('T', ' ').substring(0, 16)
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.message-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 50px 40px 30px;   /* 上边距加大 */
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.page-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
}
.search-wrapper {
  display: flex;
  align-items: center;
}
.search-input {
  width: 260px;
}
.filter-bar {
  margin-bottom: 24px;
  text-align: center;
}
.message-list {
  min-height: 400px;
}
.message-item {
  display: flex;
  gap: 16px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  padding: 16px;
  margin-bottom: 16px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #f0eef7;
}
.message-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}
.avatar-wrapper {
  flex-shrink: 0;
}
.message-content {
  flex: 1;
  overflow: hidden;
}
.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.candidate-name {
  font-size: 16px;
  font-weight: 600;
  color: #1E1E2F;
}
.message-body {
  color: #555;
  font-size: 14px;
}
.message-desc {
  margin: 6px 0;
  color: #666;
}
.message-time {
  font-size: 12px;
  color: #999;
  text-align: right;
}
.pagination {
  margin-top: 150px;    
  text-align: center;
}
:deep(.el-button--primary) {
  background-color: #4F46E5;
  border-color: #4F46E5;
}
:deep(.el-button--primary:hover) {
  background-color: #4338ca;
  border-color: #4338ca;
}
:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #4F46E5 inset !important;
}
:deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background-color: #4F46E5;
  border-color: #4F46E5;
  box-shadow: -1px 0 0 0 #4F46E5;
}
:deep(.el-radio-button__inner:hover) {
  color: #4F46E5;
}
</style>