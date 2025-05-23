import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';

function MainContent() {
  return (
    <Container className="my-5"> {/* 위아래 마진 (my-5: margin y-axis 5) */}
      <Row className="justify-content-md-center text-center mb-4">
        <Col md={8}>
          <h2>지옥으로 달려가자</h2>
          <p className="lead">
            최고의 선생 효운이와 함께하는 고래봉IT
          </p>
        </Col>
      </Row>
      <Row>
        <Col md={4} className="mb-3">
          <Card>
            <Card.Body>
              <Card.Title>정보보안기사</Card.Title>
              <Card.Text>
                말도 안되는 문제 어디 한번 풀어보세요 
              </Card.Text>
              <Button variant="primary">시작하기</Button>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} className="mb-3">
          <Card>
            <Card.Body>
              <Card.Title>정보처리기사</Card.Title>
              <Card.Text>
                보안기사 붙으면 안할거에요
              </Card.Text>
              <Button variant="primary">시작하기</Button>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} className="mb-3">
          <Card>
            <Card.Body>
              <Card.Title>재훈이 올림피아</Card.Title>
              <Card.Text>
                헬창의 무대 올림피아로 
              </Card.Text>
              <Button variant="primary">시작하기</Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default MainContent;