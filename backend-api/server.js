// server.js

// 1. 필요한 모듈 가져오기
const express = require('express');
const mysql = require('mysql2/promise'); // mysql2/promise 사용 (async/await 지원)
const cors = require('cors');
require('dotenv').config(); // .env 파일의 환경 변수를 불러오기 위함

// 2. Express 앱 생성 및 기본 설정
const app = express();
const port = process.env.PORT || 3001; // .env 파일에 PORT를 지정하거나 기본값 3001 사용

// 3. 미들웨어 설정
app.use(cors()); // 모든 도메인에서의 요청을 허용 (개발 중에는 편리, 배포 시에는 특정 도메인만 허용하도록 설정 변경 권장)
app.use(express.json()); // 요청 본문(body)을 JSON 형태로 파싱하기 위함

// 4. 데이터베이스 연결 설정 (GCP SQL - MySQL)
// .env 파일에 DB 정보를 저장하고 불러오는 것을 권장합니다.
// 예: DB_HOST, DB_USER, DB_PASSWORD, DB_DATABASE
const dbConfig = {
    host: process.env.DB_HOST || '34.64.178.251', // GCP SQL 외부 IP 주소
    user: process.env.DB_USER,                  // DB 사용자 이름
    password: process.env.DB_PASSWORD,            // DB 비밀번호
    database: process.env.DB_DATABASE,            // 사용할 데이터베이스 이름
    // port: 3306, // MySQL 기본 포트
    // connectionLimit: 10 // 필요에 따라 커넥션 풀 설정
};

// 데이터베이스 커넥션 풀 생성 (권장 방식)
const pool = mysql.createPool(dbConfig);

// 5. 기본 API 라우트(Route) 생성 (테스트용)
app.get('/', (req, res) => {
    res.send('백엔드 서버에 오신 것을 환영합니다!');
});

// 6. (여기에 DB 정보 가져오는 API 라우트들을 추가할 예정입니다)
// API: 모든 자격증 종류 가져오기
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

// API: 특정 자격증 종류의 회차 목록 가져오기
// 예: /api/exam-types/1/rounds (exam_type_id가 1인 자격증의 회차 목록)
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
// 예: /api/questions?examTypeId=1&round=20%ED%9A%8C (exam_type_id가 1이고, round_identifier가 "20회"인 문제들)
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
// 7. 서버 시작
app.listen(port, () => {
    console.log(`백엔드 서버가 http://localhost:${port} 에서 실행 중입니다.`);
});

