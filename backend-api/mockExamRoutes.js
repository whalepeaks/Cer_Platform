// mockExamRoutes.js (또는 실제 파일명)

const express = require('express');
const router = express.Router(); // Express 라우터 생성

// 이 함수는 server.js에서 pool 객체를 주입받아 사용하도록 합니다.
module.exports = function(pool) { // pool을 인자로 받도록 변경

    // API: 새로운 모의고사 생성
    // 이 파일이 '/api/mock-exam' 경로에 마운트된다면,
    // 실제 경로는 '/api/mock-exam/generate'가 됩니다.
    router.get('/generate', async (req, res) => { // app.get 대신 router.get 사용
        const { examTypeId } = req.query;

        if (!examTypeId) {
            return res.status(400).json({ message: '쿼리 파라미터로 examTypeId가 필요합니다.' });
        }

        const questionRequirements = [
            { type: '단답형', count: 12 },
            { type: '서술형', count: 4 },
            { type: '실무형', count: 2 }
        ];

        const randomOrderClause = 'ORDER BY RAND()'; // MySQL 기준

        try {
            const connection = await pool.getConnection();
            let mockExamQuestions = [];
            let messages = [];

            console.log(`모의고사 생성 요청 받음 (mockExamRoutes.js): examTypeId = ${examTypeId}`);

            for (const requirement of questionRequirements) {
                const query = `
                    SELECT id, question_text, correct_answer, explanation, question_type, round_identifier, question_number
                    FROM questions
                    WHERE exam_type_id = ? AND question_type = ?
                    ${randomOrderClause}
                    LIMIT ?;
                `;
                const [rows] = await connection.query(query, [examTypeId, requirement.type, requirement.count]);

                if (rows.length < requirement.count) {
                    messages.push(`주의: '${requirement.type}' 유형의 문제가 ${requirement.count}개 필요하지만 ${rows.length}개만 찾았습니다.`);
                }
                mockExamQuestions = mockExamQuestions.concat(rows);
            }

            connection.release();

            if (mockExamQuestions.length === 0 && messages.some(msg => msg.startsWith("주의:"))) {
                return res.status(404).json({ message: '모의고사를 생성할 문제를 충분히 찾을 수 없습니다.', details: messages });
            }
            
            console.log(`생성된 문제 수 (mockExamRoutes.js): ${mockExamQuestions.length}`);

            res.json({
                examTypeId: parseInt(examTypeId),
                totalQuestions: mockExamQuestions.length,
                questions: mockExamQuestions,
                generationMessages: messages.length > 0 ? messages : ['모든 유형의 문제가 요청된 수만큼 정상적으로 포함되었습니다.']
            });

        } catch (error) {
            console.error('모의고사 생성 중 DB 오류 (mockExamRoutes.js):', error);
            res.status(500).json({ message: '모의고사 생성 중 서버 오류가 발생했습니다.' });
        }
    });

    // API: 모의고사 답안 제출
    // 이 파일이 '/api/mock-exam' 경로에 마운트된다면,
    // 실제 경로는 '/api/mock-exam/submit'이 됩니다.
    router.post('/submit', async (req, res) => { // app.post 대신 router.post 사용
        const { userId, examTypeId, answers } = req.body;
        console.log('답안 제출 API (/submit) 요청 받음 (mockExamRoutes.js):', { userId, examTypeId, answersCount: answers ? answers.length : 0 });

        if (!userId || !examTypeId || !answers || !Array.isArray(answers) || answers.length === 0) {
            return res.status(400).json({ message: '잘못된 요청입니다. userId, examTypeId, 그리고 answers 배열(최소 1개 이상의 답변 포함)이 필요합니다.' });
        }

        let connection;
        try {
            connection = await pool.getConnection();
            await connection.beginTransaction(); 

            // 1. mock_exam_submissions 테이블에 제출 기록 생성
            const submissionSql = `
                INSERT INTO mock_exam_submissions (user_id, exam_type_id, submitted_at)
                VALUES (?, ?, CURRENT_TIMESTAMP);
            `;
            const [submissionResult] = await connection.query(submissionSql, [userId, examTypeId]);
            const submissionId = submissionResult.insertId;

            if (!submissionId) {
                throw new Error('모의고사 제출 기록 생성에 실패했습니다.');
            }
            
            let insertedAnswersCount = 0;
            for (const userAnswer of answers) {
                if (userAnswer.questionId === undefined || userAnswer.answer === undefined) continue;

                const answerSql = `
                    INSERT INTO user_answers (submission_id, user_id, question_id, exam_type_id, submitted_answer, submitted_at)
                    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP);
                `;
                const [answerResult] = await connection.query(answerSql, [
                    submissionId,
                    userId,
                    userAnswer.questionId,
                    examTypeId,
                    userAnswer.answer
                ]);
                if (answerResult.insertId > 0) {
                    insertedAnswersCount++;
                }
            }

            await connection.commit(); 
            res.status(201).json({ 
                message: `${insertedAnswersCount}개의 답안이 성공적으로 기록되었습니다.`,
                submissionId: submissionId 
            });

        } catch (error) {
            if (connection) await connection.rollback(); 
            console.error('답안 제출 중 DB 오류 (mockExamRoutes.js):', error);
            res.status(500).json({ message: '답안 제출 중 서버 오류가 발생했습니다.' });
        } finally {
            if (connection) connection.release();
        }
    });

    return router; // 설정된 라우터 객체 반환
};