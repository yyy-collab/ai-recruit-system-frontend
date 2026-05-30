// 格式化
import dayjs from 'dayjs';

// 格式化日期时间 YYYY-MM-DD HH:mm:ss
export function formatDateTime(dateStr) {
  if (!dateStr) return '';
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm:ss');
}

// 格式化日期 YYYY-MM-DD
export function formatDate(dateStr) {
  if (!dateStr) return '';
  return dayjs(dateStr).format('YYYY-MM-DD');
}

// 匹配度等级映射
export function getMatchLevel(score) {
  if (score >= 90) return '极高潜力';
  if (score >= 75) return '高潜力';
  if (score >= 60) return '中等潜力';
  return '低潜力';
}

// 投递状态映射
export function getDeliveryStatusText(status) {
  const map = { 0: '待处理', 1: '通过', 2: '淘汰', 3: '待面试' };
  return map[status] || '未知';
}

// 面试邀请状态映射
export function getInterviewStatusText(status) {
  const map = { 0: '待确认', 1: '已接受', 2: '已拒绝' };
  return map[status] || '未知';
}