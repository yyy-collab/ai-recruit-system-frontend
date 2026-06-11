<template>
  <div class="message-page">
    <div class="page-head">
      <h1>消息通知</h1>
    </div>

    <div class="filter-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.label"
        :class="{ active: activeStatus === tab.value }"
        type="button"
        @click="switchTab(tab.value)"
      >
        {{ tab.label }}
      </button>
    </div>

    <div v-loading="loading" class="message-list">
      <button
        v-for="item in messages"
        :key="messageIdOf(item)"
        class="message-card"
        type="button"
        @click="openDetail(item)"
      >
        <div class="message-avatar">{{ initials(candidateNameOf(item), '候') }}</div>
        <div class="message-content">
          <div class="message-main">
            <strong>{{ candidateNameOf(item) }}</strong>
            <span>应聘：{{ jobNameOf(item) }}</span>
          </div>
          <p>{{ messageText(item) }}</p>
          <time>消息时间：{{ formatDateTimeLoose(valueOf(item, ['createTime', 'create_time'])) }}</time>
        </div>
        <span class="status-pill" :class="interviewStatusMeta(valueOf(item, 'status')).className">
          {{ interviewStatusMeta(valueOf(item, 'status'), valueOf(item, ['statusText', 'status_text'])).text }}
        </span>
      </button>

      <el-empty
        v-if="!loading && !messages.length"
        description="暂无消息"
        :image-size="96"
      />
    </div>

    <div v-if="total > pageSize" class="pagination-wrap">
      <el-pagination
        v-model:current-page="pageNum"
        background
        layout="prev, pager, next"
        :page-size="pageSize"
        :total="total"
        @current-change="fetchMessages"
      />
    </div>

    <el-dialog v-model="detailVisible" class="detail-dialog" width="660px" align-center>
      <template #header>
        <h2>面试邀请详情</h2>
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
          <el-button class="primary-action" type="primary" @click="detailVisible = false">确认</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { getHrMessageDetail, getHrMessageList } from '@/api/modules/interview';
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

const tabs = [
  { label: '全部消息', value: undefined },
  { label: '待确认邀请', value: 0 },
  { label: '已确认邀请', value: 1 },
  { label: '已拒绝邀请', value: 2 },
];

const activeStatus = ref(undefined);
const loading = ref(false);
const messages = ref([]);
const pageNum = ref(1);
const pageSize = 10;
const total = ref(0);
const detailVisible = ref(false);
const detailLoading = ref(false);
const detail = ref(null);

const detailRows = computed(() => {
  if (!detail.value) return [];
  const seeker = valueOf(detail.value, ['seekerInfo', 'seeker_info'], {});
  const job = valueOf(detail.value, ['jobInfo', 'job_info'], {});
  const interview = valueOf(detail.value, ['interviewInfo', 'interview_info'], {});
  const statusText = interviewStatusMeta(
    valueOf(detail.value, 'status'),
    valueOf(detail.value, ['statusText', 'status_text']),
  ).description;

  const rows = [
    { label: '候选人姓名', value: valueOf(seeker, ['realName', 'real_name']) },
    { label: '应聘岗位', value: valueOf(job, ['jobName', 'job_name']) },
    { label: '面试轮次', value: valueOf(interview, ['interviewRound', 'interview_round']) },
    { label: '面试方式', value: valueOf(interview, ['interviewType', 'interview_type']) },
    { label: '面试日期', value: formatDateLoose(valueOf(interview, ['interviewDate', 'interview_date'])) },
    { label: '面试时段', value: formatInterviewRange(valueOf(interview, ['interviewTime', 'interview_time'])) },
    { label: '面试地点/链接', value: valueOf(interview, ['interviewAddress', 'interview_address']) },
    { label: '联系人', value: valueOf(interview, ['contactName', 'contact_name']) },
    { label: '联系电话', value: valueOf(interview, ['contactPhone', 'contact_phone']) },
    { label: '备注', value: valueOf(interview, 'remark') },
    { label: '当前状态', value: statusText },
  ];

  const rejectReason = valueOf(detail.value, ['rejectReason', 'reject_reason']);
  if (rejectReason) rows.push({ label: '拒绝原因', value: rejectReason });
  return rows;
});

onMounted(fetchMessages);

function messageIdOf(item) {
  return valueOf(item, ['messageId', 'message_id']);
}

function candidateNameOf(item) {
  return valueOf(item, ['seekerName', 'seeker_name'], '候选人');
}

function jobNameOf(item) {
  return valueOf(item, ['jobName', 'job_name'], '未命名岗位');
}

function messageText(item) {
  const status = Number(valueOf(item, 'status'));
  const date = formatDateLoose(valueOf(item, ['interviewDate', 'interview_date']));
  const time = formatTimeLoose(valueOf(item, ['interviewTime', 'interview_time']));
  const name = candidateNameOf(item);
  if (status === 1) {
    return `候选人已接受您的面试邀请，将于${date} ${time}参加面试`;
  }
  if (status === 2) {
    const reason = valueOf(item, ['rejectReason', 'reject_reason']);
    return `${name}已拒绝您的面试邀请${reason ? `，原因：${reason}` : ''}`;
  }
  return `您已向候选人发送面试邀请，等待对方确认`;
}

function switchTab(status) {
  activeStatus.value = status;
  pageNum.value = 1;
  fetchMessages();
}

async function fetchMessages() {
  loading.value = true;
  try {
    const res = await getHrMessageList({
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

async function openDetail(item) {
  const messageId = messageIdOf(item);
  if (!messageId) return;
  detailVisible.value = true;
  detailLoading.value = true;
  detail.value = null;
  try {
    const res = await getHrMessageDetail(messageId);
    detail.value = res.data;
  } catch (error) {
    ElMessage.error(error?.msg || '获取详情失败');
    detailVisible.value = false;
  } finally {
    detailLoading.value = false;
  }
}
</script>

<style scoped>
.message-page {
  min-height: 100vh;
  padding: 24px 54px 52px;
  background: #f6f6f7;
}

.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 26px;
}

.page-head h1 {
  margin: 0;
  color: #171923;
  font-size: 30px;
  line-height: 1.2;
  font-weight: 900;
  letter-spacing: 0;
}

.filter-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 26px;
  margin-bottom: 30px;
}

.filter-tabs button {
  height: 36px;
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

.filter-tabs button.active {
  color: #ffffff;
  background: #4f46e5;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.message-card {
  width: 100%;
  min-height: 110px;
  display: grid;
  grid-template-columns: 74px minmax(0, 1fr) auto;
  align-items: center;
  gap: 24px;
  padding: 16px 24px 16px 12px;
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
  font-size: 22px;
  font-weight: 600;
}

.message-content {
  min-width: 0;
}

.message-main {
  display: flex;
  align-items: baseline;
  gap: 22px;
  margin-bottom: 7px;
}

.message-main strong {
  color: #12151f;
  font-size: 19px;
  font-weight: 900;
}

.message-main span {
  color: #333845;
  font-size: 14px;
  font-weight: 800;
}

.message-card p {
  margin: 0 0 8px;
  color: #191d29;
  font-size: 16px;
  line-height: 1.45;
  font-weight: 700;
}

.message-card time {
  color: #6b7280;
  font-size: 13px;
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

.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 26px;
}

:global(.detail-dialog) {
  --el-dialog-border-radius: 0;
}

:global(.detail-dialog .el-dialog__header) {
  margin: 0;
  padding: 26px 24px 10px;
}

:global(.detail-dialog .el-dialog__body) {
  padding: 0 24px;
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
  font-size: 26px;
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
  row-gap: 19px;
  column-gap: 16px;
  margin: 0;
}

.detail-grid dt {
  color: #666b76;
  font-size: 19px;
  font-weight: 900;
  line-height: 1.35;
}

.detail-grid dd {
  margin: 0;
  color: #0d111a;
  font-size: 20px;
  line-height: 1.35;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.detail-actions {
  display: flex;
  justify-content: center;
}

.primary-action {
  min-width: 86px;
  height: 42px;
  border-radius: 3px;
  border-color: #4f46e5;
  background: #4f46e5;
  font-weight: 800;
}

@media (max-width: 760px) {
  .message-page {
    padding: 22px 16px 40px;
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
    font-size: 18px;
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
    grid-template-columns: 110px minmax(0, 1fr);
  }

  .detail-grid dt,
  .detail-grid dd {
    font-size: 16px;
  }
}
</style>
