import request from '../request';

export const hrRegister = (data) => request.post('/hr/register', data);
export const hrLogin = (data) => request.post('/hr/login', data);
export const getHrInfo = () => request.get('/hr/userInfo');
export const logoutHr = () => request.post('/hr/logout');
export const updateHrInfo = (data) => request.put('/hr/update', data);
export const deleteHr = (data) => request.delete('/hr/delete', { data });
export const updateHrPwd = (data) => request.patch('/hr/updatePwd', data);
export const resetHrPwd = (data) => request.post('/hr/resetPwd', data);