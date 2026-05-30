import request from '../request';

// HR 发布岗位
export const addJob = (data) => request.post('/hr/job/add', data);
// HR 编辑岗位
export const updateJob = (data) => request.put('/hr/job/update', data);
// HR 上下线岗位
export const changeJobStatus = (data) => request.patch('/hr/job/changeStatus', data);
// HR 获取我的岗位列表
export const getMyJobList = (params) => request.get('/hr/job/myList', { params });
// HR 删除岗位
export const deleteJob = (id) => request.delete('/hr/job/delete', { params: { id } });

// 求职者获取岗位列表
export const getSeekerJobList = (params) => request.get('/seeker/job/list', { params });
// 求职者获取岗位详情
export const getJobDetail = (job_id) => request.get('/seeker/job/detail', { params: { job_id } });