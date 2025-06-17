import React, { useState, useEffect } from 'react'; // useState와 useEffect 임포트
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';

// !!!! 실제 백엔드 API 주소로 변경해주세요 !!!!
// 예시: const BACKEND_URL = 'http://34.64.241.71:3001';
const BACKEND_URL = 'http://34.64.241.71:3001'; // 로컬 테스트 시

function MainContent() {
  const [examTypes, setExamTypes] = useState([]); // DB에서 가져온 자격증 종류 목록을 저장할 상태
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchExamTypes = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${BACKEND_URL}/api/exam-types`); // API 호출
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setExamTypes(data);
      } catch (err) {
        console.error("Error fetching exam types:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchExamTypes();
  }, []); // 컴포넌트 마운트 시 1회 실행

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

      {loading && (
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      )}

      {error && <Alert variant="danger">자격증 종류를 불러오는 중 오류 발생: {error}</Alert>}

      {!loading && !error && (
        <Row>
          {examTypes.length > 0 ? (
            examTypes
              // .filter(examType => examType.certification_name === '정보보안기사') // 필요시 필터링
              .map((examType) => (
                <Col md={4} className="mb-3" key={examType.id}>
                  <Card>
                    <Card.Body>
                      <Card.Title>{examType.certification_name}</Card.Title>
                      <Card.Text>
                        {examType.description || `${examType.certification_name} 가즈아!!`}
                      </Card.Text>
                      <Link to={`/mock-exam/${examType.id}`}>
                        <Button variant="primary">모의고사 스타또</Button>
                      </Link>
                    </Card.Body>
                  </Card>
                </Col>
              ))
          ) : (
            <Col>
              <Alert variant="info">등록된 자격증 종류가 없습니다.</Alert>
            </Col>
          )}
          {/* ... (필터링 시 정보보안기사 없을 때 메시지 부분은 현재 필터링 안 하므로 주석 처리 또는 삭제 가능) ... */}
        </Row>
      )}
    </Container>
  );
}

export default MainContent;