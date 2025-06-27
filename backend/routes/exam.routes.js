const express = require('express');
const router = express.Router();
const examController = require('../controllers/exam.controller');

// [신규] GET /api/exams/sets - 모든 모의고사 세트 목록 조회
router.get('/sets', examController.getExamSets);

// [신규] GET /api/exams/sets/:setId - 특정 모의고사 세트의 문제들 조회
router.get('/sets/:setId', examController.getExamSetQuestions);

// 이전 라우트들은 삭제합니다.
// router.get('/exam-types', examController.getExamTypes);
// router.get('/questions', examController.getQuestions);
// router.get('/generate-mock', examController.generateMockExam);

module.exports = router;