const express = require('express');
const router = express.Router(); // Express 라우터 생성

// 이 함수는 server.js에서 pool 객체를 주입받아 사용하도록 합니다.
module.exports = function(pool) { // pool을 인자로 받도록 변경

    // API: 모의고사 답안 제출
    // 이 파일이 '/api/mock-exam' 경로에 마운트된다면, 실제 경로는 '/api/mock-exam/submit'이 됩니다.
    router.post('/submit', async (req, res) => {
        const { userId, examTypeId, answers } = req.body;
        console.log('답안 제출 API (/submit) 요청 받음:', { userId, examTypeId, answersCount: answers ? answers.length : 0 });


        if (!userId || !examTypeId || !answers || !Array.isArray(answers) || answers.length === 0) {
            return res.status(400).json({ message: '잘못된 요청입니다. userId, examTypeId, 그리고 answers 배열(최소 1개 이상의 답변 포함)이 필요합니다.' });
        }

        let connection;
        try {
            connection = await pool.getConnection();
            await connection.beginTransaction(); 

            let insertedCount = 0;
            for (const userAnswer of answers) {
                if (!userAnswer.questionId || userAnswer.answer === undefined || userAnswer.answer === null) {
                    console.warn('답안 정보 누락 (건너뜀):', userAnswer);
                    continue; 
                }

                const sql = `
                    INSERT INTO user_answers (user_id, question_id, exam_type_id, submitted_answer, submitted_at)
                    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP); 
                `;
                
                const [result] = await connection.query(sql, [
                    userId,
                    userAnswer.questionId,
                    examTypeId,
                    userAnswer.answer
                ]);

                if (result.insertId > 0) {
                     insertedCount++;
                }
            }

            await connection.commit(); 
            res.status(201).json({ message: `${insertedCount}개의 답안이 성공적으로 기록되었습니다.` });

        } catch (error) {
            if (connection) await connection.rollback(); 
            console.error('답안 제출 중 DB 오류:', error);
            res.status(500).json({ message: '답안 제출 중 서버 오류가 발생했습니다.' });
        } finally {
            if (connection) connection.release();
        }
    });

    // 여기에 이 라우터에 속하는 다른 /api/mock-exam 관련 라우트들을 추가할 수 있습니다.
    // 예: 모의고사 생성 API도 이 파일로 옮길 수 있습니다.
    // router.get('/generate', async (req, res) => { ... });

    return router; // 설정된 라우터 객체 반환
};