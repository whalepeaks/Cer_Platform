import React from 'react';
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap'; // React Bootstrap 컴포넌트 임포트
import { Link, useNavigate } from 'react-router-dom';

function AppNavbar({ currentUser, onLogout }) { // props로 currentUser와 onLogout 받기
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    }
    navigate('/'); // 로그아웃 후 홈으로 이동
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" sticky="top">
      <Container>
        <Navbar.Brand as={Link} to="/">고래봉 플랫폼</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <Nav.Link as={Link} to="/">홈</Nav.Link>
            {/* <Nav.Link as={Link} to="/mock-exam">모의고사</Nav.Link> */}
            
            {currentUser ? (
              // 로그인 상태일 때
                <NavDropdown title={`${currentUser.username}님`} id="basic-nav-dropdown">
                <NavDropdown.Item as={Link} to="/my-info">내 정보</NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/my-records">내 기록</NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/weakness-drill">AI 약점 분석</NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogoutClick}>로그아웃</NavDropdown.Item>
                </NavDropdown>
            ) : (
              // 로그아웃 상태일 때
              <Nav.Link as={Link} to="/login">로그인</Nav.Link>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default AppNavbar;