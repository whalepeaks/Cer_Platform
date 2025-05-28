import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import AppNavbar from './components/AppNavbar'; // 기존 Navbar
import MainContent from './components/MainContent'; // 기존 MainContent
import QuestionPage from './pages/QuestionPage';   // 새로 만들 문제 페이지 컴포넌트
import AppFooter from './components/AppFooter';   // 기존 Footer
import Container from 'react-bootstrap/Container'; // Bootstrap 컨테이너 추가

// Bootstrap CSS를 App.js 또는 index.js에 임포트합니다.
// import 'bootstrap/dist/css/bootstrap.min.css'; // 이미 되어있을 수 있습니다.

function App() {
  return (
    <Router>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppNavbar />
        <Container as="main" className="py-4" style={{ flex: 1 }}> {/* 메인 콘텐츠 영역 */}
          <Routes>
            <Route path="/" element={<MainContent />} />
            {/* :examTypeId와 :roundIdentifier는 URL 파라미터로 문제 페이지에 전달됩니다. */}
            <Route path="/questions/:examTypeId/:roundIdentifier" element={<QuestionPage />} />
            {/* 다른 필요한 라우트들 (예: 로그인 페이지) */}
          </Routes>
        </Container>
        <AppFooter />
      </div>
    </Router>
  );
}

export default App;