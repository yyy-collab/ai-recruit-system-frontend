// 表单校验
// 用户名 5~16位字母数字下划线
export const usernameRegex = /^[a-zA-Z0-9_]{5,16}$/;
// 密码 8~16位，必须包含字母和数字
export const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,16}$/;
// 手机号
export const phoneRegex = /^1[3-9]\d{9}$/;
// 邮箱
export const emailRegex = /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/;
// 真实姓名 2~20位中文或字母
export const realNameRegex = /^[\u4e00-\u9fa5a-zA-Z]{2,20}$/;

export const validateUsername = (val) => usernameRegex.test(val);
export const validatePassword = (val) => passwordRegex.test(val);
export const validatePhone = (val) => phoneRegex.test(val);
export const validateEmail = (val) => emailRegex.test(val);
export const validateRealName = (val) => realNameRegex.test(val);