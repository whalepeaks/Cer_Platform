import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { getExamTypes } from '../api/examApi'; // API 함수 임포트

function MainContent() {
  const [examTypes, setExamTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchExamTypes = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getExamTypes();
        setExamTypes(response.data);
      } catch (err) {
        setError(err.response?.data?.message || err.message || '자격증 종류를 불러오는 중 오류 발생');
      } finally {
        setLoading(false);
      }
    };

    fetchExamTypes();
  }, []);

  return (
    <>
      <Row className="justify-content-md-center text-center mb-4">
        <Col md={8}>
          <h2>지옥으로 달려가자</h2>
          <p className="lead">최고의 선생 효운이와 함께하는 고래봉IT</p>
        </Col>
      </Row>

      {loading && (
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      )}

      {error && <Alert variant="danger">{error}</Alert>}

      {!loading && !error && (
        <Row>
          {examTypes.length > 0 ? (
            examTypes.map((examType) => (
              <Col md={4} className="mb-3" key={examType.id}>
                <Card>
                  <Card.Body>
                    <Card.Title>{examType.certification_name}</Card.Title>
                    <Card.Text>
                      {examType.certification_name} 가즈아!!
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
        </Row>
      )}
    </>
  );
}

export default MainContent;