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
        <el-table-column prop="job_name" label="岗位名称" min-width="180" />
        <el-table-column prop="salary" label="薪资" width="120" />
        <el-table-column prop="work_address" label="工作地点" width="140" />
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '已上线' : '已下线' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="delivery_count" label="投递数" width="100" />
        <el-table-column prop="create_time" label="发布时间" width="180" />
        <el-table-column prop="update_time" label="更新时间" width="180" />
        <el-table-column label="操作" width="240">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="toggleStatus(row)">
              {{ row.status === 1 ? '下线' : '上线' }}
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getMyJobList, changeJobStatus, deleteJob } from '@/api/modules/job';

const router = useRouter();
const jobs = ref([]);
const loading = ref(false);
const total = ref(0);
const onlineCount = ref(0);
const offlineCount = ref(0);

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
});

const filters = reactive({
  job_name: '',
  status: '',
});

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

const toggleStatus = async (row) => {
  const targetStatus = row.status === 1 ? 0 : 1;
  try {
    await ElMessageBox.confirm(
      `确定要将岗位「${row.job_name}」${targetStatus === 1 ? '上线' : '下线'}吗？`,
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
      `确定删除岗位「${row.job_name}」吗？删除后无法恢复。`,
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

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
