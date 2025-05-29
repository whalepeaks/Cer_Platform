const bcrypt = require('bcrypt');
const saltRounds = 10; // 해싱 강도
const jwt = require('jsonwebtoken');
require('dotenv').config(); // .env 파일 사용 시 (JWT_SECRET 키 필요)

// 회원가입 API
app.post('/api/auth/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: '사용자 이름과 비밀번호를 모두 입력해주세요.' });
    }

    try {
        // 비밀번호 해싱
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const connection = await pool.getConnection();
        try {
            const [result] = await connection.query(
                'INSERT INTO users (username, password) VALUES (?, ?)',
                [username, hashedPassword]
            );
            res.status(201).json({ message: '회원가입이 성공적으로 완료되었습니다.', userId: result.insertId });
        } finally {
            connection.release();
        }
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') { // MySQL 중복 에러 코드
            return res.status(409).json({ message: '이미 사용 중인 사용자 이름입니다.' });
        }
        console.error('회원가입 중 DB 오류:', error);
        res.status(500).json({ message: '회원가입 중 오류가 발생했습니다.' });
    }
});
// 로그인 API
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;

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
            // 입력된 비밀번호와 DB에 저장된 해시된 비밀번호 비교
            const match = await bcrypt.compare(password, user.password);

            if (match) {
                // 비밀번호 일치 -> JWT 생성
                const payload = { userId: user.id, username: user.username };
                const token = jwt.sign(
                    payload,
                    process.env.JWT_SECRET, // .env 파일에 저장된 비밀 키
                    { expiresIn: '1h' } // 토큰 유효 시간 (예: 1시간)
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
