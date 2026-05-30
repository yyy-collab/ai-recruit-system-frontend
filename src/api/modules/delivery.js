import request from '../request';

// 求职者投递
export const addDelivery = (job_id) => request.post('/seeker/delivery/add', { job_id });
// 求职者投递列表
export const getMyDeliveryList = (params) => request.get('/seeker/delivery/myList', { params });

// HR 查看岗位投递列表
export const getDeliveryList = (params) => request.get('/hr/delivery/list', { params });
// HR 查看投递详情
export const getDeliveryDetail = (delivery_id) => request.get('/hr/delivery/detail', { params: { delivery_id } });
// HR 修改投递状态
export const updateDeliveryStatus = (data) => request.patch('/hr/delivery/updateStatus', data);
// HR 批量更新投递状态
export const batchUpdateDeliveryStatus = (data) => request.patch('/hr/delivery/batchUpdateStatus', data);