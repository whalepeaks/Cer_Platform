const express = require('express');
const router = express.Router();
const examController = require('../controllers/exam.controller');

// GET /api/exams/types
router.get('/exam-types', examController.getExamTypes);

// GET /api/exams/types/:examTypeId/rounds
router.get('/exam-types/:examTypeId/rounds', examController.getRoundsByExamType);

// GET /api/exams/questions
router.get('/questions', examController.getQuestions);

// GET /api/exams/generate-mock
router.get('/generate-mock', examController.generateMockExam);

module.exports = router;