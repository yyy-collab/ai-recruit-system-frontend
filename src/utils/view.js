import dayjs from 'dayjs';

export function valueOf(source, keys, fallback = '') {
  if (!source) return fallback;
  const candidates = Array.isArray(keys) ? keys : [keys];
  for (const key of candidates) {
    if (source[key] !== undefined && source[key] !== null && source[key] !== '') {
      return source[key];
    }
  }
  return fallback;
}

export function pageItems(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.list)) return data.list;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.records)) return data.records;
  if (Array.isArray(data.rows)) return data.rows;
  return [];
}

export function pageTotal(data) {
  if (!data) return 0;
  return Number(data.total || data.totalCount || pageItems(data).length || 0);
}

export function formatDateLoose(value) {
  if (!value) return '';
  if (Array.isArray(value) && value.length >= 3) {
    return `${value[0]}-${Number(value[1])}-${Number(value[2])}`;
  }
  const text = String(value).slice(0, 10);
  const match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (match) {
    return `${match[1]}-${Number(match[2])}-${Number(match[3])}`;
  }
  return dayjs(value).isValid() ? dayjs(value).format('YYYY-M-D') : text;
}

export function formatTimeLoose(value) {
  if (!value) return '';
  if (Array.isArray(value) && value.length >= 2) {
    return `${Number(value[0])}:${String(value[1]).padStart(2, '0')}`;
  }
  const match = String(value).match(/^(\d{1,2}):(\d{2})/);
  if (match) {
    return `${Number(match[1])}:${match[2]}`;
  }
  return String(value);
}

export function formatDateTimeLoose(value) {
  if (!value) return '';
  if (Array.isArray(value) && value.length >= 5) {
    return `${value[0]}-${Number(value[1])}-${Number(value[2])} ${Number(value[3])}:${String(value[4]).padStart(2, '0')}`;
  }
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format('YYYY-M-D HH:mm') : String(value);
}

export function formatInterviewRange(value) {
  const start = formatTimeLoose(value);
  const match = start.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return start;
  const hour = Number(match[1]);
  const endHour = (hour + 1) % 24;
  return `${start}-${endHour}:${match[2]}`;
}

export function interviewStatusMeta(status, fallbackText = '') {
  const normalized = Number(status);
  const map = {
    0: { text: '待确认', className: 'is-pending', description: '等待对方确认' },
    1: { text: '已接受', className: 'is-accepted', description: '候选人已接受邀请' },
    2: { text: '已拒绝', className: 'is-rejected', description: '候选人已拒绝邀请' },
  };
  return map[normalized] || { text: fallbackText || '未知状态', className: 'is-unknown', description: fallbackText || '状态未知' };
}

export function initials(name, fallback = 'AI') {
  const text = String(name || fallback).trim();
  return text ? text.slice(0, 1) : fallback.slice(0, 1);
}

export function normalizeTimeForApi(value) {
  const time = String(value || '').trim();
  if (!time) return '';
  if (/^\d{1,2}:\d{2}:\d{2}$/.test(time)) return time.padStart(8, '0');
  if (/^\d{1,2}:\d{2}$/.test(time)) {
    const [hour, minute] = time.split(':');
    return `${hour.padStart(2, '0')}:${minute}:00`;
  }
  return time;
}
