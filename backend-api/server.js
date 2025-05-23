
const express = require('express');
const mysql = require('mysql2/promise'); // mysql2/promise 사용 (async/await 지원)
const cors = require('cors'); // CORS 미들웨어

const app = express();
const port = 3001; // 이전과 동일한 포트

// CORS 미들웨어 사용 (모든 출처에서의 요청 허용 - 개발용)
app.use(cors());

// JSON 요청 본문 파싱을 위한 미들웨어 (POST 요청 처리 시 필요)
app.use(express.json());

// Cloud SQL 데이터베이스 연결 설정
// 중요: 실제 운영 환경에서는 환경 변수나 시크릿 관리 도구를 사용하여 민감 정보를 관리해야 합니다.
const dbConfig = {
  host: '127.0.0.1', // Cloud SQL 인증 프록시가 VM 내부에서 리슨하는 주소
  port: 3306,        // Cloud SQL 인증 프록시가 VM 내부에서 리슨하는 포트
  user: 'cer_app_user', // Cloud SQL 사용자 이름
  password: '여러분의DB사용자비밀번호', // Cloud SQL 사용자 비밀번호
  database: 'cer_platform_db' // 데이터베이스 이름
};

// API 엔드포인트: 모든 자격증 목록 조회
app.get('/api/certifications', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows, fields] = await connection.execute('SELECT * FROM Certifications');
    await connection.end(); // 연결 종료
    res.json(rows); // 조회된 데이터를 JSON 형태로 응답
  } catch (error) {
    console.error('데이터베이스 조회 오류:', error);
    res.status(500).json({ message: '서버에서 데이터를 가져오는 데 실패했습니다.' });
  }
});

// API 엔드포인트: 특정 자격증의 문제 목록 조회 (예시)
app.get('/api/questions/:certificationId', async (req, res) => {
  const { certificationId } = req.params;
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows, fields] = await connection.execute(
      'SELECT * FROM Questions WHERE certification_id = ?',
      [certificationId]
    );
    await connection.end();
    res.json(rows);
  } catch (error) {
    console.error('데이터베이스 조회 오류:', error);
    res.status(500).json({ message: '서버에서 데이터를 가져오는 데 실패했습니다.' });
  }
});

// 서버 시작
app.listen(port, () => {
  console.log(`백엔드 API 서버가 http://localhost:${port} 에서 실행 중입니다.`);
  console.log('Cloud SQL 인증 프록시가 VM 내부에서 127.0.0.1:3306으로 실행 중이어야 합니다.');
});
