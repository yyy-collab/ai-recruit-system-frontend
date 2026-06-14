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
      <el-checkbox v-model="allSelected">全选</el-checkbox>
      <el-button type="primary" size="small" @click="batchApprove">批量通过</el-button>
      <el-button type="danger" size="small" @click="batchReject">批量淘汰</el-button>
    </div>

    <div v-loading="loading" class="candidate-list">
      <article v-for="item in deliveries" :key="deliveryIdOf(item)" class="candidate-card">
        <div class="candidate-avatar">{{ initials(candidateNameOf(item), '候') }}</div>
        <div class="candidate-checkbox">
          <el-checkbox v-model="selectedDeliveryIds" :label="deliveryIdOf(item)" />
        </div>
        <div class="candidate-info">
          <div class="candidate-title">
            <h2>{{ candidateNameOf(item) }}</h2>
            <span>应聘岗位：{{ currentJobName }}</span>
          </div>
          <div class="candidate-tags">
            <span>{{ valueOf(item, ['matchLevel', 'match_level'], '潜力候选人') }}</span>
            <span>匹配度 {{ scoreOf(item) }}</span>
            <span>{{ statusTextOf(item) }}</span>
          </div>
          <p>投递时间：{{ formatDateTimeLoose(valueOf(item, ['deliveryTime', 'delivery_time'])) }}</p>
        </div>
        <div class="candidate-actions">
          <el-button :icon="View" @click="openResume(item)">查看简历</el-button>
          <el-button
            v-if="deliveryStatusOf(item) === 0"
            type="success"
            @click="approve(item)"
          >
            通过
          </el-button>
          <el-button
            v-if="deliveryStatusOf(item) === 1"
            type="primary"
            :icon="Message"
            @click="openInvite(item)"
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
      @success="fetchDeliveries"
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
import { Message, View } from '@element-plus/icons-vue';
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
const inviteVisible = ref(false);
const activeCandidate = ref({});
const resumeVisible = ref(false);
const resumeLoading = ref(false);
const resumeDetail = ref(null);

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
    const res = await getDeliveryList({
      jobId: selectedJobId.value,
      pageNum: pageNum.value,
      pageSize,
      status: activeStatus.value,
      sort: 'match_score_desc',
    });
    const items = pageItems(res.data);
    deliveries.value = items;
    total.value = pageTotal(res.data);
    selectedDeliveryIds.value = [];
    await hydrateMissingMatchScores(items);
    deliveries.value = sortDeliveriesByScore(items);
  } catch (error) {
    deliveries.value = [];
    total.value = 0;
    ElMessage.error(error?.msg || '获取候选人失败');
  } finally {
    loading.value = false;
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

function deliveryStatusOf(item) {
  return Number(valueOf(item, 'status', -1));
}

function scoreOf(item) {
  const score = valueOf(item, ['matchScore', 'match_score']);
  const numericScore = Number(score);
  if (score === '' || Number.isNaN(numericScore)) return '暂无';
  return `${Number.isInteger(numericScore) ? numericScore : numericScore.toFixed(1)}%`;
}

function statusTextOf(item) {
  const map = {
    0: '待处理',
    1: '已通过',
    2: '已淘汰',
    3: '待面试',
  };
  return map[deliveryStatusOf(item)] || '未知';
}

function hasMatchScore(item) {
  const score = valueOf(item, ['matchScore', 'match_score']);
  return score !== '' && score !== null && !Number.isNaN(Number(score));
}

async function hydrateMissingMatchScores(items) {
  const missingItems = items.filter(item => deliveryIdOf(item) && !hasMatchScore(item));
  if (!missingItems.length) return;

  const results = await Promise.allSettled(
    missingItems.map(item => recalculateMatch(deliveryIdOf(item))),
  );

  results.forEach((result, index) => {
    if (result.status !== 'fulfilled') return;
    const data = result.value?.data || {};
    const target = missingItems[index];
    target.match_score = valueOf(data, ['match_score', 'matchScore'], target.match_score);
    target.match_level = valueOf(data, ['match_level', 'matchLevel'], target.match_level);
  });
}

function sortDeliveriesByScore(items) {
  return [...items].sort((left, right) => {
    const leftScoreRaw = Number(valueOf(left, ['matchScore', 'match_score'], -1));
    const rightScoreRaw = Number(valueOf(right, ['matchScore', 'match_score'], -1));
    const leftScore = Number.isNaN(leftScoreRaw) ? -1 : leftScoreRaw;
    const rightScore = Number.isNaN(rightScoreRaw) ? -1 : rightScoreRaw;
    return rightScore - leftScore;
  });
}

async function openInvite(item) {
  const status = deliveryStatusOf(item);
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
  try {
    await updateDeliveryStatus({ delivery_id: deliveryId, status: 1, comment: '' });
    ElMessage.success('已通过候选人');
    await fetchDeliveries();
  } catch (error) {
    ElMessage.error(error?.msg || '通过失败');
  }
}

async function batchApprove() {
  if (!selectedDeliveryIds.value.length) {
    ElMessage.warning('请先选择候选人');
    return;
  }
  try {
    await batchUpdateDeliveryStatus({ delivery_ids: selectedDeliveryIds.value, status: 1 });
    ElMessage.success('已批量通过候选人');
    selectedDeliveryIds.value = [];
    await fetchDeliveries();
  } catch (error) {
    ElMessage.error(error?.msg || '批量通过失败');
  }
}

async function reject(item) {
  const deliveryId = deliveryIdOf(item);
  if (!deliveryId) return;
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
    await fetchDeliveries();
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
  try {
    const { value } = await ElMessageBox.prompt('请输入批量淘汰原因', '批量淘汰候选人', {
      confirmButtonText: '确认淘汰',
      cancelButtonText: '取消',
      inputPattern: /\S+/, 
      inputErrorMessage: '淘汰原因不能为空',
      inputValue: '不符合岗位要求',
    });
    await batchUpdateDeliveryStatus({ delivery_ids: selectedDeliveryIds.value, status: 2, reject_reason: value.trim() });
    ElMessage.success('已批量淘汰候选人');
    selectedDeliveryIds.value = [];
    await fetchDeliveries();
  } catch (error) {
    if (error?.message === 'cancel' || error?.message === 'close') return;
    ElMessage.error(error?.msg || '批量淘汰失败');
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
  display: grid;
  grid-template-columns: 82px 40px minmax(0, 1fr) auto;
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

.candidate-checkbox {
  display: flex;
  align-items: center;
  justify-content: center;
}

.candidate-checkbox :deep(.el-checkbox__label) {
  display: none;
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

.candidate-actions {
  display: flex;
  gap: 10px;
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
    justify-content: flex-start;
  }
}
</style>
