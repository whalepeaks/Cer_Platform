// frontend/src/App.js
import React from 'react';
import AppNavbar from './components/AppNavbar';
import MainContent from './components/MainContent';
import AppFooter from './components/AppFooter';

// 전역 스타일 또는 App 특정 스타일 (필요하다면)
// import './App.css'; // 만약 App.css를 사용한다면
// import './global.css'; // 만약 global.css를 사용하고 index.js에 이미 import하지 않았다면

function App() {
  return (
    // React.Fragment 또는 div로 감싸기
    // 푸터를 하단에 고정하기 위해 flex 스타일 적용
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppNavbar />
      <MainContent /> {/* 이 부분이 나중에 라우팅에 따라 동적으로 변경될 수 있음 */}
      <AppFooter />
    </div>
  );
}

export default App;