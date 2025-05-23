import React from 'react';
import { Container } from 'react-bootstrap';

function AppFooter() {
  const currentYear = new Date().getFullYear(); // 현재 연도 가져오기

  return (
    <footer className="bg-light text-center text-lg-start mt-auto"> {/* 밝은 배경, 하단 고정 시도 */}
      <Container className="p-4">
        <p className="text-center mb-0">
          &copy; {currentYear} 고래봉은 전부다
        </p>
      </Container>
    </footer>
  );
}

export default AppFooter;