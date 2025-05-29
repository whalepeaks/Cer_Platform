import React, { useState } from 'react';
import { Container, Form, Button, Alert, Card } from 'react-bootstrap';
import { useNavigate, Link as RouterLink } from 'react-router-dom'; // react-router-dom의 Link를 RouterLink로 가져옴

// !!!! 실제 백엔드 API 주소로 변경해주세요 !!!!
// 예시: const BACKEND_URL = 'http://34.64.241.71:3001';
const BACKEND_URL = 'http://localhost:3001'; // 로컬 테스트 시

function RegisterPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const passwordCriteria = "8글자만 넘겨봐";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (password.length < 8) {
      setError(passwordCriteria);
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, username, password }), // email 정보 포함하여 전송
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '회원가입에 실패했습니다.');
      }

      setSuccess('고래봉에 오신것을 환영하네');
      setTimeout(() => {
        navigate('/login'); // 성공 시 로그인 페이지로 이동
      }, 2000); // 2초 후 이동

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: 'calc(100vh - 120px)' }}> {/* 푸터 높이 등을 고려하여 조정 */}
      <Card style={{ width: '100%', maxWidth: '450px' }} className="shadow-sm">
        <Card.Body className="p-4">
          <h2 className="text-center mb-4">회원가입</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="formRegisterEmail">
              <Form.Label>이메일 주소</Form.Label>
              <Form.Control
                type="email"
                placeholder="이메일 내놔"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formRegisterUsername">
              <Form.Label>사용자 이름 (아이디)</Form.Label>
              <Form.Control
                type="text"
                placeholder="왓쮸얼 네임"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formRegisterPassword">
              <Form.Label>비밀번호</Form.Label>
              <Form.Control
                type="password"
                placeholder="하루에 네번 사랑을 말하고"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                aria-describedby="passwordHelpBlock"
              />
              <Form.Text id="passwordHelpBlock" muted>
                {passwordCriteria}
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-4" controlId="formConfirmPassword"> {/* 마지막 항목이므로 mb-4로 간격 더 줌 */}
              <Form.Label>비밀번호 확인</Form.Label>
              <Form.Control
                type="password"
                placeholder="여덟번 웃고"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </Form.Group>

            <Button variant="primary" type="submit" className="w-100 py-2" disabled={loading}>
              {loading ? '가입 처리 중...' : '회원가입'}
            </Button>
          </Form>
          <div className="text-center mt-3">
            <small>이미 계정이 있으신가요? <RouterLink to="/login">로그인</RouterLink></small>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default RegisterPage;