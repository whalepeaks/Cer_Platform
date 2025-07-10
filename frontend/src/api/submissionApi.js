import client from './client';

export const getPersonalFeedback = (data) => client.post('/api/submissions/personal-feedback', data);
export const submitAnswers = (submissionData) => client.post('/api/submissions', submissionData);
export const getMySubmissions = (userId) => client.get(`/api/submissions/my?userId=${userId}`);
export const getSubmissionResult = (submissionId) => client.get(`/api/submissions/${submissionId}`);
export const getFinalScore = (submissionId) => client.get(`/api/submissions/${submissionId}/final-score`);
export const scoreAnswer = (scoreData) => client.post('/api/submissions/score-answer', scoreData);
export const getAiFeedback = (feedbackData) => client.post('/api/submissions/feedback', feedbackData);
export const generateSimilarQuestion = (similarData) => client.post('/api/submissions/generate-similar', similarData);