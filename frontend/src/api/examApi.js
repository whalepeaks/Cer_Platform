import client from './client';

export const getExamTypes = () => client.get('/api/exams/exam-types');
export const generateMockExam = (examTypeId) => client.get(`/api/exams/generate-mock?examTypeId=${examTypeId}`);