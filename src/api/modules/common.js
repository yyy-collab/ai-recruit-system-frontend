// src/api/modules/common.js
import request from '../request';

// 刷新令牌（注意：求职者和HR都有，需要根据当前角色调用，这里提供通用刷新，实际请求时根据token里的角色自动路由）
// 因为后端刷新接口分 /seeker/refreshToken 和 /hr/refreshToken，需要前端判断当前角色
// 为了通用，我们在调用时动态决定路径，或者存储角色后再调用
let currentRole = null; // 由store设置

export function setRefreshRole(role) {
  currentRole = role;
}

export function refreshToken() {
  const path = currentRole === 'hr' ? '/hr/refreshToken' : '/seeker/refreshToken';
  return request.post(path);
}

// 公共文件上传（头像等）
export function uploadFile(file, type = 'avatar') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);
  return request.post('/common/file/upload', formData);
}

// 获取邮箱验证码
export function getEmailCode(email, type) {
  return request.post('/common/verify/code', { email, type });
}