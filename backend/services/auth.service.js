const pool = require('../config/database'); // 분리된 DB 설정 파일을 가져옵니다.
const bcrypt = require('bcrypt');
const jwt = ('jsonwebtoken');

const saltRounds = 10;

// 회원가입 서비스 로직
async function registerUser(username, password, email) {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    try {
        const [result] = await pool.query(
            'INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
            [username, hashedPassword, email]
        );
        return { success: true, userId: result.insertId };
    } catch (error) {
        // 'ER_DUP_ENTRY'는 고유값(UNIQUE) 제약조건 위반 시 발생하는 에러 코드입니다.
        if (error.code === 'ER_DUP_ENTRY') {
            const err = new Error('이미 사용중인 아이디 또는 이메일입니다.');
            err.status = 409; // 409 Conflict 상태 코드를 설정
            throw err;
        }
        throw error; // 그 외의 에러는 그대로 던짐
    }
}

// 로그인 서비스 로직
async function loginUser(username, password) {
    const [rows] = await pool.query(
        'SELECT id, username, password FROM users WHERE username = ?',
        [username]
    );

    if (rows.length === 0) {
        return { success: false, message: '등록되지 않은 사용자이거나 비밀번호가 일치하지 않습니다.' };
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
        return { success: true, token, userId: user.id, username: user.username };
    } else {
        return { success: false, message: '등록되지 않은 사용자이거나 비밀번호가 일치하지 않습니다.' };
    }
}

module.exports = {
    registerUser,
    loginUser
};