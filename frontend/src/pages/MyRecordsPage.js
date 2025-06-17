// src/pages/MyRecordsPage.js
import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Container, Spinner, Alert, ListGroup, Badge } from 'react-bootstrap';

const BACKEND_URL = 'http://34.64.241.71:3001';

function MyRecordsPage() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMySubmissions = async () => {
      setLoading(true);
      setError(null);
      // 현재 로그인한 사용자 정보 가져오기 (localStorage 또는 Context API 등 사용)
      const storedUser = localStorage.getItem('currentUser');
      if (!storedUser) {
        setError('내 기록을 보려면 로그인이 필요합니다.');
        setLoading(false);
        // navigate('/login'); // 필요시 로그인 페이지로 강제 이동
        return;
      }
      const currentUser = JSON.parse(storedUser);
      const userId = currentUser.userId;

      try {
        // 백엔드 API 호출 시 userId를 쿼리 파라미터로 전달 (또는 인증 헤더 사용)
        const response = await fetch(`${BACKEND_URL}/api/my-submissions?userId=${userId}`);
        // 만약 인증 헤더를 사용한다면:
        // const response = await fetch(`${BACKEND_URL}/api/my-submissions`, {
        //   headers: {
        //     'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        //   }
        // });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({ message: `HTTP 오류! ${response.status}` }));
          throw new Error(errData.message);
        }
        const data = await response.json();
        setSubmissions(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMySubmissions();
  }, []);

  if (loading) {
    return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;
  }
  if (error) {
    return <Container className="mt-5"><Alert variant="danger">내 기록을 불러오는 중 오류 발생: {error}</Alert></Container>;
  }

  return (
    <Container className="mt-4">
      <h2>나의 모의고사 기록</h2>
      {submissions.length === 0 ? (
        <Alert variant="info" className="mt-3">아직 응시한 모의고사 기록이 없습니다.</Alert>
      ) : (
        <ListGroup className="mt-3">
          {submissions.map(sub => (
            <ListGroup.Item 
              key={sub.submissionId} 
              action 
              as={RouterLink} 
              to={`/results/${sub.submissionId}`}
              className="d-flex justify-content-between align-items-start"
            >
              <div className="ms-2 me-auto">
                <div className="fw-bold">{sub.examTypeName}</div>
                제출일: {new Date(sub.submitted_at).toLocaleString()}
              </div>
              <Badge bg="primary" pill>
                {sub.answeredQuestionsCount} 문제 답변
              </Badge>
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
    </Container>
  );
}

export default MyRecordsPage;