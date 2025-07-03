const submissionService = require('../services/submission.service');

const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

exports.submitAnswers = asyncHandler(async (req, res) => {
    const { userId, setId, answers } = req.body;
    
    // 이 부분에서 "필수 정보가 누락되었습니다" 오류가 발생하고 있습니다.
    if (!userId || !setId || !answers || !Array.isArray(answers) || answers.length === 0) {
        return res.status(400).json({ message: '잘못된 요청입니다. 필수 정보가 누락되었습니다.' });
    }

    const result = await submissionService.submitAnswers(userId, setId, answers);
    res.status(201).json(result);
});


exports.getMySubmissions = asyncHandler(async (req, res) => {
    const { userId } = req.query; // 프론트엔드에서 쿼리로 userId를 보내는 것을 가정
    if (!userId) return res.status(401).json({ message: "사용자 인증이 필요합니다." });
    
    const data = await submissionService.getMySubmissions(userId);
    res.json(data);
});

exports.getSubmissionResult = asyncHandler(async (req, res) => {
    const { submissionId } = req.params;
    const data = await submissionService.getSubmissionResult(submissionId);
    if (!data) return res.status(404).json({ message: '해당 제출 기록을 찾을 수 없습니다.' });
    res.json(data);
});

exports.getAiFeedback = asyncHandler(async (req, res) => {
    const { submissionId, questionId } = req.body;
    if (!submissionId || !questionId) {
        return res.status(400).json({ message: "submissionId와 questionId는 필수입니다." });
    }
    const result = await submissionService.getAiFeedback(submissionId, questionId);
    res.json(result);
});

exports.generateSimilarQuestion = asyncHandler(async (req, res) => {
    const { originalQuestionId, userId } = req.body;
    if (!originalQuestionId || !userId) {
        return res.status(400).json({ message: "필수 정보(원본 문제 ID, 사용자 ID)가 누락되었습니다." });
    }
    const data = await submissionService.generateSimilarQuestion(originalQuestionId, userId);
    res.status(201).json(data);
});

exports.scoreAnswer = asyncHandler(async (req, res) => {
    const { submissionId, questionId } = req.body;
    if (!submissionId || !questionId) {
        return res.status(400).json({ message: "submissionId와 questionId는 필수입니다." });
    }
    const data = await submissionService.scoreAnswer(submissionId, questionId);
    res.status(200).json(data);
});

exports.calculateFinalScore = asyncHandler(async (req, res) => {
    const { submissionId } = req.params;
    const data = await submissionService.calculateFinalScore(submissionId);
    res.status(200).json(data);
});