require('dotenv').config(); 
const express = require('express');
const cors = require('cors');

// 라우터 파일들을 모두 불러옵니다.
const authRoutes = require('./routes/auth.routes'); 
const examRoutes = require('./routes/exam.routes');
const submissionRoutes = require('./routes/submission.routes');

const app = express();
const port = process.env.PORT || 3001;

// --- 미들웨어 설정 ---
const allowedOrigins = ['http://34.64.241.71', 'http://localhost:3000'];
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());

// --- 라우팅 설정 ---
app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/submissions', submissionRoutes);

// 에러 처리 미들웨어 (모든 라우터 뒤에 위치)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({ message: err.message || '서버에서 오류가 발생했습니다.' });
});

// 기본 API 라우트 (서버 상태 확인용)
app.get('/', (req, res) => {
    res.send('백엔드 서버에 오신 것을 환영합니다! (리팩토링 버전)');
});

// --- 서버 실행 ---
app.listen(port, () => {
    console.log(`백엔드 서버가 http://localhost:${port} 에서 실행 중입니다.`);
});