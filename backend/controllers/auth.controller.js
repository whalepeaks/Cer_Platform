const authService = require('../services/auth.service');

// 회원가입 컨트롤러
async function register(req, res) {
    const { username, password, email } = req.body;
    console.log('회원가입 요청 받음 (auth.controller.js):', { email, username });

    if (!username || !password || !email) {
        return res.status(400).json({ message: '모든 필드를 입력해주세요.' });
    }

    try {
        const result = await authService.registerUser(username, password, email);
        res.status(201).json({ message: '회원가입 성공!', userId: result.userId });
    } catch (error) {
        console.error('회원가입 컨트롤러 오류:', error);
        // 서비스에서 설정한 상태 코드가 있다면 사용하고, 없다면 500을 사용합니다.
        res.status(error.status || 500).json({ message: error.message || '서버 오류가 발생했습니다.' });
    }
}

// 로그인 컨트롤러
async function login(req, res) {
    const { username, password } = req.body;
    console.log('로그인 요청 받음 (auth.controller.js):', username);

    if (!username || !password) {
        return res.status(400).json({ message: '사용자 이름과 비밀번호를 모두 입력해주세요.' });
    }
    try {
        const result = await authService.loginUser(username, password);
        if (result.success) {
            res.json({ message: '로그인 성공!', token: result.token, userId: result.userId, username: result.username });
        } else {
            res.status(401).json({ message: result.message });
        }
    } catch (error) {
        console.error('로그인 컨트롤러 오류:', error);
        res.status(500).json({ message: '로그인 중 서버 오류가 발생했습니다.' });
    }
}

module.exports = {
    register,
    login
};