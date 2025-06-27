const examService = require('../services/exam.service');

// 모든 try-catch 블록을 감싸는 래퍼 함수로 코드 중복을 줄입니다.
const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

exports.getExamTypes = asyncHandler(async (req, res) => {
    const data = await examService.getExamTypes();
    res.json(data);
});

exports.getRoundsByExamType = asyncHandler(async (req, res) => {
    const { examTypeId } = req.params;
    const data = await examService.getRoundsByExamType(examTypeId);
    res.json(data);
});

exports.getQuestions = asyncHandler(async (req, res) => {
    const { examTypeId, round } = req.query;
    if (!examTypeId || !round) {
        return res.status(400).json({ message: 'examTypeId와 round 파라미터가 필요합니다.' });
    }
    const data = await examService.getQuestions(examTypeId, round);
    res.json(data);
});

exports.generateMockExam = asyncHandler(async (req, res) => {
    const { examTypeId } = req.query;
    if (!examTypeId) {
        return res.status(400).json({ message: '쿼리 파라미터로 examTypeId가 필요합니다.' });
    }
    const data = await examService.generateMockExam(examTypeId);
    res.json(data);
});