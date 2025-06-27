import React, { useState } from 'react';
import { Container, Form, Button, Alert, Card } from 'react-bootstrap';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { register } from '../api/authApi';

function RegisterPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (password.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setLoading(true);
    try {
      await register({ email, username, password });
      setSuccess('고래봉에 오신 것을 환영합니다! 잠시 후 로그인 페이지로 이동합니다.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
      <Card style={{ width: '100%', maxWidth: '450px' }} className="shadow-sm">
        <Card.Body className="p-4">
          <h2 className="text-center mb-4">회원가입</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="formRegisterEmail">
              <Form.Label>이메일 주소</Form.Label>
              <Form.Control type="email" placeholder="이메일 내놔" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formRegisterUsername">
              <Form.Label>사용자 이름 (아이디)</Form.Label>
              <Form.Control type="text" placeholder="왓쮸얼 네임" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formRegisterPassword">
              <Form.Label>비밀번호</Form.Label>
              <Form.Control type="password" placeholder="8자 이상 입력" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </Form.Group>
            <Form.Group className="mb-4" controlId="formConfirmPassword">
              <Form.Label>비밀번호 확인</Form.Label>
              <Form.Control type="password" placeholder="다시 한번 입력" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
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