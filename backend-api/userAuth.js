const express = require('express');
const router = express.Router(); // Express 라우터 생성
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
// dotenv는 server.js에서 이미 실행했으므로 여기서는 생략 가능, 단 process.env.JWT_SECRET 사용

const saltRounds = 10;

// 이 함수는 server.js에서 pool 객체를 주입받아 사용하도록 수정합니다.
module.exports = function(pool) { // pool을 인자로 받도록 변경

    // 회원가입 API - router.post로 변경
    router.post('/register', async (req, res) => {
        const { username, password, email } = req.body;
        console.log('회원가입 요청 받음 (userAuth.js):', email, username);

        if (!username || !password || !email) {
            return res.status(400).json({ message: '모두 적으쇼' });
        }

        try {
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            const connection = await pool.getConnection();
            try {
                const [result] = await connection.query(
                    'INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
                    [username, hashedPassword, email]
                );
                res.status(201).json({ message: '가입이 됐으니 넌 내꺼야', userId: result.insertId });
            } finally {
                connection.release();
            }
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ message: '사용중이니까 다른거 ㄱ' });
            }
            console.error('회원가입 중 DB 오류:', error);
            res.status(500).json({ message: '회원가입 중 오류가 발생했습니다.' });
        }
    });

    // 로그인 API - router.post로 변경
    router.post('/login', async (req, res) => {
        const { username, password } = req.body;
        console.log('로그인 요청 받음 (userAuth.js):', username);


        if (!username || !password) {
            return res.status(400).json({ message: '사용자 이름과 비밀번호를 모두 입력해주세요.' });
        }

        try {
            const connection = await pool.getConnection();
            try {
                const [rows] = await connection.query(
                    'SELECT id, username, password FROM users WHERE username = ?',
                    [username]
                );

                if (rows.length === 0) {
                    return res.status(401).json({ message: '등록되지 않은 사용자이거나 비밀번호가 일치하지 않습니다.' });
                }

                const user = rows[0];
                const match = await bcrypt.compare(password, user.password);

                if (match) {
                    const payload = { userId: user.id, username: user.username };
                    const token = jwt.sign(
                        payload,
                        process.env.JWT_SECRET,
                        { expiresIn: '1h' }
                    );
                    res.json({ message: '로그인 성공!', token: token, userId: user.id, username: user.username });
                } else {
                    res.status(401).json({ message: '등록되지 않은 사용자이거나 비밀번호가 일치하지 않습니다.' });
                }
            } finally {
                connection.release();
            }
        } catch (error) {
            console.error('로그인 중 DB 오류:', error);
            res.status(500).json({ message: '로그인 중 오류가 발생했습니다.' });
        }
    });

    return router; // 설정된 라우터 객체 반환
};