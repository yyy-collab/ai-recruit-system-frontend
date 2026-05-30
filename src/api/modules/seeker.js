import request from '../request';

export const seekerRegister = (data) => request.post('/seeker/register', data);
export const seekerLogin = (data) => request.post('/seeker/login', data);
export const getSeekerInfo = () => request.get('/seeker/userInfo');
export const logoutSeeker = () => request.post('/seeker/logout');
export const updateSeekerInfo = (data) => request.put('/seeker/update', data);
export const updateSeekerPwd = (data) => request.patch('/seeker/updatePwd', data);
export const deleteSeeker = (data) => request.delete('/seeker/delete', { data });
export const resetSeekerPwd = (data) => request.post('/seeker/resetPwd', data);