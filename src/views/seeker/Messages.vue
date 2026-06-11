<template>
  <div class="message-page">
    <div class="page-head">
      <div>
        <h1>消息通知</h1>
        <p>查看你的面试邀请与简历投递记录。</p>
      </div>
      <el-input
        v-model="keyword"
        class="search-input"
        clearable
        placeholder="搜索联系人、公司、岗位"
        :prefix-icon="Search"
      />
    </div>

    <div class="view-tabs">
      <button
        v-for="view in viewModes"
        :key="view.value"
        :class="{ active: activeView === view.value }"
        type="button"
        @click="switchView(view.value)"
      >
        {{ view.label }}
      </button>
    </div>

    <div class="filter-tabs">
      <button
        v-for="tab in isDeliveryView ? deliveryTabs : tabs"
        :key="tab.label"
        :class="{ active: activeStatus === tab.value }"
        type="button"
        @click="switchTab(tab.value)"
      >
        {{ tab.label }}
      </button>
    </div>

    <div v-loading="loading" class="message-list">
      <template v-if="isDeliveryView">
        <button
          v-for="item in filteredDeliveries"
          :key="valueOf(item, ['deliveryId', 'delivery_id'])"
          class="message-card"
          type="button"
          @click="openDeliveryDetail(item)"
        >
          <div class="message-avatar">{{ initials(valueOf(item, ['companyName', 'company_name']), '企') }}</div>
          <div class="message-content">
            <div class="message-main">
              <strong>{{ valueOf(item, ['companyName', 'company_name'], '招聘企业') }}</strong>
              <span>{{ valueOf(item, ['jobName', 'job_name'], '未命名岗位') }}</span>
            </div>
            <p>投递状态：{{ deliveryStatusText(valueOf(item, 'status')) }}</p>
            <time>投递时间：{{ formatDateTimeLoose(valueOf(item, ['createTime', 'create_time'])) }}</time>
          </div>
          <span class="status-pill" :class="deliveryStatusClass(valueOf(item, 'status'))">
            {{ deliveryStatusText(valueOf(item, 'status')) }}
          </span>
        </button>
        <el-empty
          v-if="!loading && !filteredDeliveries.length"
          description="暂无投递记录"
          :image-size="96"
        />
      </template>

      <template v-else>
        <button
          v-for="item in filteredMessages"
          :key="messageIdOf(item)"
          class="message-card"
          type="button"
          @click="openDetail(item)"
        >
          <div class="message-avatar">{{ initials(companyNameOf(item), '企') }}</div>
          <div class="message-content">
            <div class="message-main">
              <strong>{{ companyNameOf(item) }}</strong>
              <span>{{ jobNameOf(item) }}</span>
            </div>
            <p>{{ messageText(item) }}</p>
            <time>消息时间：{{ formatDateTimeLoose(valueOf(item, ['createTime', 'create_time'])) }}</time>
          </div>
          <span class="status-pill" :class="interviewStatusMeta(valueOf(item, 'status')).className">
            {{ interviewStatusMeta(valueOf(item, 'status'), valueOf(item, ['statusText', 'status_text'])).text }}
          </span>
        </button>
        <el-empty
          v-if="!loading && !filteredMessages.length"
          description="暂无消息"
          :image-size="96"
        />
      </template>
    </div>

    <div v-if="total > pageSize" class="pagination-wrap">
      <el-pagination
        v-model:current-page="pageNum"
        background
        layout="prev, pager, next"
        :page-size="pageSize"
        :total="total"
        @current-change="fetchData"
      />
    </div>

    <el-dialog v-model="detailVisible" class="detail-dialog" width="660px" align-center>
      <template #header>
        <h2>{{ isDeliveryView ? '投递详情' : '面试邀请详情' }}</h2>
      </template>

      <div v-loading="detailLoading" class="detail-body">
        <dl v-if="detail" class="detail-grid">
          <template v-for="row in detailRows" :key="row.label">
            <dt>{{ row.label }}</dt>
            <dd>{{ row.value || '-' }}</dd>
          </template>
        </dl>
      </div>

      <template #footer>
        <div class="detail-actions">
          <template v-if="!isDeliveryView && isPendingDetail">
            <el-button class="primary-action" type="primary" :loading="handling" @click="confirmInterview">
              确认
            </el-button>
            <el-button class="reject-action" type="success" :loading="handling" @click="rejectInterview">
              拒绝
            </el-button>
          </template>
          <el-button v-else class="primary-action" type="primary" @click="detailVisible = false">确认</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search } from '@element-plus/icons-vue';
import { getSeekerMessageDetail, getSeekerMessageList, handleInterview } from '@/api/modules/interview';
import { getMyDeliveryList } from '@/api/modules/delivery';
import {
  formatDateLoose,
  formatDateTimeLoose,
  formatInterviewRange,
  formatTimeLoose,
  initials,
  interviewStatusMeta,
  pageItems,
  pageTotal,
  valueOf,
} from '@/utils/view';

const viewModes = [
  { label: '面试邀请', value: 'interview' },
  { label: '投递记录', value: 'delivery' },
];
const tabs = [
  { label: '全部邀请', value: undefined },
  { label: '待确认邀请', value: 0 },
  { label: '已确认邀请', value: 1 },
  { label: '已拒绝邀请', value: 2 },
];
const deliveryTabs = [
  { label: '所有投递', value: undefined },
  { label: '待处理', value: 0 },
  { label: '已通过', value: 1 },
  { label: '已淘汰', value: 2 },
  { label: '待面试', value: 3 },
];

const route = useRoute();
const router = useRouter();
const keyword = ref('');
const activeView = ref(route.query.view || route.query.tab || 'interview');
const activeStatus = ref(undefined);
const loading = ref(false);
const messages = ref([]);
const deliveries = ref([]);
const pageNum = ref(1);
const pageSize = 10;
const total = ref(0);
const detailVisible = ref(false);
const detailLoading = ref(false);
const handling = ref(false);
const detail = ref(null);

const filteredMessages = computed(() => {
  const term = keyword.value.trim().toLowerCase();
  if (!term) return messages.value;
  return messages.value.filter((item) => {
    const text = `${companyNameOf(item)} ${jobNameOf(item)} ${valueOf(item, ['hrName', 'hr_name'])}`.toLowerCase();
    return text.includes(term);
  });
});

const filteredDeliveries = computed(() => {
  const term = keyword.value.trim().toLowerCase();
  if (!term) return deliveries.value;
  return deliveries.value.filter((item) => {
    const text = `${valueOf(item, ['jobName', 'job_name'])} ${valueOf(item, ['companyName', 'company_name'])} ${valueOf(item, ['matchLevel', 'match_level'], '')}`.toLowerCase();
    return text.includes(term);
  });
});

const isPendingDetail = computed(() => Number(valueOf(detail.value, 'status')) === 0);
const isDeliveryView = computed(() => activeView.value === 'delivery');

const detailRows = computed(() => {
  if (!detail.value) return [];

  if (isDeliveryView.value) {
    return [
      { label: '企业名称', value: valueOf(detail.value, ['companyName', 'company_name']) },
      { label: '应聘岗位', value: valueOf(detail.value, ['jobName', 'job_name']) },
      { label: '投递时间', value: formatDateTimeLoose(valueOf(detail.value, ['createTime', 'create_time'])) },
      { label: '当前状态', value: deliveryStatusText(valueOf(detail.value, 'status')) },
      { label: '匹配等级', value: valueOf(detail.value, ['matchLevel', 'match_level'], '-') },
      { label: 'AI 匹配结果', value: valueOf(detail.value, ['aiMatchResult', 'ai_match_result'], '-') },
      { label: 'HR 备注', value: valueOf(detail.value, 'hrRemark') || valueOf(detail.value, ['hr_remark']) || '-' },
    ];
  }

  const hr = valueOf(detail.value, ['hrInfo', 'hr_info'], {});
  const job = valueOf(detail.value, ['jobInfo', 'job_info'], {});
  const interview = valueOf(detail.value, ['interviewInfo', 'interview_info'], {});
  const statusMeta = interviewStatusMeta(
    valueOf(detail.value, 'status'),
    valueOf(detail.value, ['statusText', 'status_text']),
  );

  return [
    { label: '企业名称', value: valueOf(hr, ['companyName', 'company_name']) },
    { label: '应聘岗位', value: valueOf(job, ['jobName', 'job_name']) },
    { label: '面试轮次', value: valueOf(interview, ['interviewRound', 'interview_round']) },
    { label: '面试方式', value: valueOf(interview, ['interviewType', 'interview_type']) },
    { label: '面试日期', value: formatDateLoose(valueOf(interview, ['interviewDate', 'interview_date'])) },
    { label: '面试时段', value: formatInterviewRange(valueOf(interview, ['interviewTime', 'interview_time'])) },
    { label: '面试地点/链接', value: valueOf(interview, ['interviewAddress', 'interview_address']) },
    { label: '联系人', value: valueOf(hr, ['contactName', 'contact_name', 'realName', 'real_name']) },
    { label: '联系电话', value: valueOf(hr, ['contactPhone', 'contact_phone']) },
    { label: '备注', value: valueOf(interview, 'remark') },
    { label: '当前状态', value: statusMeta.description || statusMeta.text },
  ];
});

onMounted(() => {
  const initialView = route.query.view || route.query.tab;
  if (initialView) {
    activeView.value = initialView;
  }
  fetchData();
});

watch(
  () => [route.query.view, route.query.tab],
  ([view, tab]) => {
    const nextView = view || tab;
    if (nextView) {
      activeView.value = nextView;
    }
    activeStatus.value = undefined;
    pageNum.value = 1;
    fetchData();
  },
);

function messageIdOf(item) {
  return valueOf(item, ['messageId', 'message_id']);
}

function companyNameOf(item) {
  return valueOf(item, ['companyName', 'company_name'], '招聘企业');
}

function jobNameOf(item) {
  return valueOf(item, ['jobName', 'job_name'], '未命名岗位');
}

function messageText(item) {
  const status = Number(valueOf(item, 'status'));
  const date = formatDateLoose(valueOf(item, ['interviewDate', 'interview_date']));
  const time = formatTimeLoose(valueOf(item, ['interviewTime', 'interview_time']));
  if (status === 1) {
    return `您已接受面试邀请，将于${date} ${time}参加面试`;
  }
  if (status === 2) {
    return '您已拒绝面试邀请';
  }
  return `hr为您的简历很满意，邀请您参加面试`;
}

function switchTab(status) {
  activeStatus.value = status;
  pageNum.value = 1;
  fetchData();
}

function switchView(view) {
  if (activeView.value === view) return;
  activeView.value = view;
  activeStatus.value = undefined;
  pageNum.value = 1;
  router.replace({ path: '/seeker/messages', query: { view } });
}

async function fetchData() {
  if (isDeliveryView.value) {
    await fetchDeliveries();
  } else {
    await fetchMessages();
  }
}

async function fetchMessages() {
  loading.value = true;
  try {
    const res = await getSeekerMessageList({
      status: activeStatus.value,
      pageNum: pageNum.value,
      pageSize,
    });
    messages.value = pageItems(res.data);
    total.value = pageTotal(res.data);
  } catch (error) {
    messages.value = [];
    total.value = 0;
    ElMessage.error(error?.msg || '获取消息失败');
  } finally {
    loading.value = false;
  }
}

async function fetchDeliveries() {
  loading.value = true;
  try {
    const res = await getMyDeliveryList({
      status: activeStatus.value,
      pageNum: pageNum.value,
      pageSize,
    });
    deliveries.value = pageItems(res.data);
    total.value = pageTotal(res.data);
  } catch (error) {
    deliveries.value = [];
    total.value = 0;
    ElMessage.error(error?.msg || '获取投递记录失败');
  } finally {
    loading.value = false;
  }
}

async function openDetail(item) {
  const messageId = messageIdOf(item);
  if (!messageId) return;
  detailVisible.value = true;
  detailLoading.value = true;
  detail.value = null;
  try {
    const res = await getSeekerMessageDetail(messageId);
    detail.value = res.data;
  } catch (error) {
    ElMessage.error(error?.msg || '获取详情失败');
    detailVisible.value = false;
  } finally {
    detailLoading.value = false;
  }
}

function openDeliveryDetail(item) {
  detail.value = item;
  detailVisible.value = true;
}

function deliveryStatusText(status) {
  const value = Number(status);
  switch (value) {
    case 0:
      return '待处理';
    case 1:
      return '已通过';
    case 2:
      return '已淘汰';
    case 3:
      return '待面试';
    default:
      return '未知状态';
  }
}

function deliveryStatusClass(status) {
  const value = Number(status);
  switch (value) {
    case 1:
      return 'status-pass';
    case 2:
      return 'status-reject';
    case 3:
      return 'status-wait';
    default:
      return 'status-pending';
  }
}

async function confirmInterview() {
  await submitHandle(1);
}

async function rejectInterview() {
  let rejectReason = '个人原因，暂不参加面试';
  try {
    const { value } = await ElMessageBox.prompt('请输入拒绝原因', '拒绝面试邀请', {
      confirmButtonText: '提交',
      cancelButtonText: '取消',
      inputPlaceholder: '例如：已接受其他 offer',
      inputValue: rejectReason,
      inputValidator: (value) => Boolean(value?.trim()) || '拒绝原因不能为空',
    });
    rejectReason = value.trim();
  } catch (error) {
    return;
  }
  await submitHandle(2, rejectReason);
}

async function submitHandle(status, rejectReason = '') {
  const messageId = valueOf(detail.value, ['messageId', 'message_id']);
  if (!messageId) return;
  handling.value = true;
  try {
    await handleInterview({
      message_id: messageId,
      status,
      reject_reason: rejectReason,
    });
    ElMessage.success(status === 1 ? '已确认面试邀请' : '已拒绝面试邀请');
    detailVisible.value = false;
    await fetchMessages();
  } catch (error) {
    ElMessage.error(error?.msg || '操作失败');
  } finally {
    handling.value = false;
  }
}
</script>

<style scoped>
.message-page {
  min-height: 100vh;
  padding: 18px 44px 52px;
  background: #f6f6f7;
}

.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 22px;
}

.page-head h1 {
  margin: 0;
  color: #171923;
  font-size: 30px;
  line-height: 1.2;
  font-weight: 900;
  letter-spacing: 0;
}

.search-input {
  width: 178px;
}

.search-input :deep(.el-input__wrapper) {
  height: 28px;
  border-radius: 3px;
  background: #ffffff;
  box-shadow: 0 0 0 1px #e0e5ee inset;
}

.search-input :deep(.el-input__inner) {
  font-size: 11px;
}

.view-tabs,
.filter-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 26px;
}

.view-tabs button,
.filter-tabs button {
  height: 34px;
  padding: 0 18px;
  border: 0;
  border-radius: 18px;
  color: #151923;
  background: #ffffff;
  font-size: 14px;
  font-weight: 800;
  box-shadow: 0 1px 8px rgba(28, 35, 58, 0.04);
  cursor: pointer;
}

.view-tabs button.active,
.filter-tabs button.active {
  color: #ffffff;
  background: #4f46e5;
}

.message-list {
  max-width: 1040px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.message-card {
  width: 100%;
  min-height: 74px;
  display: grid;
  grid-template-columns: 74px minmax(0, 1fr) auto;
  align-items: center;
  gap: 22px;
  padding: 16px;
  border: 1px solid #e2e4ea;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 2px 5px rgba(34, 40, 59, 0.22);
  text-align: left;
  cursor: pointer;
}

.message-card:hover {
  border-color: #c8cffc;
  box-shadow: 0 6px 16px rgba(34, 40, 59, 0.16);
}

.message-avatar {
  width: 74px;
  height: 74px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #191924;
  background: #dedbff;
  font-size: 19px;
  font-weight: 700;
}

.message-content {
  min-width: 0;
}

.message-main {
  display: flex;
  align-items: baseline;
  gap: 18px;
  margin-bottom: 7px;
}

.message-main strong {
  color: #12151f;
  font-size: 17px;
  font-weight: 900;
}

.message-main span {
  color: #191d29;
  font-size: 15px;
  font-weight: 900;
}

.message-card p {
  margin: 0 0 6px;
  color: #191d29;
  font-size: 14px;
  line-height: 1.45;
  font-weight: 700;
}

.message-card time {
  color: #2f3542;
  font-size: 12px;
  font-weight: 700;
}

.status-pill {
  min-width: 72px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  padding: 0 14px;
  font-size: 14px;
  font-weight: 900;
}

.status-pill.is-accepted {
  color: #21d23c;
  background: #d9ffd9;
}

.status-pill.is-pending {
  color: #ffad25;
  background: #fff0d8;
}

.status-pill.is-rejected {
  color: #ef4343;
  background: #ffd9de;
}

.status-pill.is-unknown {
  color: #5d6678;
  background: #edf0f5;
}

.status-pill.status-pass {
  color: #1f8e3b;
  background: #d6f8dd;
}

.status-pill.status-reject {
  color: #ca3b3b;
  background: #ffe3e3;
}

.status-pill.status-wait {
  color: #b36d00;
  background: #fff7d6;
}

:global(.detail-dialog .el-dialog__footer) {
  padding: 20px 24px 28px;
}

:global(.detail-dialog .el-dialog__headerbtn) {
  top: 24px;
  right: 24px;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.42);
}

:global(.detail-dialog .el-dialog__headerbtn .el-dialog__close) {
  color: #ffffff;
  font-size: 22px;
}

.detail-dialog h2 {
  margin: 0;
  color: #0f1117;
  font-size: 21px;
  font-weight: 900;
  line-height: 1.3;
}

.detail-body {
  min-height: 320px;
  padding: 8px 0 0;
}

.detail-grid {
  display: grid;
  grid-template-columns: 150px minmax(0, 1fr);
  row-gap: 17px;
  column-gap: 16px;
  margin: 0;
}

.detail-grid dt {
  color: #666b76;
  font-size: 17px;
  font-weight: 900;
  line-height: 1.35;
}

.detail-grid dd {
  margin: 0;
  color: #0d111a;
  font-size: 17px;
  line-height: 1.35;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.detail-actions {
  display: flex;
  justify-content: center;
  gap: 94px;
}

.primary-action,
.reject-action {
  min-width: 86px;
  height: 42px;
  border-radius: 3px;
  font-weight: 800;
}

.primary-action {
  border-color: #4f46e5;
  background: #4f46e5;
}

.reject-action {
  border-color: #22c55e;
  background: #22c55e;
}

@media (max-width: 760px) {
  .message-page {
    padding: 22px 16px 40px;
  }

  .page-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .search-input {
    width: 100%;
  }

  .filter-tabs {
    gap: 10px;
  }

  .message-card {
    grid-template-columns: 58px minmax(0, 1fr);
    gap: 14px;
    padding: 14px;
  }

  .message-avatar {
    width: 58px;
    height: 58px;
    font-size: 16px;
  }

  .status-pill {
    grid-column: 2;
    justify-self: flex-start;
  }

  .message-main {
    flex-direction: column;
    gap: 2px;
  }

  .detail-grid {
    grid-template-columns: 108px minmax(0, 1fr);
  }

  .detail-grid dt,
  .detail-grid dd {
    font-size: 15px;
  }

  .detail-actions {
    gap: 28px;
  }
}
</style>
