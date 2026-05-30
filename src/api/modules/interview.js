import request from '../request';

// HR 发送面试邀请
export const sendInterview = (data) => request.post('/hr/interview/send', data);
// HR 获取消息通知列表
export const getHrMessageList = (params) => request.get('/hr/message/list', { params });
// HR 获取消息详情
export const getHrMessageDetail = (message_id) => request.get('/hr/message/detail', { params: { message_id } });

// 求职者获取消息通知列表
export const getSeekerMessageList = (params) => request.get('/seeker/message/list', { params });
// 求职者获取消息详情
export const getSeekerMessageDetail = (message_id) => request.get('/seeker/message/detail', { params: { message_id } });
// 求职者处理面试邀请
export const handleInterview = (data) => request.post('/seeker/interview/handle', data);