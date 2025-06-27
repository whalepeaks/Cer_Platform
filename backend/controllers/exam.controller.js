const examService = require('../services/exam.service');

const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// [신규] 모든 모의고사 세트 목록 조회 컨트롤러
exports.getExamSets = asyncHandler(async (req, res) => {
    const data = await examService.getExamSets();
    res.json(data);
});

// [신규] 특정 세트의 문제 조회 컨트롤러
exports.getExamSetQuestions = asyncHandler(async (req, res) => {
    const { setId } = req.params;
    const data = await examService.getExamSetQuestions(setId);
    res.json(data);
});