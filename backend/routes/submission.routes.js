const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submission.controller');

// [POST] /api/submissions - 답안 제출
router.post('/', submissionController.submitAnswers);

// [GET] /api/submissions/my - 내 제출 기록 목록
router.get('/my', submissionController.getMySubmissions);

// [GET] /api/submissions/:submissionId - 특정 제출 결과 상세
router.get('/:submissionId', submissionController.getSubmissionResult);

// [GET] /api/submissions/:submissionId/final-score - 최종 점수 계산
router.get('/:submissionId/final-score', submissionController.calculateFinalScore);

// --- AI 관련 라우트 ---

// [POST] /api/submissions/score-answer - 특정 문제 채점하기
router.post('/score-answer', submissionController.scoreAnswer);

// [POST] /api/submissions/feedback - 특정 문제 AI 해설 생성/조회
router.post('/feedback', submissionController.getAiFeedback);

// [POST] /api/submissions/generate-similar - 유사 문제 생성
router.post('/generate-similar', submissionController.generateSimilarQuestion);

module.exports = router;