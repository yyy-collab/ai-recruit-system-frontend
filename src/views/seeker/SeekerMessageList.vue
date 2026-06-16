<template>
  <div class="message-container">
    <div class="page-header">
      <h2 class="page-title">我的消息</h2>
      <div class="search-wrapper">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索企业名称或岗位"
          clearable
          class="search-input"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" class="search-button" @click="handleSearch">搜索</el-button>
      </div>
    </div>

    <div class="filter-bar">
      <el-radio-group v-model="statusFilter" @change="handleFilterChange">
        <el-radio-button label="">全部</el-radio-button>
        <el-radio-button label="0">待确认</el-radio-button>
        <el-radio-button label="1">已接受</el-radio-button>
        <el-radio-button label="2">已拒绝</el-radio-button>
        <el-radio-button label="delivery">投递记录</el-radio-button>
      </el-radio-group>
    </div>

    <div class="message-list" v-loading="loading">
      <template v-if="isDeliveryView">
        <div
          v-for="item in displayList"
          :key="deliveryIdOf(item)"
          class="message-item delivery-item"
        >
          <div class="avatar-wrapper">
            <el-avatar :size="48" :src="defaultAvatar">
              {{ getInitials(companyNameOf(item)) }}
            </el-avatar>
          </div>
          <div class="message-content">
            <div class="message-header">
              <span class="company-name">{{ companyNameOf(item) }}</span>
              <el-tag :type="getDeliveryStatusTagType(item.status)">
                {{ getDeliveryStatusText(item.status) }}
              </el-tag>
            </div>
            <div class="message-body">
              <div>岗位：{{ jobNameOf(item) }}</div>
              <div class="message-desc">投递时间：{{ formatTime(item.delivery_time) }}</div>
              <div class="message-time">{{ formatTime(item.update_time || item.delivery_time) }}</div>
            </div>
          </div>
        </div>
      </template>

      <template v-else>
        <div
          v-for="item in displayList"
          :key="item.message_id"
          class="message-item"
          @click="showDetail(item.message_id)"
        >
          <div class="avatar-wrapper">
            <el-avatar :size="48" :src="item.avatar_url || defaultAvatar">
              {{ getInitials(item.company_name || item.hr_name) }}
            </el-avatar>
          </div>
          <div class="message-content">
            <div class="message-header">
              <span class="company-name">{{ item.company_name || item.hr_name }}</span>
              <el-tag :type="getMessageStatusTagType(item.status)">
                {{ getMessageStatusText(item.status) }}
              </el-tag>
            </div>
            <div class="message-body">
              <div>岗位：{{ item.job_name }}</div>
              <div class="message-desc">面试时间：{{ item.interview_date }} {{ item.interview_time }}</div>
              <div class="message-time">{{ formatTime(item.create_time) }}</div>
            </div>
          </div>
        </div>
      </template>

      <el-empty
        v-if="(!displayList || displayList.length === 0) && !loading"
        :description="isDeliveryView ? '暂无投递记录' : '暂无消息'"
      />
    </div>

    <el-pagination
      v-if="total > 0"
      v-model:current-page="pageNum"
      v-model:page-size="pageSize"
      :total="total"
      layout="prev, pager, next"
      @current-change="handlePageChange"
      class="pagination"
    />

    <MessageDetailDialog
      v-if="!isDeliveryView"
      v-model="detailVisible"
      :message-id="currentMessageId"
      @refresh="fetchList"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Search } from '@element-plus/icons-vue';
import { getMyDeliveryList } from '@/api/modules/delivery';
import { getSeekerMessageList } from '@/api/modules/interview';
import { getSeekerJobList } from '@/api/modules/job';
import MessageDetailDialog from './components/MessageDetailDialog.vue';

const loading = ref(false);
const rawMessageList = ref([]);
const rawDeliveryList = ref([]);
const searchKeyword = ref('');
const statusFilter = ref('');
const pageNum = ref(1);
const pageSize = ref(10);
const detailVisible = ref(false);
const currentMessageId = ref(null);
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png';

const isDeliveryView = computed(() => statusFilter.value === 'delivery');

const sourceList = computed(() => (isDeliveryView.value ? rawDeliveryList.value : rawMessageList.value));

const filteredList = computed(() => {
  let list = sourceList.value;

  if (!isDeliveryView.value && statusFilter.value !== '') {
    list = list.filter((item) => Number(item.status) === Number(statusFilter.value));
  }

  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.trim().toLowerCase();
    list = list.filter((item) => {
      const companyName = String(item.company_name || item.hr_name || '').toLowerCase();
      const jobName = String(item.job_name || '').toLowerCase();
      return companyName.includes(keyword) || jobName.includes(keyword);
    });
  }

  return list;
});

const total = computed(() => filteredList.value.length);

const displayList = computed(() => {
  const start = (pageNum.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredList.value.slice(start, end);
});

function getInitials(name) {
  if (!name) return 'U';
  return String(name).charAt(0).toUpperCase();
}

function getMessageStatusText(status) {
  if (Number(status) === 0) return '待确认';
  if (Number(status) === 1) return '已接受';
  if (Number(status) === 2) return '已拒绝';
  return '未知';
}

function getMessageStatusTagType(status) {
  if (Number(status) === 0) return 'warning';
  if (Number(status) === 1) return 'success';
  if (Number(status) === 2) return 'danger';
  return 'info';
}

function getDeliveryStatusText(status) {
  if (Number(status) === 0) return '待处理';
  if (Number(status) === 1) return '已通过';
  if (Number(status) === 2) return '已淘汰';
  if (Number(status) === 3) return '待面试';
  return '未知状态';
}

function getDeliveryStatusTagType(status) {
  if (Number(status) === 0) return 'warning';
  if (Number(status) === 1) return 'success';
  if (Number(status) === 2) return 'danger';
  if (Number(status) === 3) return '';
  return 'info';
}

function deliveryIdOf(item) {
  return item.delivery_id || item.deliveryId;
}

function deliveryJobIdOf(item) {
  return item.job_id || item.jobId;
}

function companyNameOf(item) {
  return item.company_name || item.companyName || '匿名公司';
}

function jobNameOf(item) {
  return item.job_name || item.jobName || '未命名岗位';
}

function jobIdOf(item) {
  return item.id || item.job_id || item.jobId;
}

function isAppliedJob(item) {
  return Boolean(
    item.is_delivered
    || item.isDelivered
    || item.already_delivered
    || item.has_delivered
    || item.isApplied,
  );
}

function formatTime(time) {
  if (!time) return '';
  return String(time).replace('T', ' ').substring(0, 16);
}

async function fetchList() {
  loading.value = true;
  try {
    if (isDeliveryView.value) {
      const [deliveryRes, jobRes] = await Promise.all([
        getMyDeliveryList({ pageNum: 1, pageSize: 999 }),
        getSeekerJobList({}),
      ]);

      if (deliveryRes.code === 0 && jobRes.code === 0) {
        const jobItems = jobRes.data?.items || jobRes.data || [];
        const normalizedJobs = Array.isArray(jobItems) ? jobItems : [jobItems];
        const appliedJobIds = new Set(
          normalizedJobs
            .filter(isAppliedJob)
            .map((item) => String(jobIdOf(item)))
            .filter(Boolean),
        );

        rawDeliveryList.value = (deliveryRes.data?.items || []).filter((item) =>
          appliedJobIds.has(String(deliveryJobIdOf(item))),
        );
        pageNum.value = 1;
      } else {
        ElMessage.error(deliveryRes.msg || jobRes.msg || '获取投递记录失败');
      }
      return;
    }

    const params = { pageNum: 1, pageSize: 999 };
    if (statusFilter.value !== '') {
      params.status = Number(statusFilter.value);
    }

    const messageRes = await getSeekerMessageList(params);
    if (messageRes.code === 0) {
      rawMessageList.value = messageRes.data?.list || messageRes.data?.items || [];
      pageNum.value = 1;
    } else {
      ElMessage.error(messageRes.msg || '获取消息失败');
    }
  } catch (error) {
    console.error(error);
    ElMessage.error(isDeliveryView.value ? '获取投递记录失败' : '获取消息失败');
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  pageNum.value = 1;
}

function handleFilterChange() {
  pageNum.value = 1;
  detailVisible.value = false;
  fetchList();
}

function handlePageChange() {}

function showDetail(messageId) {
  currentMessageId.value = messageId;
  detailVisible.value = true;
}

onMounted(() => {
  fetchList();
});
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
  margin: 0;
  color: var(--page-text);
  font-size: 28px;
  font-weight: 800;
  letter-spacing: 0.02em;
}
.search-wrapper {
  display: flex;
  align-items: center;
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

.search-button {
  margin-left: 10px;
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

.message-item {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  padding: 16px;
  border: 1px solid var(--page-border);
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  padding: 16px;
  margin-bottom: 16px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.message-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.delivery-item {
  cursor: default;
}

.delivery-item:hover {
  transform: none;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
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
  gap: 16px;
  margin-bottom: 14px;
  margin-bottom: 8px;
}

.company-name {
  color: var(--page-text);
  font-size: 18px;
  font-weight: 800;
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
  margin: 8px 0;
  color: #4d5970;
  margin: 6px 0;
  color: #666;
}

.message-time {
  color: #97a1b4;
  font-size: 12px;
  text-align: right;
}

.pagination {
  margin-top: 150px;
  text-align: center;
}

:deep(.el-button--primary) {
  background-color: #4f46e5;
  border-color: #4f46e5;
}

:deep(.el-button--primary:hover) {
  background-color: #4338ca;
  border-color: #4338ca;
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #4f46e5 inset !important;
}

:deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background-color: #4f46e5;
  border-color: #4f46e5;
  box-shadow: -1px 0 0 0 #4f46e5;
}

:deep(.el-radio-button__inner:hover) {
  color: #4f46e5;
}
</style>
