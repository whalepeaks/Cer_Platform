import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { getExamSets } from '../api/examApi'; // [수정 완료] getExamSets 함수를 임포트합니다.

function MainContent() {
  const [examSets, setExamSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchExamSets = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getExamSets(); // [수정 완료] getExamSets 함수를 호출합니다.
        setExamSets(response.data);
      } catch (err) {
        setError(err.response?.data?.message || err.message || '모의고사 목록을 불러오는 중 오류 발생');
      } finally {
        setLoading(false);
      }
    };

    fetchExamSets();
  }, []);

  return (
    <>
      <Row className="justify-content-md-center text-center mb-4">
        <Col md={8}>
          <h2>응시 가능한 모의고사</h2>
          <p className="lead">
            원하는 모의고사를 선택하여 시험을 시작하세요.
          </p>
        </Col>
      </Row>

      {loading && (
        <div className="text-center"><Spinner animation="border" /></div>
      )}

      {error && <Alert variant="danger">{error}</Alert>}

      {!loading && !error && (
        <Row>
          {examSets.length > 0 ? (
            examSets.map((examSet) => (
              <Col md={4} className="mb-3" key={examSet.id}>
                <Card>
                  <Card.Body>
                    <Card.Title>{examSet.set_name}</Card.Title>
                    <Card.Text>
                      출제일: {new Date(examSet.created_at).toLocaleDateString('ko-KR')}
                    </Card.Text>
                    <Link to={`/exam/set/${examSet.id}`}>
                      <Button variant="primary">시험 시작하기</Button>
                    </Link>
                  </Card.Body>
                </Card>
              </Col>
            ))
          ) : (
            <Col>
              <Alert variant="info">현재 응시 가능한 모의고사가 없습니다.</Alert>
            </Col>
          )}
        </Row>
      )}
    </>
  );
}

export default MainContent;