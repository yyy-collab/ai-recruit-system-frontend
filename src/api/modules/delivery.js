import request from '../request';

// 求职者投递岗位，后端需要 jobId、seekerId、resumeId 等投递对象字段
export const addDelivery = (data) => request.post('/seeker/delivery/add', data);
export const getMyDeliveryList = (params) => request.get('/seeker/delivery/myList', { params });

export const getDeliveryList = (params) => request.get('/hr/delivery/list', { params });
export const getDeliveryDetail = (delivery_id) => request.get('/hr/delivery/detail', { params: { delivery_id } });
export const updateDeliveryStatus = (data) => request.patch('/hr/delivery/updateStatus', data);
export const batchUpdateDeliveryStatus = (data) => request.patch('/hr/delivery/batchUpdateStatus', data);
