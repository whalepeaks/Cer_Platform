import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { AuthProvider } from './contexts/AuthContext';
import AppNavbar from './components/AppNavbar';
import AppFooter from './components/AppFooter';
import MainContent from './components/MainContent';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MockExamPage from './pages/MockExamPage';
import MyRecordsPage from './pages/MyRecordsPage';
import ResultsPage from './pages/ResultsPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="d-flex flex-column min-vh-100">
          <AppNavbar />
          <main className="flex-grow-1">
            <Container className="my-4">
              <Routes>
                <Route path="/" element={<MainContent />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/mock-exam/:examTypeId" element={<MockExamPage />} />
                <Route path="/my-records" element={<MyRecordsPage />} />
                <Route path="/results/:submissionId" element={<ResultsPage />} />
                {/* QuestionPage는 현재 모의고사 풀이 기능에 직접적으로 사용되지 않으므로 라우트에서 제외하거나 필요시 추가 */}
              </Routes>
            </Container>
          </main>
          <AppFooter />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;