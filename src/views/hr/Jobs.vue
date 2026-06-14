<template>
  <div class="hr-jobs-page">
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button type="primary" icon="el-icon-plus" @click="goCreateJob">发布新职位</el-button>
      </div>
      <div class="toolbar-right">
        <el-input v-model="filters.job_name" placeholder="请输入岗位名称搜索" clearable @clear="handleSearch" @keyup.enter="handleSearch" style="width: 320px; margin-right: 12px;" />
        <el-select v-model="filters.status" placeholder="岗位状态" clearable @change="handleSearch" style="width: 160px; margin-right: 12px;">
          <el-option label="全部" value="" />
          <el-option label="已上线" value="1" />
          <el-option label="已下线" value="0" />
        </el-select>
        <el-button type="primary" icon="el-icon-search" @click="handleSearch">搜索</el-button>
      </div>
    </div>

    <div class="summary-panel">
      <div>总岗位：{{ total }}</div>
      <div>已上线：{{ onlineCount }}</div>
      <div>已下线：{{ offlineCount }}</div>
    </div>

    <el-card class="job-card" shadow="always">
      <el-table
        :data="jobs"
        v-loading="loading"
        stripe
        border
        style="width: 100%;"
      >
        <el-table-column label="岗位名称" min-width="220">
          <template #default="{ row }">
            <el-button link type="primary" class="job-name-button" @click="openJobDetail(row)">
              {{ jobNameOf(row) }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column prop="salary" label="薪资" width="120" />
        <el-table-column prop="work_address" label="工作地点" width="140" />
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="jobStatusTagType(row)">
              {{ jobStatusText(row) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="delivery_count" label="投递数" width="100" />
        <el-table-column prop="create_time" label="发布时间" width="180" />
        <el-table-column prop="update_time" label="更新时间" width="180" />
        <el-table-column label="操作" width="240">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="toggleStatus(row)">
              {{ jobStatusOf(row) === 1 ? '下线' : '上线' }}
            </el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)" style="margin-left: 8px;">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-if="total > 0"
          :current-page="pagination.pageNum"
          :page-size="pagination.pageSize"
          :page-sizes="[5, 10, 20, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="detailVisible"
      title="岗位详情"
      width="760px"
      class="job-detail-dialog"
      align-center
    >
      <template v-if="activeJob">
        <div class="job-detail-header">
          <div>
            <h2>{{ jobNameOf(activeJob) }}</h2>
            <p>{{ salaryOf(activeJob) }} · {{ workAddressOf(activeJob) }}</p>
          </div>
          <el-tag :type="jobStatusTagType(activeJob)" size="large">
            {{ jobStatusText(activeJob) }}
          </el-tag>
        </div>

        <el-descriptions :column="2" border class="job-detail-meta">
          <el-descriptions-item label="薪资">{{ salaryOf(activeJob) }}</el-descriptions-item>
          <el-descriptions-item label="工作地点">{{ workAddressOf(activeJob) }}</el-descriptions-item>
          <el-descriptions-item label="工作经验">{{ workExperienceOf(activeJob) }}</el-descriptions-item>
          <el-descriptions-item label="投递数">{{ deliveryCountOf(activeJob) }}</el-descriptions-item>
          <el-descriptions-item label="发布时间">{{ createTimeOf(activeJob) || '-' }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ updateTimeOf(activeJob) || '-' }}</el-descriptions-item>
        </el-descriptions>

        <section class="job-detail-section">
          <h3>核心关键词</h3>
          <div v-if="jobKeywords(activeJob).length" class="job-keywords">
            <el-tag v-for="keyword in jobKeywords(activeJob)" :key="keyword" effect="plain" class="keyword-tag">
              {{ keyword }}
            </el-tag>
          </div>
          <p v-else class="empty-text">暂无</p>
        </section>

        <section class="job-detail-section">
          <h3>岗位描述</h3>
          <p class="job-detail-text">{{ jobDescOf(activeJob) }}</p>
        </section>

        <section class="job-detail-section">
          <h3>任职要求</h3>
          <p class="job-detail-text">{{ requirementOf(activeJob) }}</p>
        </section>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getMyJobList, changeJobStatus, deleteJob } from '@/api/modules/job';
import { formatDateTimeLoose, valueOf } from '@/utils/view';

const router = useRouter();
const jobs = ref([]);
const loading = ref(false);
const total = ref(0);
const onlineCount = ref(0);
const offlineCount = ref(0);
const detailVisible = ref(false);
const activeJob = ref(null);

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
});

const filters = reactive({
  job_name: '',
  status: '',
});

const jobField = (job, keys, fallback = '') => valueOf(job, keys, fallback);
const jobNameOf = (job) => jobField(job, ['job_name', 'jobName'], '未命名岗位');
const salaryOf = (job) => jobField(job, 'salary', '面议');
const workAddressOf = (job) => jobField(job, ['work_address', 'workAddress'], '不限地点');
const workExperienceOf = (job) => jobField(job, ['work_experience', 'workExperience'], '经验不限');
const deliveryCountOf = (job) => Number(jobField(job, ['delivery_count', 'deliveryCount'], 0) || 0);
const jobDescOf = (job) => jobField(job, ['job_desc', 'jobDesc'], '暂无岗位描述');
const requirementOf = (job) => jobField(job, 'requirement', '暂无任职要求');
const createTimeOf = (job) => formatDateTimeLoose(jobField(job, ['create_time', 'createTime']));
const updateTimeOf = (job) => formatDateTimeLoose(jobField(job, ['update_time', 'updateTime']));
const jobStatusOf = (job) => Number(jobField(job, 'status', 0));
const jobStatusText = (job) => (jobStatusOf(job) === 1 ? '已上线' : '已下线');
const jobStatusTagType = (job) => (jobStatusOf(job) === 1 ? 'success' : 'info');

const jobKeywords = (job) => {
  const keywords = jobField(job, 'keywords', '');
  return String(keywords)
    .split(/[\s,，/]+/)
    .map(item => item.trim())
    .filter(Boolean);
};

const loadJobs = async () => {
  loading.value = true;
  try {
    const params = {
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
    };
    if (filters.job_name) params.job_name = filters.job_name;
    if (filters.status !== '') params.status = Number(filters.status);

    const res = await getMyJobList(params);
    if (res && res.code === 0) {
      total.value = res.data?.total || 0;
      jobs.value = res.data?.items || [];
      onlineCount.value = jobs.value.filter(item => item.status === 1).length;
      offlineCount.value = jobs.value.filter(item => item.status === 0).length;
    }
  } catch (error) {
    console.error('加载岗位列表失败', error);
  } finally {
    loading.value = false;
  }
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

const openJobDetail = (row) => {
  activeJob.value = { ...row };
  detailVisible.value = true;
};

const toggleStatus = async (row) => {
  const targetStatus = jobStatusOf(row) === 1 ? 0 : 1;
  try {
    await ElMessageBox.confirm(
      `确定要将岗位「${jobNameOf(row)}」${targetStatus === 1 ? '上线' : '下线'}吗？`,
      '请确认',
      { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' }
    );
    const res = await changeJobStatus({ id: row.id, status: targetStatus });
    if (res && res.code === 0) {
      ElMessage.success('操作成功');
      loadJobs();
    }
  } catch (err) {
    if (err !== 'cancel') {
      console.error(err);
    }
  }
};

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定删除岗位「${jobNameOf(row)}」吗？删除后无法恢复。`,
      '删除确认',
      { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' }
    );
    const res = await deleteJob(row.id);
    if (res && res.code === 0) {
      ElMessage.success('删除成功');
      loadJobs();
    }
  } catch (err) {
    if (err !== 'cancel') {
      console.error(err);
    }
  }
};

const goCreateJob = () => {
  router.push('/hr/jobs/create');
};

onMounted(loadJobs);
</script>

<style scoped>
.hr-jobs-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.summary-panel {
  display: flex;
  gap: 20px;
  align-items: center;
  padding: 16px 0;
  color: #333;
  font-size: 14px;
}

.job-card {
  padding: 20px;
}

.job-name-button {
  padding: 0;
  font-size: 15px;
  font-weight: 700;
}

.job-name-button:hover {
  text-decoration: underline;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.job-detail-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.job-detail-header h2 {
  margin: 0;
  color: #1f2d3d;
  font-size: 24px;
  font-weight: 700;
}

.job-detail-header p {
  margin: 8px 0 0;
  color: #606266;
}

.job-detail-meta {
  margin-bottom: 20px;
}

.job-detail-section + .job-detail-section {
  margin-top: 20px;
}

.job-detail-section h3 {
  margin: 0 0 12px;
  color: #1f2d3d;
  font-size: 16px;
  font-weight: 700;
}

.job-keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.job-detail-text,
.empty-text {
  margin: 0;
  color: #4a4a4a;
  line-height: 1.75;
  white-space: pre-wrap;
}

.empty-text {
  color: #909399;
}

.job-detail-dialog :deep(.el-dialog__body) {
  max-height: 70vh;
  overflow: auto;
}
</style>
