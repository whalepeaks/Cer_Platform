const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config(); // .env 파일의 환경 변수를 불러오기 위함

const app = express();
const port = process.env.PORT || 3001;

app.use(cors()); 
app.use(express.json());

const dbConfig = {
    host: process.env.DB_HOST || '34.64.178.251', 
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
};

const pool = mysql.createPool(dbConfig);

const userAuthRoutes = require('./userAuth')(pool);
app.use('/api/auth', userAuthRoutes); 

// 기본 API 라우트 (테스트용)
app.get('/', (req, res) => {
    res.send('백엔드 서버에 오신 것을 환영합니다!');
});

// 여기에 DB 정보 가져오는 API 라우트들을 추가할 예정

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


// 서버 시작
app.listen(port, () => {
    console.log(`백엔드 서버가 http://localhost:${port} 에서 실행 중입니다.`);
});

