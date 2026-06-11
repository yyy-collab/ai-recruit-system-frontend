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
          placeholder="请输入岗位、公司或关键词搜索"
          clearable
          @clear="handleSearch"
          @keyup.enter.native="handleSearch"
          class="search-input"
        />
        <el-button type="primary" icon="el-icon-search" @click="handleSearch">搜索</el-button>
      </div>
    </div>

    <div class="job-list">
      <el-card v-for="job in jobs" :key="job.id" class="job-card" shadow="hover">
        <div class="job-header">
          <div class="job-title-group">
            <div class="job-name">{{ job.job_name }}</div>
            <div class="company-name">{{ job.company_name || '匿名公司' }}</div>
          </div>
          <div class="job-status">
            <el-tag :type="job.status === 1 ? 'success' : 'info'" effect="plain">
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getSeekerJobList } from '@/api/modules/job';
import { addDelivery } from '@/api/modules/delivery';

const filters = reactive({ keyword: '' });
const jobs = ref([]);
const loading = ref(false);
const applyingJobId = ref(null);

const normalizeJob = (job) => ({
  ...job,
  status: job.status ?? 1,
  isApplied: Boolean(job.is_delivered || job.already_delivered || job.has_delivered || job.isApplied),
});

const loadJobs = async () => {
  loading.value = true;
  try {
    const params = {};
    if (filters.keyword) params.job_name = filters.keyword;
    const res = await getSeekerJobList(params);
    const items = res.data?.items || res.data || [];
    jobs.value = (Array.isArray(items) ? items : [items]).map(normalizeJob);
  } catch (error) {
    console.error('加载求职者岗位列表失败', error);
  } finally {
    loading.value = false;
  }
};

const jobKeywords = (job) => {
  if (!job.keywords) return [];
  return String(job.keywords).split(/[\s,，;；]+/).filter(Boolean).slice(0, 4);
};

const handleSearch = () => {
  loadJobs();
};

const handleApply = async (job) => {
  if (job.status !== 1) return;
  if (job.isApplied) return;

  applyingJobId.value = job.id;
  try {
    await addDelivery({ jobId: job.id });
    job.isApplied = true;
    ElMessage.success('投递成功，已生成简历投递记录');
  } catch (error) {
    console.error('投递失败', error);
    if (error?.code === 10012) {
      ElMessage.warning('您已投递过该岗位，无需重复投递');
      job.isApplied = true;
    }
  } finally {
    applyingJobId.value = null;
  }
};

onMounted(loadJobs);
</script>

<style scoped>
.seeker-jobs-page {
  padding: 24px;
}
.page-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}
.toolbar-left h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
}
.toolbar-left p {
  margin: 8px 0 0;
  color: #606266;
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
.job-list {
  display: grid;
  gap: 16px;
}
.job-card {
  padding: 20px;
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
.job-name {
  font-size: 18px;
  font-weight: 700;
  color: #1f2d3d;
}
.company-name {
  color: #606266;
}
.job-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  color: #909399;
  font-size: 14px;
  margin-bottom: 14px;
}
.job-desc {
  color: #4a4a4a;
  line-height: 1.75;
  min-height: 48px;
  margin-bottom: 18px;
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
  background: #f5f7ff;
}
.job-actions {
  display: flex;
  align-items: center;
}
.empty-state {
  padding: 80px 0;
}
</style>
