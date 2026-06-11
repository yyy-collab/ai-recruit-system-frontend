import request from '../request';

export const uploadResume = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return request.post('/resume/upload', formData);
};

export const reparseResume = (resume_id) => request.post('/resume/ai/reparse', { resumeId: resume_id });
export const getMyResumeList = () => request.get('/resume/myList');
export const getResumeAiDetail = (resume_id) => request.get('/resume/ai/detail', { params: { resume_id } });
export const deleteResume = (resume_id) => request.delete('/resume/delete', { params: { resume_id } });
export const previewResume = (resume_id) => request.get('/resume/preview', { params: { resume_id } });
