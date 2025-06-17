require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const port = process.env.PORT || 3001;
const corsOptions = {
  origin: 'http://34.64.241.71', // 프론트엔드가 서비스되는 출처를 정확히 명시
  optionsSuccessStatus: 200 
};
app.use(cors(corsOptions));

const aiService = require('./aiService');

app.use(cors()); 
app.use(express.json());

const dbConfig = {
    host: process.env.DB_HOST || '34.64.178.251', 
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    charset: 'utf8mb4',
    timezone: '+09:00'
};

const SCORE_MAP = {
  '단답형': 3,
  '서술형': 12,
  '실무형': 16
};

const pool = mysql.createPool(dbConfig);

const userAuthRoutes = require('./userAuth')(pool);
app.use('/api/auth', userAuthRoutes); 

const mockExamRoutes = require('./mockExamRoutes')(pool); 
app.use('/api/mock-exam', mockExamRoutes);

// 기본 API 라우트 (테스트용)
app.get('/', (req, res) => {
    res.send('백엔드 서버에 오신 것을 환영합니다!');
});

app.get('/api/exam-types', async (req, res) => {
    try {
        const connection = await pool.getConnection(); // 커넥션 풀에서 커넥션 가져오기
        const [rows] = await connection.query('SELECT id, certification_name, created_at FROM exam_types');
        connection.release(); // 커넥션 반환
        res.json(rows); // 조회된 데이터를 JSON 형태로 응답
    } catch (error) {
        console.error('DB 조회 오류 (exam_types):', error);
        res.status(500).json({ message: '데이터베이스 조회 중 오류가 발생했습니다.' });
    }
});

app.get('/api/exam-types/:examTypeId/rounds', async (req, res) => {
    const { examTypeId } = req.params; // URL 경로에서 examTypeId 파라미터 가져오기
    try {
        const connection = await pool.getConnection();
        // questions 테이블에서 해당 exam_type_id를 가진 고유한 round_identifier 목록을 가져옵니다.
        const query = `
            SELECT DISTINCT round_identifier 
            FROM questions 
            WHERE exam_type_id = ? 
            ORDER BY round_identifier
        `;
        const [rows] = await connection.query(query, [examTypeId]);
        connection.release();
        res.json(rows.map(row => row.round_identifier)); // round_identifier 값만 배열로 반환
    } catch (error) {
        console.error(`DB 조회 오류 (rounds for exam_type_id ${examTypeId}):`, error);
        res.status(500).json({ message: '데이터베이스 조회 중 오류가 발생했습니다.' });
    }
});

// API: 특정 자격증 종류의 특정 회차 문제 목록 가져오기
app.get('/api/questions', async (req, res) => {
    const { examTypeId, round } = req.query; // URL 쿼리 파라미터에서 값 가져오기

    if (!examTypeId || !round) {
        return res.status(400).json({ message: 'examTypeId와 round 파라미터가 필요합니다.' });
    }

    try {
        const connection = await pool.getConnection();
        const query = `
            SELECT id, question_number, question_text, correct_answer, explanation, question_type, created_at 
            FROM questions 
            WHERE exam_type_id = ? AND round_identifier = ?
            ORDER BY question_number
        `;
        const [rows] = await connection.query(query, [examTypeId, round]);
        connection.release();
        res.json(rows);
    } catch (error) {
        console.error(`DB 조회 오류 (questions for exam_type_id ${examTypeId}, round ${round}):`, error);
        res.status(500).json({ message: '데이터베이스 조회 중 오류가 발생했습니다.' });
    }
});
// 모의고사 생성 API 라우트
app.get('/api/mock-exam/generate', async (req, res) => {
    const { examTypeId } = req.query;

    if (!examTypeId) {
        return res.status(400).json({ message: '쿼리 파라미터로 examTypeId가 필요합니다.' });
    }

    const questionRequirements = [
        { type: '단답형', count: 12 },
        { type: '서술형', count: 4 },
        { type: '실무형', count: 2 }
    ];

    const randomOrderClause = 'ORDER BY RAND()'; 

    try {
        const connection = await pool.getConnection();
        let mockExamQuestions = [];
        let messages = [];

        console.log(`모의고사 생성 요청 받음: examTypeId = ${examTypeId}`); // 요청 확인 로그

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
        
        console.log(`생성된 문제 수: ${mockExamQuestions.length}`); // 생성된 문제 수 로그

        res.json({
            examTypeId: parseInt(examTypeId),
            totalQuestions: mockExamQuestions.length,
            questions: mockExamQuestions,
            generationMessages: messages.length > 0 ? messages : ['모든 유형의 문제가 요청된 수만큼 정상적으로 포함되었습니다.']
        });

    } catch (error) {
        console.error('모의고사 생성 중 DB 오류:', error);
        res.status(500).json({ message: '모의고사 생성 중 서버 오류가 발생했습니다.' });
    }
});
// 내 기록 API
app.get('/api/my-submissions', async (req, res) => {
    const { userId } = req.query; 
    if (!userId) {
        return res.status(401).json({ message: "사용자 인증이 필요합니다." });
    }

    try {
        const connection = await pool.getConnection();
        const query = `
            SELECT 
                ms.id as submissionId, 
                ms.submitted_at, 
                et.certification_name as examTypeName,
                (SELECT COUNT(*) FROM user_answers ua WHERE ua.submission_id = ms.id) as answeredQuestionsCount
                -- 필요한 경우 점수 등 다른 정보도 추가
            FROM mock_exam_submissions ms
            JOIN exam_types et ON ms.exam_type_id = et.id
            WHERE ms.user_id = ?
            ORDER BY ms.submitted_at DESC;
        `;
        const [submissions] = await connection.query(query, [userId]);
        connection.release();
        res.json(submissions);
    } catch (error) {
        console.error('내 기록 조회 중 DB 오류:', error);
        res.status(500).json({ message: '내 기록 조회 중 서버 오류가 발생했습니다.' });
    }
});
// 결과 제출 API
app.get('/api/submission-results/:submissionId', async (req, res) => {
    const { submissionId } = req.params;

    try {
        const connection = await pool.getConnection();

        // 1. 제출 정보 가져오기
        const [submissionDetails] = await connection.query(
            `SELECT ms.id as submissionId, ms.submitted_at, et.id as examTypeId, et.certification_name as examTypeName
             FROM mock_exam_submissions ms
             JOIN exam_types et ON ms.exam_type_id = et.id
             WHERE ms.id = ?`,
            [submissionId]
        );

        if (submissionDetails.length === 0) {
            connection.release();
            return res.status(404).json({ message: '해당 제출 기록을 찾을 수 없습니다.' });
        }

        // 2. 해당 제출에 대한 사용자의 답안 및 원본 문제 정보 가져오기
        const query = `
            SELECT 
                q.id as questionId,
                q.question_text,
                q.correct_answer,
                q.explanation,
                q.question_type,
                q.round_identifier,
                q.question_number,
                ua.submitted_answer,
                ua.submitted_at as answer_submitted_at,
                ua.ai_score
            FROM user_answers ua
            JOIN questions q ON ua.question_id = q.id
            WHERE ua.submission_id = ?
            ORDER BY q.question_number; -- 또는 문제 생성 시 순서대로
        `;
        const [answeredQuestions] = await connection.query(query, [submissionId]);
        connection.release();

        res.json({
            submissionInfo: submissionDetails[0],
            answeredQuestions: answeredQuestions
        });

    } catch (error) {
        console.error(`제출 결과 조회(ID: ${submissionId}) 중 DB 오류:`, error);
        res.status(500).json({ message: '제출 결과 조회 중 서버 오류가 발생했습니다.' });
    }
});
// Perplexity API 라우트에서 함수 호출 시
app.post('/api/ai/generate-text', async (req, res) => {

    const { questionText, correctAnswerOrKeywords, userAnswer, prompt, modelName } = req.body;

    if (questionText && correctAnswerOrKeywords && userAnswer) {
        // 상세 피드백 생성 요청
        try {
            console.log(`AI 상세 피드백 생성 요청 받음: Q:"${questionText.substring(0,20)}...", UserA:"${userAnswer.substring(0,20)}..."`);
            
            // aiService 객체 안의 generateText 함수 (실제로는 generateDetailedTextForAnswer)를 호출
            const feedbackText = await aiService.generateFeedbackForAnswer(
                questionText,
                correctAnswerOrKeywords,
                userAnswer,
                modelName
            );
            
            // 프론트엔드가 일관되게 받을 수 있도록 응답 키를 'generatedText'로 통일
            res.json({ feedback: feedbackText });

        } catch (error) {
            const errorMessage = error.message || 'AI 상세 피드백 생성 중 알 수 없는 오류';
            console.error('AI 상세 피드백 생성 API 라우트 오류:', errorMessage);
            res.status(500).json({ message: 'AI 상세 피드백 생성 중 서버 오류가 발생했습니다.', error: errorMessage });
        }
    } else if (prompt) {
        // 일반적인 프롬프트만으로 텍스트 생성 요청 (선택적 기능)
        try {
            console.log(`일반 AI 텍스트 생성 요청 받음, prompt: ${prompt.substring(0,50)}...`);
            // 만약 aiService에 일반 텍스트 생성 함수가 별도로 있다면 그것을 호출
            // 여기서는 일단 상세 피드백 함수를 재활용하되, 프롬프트 구성이 달라야 함
            // 이 부분은 지금 주석 처리하고, 상세 피드백 기능에 집중
            // const generatedText = await aiService.generateText(prompt, modelName); // 일반 프롬프트용 함수 호출
            // res.json({ generatedText });
            res.status(400).json({ message: '일반 텍스트 생성은 현재 지원되지 않거나, 상세 피드백을 위한 정보가 부족합니다.' });

        } catch (error) {
            const errorMessage = error.message || '일반 AI 텍스트 생성 중 알 수 없는 오류';
            console.error('일반 AI 텍스트 생성 API 라우트 오류:', errorMessage);
            res.status(500).json({ message: '일반 AI 텍스트 생성 중 서버 오류가 발생했습니다.', error: errorMessage });
        }
    } else {
        return res.status(400).json({ message: '요청 본문에 prompt 또는 (questionText, correctAnswerOrKeywords, userAnswer) 정보가 필요합니다.' });
    }
});
// ai해설 DB 저장 API
app.post('/api/ai/save-feedback', async (req, res) => {
    const { submissionId, questionId, aiComment } = req.body;
    console.log("백엔드 /api/ai/save-feedback 요청 받음, body:", req.body);

    if (submissionId === undefined || questionId === undefined || aiComment === undefined) {
        return res.status(400).json({ message: '저장을 위한 필수 정보(submissionId, questionId, aiComment)가 부족합니다.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();

        // user_answers 테이블의 해당 레코드에 ai_comment를 UPDATE 합니다.
        const [updateResult] = await connection.query(
            'UPDATE user_answers SET ai_comment = ? WHERE submission_id = ? AND question_id = ?',
            [aiComment, parseInt(submissionId), parseInt(questionId)]
        );
        
        console.log(`AI 해설 DB UPDATE 결과 (affectedRows):`, updateResult.affectedRows);

        if (updateResult.affectedRows > 0) {
            console.log(`DB 저장 성공: submissionId=${submissionId}, questionId=${questionId}`);
            res.status(200).json({ message: "AI 해설이 성공적으로 저장되었습니다." });
        } else {
            console.warn(`DB 저장 실패: UPDATE 대상 행을 찾지 못했습니다. submissionId=${submissionId}, questionId=${questionId}`);
            // 프론트엔드에서 반드시 처리해야 할 오류는 아니므로, 404 대신 다른 상태 코드를 고려하거나,
            // 성공으로 응답하되 서버 로그에 경고를 남길 수 있습니다.
            res.status(404).json({ message: "해설을 저장할 답안 기록을 찾을 수 없습니다." });
        }
    } catch (error) {
        const errorMessage = error.message || 'AI 해설 저장 중 알 수 없는 오류';
        console.error('AI 해설 저장 API 오류:', errorMessage, error.stack);
        res.status(500).json({ message: 'AI 해설 저장 중 서버 오류가 발생했습니다.', error: errorMessage });
    } finally {
        if (connection) {
            console.log("DB 커넥션 반납 (save-feedback API).");
            connection.release();
        }
    }
});
// 통합 api
app.post('/api/ai/feedback', async (req, res) => {
    const { submissionId, questionId } = req.body;

    if (!submissionId || !questionId) {
        return res.status(400).json({ message: "submissionId와 questionId는 필수입니다." });
    }

    let connection;
    try {
        connection = await pool.getConnection();

        // 1. DB에서 기존 AI 해설(ai_comment)이 있는지 먼저 확인
        const [existingAnswers] = await connection.query(
            `SELECT ai_comment FROM user_answers WHERE submission_id = ? AND question_id = ?`,
            [submissionId, questionId]
        );

        // 해당 제출 기록이 없는 경우
        if (existingAnswers.length === 0) {
            return res.status(404).json({ message: "답안 기록을 찾을 수 없습니다." });
        }

        const existingFeedback = existingAnswers[0].ai_comment;

        // 2. 만약 DB에 해설이 이미 존재하면, 그걸 바로 반환
        if (existingFeedback) {
            console.log(`[DB Cache Hit] 기존 AI 해설 반환: submissionId=${submissionId}, questionId=${questionId}`);
            return res.json({ feedback: existingFeedback });
        }

        // 3. DB에 해설이 없다면, AI 해설 생성 절차 시작
        console.log(`[DB Cache Miss] 새로운 AI 해설 생성 시작: submissionId=${submissionId}, questionId=${questionId}`);
        
        // 3-1. 해설 생성에 필요한 정보 (문제, 모범답안, 사용자 답안)를 DB에서 가져오기
        const [questionDataRows] = await connection.query(
            `SELECT
                q.question_text,
                q.correct_answer,
                ua.submitted_answer
             FROM user_answers ua
             JOIN questions q ON ua.question_id = q.id
             WHERE ua.submission_id = ? AND ua.question_id = ?`,
            [submissionId, questionId]
        );

        if (questionDataRows.length === 0) {
            return res.status(404).json({ message: "해설 생성에 필요한 문제 정보를 찾을 수 없습니다." });
        }
        const questionData = questionDataRows[0];

        // 3-2. Perplexity API를 통해 새로운 해설 생성
        const newFeedback = await aiService.generateFeedbackForAnswer(
            questionData.question_text,
            questionData.correct_answer,
            questionData.submitted_answer,
        );

        // 3-3. 생성된 해설을 DB에 저장(UPDATE)
        await connection.query(
            `UPDATE user_answers SET ai_comment = ? WHERE submission_id = ? AND question_id = ?`,
            [newFeedback, submissionId, questionId]
        );
        console.log(`[DB Save] 생성된 AI 해설 DB 저장 완료: submissionId=${submissionId}, questionId=${questionId}`);


        // 4. 새로 생성 및 저장된 해설을 프론트엔드로 반환
        res.json({ feedback: newFeedback });

    } catch (error) {
        const errorMessage = error.message || 'AI 해설 처리 중 알 수 없는 오류';
        console.error('AI 해설 통합 API 오류:', error);
        res.status(500).json({ message: 'AI 해설 처리 중 서버 오류가 발생했습니다.', error: errorMessage });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});
// ai해설기반 새로운 문제 생성 api
app.post('/api/ai/generate-and-save-question', async (req, res) => {
    // 프론트엔드로부터 원본 문제 ID와 사용자 ID를 받습니다.
    const { originalQuestionId, userId } = req.body;

    if (!originalQuestionId || !userId) {
        return res.status(400).json({ message: "필수 정보(원본 문제 ID, 사용자 ID)가 누락되었습니다." });
    }

    let connection;
    try {
        // 1. 원본 문제의 정보를 DB에서 가져옵니다 (AI 프롬프트에 사용).
        connection = await pool.getConnection();
        const [originalQuestions] = await connection.query(
            'SELECT question_text, question_type FROM questions WHERE id = ?',
            [originalQuestionId]
        );

        if (originalQuestions.length === 0) {
            return res.status(404).json({ message: '원본 문제를 찾을 수 없습니다.' });
        }
        const originalQuestion = originalQuestions[0];
        
        // 2. AI를 호출하여 원본 문제와 유사한 '새로운 문제'를 생성합니다.
        console.log(`[AI Task 1/2] 유사 문제 생성 시작...`);
        const newProblem = await aiService.generateSimilarQuestion(
            originalQuestion.question_text, 
            originalQuestion.question_type
        );

        // 3. ★★ 핵심 로직 ★★
        //    방금 AI가 만든 새로운 문제의 텍스트를 이용해, 다시 AI에게 '계층형 태그' 생성을 요청합니다.
        console.log(`[AI Task 2/2] 생성된 문제의 태그 생성 시작...`);
        const tags = await aiService.generateHierarchicalTags(newProblem.question_text);
        if (!tags || tags.length < 1) {
            throw new Error('생성된 문제에 대한 AI 태그 생성에 실패했습니다.');
        }

        // 4. 데이터 저장을 위해 DB 트랜잭션을 시작합니다.
        await connection.beginTransaction();

        // 5. 'ai_generated_questions' 테이블에 새로운 문제와 관련 정보를 저장하고, 새 문제의 ID를 확보합니다.
        const mainTopic = tags[0]; // AI가 생성한 태그 중 첫 번째(대분류)를 대표 topic으로 저장
        const [questionResult] = await connection.query(
            `INSERT INTO ai_generated_questions (
                question_text, correct_answer, explanation, question_type, topic,
                original_question_id, created_by_user_id
             ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                newProblem.question_text, newProblem.correct_answer, newProblem.explanation,
                newProblem.question_type, mainTopic, originalQuestionId, userId
            ]
        );
        const newAiQuestionId = questionResult.insertId;

        // 6. AI가 생성한 모든 태그(대분류, 중분류)를 'tags'와 'question_tags' 테이블에 저장합니다.
        //    (batchTagGenerator.js에서 사용했던 계층형 저장 로직)
        let parentTagId = null;
        for (const tagName of tags) {
            let tagId;
            if (parentTagId === null) { // 첫 번째 태그는 대분류
                const [rows] = await connection.query("SELECT id FROM tags WHERE name = ? AND parent_id IS NULL", [tagName]);
                if (rows.length > 0) {
                    tagId = rows[0].id;
                } else {
                    const [result] = await connection.query("INSERT INTO tags (name, parent_id) VALUES (?, NULL)", [tagName]);
                    tagId = result.insertId;
                }
                parentTagId = tagId; // 다음 태그들의 부모가 됨
            } else { // 두 번째 이후 태그들은 중분류
                const [rows] = await connection.query("SELECT id FROM tags WHERE name = ? AND parent_id = ?", [tagName, parentTagId]);
                if (rows.length > 0) {
                    tagId = rows[0].id;
                } else {
                    const [result] = await connection.query("INSERT INTO tags (name, parent_id) VALUES (?, ?)", [tagName, parentTagId]);
                    tagId = result.insertId;
                }
            }
            // 문제와 태그를 연결
            await connection.query("INSERT IGNORE INTO question_tags (question_id, tag_id) VALUES (?, ?)", [newAiQuestionId, tagId]);
        }
        
        // 7. 모든 DB 작업이 성공했으므로 최종 저장(커밋)합니다.
        await connection.commit();
        
        console.log(`성공: AI 생성 문제(ID: ${newAiQuestionId})와 태그가 함께 저장되었습니다.`);
        res.status(201).json(newProblem); // 프론트엔드에는 새로 생성된 문제 객체를 보내줍니다.

    } catch (error) {
        if (connection) await connection.rollback(); // 오류 발생 시 모든 작업을 되돌립니다.
        console.error('AI 유사 문제 생성 및 태그 저장 API 오류:', error);
        res.status(500).json({ message: '서버에서 오류가 발생했습니다.' });
    } finally {
        if (connection) connection.release();
    }
});
// AI 점수채점
app.post('/api/ai/score-answer', async (req, res) => {
    const { submissionId, questionId } = req.body;

    let connection;
    try {
        connection = await pool.getConnection();

        // 1. 채점에 필요한 정보 (문제, 정답, 사용자 답안)를 DB에서 가져오기
        const [rows] = await connection.query(
            `SELECT q.question_text, q.correct_answer, ua.submitted_answer 
             FROM user_answers ua 
             JOIN questions q ON ua.question_id = q.id 
             WHERE ua.submission_id = ? AND ua.question_id = ?`,
            [submissionId, questionId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: '채점할 답변을 찾을 수 없습니다.' });
        }
        const data = rows[0];

        // 2. AI 서비스 호출하여 점수 받기
        const score = await aiService.getAiScoreForAnswer(
            data.question_text,
            data.correct_answer,
            data.submitted_answer
        );

        // 3. 받은 점수를 DB에 업데이트
        await connection.query(
            'UPDATE user_answers SET ai_score = ? WHERE submission_id = ? AND question_id = ?',
            [score, submissionId, questionId]
        );

        console.log(`채점 완료 (S_ID: ${submissionId}, Q_ID: ${questionId}): ${score}점`);
        res.status(200).json({ score });

    } catch (error) {
        res.status(500).json({ message: 'AI 채점 중 서버 오류가 발생했습니다.' });
    } finally {
        if (connection) connection.release();
    }
});
// 최종점수 확인
app.get('/api/results/:submissionId/final-score', async (req, res) => {
    const { submissionId } = req.params;

    let connection;
    try {
        connection = await pool.getConnection();

        // 1. 해당 제출 건의 모든 답변과 문제 유형, AI 점수를 불러옵니다.
        const [answers] = await connection.query(
            `SELECT q.question_type, ua.ai_score 
             FROM user_answers ua
             JOIN questions q ON ua.question_id = q.id
             WHERE ua.submission_id = ? AND ua.ai_score IS NOT NULL`, // 채점된 것만
            [submissionId]
        );

        if (answers.length === 0) {
            return res.status(400).json({ message: '채점된 답변이 없습니다. 각 문제에 대해 AI 채점을 먼저 진행해주세요.' });
        }
        
        // 2. 각 답변의 점수를 가중치에 맞게 계산하여 합산합니다.
        let finalScore = 0;
        for (const answer of answers) {
            const maxPoints = SCORE_MAP[answer.question_type]; // 배점표에서 만점 가져오기
            const aiScore = answer.ai_score;
            
            if (maxPoints !== undefined && aiScore !== null) {
                const calculatedScore = (aiScore / 100) * maxPoints;
                finalScore += calculatedScore;
            }
        }

        // 3. 최종 점수를 반환합니다. (소수점 첫째 자리까지 반올림)
        res.status(200).json({ finalScore: Math.round(finalScore * 10) / 10 });

    } catch (error) {
        res.status(500).json({ message: '최종 점수 계산 중 서버 오류가 발생했습니다.' });
    } finally {
        if (connection) connection.release();
    }
});
// AI 학습 드릴
app.get('/api/user/weakness-topics', async (req, res) => {
    // 실제 서비스에서는 req.user.id 와 같이 로그인된 사용자 ID를 사용해야 합니다.
    // 지금은 테스트를 위해 임시로 1번 사용자를 대상으로 하겠습니다.
    const userId = 1; 

    if (!userId) {
        return res.status(401).json({ message: "사용자 인증이 필요합니다." });
    }

    let connection;
    try {
        connection = await pool.getConnection();

        // 사용자의 답변 중 AI 점수가 특정 기준(예: 65점) 미만인 것들을 찾고,
        // 그 문제들의 주제(topic)별로 갯수를 세어 가장 많은 순서대로 5개를 가져옵니다.
        const query = `
            SELECT
                q.topic,
                COUNT(*) as incorrect_count,
                AVG(ua.ai_score) as average_score
            FROM user_answers ua
            JOIN questions q ON ua.question_id = q.id
            WHERE
                ua.user_id = ? AND
                ua.ai_score < 65 AND -- '약점'으로 판단할 점수 기준 (조정 가능)
                q.topic IS NOT NULL AND q.topic != ''
            GROUP BY q.topic
            ORDER BY incorrect_count DESC, average_score ASC
            LIMIT 5;
        `;

        const [weakTopics] = await connection.query(query, [userId]);
        connection.release();

        res.status(200).json(weakTopics);

    } catch (error) {
        if (connection) connection.release();
        console.error('약점 주제 분석 API 오류:', error);
        res.status(500).json({ message: '약점 주제 분석 중 서버 오류가 발생했습니다.' });
    }
});
// 드릴 생성
app.post('/api/ai/generate-drill', async (req, res) => {
    const { topic } = req.body;

    if (!topic) {
        return res.status(400).json({ message: '주제(topic) 정보가 필요합니다.' });
    }

    try {
        // 1. aiService에 새로 만든 함수를 호출하여 문제 배열을 받아옵니다.
        const questions = await aiService.generateTargetedDrill(topic);
        
        // 2. 받아온 문제 배열을 프론트엔드에 그대로 전달합니다.
        res.status(200).json(questions);

    } catch (error) {
        res.status(500).json({ message: 'AI 드릴 문제 생성 중 서버 오류가 발생했습니다.' });
    }
});
// 드릴 DB 저장
app.post('/api/drill-sessions/submit', async (req, res) => {
    // 프론트엔드로부터 사용자 ID, 주제, 그리고 문제/답변 배열을 받습니다.
    const { userId, topic, questions, userAnswers } = req.body;

    if (!userId || !topic || !questions || !userAnswers) {
        return res.status(400).json({ message: '드릴 결과를 저장하기 위한 정보가 부족합니다.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction(); // 트랜잭션 시작

        // 1. drill_sessions 테이블에 새로운 세션 기록을 생성하고, 그 ID를 받습니다.
        const [sessionResult] = await connection.query(
            'INSERT INTO drill_sessions (user_id, topic, status) VALUES (?, ?, ?)',
            [userId, topic, 'completed']
        );
        const newSessionId = sessionResult.insertId;

        let totalScore = 0;
        let scoredCount = 0;

        // 2. 각 문제와 답변을 drill_answers 테이블에 저장합니다.
        for (const question of questions) {
            const submittedAnswer = userAnswers[question.question_text] || '';

            const [answerResult] = await connection.query(
                `INSERT INTO drill_answers 
                    (drill_session_id, question_text, correct_answer, question_type, submitted_answer) 
                 VALUES (?, ?, ?, ?, ?)`,
                [newSessionId, question.question_text, question.correct_answer, question.question_type, submittedAnswer]
            );
            const newAnswerId = answerResult.insertId;

            // 3. (심화) 저장된 각 답변에 대해 바로 AI 채점을 실행합니다.
            if (submittedAnswer) {
                const score = await aiService.getAiScoreForAnswer(question.question_text, question.correct_answer, submittedAnswer);
                await connection.query('UPDATE drill_answers SET ai_score = ? WHERE id = ?', [score, newAnswerId]);
                totalScore += score;
                scoredCount++;
            }
        }

        // 4. (심화) 드릴 세션의 최종 평균 점수를 계산하고 업데이트합니다.
        const finalScore = scoredCount > 0 ? Math.round(totalScore / scoredCount) : 0;
        await connection.query('UPDATE drill_sessions SET final_score = ? WHERE id = ?', [finalScore, newSessionId]);

        await connection.commit(); // 모든 작업 성공 시 최종 저장

        res.status(201).json({ message: '드릴 결과가 성공적으로 저장되었습니다.', sessionId: newSessionId, finalScore: finalScore });

    } catch (error) {
        if (connection) await connection.rollback(); // 오류 발생 시 모든 작업 되돌리기
        console.error('드릴 결과 저장 API 오류:', error);
        res.status(500).json({ message: '드릴 결과 저장 중 서버 오류가 발생했습니다.' });
    } finally {
        if (connection) connection.release();
    }
});

app.post('/api/ai/score-answer', async (req, res) => {
    const { submissionId, questionId } = req.body;
    console.log("★★★★★ '/api/ai/score-answer' API가 호출되었습니다! ★★★★★");
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.query(
            `SELECT q.question_text, q.correct_answer, ua.submitted_answer 
             FROM user_answers ua 
             JOIN questions q ON ua.question_id = q.id 
             WHERE ua.submission_id = ? AND ua.question_id = ?`,
            [submissionId, questionId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: '채점할 답변을 찾을 수 없습니다.' });
        }
        const data = rows[0];

        const score = await aiService.getAiScoreForAnswer(
            data.question_text,
            data.correct_answer,
            data.submitted_answer
        );

        await connection.query(
            'UPDATE user_answers SET ai_score = ? WHERE submission_id = ? AND question_id = ?',
            [score, submissionId, questionId]
        );

        res.status(200).json({ score });
    } catch (error) {
        res.status(500).json({ message: 'AI 채점 중 서버 오류가 발생했습니다.' });
    } finally {
        if (connection) connection.release();
    }
});

// 서버 시작
app.listen(port, () => {
    console.log(`백엔드 서버가 http://localhost:${port} 에서 실행 중입니다.`);
});

