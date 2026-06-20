<template>
  <div class="seeker-jobs-page">
    <div class="page-toolbar">
      <div class="toolbar-left">
        <h1>发现职位</h1>
        <p>浏览最新岗位，快速投递你的简历。</p>
      </div>
      <div class="toolbar-right">
        <el-input
          v-model="filters.keyword"
          placeholder="请输入岗位名称搜索"
          clearable
          class="search-input"
          @clear="handleSearch"
          @keyup.enter.native="handleSearch"
        />
        <el-input
          v-model="filters.salary"
          placeholder="按薪资搜索"
          clearable
          class="search-filter"
          @clear="handleSearch"
          @keyup.enter.native="handleSearch"
        />
        <el-input
          v-model="filters.work_address"
          placeholder="按工作地点搜索"
          clearable
          class="search-filter"
          @clear="handleSearch"
          @keyup.enter.native="handleSearch"
        />
        <el-button type="primary" @click="handleSearch">搜索</el-button>
      </div>
    </div>

    <div class="job-list">
      <el-card v-for="job in jobs" :key="job.id" class="job-card" shadow="hover">
        <div class="job-header">
          <div class="job-title-group">
            <button class="job-name-button" type="button" @click="openJobDetail(job)">
              {{ job.job_name }}
            </button>
            <div class="company-name">{{ job.company_name || '匿名公司' }}</div>
          </div>
          <div class="job-status">
            <el-tag :class="['job-status-tag', job.status === 1 ? 'is-open' : 'is-closed']" effect="plain">
              {{ job.status === 1 ? '招聘中' : '已下线' }}
            </el-tag>
          </div>
        </div>

        <div class="job-meta">
          <span>{{ job.salary || '面议' }}</span>
          <span>{{ job.work_address || '不限地点' }}</span>
          <span>{{ job.work_experience || '经验不限' }}</span>
        </div>

        <div class="job-desc">{{ job.job_desc || '暂无岗位描述' }}</div>

        <div class="job-footer">
          <div class="job-keywords">
            <el-tag v-for="keyword in jobKeywords(job)" :key="keyword" size="small" class="keyword-tag">
              {{ keyword }}
            </el-tag>
          </div>
          <div class="job-actions">
            <el-button
              size="small"
              type="primary"
              :disabled="job.status !== 1 || job.isApplied"
              :loading="applyingJobId === job.id"
              @click="handleApply(job)"
            >
              {{ job.status !== 1 ? '不可投递' : job.isApplied ? '已投递' : '立即投递' }}
            </el-button>
          </div>
        </div>
      </el-card>

      <div v-if="jobs.length === 0 && !loading" class="empty-state">
        <el-empty description="暂无可投递职位，请稍后再来" />
      </div>
    </div>

    <div v-if="total > 0" class="pagination-wrapper">
      <el-pagination
        :current-page="pagination.pageNum"
        :page-size="pagination.pageSize"
        :page-sizes="[5, 10, 20, 50]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>

    <el-dialog
      v-model="detailVisible"
      title="岗位详情"
      width="760px"
      class="job-detail-dialog"
      align-center
    >
      <div v-loading="detailLoading">
        <template v-if="activeJob">
          <div class="detail-head">
            <div>
              <h2>{{ activeJob.job_name }}</h2>
              <p>{{ activeJob.company_name || '匿名公司' }}</p>
            </div>
            <el-tag :class="['job-status-tag', activeJob.status === 1 ? 'is-open' : 'is-closed']" effect="plain">
              {{ activeJob.status === 1 ? '招聘中' : '已下线' }}
            </el-tag>
          </div>

          <el-descriptions :column="2" border class="detail-meta">
            <el-descriptions-item label="薪资">{{ activeJob.salary || '面议' }}</el-descriptions-item>
            <el-descriptions-item label="工作地点">{{ activeJob.work_address || '不限地点' }}</el-descriptions-item>
            <el-descriptions-item label="工作经验">{{ activeJob.work_experience || '经验不限' }}</el-descriptions-item>
            <el-descriptions-item label="联系人">{{ activeJob.hr_name || '未提供' }}</el-descriptions-item>
          </el-descriptions>

          <section class="detail-section">
            <h3>核心关键词</h3>
            <div v-if="jobKeywords(activeJob).length" class="job-keywords">
              <el-tag v-for="keyword in jobKeywords(activeJob)" :key="keyword" size="small" class="keyword-tag">
                {{ keyword }}
              </el-tag>
            </div>
            <p v-else class="detail-empty">暂无</p>
          </section>

          <section class="detail-section">
            <h3>岗位描述</h3>
            <p class="detail-text">{{ activeJob.job_desc || '暂无岗位描述' }}</p>
          </section>

          <section class="detail-section">
            <h3>任职要求</h3>
            <p class="detail-text">{{ activeJob.requirement || '暂无任职要求' }}</p>
          </section>
        </template>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { addDelivery, getMyDeliveryList } from '@/api/modules/delivery';
import { getJobDetail, getSeekerJobList } from '@/api/modules/job';
import { pageItems, pageTotal, valueOf } from '@/utils/view';

const filters = reactive({
  keyword: '',
  salary: '',
  work_address: '',
});
const jobs = ref([]);
const loading = ref(false);
const total = ref(0);
const applyingJobId = ref(null);
const appliedJobIds = ref([]);
const detailVisible = ref(false);
const detailLoading = ref(false);
const activeJob = ref(null);

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
});

const hasAppliedJob = (jobId) => appliedJobIds.value.includes(String(jobId));

const toAppliedFlag = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value > 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['1', 'true', 'yes', 'y'].includes(normalized)) return true;
    if (['0', 'false', 'no', 'n', ''].includes(normalized)) return false;
  }
  return Boolean(value);
};

const normalizeJob = (job, detail = {}) => {
  const merged = { ...job, ...detail };
  const jobId = valueOf(merged, 'id');
  const isApplied = toAppliedFlag(
    valueOf(merged, ['is_delivered', 'isDelivered', 'already_delivered', 'has_delivered', 'isApplied'], false),
  ) || hasAppliedJob(jobId);

  return {
    ...merged,
    id: jobId,
    job_name: valueOf(merged, ['job_name', 'jobName'], '未命名岗位'),
    company_name: valueOf(merged, ['company_name', 'companyName'], '匿名公司'),
    salary: valueOf(merged, 'salary', ''),
    work_address: valueOf(merged, ['work_address', 'workAddress'], ''),
    work_experience: valueOf(merged, ['work_experience', 'workExperience'], ''),
    job_desc: valueOf(merged, ['job_desc', 'jobDesc'], ''),
    keywords: valueOf(merged, 'keywords', ''),
    requirement: valueOf(merged, 'requirement', ''),
    hr_name: valueOf(merged, ['hr_name', 'hrName'], ''),
    status: Number(valueOf(merged, 'status', 1)),
    isApplied,
    is_delivered: isApplied,
    isDelivered: isApplied,
  };
};

const syncAppliedState = () => {
  jobs.value = jobs.value.map((job) => {
    const isApplied = toAppliedFlag(
      valueOf(job, ['is_delivered', 'isDelivered', 'already_delivered', 'has_delivered', 'isApplied'], false),
    ) || hasAppliedJob(job.id);

    return {
      ...job,
      isApplied,
      is_delivered: isApplied,
      isDelivered: isApplied,
    };
  });

  if (!activeJob.value) return;

  const isApplied = toAppliedFlag(
    valueOf(activeJob.value, ['is_delivered', 'isDelivered', 'already_delivered', 'has_delivered', 'isApplied'], false),
  ) || hasAppliedJob(activeJob.value.id);

  activeJob.value = {
    ...activeJob.value,
    isApplied,
    is_delivered: isApplied,
    isDelivered: isApplied,
  };
};

const loadAppliedJobIds = async () => {
  try {
    const res = await getMyDeliveryList({ pageNum: 1, pageSize: 500 });
    const items = pageItems(res.data);
    appliedJobIds.value = [...new Set(
      items
        .map((item) => valueOf(item, ['jobId', 'job_id']))
        .filter((jobId) => jobId !== undefined && jobId !== null && jobId !== '')
        .map((jobId) => String(jobId)),
    )];
    syncAppliedState();
  } catch (error) {
    console.error('同步已投递岗位状态失败', error);
  }
};

const hydrateJobDetails = async (jobList) => {
  const jobsNeedingDetail = jobList.filter((job) => !job.job_desc);
  if (!jobsNeedingDetail.length) return jobList;

  const results = await Promise.allSettled(
    jobsNeedingDetail.map((job) => getJobDetail(job.id)),
  );

  const detailMap = new Map();
  results.forEach((result, index) => {
    if (result.status !== 'fulfilled') return;
    detailMap.set(jobsNeedingDetail[index].id, result.value?.data || {});
  });

  return jobList.map((job) => (
    detailMap.has(job.id)
      ? normalizeJob(job, detailMap.get(job.id))
      : job
  ));
};

const loadJobs = async () => {
  loading.value = true;
  try {
    const params = {
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
    };
    if (filters.keyword) params.job_name = filters.keyword;
    if (filters.salary) params.salary = filters.salary;
    if (filters.work_address) params.work_address = filters.work_address;

    const res = await getSeekerJobList(params);
    const items = pageItems(res.data);
    total.value = pageTotal(res.data);
    const normalizedJobs = items.map((item) => normalizeJob(item));
    jobs.value = await hydrateJobDetails(normalizedJobs);
    syncAppliedState();
  } catch (error) {
    jobs.value = [];
    total.value = 0;
    console.error('加载求职者岗位列表失败', error);
  } finally {
    loading.value = false;
  }
};

const jobKeywords = (job) => {
  if (!job.keywords) return [];
  return String(job.keywords).split(/[\s,，、]+/).filter(Boolean).slice(0, 4);
};

const handleSearch = () => {
  pagination.pageNum = 1;
  loadJobs();
};

const handlePageChange = (page) => {
  pagination.pageNum = page;
  loadJobs();
};

const handleSizeChange = (size) => {
  pagination.pageSize = size;
  pagination.pageNum = 1;
  loadJobs();
};

const openJobDetail = async (job) => {
  detailVisible.value = true;
  detailLoading.value = true;
  activeJob.value = job;
  try {
    const res = await getJobDetail(job.id);
    activeJob.value = normalizeJob(job, res.data || {});
    syncAppliedState();
  } catch (error) {
    console.error('加载岗位详情失败', error);
    activeJob.value = job;
  } finally {
    detailLoading.value = false;
  }
};

const markJobApplied = (jobId) => {
  const normalizedJobId = String(jobId);
  if (!appliedJobIds.value.includes(normalizedJobId)) {
    appliedJobIds.value = [...appliedJobIds.value, normalizedJobId];
  }

  jobs.value = jobs.value.map((item) => (
    item.id === jobId
      ? {
        ...item,
        isApplied: true,
        is_delivered: true,
        isDelivered: true,
      }
      : item
  ));

  if (activeJob.value?.id === jobId) {
    activeJob.value = {
      ...activeJob.value,
      isApplied: true,
      is_delivered: true,
      isDelivered: true,
    };
  }
};

const handleApply = async (job) => {
  if (job.status !== 1 || job.isApplied) return;

  applyingJobId.value = job.id;
  try {
    await addDelivery({ jobId: job.id });
    markJobApplied(job.id);
    await loadAppliedJobIds();
    await loadJobs();
    ElMessage.success('投递成功，已生成简历投递记录');
  } catch (error) {
    console.error('投递失败', error);
    await loadAppliedJobIds();

    if (hasAppliedJob(job.id)) {
      markJobApplied(job.id);
      await loadJobs();
      if (error?.code === 10012) {
        ElMessage.warning('您已投递过该岗位，无需重复投递');
      }
      return;
    }

    if (error?.code === 10012) {
      ElMessage.warning('您已投递过该岗位，无需重复投递');
      markJobApplied(job.id);
      await loadJobs();
    }
  } finally {
    applyingJobId.value = null;
  }
};

onMounted(async () => {
  await loadAppliedJobIds();
  await loadJobs();
});
</script>

<style scoped>
.seeker-jobs-page {
  --page-accent: #4f46e5;
  --page-accent-dark: #4338ca;
  --page-accent-soft: #eef0ff;
  --page-border: #e6e8f2;
  --page-text: #1f2540;
  --page-subtle: #677489;
  padding: 24px;
}

.page-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  padding: 22px 24px;
  border: 1px solid var(--page-border);
  border-radius: 20px;
  background:
    linear-gradient(135deg, rgba(79, 70, 229, 0.08), rgba(255, 255, 255, 0.96) 34%),
    #ffffff;
  box-shadow: 0 16px 36px rgba(31, 37, 64, 0.06);
}

.toolbar-left h1 {
  margin: 0;
  color: var(--page-text);
  font-size: 24px;
  font-weight: 800;
}

.toolbar-left p {
  margin: 8px 0 0;
  color: var(--page-subtle);
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.search-input {
  width: 320px;
  min-width: 220px;
}

.search-filter {
  width: 180px;
  min-width: 160px;
}

.search-input :deep(.el-input__wrapper) {
  min-height: 44px;
  border-radius: 14px;
  box-shadow: 0 0 0 1px var(--page-border) inset;
  transition: box-shadow 0.2s ease;
}

.search-filter :deep(.el-input__wrapper) {
  min-height: 44px;
  border-radius: 14px;
  box-shadow: 0 0 0 1px var(--page-border) inset;
  transition: box-shadow 0.2s ease;
}

.search-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--page-accent) inset, 0 0 0 4px rgba(79, 70, 229, 0.12);
}

.search-filter :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--page-accent) inset, 0 0 0 4px rgba(79, 70, 229, 0.12);
}

.seeker-jobs-page :deep(.el-button--primary) {
  border-color: var(--page-accent);
  background: var(--page-accent);
}

.seeker-jobs-page :deep(.el-button--primary:hover),
.seeker-jobs-page :deep(.el-button--primary:focus-visible) {
  border-color: var(--page-accent-dark);
  background: var(--page-accent-dark);
}

.seeker-jobs-page :deep(.el-button--primary.is-disabled),
.seeker-jobs-page :deep(.el-button--primary.is-disabled:hover) {
  color: var(--page-accent);
  border-color: rgba(79, 70, 229, 0.18);
  background: rgba(79, 70, 229, 0.16);
}

.job-list {
  display: grid;
  gap: 18px;
}

.job-card {
  border: 1px solid var(--page-border);
  border-radius: 20px;
  box-shadow: 0 16px 34px rgba(31, 37, 64, 0.06);
}

.job-card :deep(.el-card__body) {
  padding: 22px 24px;
}

.job-card:hover {
  border-color: rgba(79, 70, 229, 0.2);
}

.job-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 14px;
}

.job-title-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.job-name-button {
  padding: 0;
  border: 0;
  color: var(--page-text);
  background: transparent;
  font-size: 18px;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
  transition: color 0.2s ease;
}

.job-name-button:hover {
  color: var(--page-accent);
}

.company-name {
  color: var(--page-subtle);
}

.job-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  color: #8a95a8;
  font-size: 14px;
  margin-bottom: 14px;
}

.job-desc {
  color: #4a4a4a;
  line-height: 1.75;
  min-height: 48px;
  margin-bottom: 18px;
}

.job-status-tag {
  border-radius: 999px;
  font-weight: 700;
}

.job-status-tag.is-open {
  color: var(--page-accent);
  border-color: rgba(79, 70, 229, 0.18);
  background: rgba(79, 70, 229, 0.08);
}

.job-status-tag.is-closed {
  color: #7a869d;
  border-color: #d7dce8;
  background: #f4f6fb;
}

.job-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.job-keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.keyword-tag {
  color: var(--page-accent);
  border-color: rgba(79, 70, 229, 0.16);
  background: rgba(79, 70, 229, 0.08);
}

.job-actions {
  display: flex;
  align-items: center;
}

.detail-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.detail-head h2 {
  margin: 0;
  color: var(--page-text);
  font-size: 24px;
  font-weight: 700;
}

.detail-head p {
  margin: 8px 0 0;
  color: var(--page-subtle);
}

.detail-meta {
  margin-bottom: 20px;
}

.detail-meta :deep(.el-descriptions__label) {
  color: #5f6c84;
  font-weight: 700;
  background: #f7f8fe;
}

.detail-meta :deep(.el-descriptions__content) {
  color: #364154;
}

.detail-section + .detail-section {
  margin-top: 18px;
}

.detail-section h3 {
  margin: 0 0 10px;
  color: var(--page-text);
  font-size: 16px;
  font-weight: 700;
}

.detail-text,
.detail-empty {
  margin: 0;
  color: #4a4a4a;
  line-height: 1.75;
  white-space: pre-wrap;
}

.detail-empty {
  color: #909399;
}

.job-detail-dialog :deep(.el-dialog) {
  border-radius: 18px;
  overflow: hidden;
}

.job-detail-dialog :deep(.el-dialog__header) {
  margin-right: 0;
  padding: 20px 24px 14px;
  border-bottom: 1px solid #eceffd;
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.1), rgba(255, 255, 255, 0.98));
}

.job-detail-dialog :deep(.el-dialog__title) {
  color: var(--page-text);
  font-size: 20px;
  font-weight: 800;
}

.job-detail-dialog :deep(.el-dialog__body) {
  padding: 20px 24px 24px;
  max-height: 70vh;
  overflow: auto;
}

.empty-state {
  padding: 80px 0;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding-top: 22px;
}

.pagination-wrapper :deep(.btn-prev),
.pagination-wrapper :deep(.btn-next),
.pagination-wrapper :deep(.el-pager li) {
  border-radius: 10px;
}

.pagination-wrapper :deep(.el-pager li.is-active) {
  background: var(--page-accent);
  color: #ffffff;
}

@media (max-width: 900px) {
  .page-toolbar {
    align-items: stretch;
    padding: 18px;
  }

  .toolbar-right {
    width: 100%;
  }

  .search-input {
    width: 100%;
  }

  .search-filter {
    width: 100%;
  }
}
</style>
