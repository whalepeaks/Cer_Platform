import React from 'react';
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap'; // React Bootstrap 컴포넌트 임포트

function AppNavbar() {
  return (
    <Navbar bg="dark" variant="dark" expand="lg" sticky="top"> {/* 어두운 배경, 글자색 반전, 확장형, 상단 고정 */}
      <Container> {/* 콘텐츠를 가운데 정렬하고 반응형으로 만듦 */}
        <Navbar.Brand href="#home">고래봉 플랫폼</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto"> {/* 메뉴를 오른쪽으로 정렬 (ms-auto: margin-start auto) */}
            <Nav.Link href="#home">홈</Nav.Link>
            <Nav.Link href="#login">로그인</Nav.Link>
            <Nav.Link href="#features">모의고사</Nav.Link>
            <NavDropdown title="더보기" id="basic-nav-dropdown">
              <NavDropdown.Item href="#action/3.1">내 정보</NavDropdown.Item>
              <NavDropdown.Item href="#action/3.2">내 기록</NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item href="#action/3.4"> 로그아웃</NavDropdown.Item>
            </NavDropdown>
            
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default AppNavbar;