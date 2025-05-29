import React, { useState, useEffect } from 'react'; // useState와 useEffect를 React에서 가져오도록 수정
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom'; // Navigate를 react-router-dom에서 가져오도록 추가
import AppNavbar from './components/AppNavbar'; // Navbar
import MainContent from './components/MainContent'; // MainContent
import AppFooter from './components/AppFooter';   // Footer
// import QuestionPage from './pages/QuestionPage';   // 회차별 문제 페이지
import MockExamPage from './pages/MockExamPage'; // MockExamPage
import RegisterPage from './pages/RegisterPage'; // 회원가입 페이지
import LoginPage from './pages/LoginPage'; // LoginPage
import Container from 'react-bootstrap/Container'; // Bootstrap 컨테이너 추가
// import 'bootstrap/dist/css/bootstrap.min.css'; // 

function App() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // 앱 시작 시 localStorage에서 사용자 정보 확인
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setCurrentUser(userData);
    // localStorage에도 저장 (새로고침 시 유지)
    localStorage.setItem('currentUser', JSON.stringify(userData));
    localStorage.setItem('authToken', /* 로그인 API 응답에서 받은 토큰 저장 */ ); 
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    
    // 필요하다면 홈페이지로 리다이렉트
    // navigate('/'); // App.js에서는 useNavigate를 직접 사용하기 어려우므로 AppNavbar 등에서 처리
  };


  return (
    <Router>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppNavbar currentUser={currentUser} onLogout={handleLogout} />
        <Container as="main" className="py-4" style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<MainContent />} />
            <Route path="/mock-exam/:examTypeId" element={<MockExamPage />} /> 
           {/* <Route path="/questions/:examTypeId/:roundIdentifier" element={<QuestionPage />} /> */}
            <Route path="/mock-exam" element={currentUser ? <MockExamPage /> : <Navigate to="/login" replace />} />
            <Route 
              path="/login" 
              element={currentUser ? <Navigate to="/" /> : <LoginPage onLoginSuccess={handleLoginSuccess} />} />
            <Route
              path="/register"
              element={currentUser ? <Navigate to="/" replace /> : <RegisterPage />} />
            {/* 기타 필요한 라우트들 */}
          </Routes>
        </Container>
        <AppFooter />
      </div>
    </Router>
  );
}

export default App;