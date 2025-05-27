// frontend/src/components/Header.js
import React from 'react';
// import './Header.css'; // Header 전용 CSS가 있다면

function Header() {
  return (
    <header className="header">
      <h1>고래봉 Platform</h1>
      <nav className="navigation">
        <ul>
          <li><a href="/">홈</a></li>
          <li><a href="/tests">모의고사 목록</a></li>
          <li><a href="/login">로그인</a></li>
        </ul>
      </nav>
    </header>
  );
}

export default Header;