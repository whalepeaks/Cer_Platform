// src/components/MainContent.js
import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom'; // Link 컴포넌트 임포트

function MainContent() {
  // 예시 데이터: 각 카드에 대한 examTypeId와 roundIdentifier를 정의합니다.
  // 이 값들은 나중에 DB에서 동적으로 가져오도록 변경할 수 있습니다.
  const examCards = [
    { examTypeId: 1, roundIdentifier: '20', title: '정보보안기사', description: '말도 안되는 문제 어디 한번 풀어보세요' },
    { examTypeId: 1, roundIdentifier: '21', title: '정보보안기사 (다른 회차)', description: '21회차 문제도 풀어보세요.' }, // 예시로 같은 examTypeId, 다른 회차
    // { examTypeId: 2, roundIdentifier: '1회', title: '정보처리기사', description: '보안기사 붙으면 안할거에요' },
    // 다른 카드들도 여기에 추가...
  ];

  return (
    <Container className="my-5">
      <Row className="justify-content-md-center text-center mb-4">
        <Col md={8}>
          <h2>지옥으로 달려가자</h2>
          <p className="lead">
            최고의 선생 효운이와 함께하는 고래봉IT
          </p>
        </Col>
      </Row>
      <Row>
        {examCards.map((card, index) => (
          <Col md={4} className="mb-3" key={index}>
            <Card>
              <Card.Body>
                <Card.Title>{card.title}</Card.Title>
                <Card.Text>{card.description}</Card.Text>
                {/* Link 컴포넌트를 사용하여 /questions/:examTypeId/:roundIdentifier 경로로 이동 */}
                {/* roundIdentifier에 특수문자(예: '회')가 포함될 수 있으므로 URL 인코딩 */}
                <Link to={`/questions/${card.examTypeId}/${encodeURIComponent(card.roundIdentifier)}`}>
                  <Button variant="primary">시작하기</Button>
                </Link>
              </Card.Body>
            </Card>
          </Col>
        ))}
        {/* 기존 카드들은 예시 데이터에 맞게 수정하거나, examCards 배열로 관리 */}
      </Row>
    </Container>
  );
}

export default MainContent;