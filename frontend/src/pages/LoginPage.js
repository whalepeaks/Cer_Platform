import React, { useState } from 'react';
import { Container, Form, Button, Alert, Card } from 'react-bootstrap';
import { useNavigate, Link as RouterLink } from 'react-router-dom';

// !!!! 실제 백엔드 API 주소로 변경해주세요 !!!!
const BACKEND_URL = 'http://34.64.241.71:3001'; // 로컬 테스트 시 또는 VM IP:PORT

function LoginPage({ onLoginSuccess }) { // onLoginSuccess 콜백 함수를 props로 받음
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '로그인에 실패했습니다.');
      }

      // 로그인 성공 처리
      console.log('로그인 성공:', data);
      // JWT 토큰과 사용자 정보를 localStorage 또는 상태 관리 라이브러리(Context, Redux 등)에 저장
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('currentUser', JSON.stringify({ userId: data.userId, username: data.username }));
      
      if (onLoginSuccess) {
        onLoginSuccess({ userId: data.userId, username: data.username }); // App.js로 로그인 상태 전달
      }
      navigate('/'); // 로그인 성공 후 홈으로 이동 (또는 이전 페이지)

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <Card style={{ width: '100%', maxWidth: '400px' }}>
        <Card.Body>
          <h2 className="text-center mb-4">로그인</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="formBasicUsername">
              <Form.Label>사용자 이름</Form.Label>
              <Form.Control
                type="text"
                placeholder="사용자 이름을 입력하세요"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formBasicPassword">
              <Form.Label>비밀번호</Form.Label>
              <Form.Control
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Form.Group>
            <Button variant="primary" type="submit" className="w-100" disabled={loading}>
              {loading ? '로그인 중...' : '로그인'}
            </Button>
          </Form>
          {/* 회원가입 페이지로 가는 링크 등 추가 가능 */}
          <div className="text-center mt-3">
            <small>계정이 없으신가요? <RouterLink to="/register">회원가입</RouterLink></small>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default LoginPage;