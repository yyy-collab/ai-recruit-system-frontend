// 文件校验
// 简历支持格式
export const RESUME_ALLOWED_TYPES = ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
export const RESUME_ALLOWED_EXTENSIONS = ['.doc', '.docx'];
export const RESUME_MAX_SIZE = 20 * 1024 * 1024; // 20MB

// 头像支持格式
export const AVATAR_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
export const AVATAR_MAX_SIZE = 5 * 1024 * 1024; // 5MB

export function validateResume(file) {
  if (!RESUME_ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, msg: '简历仅支持 doc、docx 格式' };
  }
  if (file.size > RESUME_MAX_SIZE) {
    return { valid: false, msg: '简历大小不能超过 20MB' };
  }
  return { valid: true };
}

export function validateAvatar(file) {
  if (!AVATAR_ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, msg: '头像仅支持 jpg/png/jpeg/webp 格式' };
  }
  if (file.size > AVATAR_MAX_SIZE) {
    return { valid: false, msg: '头像大小不能超过 5MB' };
  }
  return { valid: true };
}
