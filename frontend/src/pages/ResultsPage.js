// src/pages/ResultsPage.js
import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { Container, Spinner, Alert, Card, ListGroup, Button } from 'react-bootstrap';

const BACKEND_URL = 'http://localhost:3001';

function ResultsPage() {
  const { submissionId } = useParams();
  const [resultData, setResultData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (submissionId) {
      setLoading(true);
      setError(null);
      const apiUrl = `${BACKEND_URL}/api/submission-results/${submissionId}`;
      console.log("결과 데이터 요청 URL:", apiUrl);

      fetch(apiUrl)
        .then(response => {
          if (!response.ok) {
            return response.json().then(err => { throw new Error(err.message || `HTTP 오류! ${response.status}`) });
          }
          return response.json();
        })
        .then(data => {
          console.log("받은 결과 데이터:", data);
          setResultData(data);
          setLoading(false);
        })
        .catch(err => {
          console.error("결과 데이터 가져오기 오류:", err);
          setError(err.message);
          setLoading(false);
        });
    }
  }, [submissionId]);

  if (loading) {
    return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;
  }
  if (error) {
    return <Container className="mt-5"><Alert variant="danger">결과를 불러오는 중 오류 발생: {error}</Alert></Container>;
  }
  if (!resultData || !resultData.submissionInfo) {
    return <Container className="mt-5"><Alert variant="warning">결과 데이터를 찾을 수 없습니다.</Alert></Container>;
  }

  const { submissionInfo, answeredQuestions } = resultData;

  return (
    <Container className="mt-4">
      <h2>모의고사 결과: {submissionInfo.examTypeName}</h2>
      <p>제출일: {new Date(submissionInfo.submitted_at).toLocaleString()}</p>
      <hr />
      <h3>제출한 답안 및 문제</h3>
      <ListGroup as="ol" numbered className="mt-3">
        {answeredQuestions.map((item, index) => (
          <ListGroup.Item as="li" key={item.questionId} className="mb-3 p-3 shadow-sm">
            <div className="fw-bold">
              문제 {index + 1} (원래 번호: {item.round_identifier}-{item.question_number}, 유형: {item.question_type})
            </div>
            <Card.Text as="div" style={{ whiteSpace: 'pre-wrap', marginTop: '0.5rem', marginBottom: '1rem' }}>
              {item.question_text}
            </Card.Text>
            
            <Card.Text as="div" className="mb-1"><strong>내가 제출한 답:</strong></Card.Text>
            <Card.Text as="div" style={{ whiteSpace: 'pre-wrap', backgroundColor: '#f0f0f0', padding: '10px', borderRadius: '4px' }}>
              {item.submitted_answer || '답변 없음'}
            </Card.Text>

            <Card.Text as="div" className="mb-1 mt-3"><strong>정답:</strong></Card.Text>
            <Card.Text as="div" style={{ whiteSpace: 'pre-wrap' }}>
              {item.correct_answer || '정답 정보 없음'}
            </Card.Text>

            {item.explanation && (
              <>
                <Card.Text as="div" className="mb-1 mt-3"><strong>해설:</strong></Card.Text>
                <Card.Text as="div" style={{ whiteSpace: 'pre-wrap' }}>
                  {item.explanation}
                </Card.Text>
              </>
            )}
          </ListGroup.Item>
        ))}
      </ListGroup>
      <Button as={RouterLink} to="/my-records" variant="secondary" className="mt-4">내 기록 목록으로</Button>
    </Container>
  );
}

export default ResultsPage;