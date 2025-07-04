const pool = require('../config/database');
const aiService = require('./aiService.js');

const SCORE_MAP = {
  '단답형': 3,
  '서술형': 12,
  '실무형': 16
};

async function submitAnswers(userId, setId, answers) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction(); 

        // [수정] mock_exam_submissions 테이블에 setId를 저장합니다.
        const [submissionResult] = await connection.query(
            'INSERT INTO mock_exam_submissions (user_id, set_id, submitted_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
            [userId, setId]
        );
        const submissionId = submissionResult.insertId;

        // user_answers 테이블에는 exam_type_id를 저장할 필요가 없습니다.
        for (const userAnswer of answers) {
            await connection.query(
                'INSERT INTO user_answers (submission_id, user_id, question_id, submitted_answer, submitted_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
                [submissionId, userId, userAnswer.questionId, userAnswer.answer]
            );
        }

        await connection.commit(); 
        return { message: `${answers.length}개의 답안이 성공적으로 기록되었습니다.`, submissionId };
    } catch (error) {
        await connection.rollback(); 
        throw error;
    } finally {
        connection.release();
    }
}


async function getMySubmissions(userId) {
    // [수정] SQL 쿼리문을 새로운 테이블 구조에 맞게 변경합니다.
    // mock_exam_submissions -> mock_exam_sets -> exam_types 순서로 JOIN 합니다.
    const query = `
        SELECT 
            ms.id as submissionId, 
            ms.submitted_at, 
            mes.set_name as examSetName, -- 모의고사 세트 이름으로 변경
            et.certification_name as examTypeName,
            (SELECT COUNT(*) FROM user_answers ua WHERE ua.submission_id = ms.id) as answeredQuestionsCount
        FROM mock_exam_submissions ms
        JOIN mock_exam_sets mes ON ms.set_id = mes.id
        JOIN exam_types et ON mes.exam_type_id = et.id
        WHERE ms.user_id = ?
        ORDER BY ms.submitted_at DESC;
    `;
    const [submissions] = await pool.query(query, [userId]);
    return submissions;
}

async function getSubmissionResult(submissionId) {
    // [수정] SQL 쿼리문을 새로운 테이블 구조에 맞게 변경합니다.
    const [submissionDetails] = await pool.query(
        `SELECT 
            ms.id as submissionId, 
            ms.submitted_at, 
            mes.id as setId,
            mes.set_name as examSetName,
            et.id as examTypeId, 
            et.certification_name as examTypeName
         FROM mock_exam_submissions ms
         JOIN mock_exam_sets mes ON ms.set_id = mes.id
         JOIN exam_types et ON mes.exam_type_id = et.id
         WHERE ms.id = ?`,
        [submissionId]
    );

    if (submissionDetails.length === 0) {
        throw new Error('해당 제출 기록을 찾을 수 없습니다.');
    }

    const query = `
        SELECT 
            q.id as questionId,
            q.question_text,
            q.correct_answer,
            q.explanation,
            q.question_type,
            q.topic,
            ua.submitted_answer,
            ua.ai_score,
            ua.ai_comment
        FROM user_answers ua
        JOIN questions q ON ua.question_id = q.id
        WHERE ua.submission_id = ?
        ORDER BY q.id;
    `;
    const [answeredQuestions] = await pool.query(query, [submissionId]);

    return {
        submissionInfo: submissionDetails[0],
        answeredQuestions: answeredQuestions
    };
}

async function getAiFeedback(submissionId, questionId) {
    const [existing] = await pool.query('SELECT ai_comment FROM user_answers WHERE submission_id = ? AND question_id = ?', [submissionId, questionId]);
    if (existing.length > 0 && existing[0].ai_comment) {
        return { feedback: existing[0].ai_comment, fromCache: true };
    }

    const [dataRows] = await pool.query(
        `SELECT q.question_text, q.correct_answer, ua.submitted_answer FROM user_answers ua JOIN questions q ON ua.question_id = q.id WHERE ua.submission_id = ? AND ua.question_id = ?`,
        [submissionId, questionId]
    );
    if (dataRows.length === 0) throw new Error("해설 생성에 필요한 문제 정보를 찾을 수 없습니다.");
    const data = dataRows[0];
    
    const newFeedback = await aiService.generateFeedbackForAnswer(data.question_text, data.correct_answer, data.submitted_answer);
    
    await pool.query('UPDATE user_answers SET ai_comment = ? WHERE submission_id = ? AND question_id = ?', [newFeedback, submissionId, questionId]);
    
    return { feedback: newFeedback, fromCache: false };
}

async function generateSimilarQuestion(originalQuestionId, userId) {
    const [originals] = await pool.query('SELECT question_text, question_type FROM questions WHERE id = ?', [originalQuestionId]);
    if (originals.length === 0) throw new Error('원본 문제를 찾을 수 없습니다.');
    const originalQuestion = originals[0];

    const newProblem = await aiService.generateSimilarQuestion(originalQuestion.question_text, originalQuestion.question_type);
    return newProblem;
}

async function scoreAnswer(submissionId, questionId) {
    const [rows] = await pool.query(
        `SELECT q.question_text, q.correct_answer, ua.submitted_answer FROM user_answers ua JOIN questions q ON ua.question_id = q.id WHERE ua.submission_id = ? AND ua.question_id = ?`,
        [submissionId, questionId]
    );
    if (rows.length === 0) throw new Error('채점할 답변을 찾을 수 없습니다.');
    const data = rows[0];

    const score = await aiService.getAiScoreForAnswer(data.question_text, data.correct_answer, data.submitted_answer);
    
    await pool.query('UPDATE user_answers SET ai_score = ? WHERE submission_id = ? AND question_id = ?', [score, submissionId, questionId]);

    return { score };
}

async function calculateFinalScore(submissionId) {
    const [answers] = await pool.query(
        `SELECT q.question_type, ua.ai_score FROM user_answers ua JOIN questions q ON ua.question_id = q.id WHERE ua.submission_id = ? AND ua.ai_score IS NOT NULL`,
        [submissionId]
    );
    if (answers.length === 0) throw new Error('채점된 답변이 없습니다. 각 문제에 대해 AI 채점을 먼저 진행해주세요.');
    
    let finalScore = 0;
    for (const answer of answers) {
        const maxPoints = SCORE_MAP[answer.question_type];
        const aiScore = answer.ai_score;
        if (maxPoints !== undefined && aiScore !== null) {
            finalScore += (aiScore / 100) * maxPoints;
        }
    }
    return { finalScore: Math.round(finalScore * 10) / 10 };
}

module.exports = {
    submitAnswers,
    getMySubmissions,
    getSubmissionResult,
    getAiFeedback,
    generateSimilarQuestion,
    scoreAnswer,
    calculateFinalScore
};