<template>
  <div class="pool-page">
    <div class="page-head">
      <div>
        <h1>智能筛选池</h1>
        <p>按岗位查看候选人投递，筛选后发送面试邀请</p>
      </div>
      <el-select v-model="selectedJobId" class="job-select" placeholder="选择岗位" @change="fetchDeliveries">
        <el-option
          v-for="job in jobs"
          :key="valueOf(job, 'id')"
          :label="valueOf(job, ['jobName', 'job_name'], '未命名岗位')"
          :value="valueOf(job, 'id')"
        />
      </el-select>
    </div>

    <div class="status-tabs">
      <button
        v-for="tab in statusTabs"
        :key="tab.label"
        :class="{ active: activeStatus === tab.value }"
        type="button"
        @click="switchStatus(tab.value)"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="action-bar">
      <div style="display:flex;align-items:center;gap:12px;margin-left:24px; margin-bottom: 20px;">
        <el-checkbox v-model="selectAll">全选</el-checkbox>
        <el-button type="primary">批量通过</el-button>
        <el-button type="danger">批量淘汰</el-button>
      </div>
    </div>

    <div v-loading="loading" class="candidate-list">
      <article v-for="item in deliveries" :key="deliveryIdOf(item)" class="candidate-card" @click="openResume(item)">
        <div class="candidate-avatar">{{ initials(candidateNameOf(item), '候') }}</div>
        <div class="candidate-info">
          <div class="candidate-title">
            <h2>{{ candidateNameOf(item) }}</h2>
            <span>应聘岗位：{{ currentJobName }}</span>
          </div>
          <div class="candidate-tags">
            <span>{{ valueOf(item, ['matchLevel', 'match_level'], '潜力候选人') }}</span>
            <span>{{ statusTextOf(item) }}</span>
          </div>
          <p>投递时间：{{ formatDateTimeLoose(valueOf(item, ['deliveryTime', 'delivery_time'])) }}</p>
        </div>
        <div class="candidate-actions">
          <div class="decision-actions">
            <el-button type="success" plain :disabled="isApproveDisabled(item)" @click.stop="approve(item)">
              单独通过
            </el-button>
            <el-button type="danger" plain :disabled="isRejectDisabled(item)" @click.stop="reject(item)">
              淘汰
            </el-button>
          </div>
          <div class="match-score-panel">
            <span class="match-score-label">匹配度</span>
            <div class="match-circle" :style="matchCircleStyle(item)">{{ matchScoreNum(item) }}</div>
          </div>
          <el-button
            type="primary"
            :icon="Message"
            @click.stop="openInvite(item)"
          >
            发送邀请
          </el-button>
        </div>
      </article>

      <el-empty
        v-if="!loading && !deliveries.length"
        :description="selectedJobId ? '暂无候选人投递' : '请先选择岗位'"
        :image-size="110"
      />
    </div>

    <div v-if="total > pageSize" class="pagination-wrap">
      <el-pagination
        v-model:current-page="pageNum"
        background
        layout="prev, pager, next"
        :page-size="pageSize"
        :total="total"
        @current-change="fetchDeliveries"
      />
    </div>

    <SendInterviewDialog
      v-model="inviteVisible"
      :candidate="activeCandidate"
      @success="handleInviteSuccess"
    />

    <el-dialog v-model="resumeVisible" class="resume-dialog" width="760px" align-center>
      <template #header>
        <h2>候选人简历</h2>
      </template>
      <div v-loading="resumeLoading" class="resume-detail">
        <template v-if="resumeDetail">
          <div class="profile-line">
            <div class="profile-avatar">{{ initials(valueOf(valueOf(resumeDetail, ['seeker_info', 'seekerInfo'], {}), ['real_name', 'realName']), '候') }}</div>
            <div>
              <strong>{{ valueOf(valueOf(resumeDetail, ['seeker_info', 'seekerInfo'], {}), ['real_name', 'realName'], '候选人') }}</strong>
              <span>{{ valueOf(valueOf(resumeDetail, ['seeker_info', 'seekerInfo'], {}), ['edu_back', 'eduBack'], '学历未填写') }}</span>
            </div>
          </div>
          <pre>{{ resumePreviewText }}</pre>
        </template>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Message } from '@element-plus/icons-vue';
import SendInterviewDialog from '@/components/SendInterviewDialog.vue';
import { recalculateMatch } from '@/api/modules/ai';
import { getDeliveryDetail, getDeliveryList, updateDeliveryStatus, batchUpdateDeliveryStatus } from '@/api/modules/delivery';
import { getMyJobList } from '@/api/modules/job';
import {
  formatDateTimeLoose,
  initials,
  pageItems,
  pageTotal,
  valueOf,
} from '@/utils/view';

const statusTabs = [
  { label: '全部候选人', value: undefined },
  { label: '待处理', value: 0 },
  { label: '已通过', value: 1 },
  { label: '已淘汰', value: 2 },
  { label: '待面试', value: 3 },
];

const jobs = ref([]);
const selectedJobId = ref();
const activeStatus = ref(undefined);
const deliveries = ref([]);
const selectedDeliveryIds = ref([]);
const loading = ref(false);
const pageNum = ref(1);
const pageSize = 8;
const total = ref(0);
const allDeliveryStatuses = [0, 1, 2, 3];
const inviteVisible = ref(false);
const activeCandidate = ref({});
const resumeVisible = ref(false);
const resumeLoading = ref(false);
const resumeDetail = ref(null);
const sentInviteIds = ref([]);
const recalculatedMatchIds = ref([]);

const allSelected = computed({
  get() {
    return deliveries.value.length > 0 && deliveries.value.every(item => selectedDeliveryIds.value.includes(deliveryIdOf(item)));
  },
  set(value) {
    if (value) {
      selectedDeliveryIds.value = deliveries.value
        .map(item => deliveryIdOf(item))
        .filter(Boolean);
    } else {
      selectedDeliveryIds.value = [];
    }
  },
});

const currentJobName = computed(() => {
  const job = jobs.value.find((item) => Number(valueOf(item, 'id')) === Number(selectedJobId.value));
  return valueOf(job, ['jobName', 'job_name'], '未选择岗位');
});

const resumePreviewText = computed(() => {
  const resume = valueOf(resumeDetail.value, ['resume_info', 'resumeInfo'], {});
  const parsedData = valueOf(resume, ['parsed_data', 'parsedData'], {});
  return valueOf(resume, ['previewText', 'preview_text'])
    || [
      `工作经验：${valueOf(parsedData, ['work_experience', 'workExperience'], '暂无')}`,
      `核心技能：${normalizeTextList(valueOf(parsedData, 'skills', [])).join(' / ') || '暂无'}`,
    ].join('\n');
});

onMounted(async () => {
  await fetchJobs();
  if (selectedJobId.value) await fetchDeliveries();
});

async function fetchJobs() {
  try {
    const res = await getMyJobList({ pageNum: 1, pageSize: 50, status: 1 });
    jobs.value = pageItems(res.data);
    selectedJobId.value = valueOf(jobs.value[0], 'id') || undefined;
  } catch (error) {
    ElMessage.error(error?.msg || '获取岗位失败');
  }
}

async function fetchDeliveries() {
  if (!selectedJobId.value) {
    deliveries.value = [];
    total.value = 0;
    selectedDeliveryIds.value = [];
    return;
  }
  loading.value = true;
  try {
    if (activeStatus.value === undefined) {
      await fetchAllStatusDeliveries();
    } else {
      const res = await getDeliveryList({
        jobId: selectedJobId.value,
        pageNum: pageNum.value,
        pageSize,
        status: activeStatus.value,
        sort: 'match_score_desc',
      });
      deliveries.value = pageItems(res.data);
      total.value = pageTotal(res.data);
    }
    selectedDeliveryIds.value = [];
    await backfillMissingMatchScores();
  } catch (error) {
    deliveries.value = [];
    total.value = 0;
    ElMessage.error(error?.msg || '获取候选人失败');
  } finally {
    loading.value = false;
  }
}

async function fetchAllStatusDeliveries() {
  const results = await Promise.allSettled(
    allDeliveryStatuses.map((status) => getDeliveryList({
      jobId: selectedJobId.value,
      pageNum: 1,
      pageSize: 200,
      status,
      sort: 'match_score_desc',
    })),
  );

  const mergedMap = new Map();
  results.forEach((result) => {
    if (result.status !== 'fulfilled') return;
    pageItems(result.value.data).forEach((item) => {
      const deliveryId = deliveryIdOf(item);
      if (!deliveryId) return;
      mergedMap.set(String(deliveryId), item);
    });
  });

  const mergedItems = Array.from(mergedMap.values()).sort((left, right) => {
    const leftScore = Number(valueOf(left, ['matchScore', 'match_score'], -1));
    const rightScore = Number(valueOf(right, ['matchScore', 'match_score'], -1));
    const safeLeftScore = Number.isFinite(leftScore) ? leftScore : -1;
    const safeRightScore = Number.isFinite(rightScore) ? rightScore : -1;
    if (safeRightScore !== safeLeftScore) return safeRightScore - safeLeftScore;

    const leftTime = new Date(valueOf(left, ['deliveryTime', 'delivery_time'], 0)).getTime() || 0;
    const rightTime = new Date(valueOf(right, ['deliveryTime', 'delivery_time'], 0)).getTime() || 0;
    return rightTime - leftTime;
  });

  total.value = mergedItems.length;
  const start = (pageNum.value - 1) * pageSize;
  deliveries.value = mergedItems.slice(start, start + pageSize);
}

function hasMatchScore(item) {
  const raw = valueOf(item, ['matchScore', 'match_score'], undefined);
  if (raw === '' || raw === undefined || raw === null || raw === false) return false;

  const num = Number(raw);
  return Number.isFinite(num) && num >= 0 && num <= 100;
}

async function backfillMissingMatchScores() {
  const missingItems = deliveries.value.filter((item) => {
    const deliveryId = deliveryIdOf(item);
    return deliveryId && !hasMatchScore(item) && !recalculatedMatchIds.value.includes(String(deliveryId));
  });

  if (!missingItems.length) return;

  const missingIds = missingItems.map((item) => String(deliveryIdOf(item)));
  recalculatedMatchIds.value = [...new Set([...recalculatedMatchIds.value, ...missingIds])];

  const results = await Promise.allSettled(
    missingItems.map((item) => recalculateMatch(deliveryIdOf(item))),
  );

  let hasUpdate = false;
  results.forEach((result, index) => {
    if (result.status !== 'fulfilled') return;

    const item = missingItems[index];
    const score = valueOf(result.value?.data, ['match_score', 'matchScore'], undefined);
    const level = valueOf(result.value?.data, ['match_level', 'matchLevel'], undefined);

    if (score !== undefined && score !== null && score !== '') {
      item.match_score = score;
      item.matchScore = score;
      hasUpdate = true;
    }

    if (level !== undefined && level !== null && level !== '') {
      item.match_level = level;
      item.matchLevel = level;
      hasUpdate = true;
    }
  });

  if (hasUpdate) {
    deliveries.value = [...deliveries.value];
  }
}

function switchStatus(status) {
  activeStatus.value = status;
  pageNum.value = 1;
  fetchDeliveries();
}

function deliveryIdOf(item) {
  return valueOf(item, ['deliveryId', 'delivery_id']);
}

function candidateNameOf(item) {
  return valueOf(item, ['seekerName', 'seeker_name'], '候选人');
}

function statusOf(item) {
  const rawStatus = Number(valueOf(item, 'status'));
  return Number.isFinite(rawStatus) ? rawStatus : -1;
}

function isInviteSent(item) {
  const rawFlag = valueOf(
    item,
    ['inviteSent', 'invite_sent', 'interviewSent', 'interview_sent', 'hasInterview', 'has_interview', 'hasInterviewInvite', 'has_interview_invite'],
    undefined,
  );
  const deliveryId = deliveryIdOf(item);

  if (statusOf(item) === 3) return true;
  if (typeof rawFlag === 'string') {
    const normalized = rawFlag.trim().toLowerCase();
    if (['1', 'true', 'yes', 'sent'].includes(normalized)) return true;
  } else if (rawFlag !== undefined && rawFlag !== null && rawFlag !== false) {
    return Boolean(rawFlag);
  }

  return Boolean(deliveryId) && sentInviteIds.value.includes(String(deliveryId));
}

function hasFinalDecision(item) {
  const status = statusOf(item);
  return status === 1 || status === 2;
}

function isApproveDisabled(item) {
  return hasFinalDecision(item) || isInviteSent(item);
}

function isRejectDisabled(item) {
  return hasFinalDecision(item) || isInviteSent(item);
}

function itemByDeliveryId(deliveryId) {
  return deliveries.value.find((item) => String(deliveryIdOf(item)) === String(deliveryId));
}

function selectableIdsFor(action) {
  const disabledCheck = action === 'approve' ? isApproveDisabled : isRejectDisabled;
  return selectedDeliveryIds.value.filter((deliveryId) => {
    const item = itemByDeliveryId(deliveryId);
    return item && !disabledCheck(item);
  });
}

function matchScoreNum(item) {
  const raw = valueOf(item, ['matchScore', 'match_score']);
  if (raw === '' || raw === undefined || raw === null || raw === false) return '--';
  const num = Number(raw);
  if (!Number.isFinite(num) || num < 0 || num > 100) return '--';
  return Math.round(num);
}

function matchCircleStyle(item) {
  const num = Number(matchScoreNum(item));
  if (!Number.isFinite(num)) {
    return {
      background: 'linear-gradient(135deg, #cfd5e6 0%, #b9c0d4 100%)',
      boxShadow: '0 12px 24px rgba(79, 70, 229, 0.12)',
    };
  }

  const shadowOpacity = num >= 80 ? 0.28 : num >= 50 ? 0.22 : 0.16;
  return {
    background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
    boxShadow: `0 12px 24px rgba(79, 70, 229, ${shadowOpacity})`,
  };
}

function statusTextOf(item) {
  const map = {
    0: '待处理',
    1: '已通过',
    2: '已淘汰',
    3: '待面试',
  };
  return map[Number(valueOf(item, 'status'))] || '未知';
}

function setLocalDeliveryStatus(deliveryId, status) {
  let changed = false;
  deliveries.value.forEach((item) => {
    if (String(deliveryIdOf(item)) !== String(deliveryId)) return;
    item.status = status;
    changed = true;
  });
  if (changed) {
    deliveries.value = [...deliveries.value];
  }
}

function setLocalBatchStatus(deliveryIds, status) {
  const idSet = new Set(deliveryIds.map((id) => String(id)));
  let changed = false;
  deliveries.value.forEach((item) => {
    if (!idSet.has(String(deliveryIdOf(item)))) return;
    item.status = status;
    changed = true;
  });
  if (changed) {
    deliveries.value = [...deliveries.value];
  }
}

async function openInvite(item) {
  const status = statusOf(item);
  if (isInviteSent(item)) {
    ElMessage.warning('该求职者已发送过邀请');
    return;
  }
  if (status !== 1) {
    ElMessage.warning('只有已通过候选人才能发送面试邀请');
    return;
  }
  activeCandidate.value = {
    ...item,
    deliveryId: deliveryIdOf(item),
    seekerName: candidateNameOf(item),
    jobName: currentJobName.value,
    skills: [valueOf(item, ['matchLevel', 'match_level'], '高潜力'), '架构能力强', '沟通稳定'],
  };
  inviteVisible.value = true;
}

async function approve(item) {
  const deliveryId = deliveryIdOf(item);
  if (!deliveryId) return;
  if (statusOf(item) === 2) {
    ElMessage.warning('已淘汰的候选人不可再次通过');
    return;
  }
  if (statusOf(item) === 1) {
    ElMessage.warning('该候选人已通过');
    return;
  }
  if (isInviteSent(item)) {
    ElMessage.warning('已发送邀请的候选人不可再次更改状态');
    return;
  }
  try {
    await updateDeliveryStatus({ delivery_id: deliveryId, status: 1, comment: '' });
    ElMessage.success('已通过候选人');
    setLocalDeliveryStatus(deliveryId, 1);
  } catch (error) {
    ElMessage.error(error?.msg || '通过失败');
  }
}

async function batchApprove() {
  if (!selectedDeliveryIds.value.length) {
    ElMessage.warning('请先选择候选人');
    return;
  }
  const deliveryIds = selectableIdsFor('approve');
  if (!deliveryIds.length) {
    ElMessage.warning('所选候选人中没有可通过的记录');
    return;
  }
  try {
    if (deliveryIds.length !== selectedDeliveryIds.value.length) {
      ElMessage.warning('已通过、已淘汰或已发送邀请的候选人已自动跳过');
    }
    await batchUpdateDeliveryStatus({ delivery_ids: deliveryIds, status: 1 });
    ElMessage.success('已批量通过候选人');
    setLocalBatchStatus(deliveryIds, 1);
    selectedDeliveryIds.value = [];
  } catch (error) {
    ElMessage.error(error?.msg || '批量通过失败');
  }
}

async function reject(item) {
  const deliveryId = deliveryIdOf(item);
  if (!deliveryId) return;
  if (statusOf(item) === 1) {
    ElMessage.warning('已通过的候选人不可再次淘汰');
    return;
  }
  if (statusOf(item) === 2) {
    ElMessage.warning('该候选人已淘汰');
    return;
  }
  if (isInviteSent(item)) {
    ElMessage.warning('已发送邀请的候选人不可再次更改状态');
    return;
  }
  try {
    const { value } = await ElMessageBox.prompt('请输入淘汰原因', '淘汰候选人', {
      confirmButtonText: '确认淘汰',
      cancelButtonText: '取消',
      inputPattern: /\S+/, 
      inputErrorMessage: '淘汰原因不能为空',
      inputValue: '不符合岗位要求',
    });
    await updateDeliveryStatus({ delivery_id: deliveryId, status: 2, comment: value.trim() });
    ElMessage.success('已淘汰候选人');
    setLocalDeliveryStatus(deliveryId, 2);
  } catch (error) {
    if (error?.message === 'cancel' || error?.message === 'close') return;
    ElMessage.error(error?.msg || '淘汰失败');
  }
}

async function batchReject() {
  if (!selectedDeliveryIds.value.length) {
    ElMessage.warning('请先选择候选人');
    return;
  }
  const deliveryIds = selectableIdsFor('reject');
  if (!deliveryIds.length) {
    ElMessage.warning('所选候选人中没有可淘汰的记录');
    return;
  }
  try {
    const { value } = await ElMessageBox.prompt('请输入批量淘汰原因', '批量淘汰候选人', {
      confirmButtonText: '确认淘汰',
      cancelButtonText: '取消',
      inputPattern: /\S+/, 
      inputErrorMessage: '淘汰原因不能为空',
      inputValue: '不符合岗位要求',
    });
    if (deliveryIds.length !== selectedDeliveryIds.value.length) {
      ElMessage.warning('已通过、已淘汰或已发送邀请的候选人已自动跳过');
    }
    await batchUpdateDeliveryStatus({ delivery_ids: deliveryIds, status: 2, reject_reason: value.trim() });
    ElMessage.success('已批量淘汰候选人');
    setLocalBatchStatus(deliveryIds, 2);
    selectedDeliveryIds.value = [];
  } catch (error) {
    if (error?.message === 'cancel' || error?.message === 'close') return;
    ElMessage.error(error?.msg || '批量淘汰失败');
  }
}

async function handleInviteSuccess(payload) {
  const deliveryId = payload?.deliveryId || deliveryIdOf(activeCandidate.value);
  if (deliveryId) {
    const normalizedId = String(deliveryId);
    if (!sentInviteIds.value.includes(normalizedId)) {
      sentInviteIds.value = [...sentInviteIds.value, normalizedId];
    }
    setLocalDeliveryStatus(deliveryId, 3);
  }
}

function normalizeTextList(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return value.split(/[,，/]/).map((item) => item.trim()).filter(Boolean);
  }
}
async function openResume(item) {
  const did = deliveryIdOf(item);
  console.log('当前投递ID：', did);
  if (!did) {
    ElMessage.warning('该条投递无ID，无法查看简历');
    return;
  }
  resumeVisible.value = true;
  resumeLoading.value = true;
  resumeDetail.value = null;
  try {
    // 直接传did数字，不再包一层对象
    const res = await getDeliveryDetail(did);
    resumeDetail.value = res.data;
  } catch (err) {
    ElMessage.error(err?.msg || '简历加载失败');
  } finally {
    resumeLoading.value = false;
  }
}
</script>

<style scoped>
.pool-page {
  min-height: 100vh;
  padding: 28px 44px 52px;
  background: #f6f7fb;
}

.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 24px;
}

.page-head h1 {
  margin: 0 0 8px;
  color: #171923;
  font-size: 30px;
  line-height: 1.2;
  font-weight: 900;
}

.page-head p {
  margin: 0;
  color: #7b8798;
  font-size: 13px;
  font-weight: 700;
}

.job-select {
  width: 280px;
}

.job-select :deep(.el-input__wrapper) {
  height: 42px;
  border-radius: 8px;
}

.status-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-bottom: 22px;
}

.status-tabs button {
  height: 34px;
  padding: 0 16px;
  border: 0;
  border-radius: 17px;
  color: #151923;
  background: #ffffff;
  font-size: 13px;
  font-weight: 800;
  box-shadow: 0 1px 8px rgba(28, 35, 58, 0.04);
  cursor: pointer;
}

.status-tabs button.active {
  color: #ffffff;
  background: #4f46e5;
}

.candidate-list {
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-width: 1060px;
}

.candidate-card {
  cursor: pointer;
  display: grid;
  grid-template-columns: 82px minmax(0, 1fr) auto;
  align-items: center;
  gap: 22px;
  padding: 18px 22px;
  border: 1px solid #e2e4ea;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 2px 5px rgba(34, 40, 59, 0.16);
}

.candidate-avatar {
  width: 76px;
  height: 76px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #ffffff;
  background: #4f46e5;
  font-size: 26px;
  font-weight: 900;
}

.candidate-info {
  min-width: 0;
}

.candidate-title {
  display: flex;
  align-items: baseline;
  gap: 18px;
  margin-bottom: 10px;
}

.candidate-title h2 {
  margin: 0;
  color: #151923;
  font-size: 19px;
  font-weight: 900;
}

.candidate-title span {
  color: #7b8190;
  font-size: 14px;
  font-weight: 800;
}

.candidate-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 10px;
}

.candidate-tags span {
  height: 24px;
  display: inline-flex;
  align-items: center;
  padding: 0 10px;
  border-radius: 4px;
  color: #2f61db;
  background: #dbe4ff;
  font-size: 12px;
  font-weight: 900;
}

.candidate-info p {
  margin: 0;
  color: #6b7280;
  font-size: 13px;
  font-weight: 700;
}

.match-score-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.match-score-label {
  color: #758198;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.04em;
}

.match-circle {
  width: 58px;
  height: 58px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.36);
  color: #ffffff;
  font-size: 19px;
  font-weight: 900;
  flex-shrink: 0;
}

.decision-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.decision-actions .el-button {
  min-width: 92px;
  margin-left: 0;
}

.candidate-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.candidate-actions .el-button {
  height: 38px;
  border-radius: 7px;
  font-weight: 800;
}

.candidate-actions .el-button--primary {
  border-color: #4f46e5;
  background: #4f46e5;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  max-width: 1060px;
  margin-top: 24px;
}

:global(.resume-dialog) {
  --el-dialog-border-radius: 8px;
}

.resume-dialog h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 900;
}

.resume-detail {
  min-height: 260px;
}

.profile-line {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
}

.profile-avatar {
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #ffffff;
  background: #4f46e5;
  font-size: 20px;
  font-weight: 900;
}

.profile-line strong,
.profile-line span {
  display: block;
}

.profile-line strong {
  color: #151923;
  font-size: 17px;
  font-weight: 900;
}

.profile-line span {
  color: #7b8798;
  font-size: 13px;
  font-weight: 700;
}

.resume-detail pre {
  max-height: 52vh;
  overflow: auto;
  margin: 0;
  padding: 16px;
  border-radius: 8px;
  color: #172033;
  background: #f7f9fc;
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 13px;
  line-height: 1.7;
  white-space: pre-wrap;
}

@media (max-width: 860px) {
  .pool-page {
    padding: 22px 16px 40px;
  }

  .page-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .job-select {
    width: 100%;
  }

  .candidate-card {
    grid-template-columns: 64px minmax(0, 1fr);
    gap: 14px;
  }

  .candidate-avatar {
    width: 62px;
    height: 62px;
    font-size: 22px;
  }

  .candidate-title {
    flex-direction: column;
    gap: 4px;
  }

  .candidate-actions {
    grid-column: 2;
    align-items: flex-start;
    flex-wrap: wrap;
    justify-content: flex-start;
  }

  .decision-actions {
    flex-direction: row;
  }
}
</style>
