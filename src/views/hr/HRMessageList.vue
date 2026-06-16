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
        <!-- 头像盒子：flex 实现水平垂直完全居中 -->
        <div class="avatar-wrapper">
          <!-- item.avatar_url 数据库存储的候选人头像图片地址 -->
          <el-avatar :size="48" :src="item.avatar_url || defaultAvatar">
            {{ getInitials(item.real_name) }}
          </el-avatar>
        </div>
        <div class="message-content">
          <div class="message-body">
            <div>应聘：{{ item.job_name }}</div>
            <div class="message-desc">{{ getDescription(item) }}</div>
          </div>
        </div>
        <!-- 右上角状态标签 -->
        <el-tag class="status-tag" :type="getStatusTagType(item.status)">
          {{ getStatusText(item.status) }}
        </el-tag>
        <!-- 右下角创建时间 -->
        <div class="create-time">{{ formatTime(item.create_time) }}</div>
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
// 默认占位头像
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'

// 获取姓名首字母（图片加载失败兜底）
const getInitials = (name) => {
  if (!name) return 'U'
  return name.charAt(0).toUpperCase()
}

// 状态文本
const getStatusText = (status) => {
  if (status === 0) return '待确认'
  if (status === 1) return '已接受'
  if (status === 2) return '已拒绝'
  return '未知'
}

// 前端过滤数据逻辑完全保留
const filteredList = computed(() => {
  let list = rawMessageList.value
  if (statusFilter.value !== '') {
    list = list.filter(item => item.status === parseInt(statusFilter.value))
  }
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

// 请求接口
const fetchList = async () => {
  loading.value = true
  // 补上缺失的 try {
  try {
    const params = { pageNum: 1, pageSize: 999 }
    if (statusFilter.value !== '') params.status = statusFilter.value
    const res = await getHrMessageList(params)
    if (res.code === 0) {
      rawMessageList.value = res.data.list || res.data.items || []
      // 打印数据调试头像地址
      console.log('列表全部数据', rawMessageList.value)
      console.log('第一条数据头像地址', rawMessageList.value[0]?.avatar_url)
      pageNum.value = 1
    } else {
      ElMessage.error(res.msg)
    }
  } catch (error) {
    console.error('请求失败', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pageNum.value = 1
}

const handleFilterChange = () => {
  pageNum.value = 1
  fetchList()
}

const handlePageChange = () => {}

const showDetail = (messageId) => {
  currentMessageId.value = messageId
  detailVisible.value = true
}

// tag标签颜色
const getStatusTagType = (status) => {
  if (status === 0) return 'warning'
  if (status === 1) return 'success'
  if (status === 2) return 'danger'
  return 'info'
}

// 描述文案（完全匹配截图展示）
const getDescription = (item) => {
  if (item.status === 0) return '等待候选人确认'
  if (item.status === 1) return `候选人已接受邀请，面试时间：${item.interview_date} ${item.interview_time}`
  if (item.status === 2) return `候选人已拒绝，原因：${item.reject_reason || '无'}`
  return ''
}

// 时间格式化
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
  --page-accent: #4f46e5;
  --page-accent-dark: #4338ca;
  --page-accent-soft: #eef0ff;
  --page-border: #e6e8f2;
  --page-text: #1f2540;
  --page-subtle: #677489;
  max-width: 1200px;
  margin: 0 auto;
  padding: 50px 40px 30px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  margin-bottom: 18px;
  padding: 22px 26px;
  border: 1px solid var(--page-border);
  border-radius: 20px;
  background:
    linear-gradient(135deg, rgba(79, 70, 229, 0.08), rgba(255, 255, 255, 0.96) 34%),
    #ffffff;
  box-shadow: 0 16px 36px rgba(31, 37, 64, 0.06);
}

.page-title {
  color: var(--page-text);
  font-size: 28px;
  font-weight: 800;
  letter-spacing: 0.02em;
  margin: 0;
}

.search-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-input {
  width: 300px;
}

.search-input :deep(.el-input__wrapper) {
  min-height: 44px;
  border-radius: 14px;
  box-shadow: 0 0 0 1px var(--page-border) inset;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.search-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--page-accent) inset, 0 0 0 4px rgba(79, 70, 229, 0.12);
}

.search-wrapper .el-button {
  min-width: 92px;
  height: 44px;
  margin-left: 0 !important;
  border-radius: 14px;
  border-color: var(--page-accent);
  background: var(--page-accent);
  font-weight: 700;
}

.search-wrapper .el-button:hover,
.search-wrapper .el-button:focus-visible {
  border-color: var(--page-accent-dark);
  background: var(--page-accent-dark);
}

.filter-bar {
  margin-bottom: 24px;
  text-align: center;
}

.filter-bar :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  border-color: var(--page-accent);
  background: var(--page-accent);
  box-shadow: -1px 0 0 0 var(--page-accent);
  color: #ffffff;
}

.filter-bar :deep(.el-radio-button__inner:hover) {
  color: var(--page-accent);
}

.message-list {
  min-height: 400px;
}

/* 单条卡片：相对定位，适配右上角标签、右下角时间 */
.message-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  padding: 16px;
  margin-bottom: 16px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  border: 1px solid var(--page-border);
  position: relative;
}

.message-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

/* 核心修改：头像盒子水平垂直居中 */
.avatar-wrapper {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  /* 水平+垂直双居中 */
  display: flex;
  align-items: center;
  justify-content: center;
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
  font-size: 18px;
  font-weight: 800;
  color: var(--page-text);
}

.message-header :deep(.el-tag) {
  min-height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  font-weight: 700;
}

.message-body {
  color: var(--page-subtle);
  font-size: 14px;
  line-height: 1.8;
}

.message-desc {
  margin: 6px 0;
  color: #666;
}

/* 右上角状态标签 */
.status-tag {
  position: absolute;
  top: 16px;
  right: 16px;
  min-height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  font-weight: 700;
}

/* 右下角创建时间 */
.create-time {
  position: absolute;
  bottom: 16px;
  right: 16px;
  font-size: 12px;
  color: #97a1b4;
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