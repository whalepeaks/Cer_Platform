import client from './client';

// 모든 공식 모의고사 세트 목록을 가져옵니다.
export const getExamSets = () => client.get('/api/exams/sets');
// 특정 모의고사 세트에 포함된 문제들을 가져옵니다.
export const getExamSetQuestions = (setId) => client.get(`/api/exams/sets/${setId}`);