<template>
  <div class="resume-page">
    <div class="page-head">
      <h1>智能简历中心</h1>
      <div class="head-actions">
        <el-button class="light-action" :icon="View" :disabled="!currentResume" @click="previewCurrent">
          预览简历
        </el-button>
        <el-button class="primary-action" type="primary" :icon="Download" :disabled="!currentResume" @click="downloadCurrent">
          下载PDF
        </el-button>
      </div>
    </div>

    <div class="resume-layout" v-loading="loading">
      <section class="left-column">
        <div class="upload-card">
          <el-upload
            class="resume-upload"
            drag
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handleUploadChange"
            accept=".doc,.docx"
          >
            <div class="upload-mark">
              <el-icon><Headset /></el-icon>
            </div>
            <strong>更新简历</strong>
            <p>拖拽 DOC/Word 文件到此处或点击浏览文件</p>
            <span>支持 20MB 内的简历文档</span>
          </el-upload>

          <div v-if="currentResume" class="resume-file">
            <el-icon><Document /></el-icon>
            <div>
              <strong>{{ valueOf(currentResume, ['resumeFileName', 'resume_file_name'], '我的简历.docx') }}</strong>
              <span>上次更新：{{ formatDateLoose(valueOf(currentResume, ['createTime', 'create_time'])) }}</span>
            </div>
            <em>{{ parseStatusText(valueOf(currentResume, ['isParsed', 'is_parsed'])) }}</em>
          </div>

          <el-empty v-else description="暂无简历" :image-size="76" />
        </div>

        <div class="score-card">
          <div class="card-title">
            <h2>简历质量评分</h2>
            <span>{{ scoreLevel }}</span>
          </div>
          <div class="score-ring" :style="{ '--score': totalScore }">
            <strong>{{ totalScore }}</strong>
            <span>TOTAL SCORE</span>
          </div>
          <div class="score-bars">
            <div v-for="metric in metrics" :key="metric.label" class="metric-row">
              <div class="metric-head">
                <span>{{ metric.label }}</span>
                <strong>{{ metric.value }}%</strong>
              </div>
              <div class="metric-track">
                <i :style="{ width: `${metric.value}%`, background: metric.color }"></i>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="right-column">
        <div class="insight-grid">
          <article class="insight-card">
            <span class="insight-icon orange">
              <el-icon><MagicStick /></el-icon>
            </span>
            <h2>增加具体的量化指标</h2>
            <p>在智能助手提示项目中，建议补充业务结果、转化率、节省成本等可以被验证的数字。</p>
            <button type="button">点击查看示例 +</button>
          </article>
          <article class="insight-card">
            <span class="insight-icon blue">
              <el-icon><CollectionTag /></el-icon>
            </span>
            <h2>更新技术关键词</h2>
            <p>当前简历中可强化 AI 产品、前端工程化、数据分析等岗位高频能力词。</p>
            <button type="button">点击应用修改 +</button>
          </article>
        </div>

        <div class="radar-card">
          <h2>行业人才技能对标（高级产品经理 - 2026）</h2>
          <div class="radar-wrap">
            <svg viewBox="0 0 360 280" role="img" aria-label="行业人才技能对标雷达图">
              <g transform="translate(180 138)">
                <polygon
                  v-for="level in [1, 2, 3, 4, 5]"
                  :key="level"
                  :points="polygonPoints(level * 18)"
                  fill="none"
                  stroke="#edf0f7"
                  stroke-width="1"
                />
                <line
                  v-for="axis in radarAxes"
                  :key="axis.label"
                  x1="0"
                  y1="0"
                  :x2="axisPoint(axis.index, 92).x"
                  :y2="axisPoint(axis.index, 92).y"
                  stroke="#eef1f7"
                  stroke-width="1"
                />
                <polygon :points="industryPolygon" fill="rgba(123, 135, 157, .16)" stroke="#93a0b2" stroke-width="2" />
                <polygon :points="userPolygon" fill="rgba(79, 70, 229, .18)" stroke="#6566f1" stroke-width="3" />
                <circle
                  v-for="point in userPoints"
                  :key="`user-${point.x}-${point.y}`"
                  :cx="point.x"
                  :cy="point.y"
                  r="4"
                  fill="#6566f1"
                />
              </g>
              <g>
                <text
                  v-for="axis in radarAxes"
                  :key="axis.label"
                  :x="axis.labelPoint.x"
                  :y="axis.labelPoint.y"
                  text-anchor="middle"
                >
                  {{ axis.label }}
                </text>
              </g>
            </svg>
            <div class="legend">
              <span><i class="mine"></i>你的能力</span>
              <span><i class="industry"></i>行业均值</span>
            </div>
          </div>
        </div>
      </section>
    </div>

    <el-dialog v-model="previewVisible" class="preview-dialog" width="760px" align-center>
      <template #header>
        <h2>简历预览</h2>
      </template>
      <pre>{{ previewText || '暂无可预览内容' }}</pre>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  CollectionTag,
  Document,
  Download,
  Headset,
  MagicStick,
  View,
} from '@element-plus/icons-vue';
import {
  deleteResume,
  getMyResumeList,
  getResumeAiDetail,
  previewResume,
  reparseResume,
  uploadResume,
} from '@/api/modules/resume';
import { formatDateLoose, valueOf } from '@/utils/view';

const loading = ref(false);
const uploading = ref(false);
const resumeList = ref([]);
const detail = ref(null);
const previewVisible = ref(false);
const previewText = ref('');

const currentResume = computed(() => resumeList.value[0] || null);
const analysis = computed(() => valueOf(detail.value, 'analysis', {}));
const basicInfo = computed(() => valueOf(analysis.value, ['basicInfo', 'basic_info'], {}));
const skills = computed(() => normalizeArray(valueOf(analysis.value, 'skills', [])));
const workHistory = computed(() => normalizeArray(valueOf(analysis.value, ['workHistory', 'work_history'], [])));

const metrics = computed(() => {
  const keyword = Math.min(96, 58 + skills.value.length * 7);
  const completenessPieces = [
    valueOf(basicInfo.value, ['realName', 'real_name']),
    valueOf(basicInfo.value, 'phone'),
    valueOf(basicInfo.value, 'email'),
    valueOf(analysis.value, ['workExperience', 'work_experience']),
    skills.value.length > 0,
    workHistory.value.length > 0,
  ];
  const completeness = Math.round((completenessPieces.filter(Boolean).length / completenessPieces.length) * 100);
  const competitiveness = Math.min(92, Math.round((keyword * 0.45) + (completeness * 0.35) + (workHistory.value.length ? 18 : 6)));
  return [
    { label: '关键词覆盖率', value: keyword, color: '#6366f1' },
    { label: '语义结构完整性', value: completeness, color: '#22c55e' },
    { label: '竞争力对标', value: competitiveness, color: '#f59e0b' },
  ];
});

const totalScore = computed(() => {
  const values = metrics.value.map((item) => item.value);
  return Math.round(values.reduce((sum, item) => sum + item, 0) / values.length);
});

const scoreLevel = computed(() => {
  if (totalScore.value >= 90) return '优秀';
  if (totalScore.value >= 75) return '待优化';
  if (totalScore.value >= 60) return '可提升';
  return '需完善';
});

const radarValues = computed(() => [
  Math.max(50, Math.min(95, metrics.value[0].value)),
  Math.max(48, Math.min(92, totalScore.value + 4)),
  Math.max(46, Math.min(90, skills.value.length * 12 + 48)),
  Math.max(46, Math.min(92, metrics.value[1].value - 2)),
  Math.max(46, Math.min(90, metrics.value[2].value)),
]);

const industryValues = [72, 70, 66, 68, 74];
const radarLabels = ['AI 应用能力', '数据分析', '项目推进力', '交互表达力', '商业洞察'];
const radarAxes = computed(() => radarLabels.map((label, index) => ({
  label,
  index,
  labelPoint: axisPoint(index, 124, 180, 146),
})));
const userPoints = computed(() => radarValues.value.map((value, index) => axisPoint(index, (value / 100) * 92)));
const userPolygon = computed(() => userPoints.value.map((point) => `${point.x},${point.y}`).join(' '));
const industryPolygon = computed(() => industryValues.map((value, index) => {
  const point = axisPoint(index, (value / 100) * 92);
  return `${point.x},${point.y}`;
}).join(' '));

onMounted(fetchResume);

async function fetchResume() {
  loading.value = true;
  try {
    const res = await getMyResumeList();
    resumeList.value = Array.isArray(res.data) ? res.data : [];
    if (currentResume.value) {
      await fetchDetail(valueOf(currentResume.value, ['resumeId', 'resume_id']));
    } else {
      detail.value = null;
    }
  } catch (error) {
    ElMessage.error(error?.msg || '获取简历失败');
  } finally {
    loading.value = false;
  }
}

async function fetchDetail(resumeId) {
  if (!resumeId) return;
  try {
    const res = await getResumeAiDetail(resumeId);
    detail.value = res.data;
  } catch (error) {
    detail.value = null;
    if (error?.code === 10016 || error?.code === 10017) return;
    ElMessage.warning(error?.msg || '简历分析暂不可用');
  }
}

async function handleUploadChange(uploadFile) {
  if (uploading.value) return;
  const file = uploadFile.raw;
  if (!file) return;

  const suffix = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  if (!['.doc', '.docx'].includes(suffix)) {
    ElMessage.error('简历仅支持 DOC、DOCX 格式');
    return;
  }
  if (file.size > 20 * 1024 * 1024) {
    ElMessage.error('简历大小不能超过 20MB');
    return;
  }

  if (currentResume.value) {
    try {
      await ElMessageBox.confirm('当前账号已上传过简历，需要删除旧简历后再上传新文件。是否继续？', '更新简历', {
        confirmButtonText: '删除并上传',
        cancelButtonText: '取消',
        type: 'warning',
      });
      await deleteResume(valueOf(currentResume.value, ['resumeId', 'resume_id']));
    } catch (error) {
      return;
    }
  }

  uploading.value = true;
  try {
    await uploadResume(file);
    ElMessage.success('简历上传成功');
    await fetchResume();
  } catch (error) {
    ElMessage.error(error?.msg || '上传失败');
  } finally {
    uploading.value = false;
  }
}

async function previewCurrent() {
  const resumeId = valueOf(currentResume.value, ['resumeId', 'resume_id']);
  if (!resumeId) return;
  try {
    const res = await previewResume(resumeId);
    previewText.value = valueOf(res.data, ['previewText', 'preview_text'], '');
    previewVisible.value = true;
  } catch (error) {
    ElMessage.error(error?.msg || '预览失败');
  }
}

function downloadCurrent() {
  const url = valueOf(currentResume.value, ['resumeFileUrl', 'resume_file_url']);
  if (!url) {
    ElMessage.warning('暂无可下载文件');
    return;
  }
  window.open(url, '_blank');
}

function parseStatusText(status) {
  const map = {
    1: '已解析',
    2: '解析中',
    3: '解析失败',
  };
  return map[Number(status)] || '待解析';
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return value.split(/[,，/]/).map((item) => item.trim()).filter(Boolean);
  }
}

function axisPoint(index, radius, offsetX = 0, offsetY = 0) {
  const angle = (-90 + (360 / radarLabels.length) * index) * (Math.PI / 180);
  return {
    x: Number((Math.cos(angle) * radius + offsetX).toFixed(2)),
    y: Number((Math.sin(angle) * radius + offsetY).toFixed(2)),
  };
}

function polygonPoints(radius) {
  return radarLabels.map((_, index) => {
    const point = axisPoint(index, radius);
    return `${point.x},${point.y}`;
  }).join(' ');
}
</script>

<style scoped>
.resume-page {
  min-height: 100vh;
  padding: 28px 28px 48px;
  background: #f6f7fb;
}

.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 24px;
}

.page-head h1 {
  margin: 0;
  color: #172033;
  font-size: 26px;
  line-height: 1.2;
  font-weight: 900;
}

.head-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.head-actions .el-button {
  height: 36px;
  border-radius: 8px;
  padding: 0 16px;
  font-size: 12px;
  font-weight: 900;
}

.primary-action {
  border-color: #4f46e5;
  background: #4f46e5;
}

.light-action {
  color: #344054;
  background: #ffffff;
  border-color: #e1e6ef;
}

.resume-layout {
  display: grid;
  grid-template-columns: 325px minmax(0, 1fr);
  gap: 24px;
}

.left-column,
.right-column {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.upload-card,
.score-card,
.insight-card,
.radar-card {
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 1px 0 rgba(32, 44, 68, 0.02);
}

.upload-card {
  padding: 20px;
}

.resume-upload :deep(.el-upload) {
  width: 100%;
}

.resume-upload :deep(.el-upload-dragger) {
  height: 154px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  border: 1px dashed #dce3ef;
  background: #ffffff;
}

.upload-mark {
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
  border-radius: 50%;
  color: #706df4;
  background: #eeeefe;
  font-size: 21px;
}

.resume-upload strong {
  display: block;
  color: #1f2937;
  font-size: 14px;
  font-weight: 900;
}

.resume-upload p {
  margin: 8px 0 6px;
  color: #8a97aa;
  font-size: 12px;
  font-weight: 700;
}

.resume-upload span {
  color: #d0d7e4;
  font-size: 10px;
  font-weight: 700;
}

.resume-file {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  margin-top: 14px;
  padding: 9px 10px;
  border-radius: 9px;
  background: #f7f9fc;
}

.resume-file .el-icon {
  color: #ef4444;
  font-size: 18px;
}

.resume-file strong {
  display: block;
  overflow: hidden;
  color: #475467;
  font-size: 11px;
  line-height: 1.4;
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.resume-file span {
  color: #8c98a9;
  font-size: 10px;
  font-weight: 700;
}

.resume-file em {
  color: #22c55e;
  font-size: 11px;
  font-style: normal;
  font-weight: 900;
}

.score-card {
  padding: 20px;
}

.card-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.card-title h2,
.insight-card h2,
.radar-card h2 {
  margin: 0;
  color: #161b27;
  font-size: 15px;
  font-weight: 900;
}

.card-title span {
  min-width: 42px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  color: #f59e0b;
  background: #fff5d6;
  font-size: 11px;
  font-weight: 900;
}

.score-ring {
  width: 108px;
  height: 108px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 0 auto 18px;
  border-radius: 50%;
  background:
    radial-gradient(circle at center, #ffffff 56%, transparent 58%),
    conic-gradient(#6366f1 calc(var(--score) * 1%), #edf1f6 0);
}

.score-ring strong {
  color: #111827;
  font-size: 27px;
  font-weight: 900;
  line-height: 1;
}

.score-ring span {
  color: #a2adbc;
  font-size: 9px;
  font-weight: 900;
}

.score-bars {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.metric-head {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  color: #4b5563;
  font-size: 11px;
  font-weight: 900;
}

.metric-track {
  height: 31px;
  overflow: hidden;
  border-radius: 0 18px 18px 0;
  background: #eef2f7;
}

.metric-track i {
  display: block;
  height: 100%;
}

.insight-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.insight-card {
  min-height: 120px;
  padding: 18px;
}

.insight-icon {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  border-radius: 9px;
  font-size: 16px;
}

.insight-icon.orange {
  color: #f59e0b;
  background: #fff0d9;
}

.insight-icon.blue {
  color: #3b82f6;
  background: #e7f0ff;
}

.insight-card p {
  margin: 9px 0 10px;
  color: #8490a3;
  font-size: 11px;
  line-height: 1.55;
  font-weight: 700;
}

.insight-card button {
  border: 0;
  padding: 0;
  color: #4f46e5;
  background: transparent;
  font-size: 11px;
  font-weight: 900;
  cursor: pointer;
}

.radar-card {
  min-height: 284px;
  padding: 22px 22px 18px;
}

.radar-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.radar-wrap svg {
  width: min(520px, 100%);
  height: 236px;
}

.radar-wrap text {
  fill: #d4dbe7;
  font-size: 11px;
  font-weight: 800;
}

.legend {
  display: flex;
  align-items: center;
  gap: 18px;
  color: #495466;
  font-size: 12px;
  font-weight: 800;
}

.legend span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.legend i {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.legend .mine {
  background: #6566f1;
}

.legend .industry {
  background: #93a0b2;
}

:global(.preview-dialog) {
  --el-dialog-border-radius: 8px;
}

.preview-dialog h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 900;
}

.preview-dialog pre {
  max-height: 62vh;
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

@media (max-width: 980px) {
  .resume-layout {
    grid-template-columns: 1fr;
  }

  .insight-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .resume-page {
    padding: 22px 16px 40px;
  }

  .page-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .head-actions {
    width: 100%;
  }

  .head-actions .el-button {
    flex: 1;
  }
}
</style>
