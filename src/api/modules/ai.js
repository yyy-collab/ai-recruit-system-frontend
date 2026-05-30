import request from '../request';

// 中文分词
export const wordSegment = (text) => request.post('/ai/word/segment', { text });
// 关键词提取
export const extractKeywords = (data) => request.post('/ai/keyword/extract', data);
// 匹配度计算
export const calculateMatch = (job_id, resume_id) => request.post('/ai/match/calculate', { job_id, resume_id });
// 重新计算投递匹配度
export const recalculateMatch = (delivery_id) => request.post('/ai/match/recalculate', { delivery_id });