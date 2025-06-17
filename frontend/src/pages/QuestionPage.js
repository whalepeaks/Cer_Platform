// src/pages/QuestionPage.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom'; // URL 파라미터를 가져오기 위한 Hook
import { Card, Container, Spinner, Alert, ListGroup } from 'react-bootstrap';

function QuestionPage() {
  // URL 파라미터에서 examTypeId와 roundIdentifier 값을 가져옵니다.
  const { examTypeId, roundIdentifier: encodedRoundIdentifier } = useParams();
  const roundIdentifier = decodeURIComponent(encodedRoundIdentifier); // URL 인코딩된 회차 정보 디코딩

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [examTypeName, setExamTypeName] = useState(''); // 자격증 종류 이름을 저장할 상태

  useEffect(() => {
    if (examTypeId && roundIdentifier) {
      // 백엔드 API URL (반드시 실제 VM 외부 IP와 백엔드 포트로 변경해주세요!)
      const apiUrl = `${process.env.REACT_APP_BACKEND_URL}/api/questions?examTypeId=${examTypeId}&round=${encodeURIComponent(roundIdentifier)}`;
      const examTypeApiUrl = `${process.env.REACT_APP_BACKEND_URL}:3001/api/exam-types`; // 자격증 종류 이름 가져오기용

      console.log("Fetching questions from:", apiUrl); // 디버깅용 로그

      // 자격증 종류 이름 가져오기 (선택 사항, UI 표시용)
      fetch(examTypeApiUrl)
        .then(res => res.json())
        .then(types => {
          const currentType = types.find(t => t.id === parseInt(examTypeId));
          if (currentType) {
            setExamTypeName(currentType.certification_name);
          }
        })
        .catch(typeError => console.error("Error fetching exam type name:", typeError));

      // 문제 목록 가져오기
      fetch(apiUrl)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          setQuestions(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching questions:', err);
          setError(err.message);
          setLoading(false);
        });
    } else {
      setError("시험 종류 ID 또는 회차 정보가 URL에 없습니다.");
      setLoading(false);
    }
  }, [examTypeId, roundIdentifier]); // examTypeId 또는 roundIdentifier가 변경될 때마다 실행

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">문제 목록을 불러오는 중 오류 발생: {error}</Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <h2>{examTypeName} - {roundIdentifier} 문제 목록</h2>
      {questions.length === 0 ? (
        <p>해당 회차에 문제가 없습니다.</p>
      ) : (
        <ListGroup as="ol" numbered>
          {questions.map((q) => (
            <ListGroup.Item as="li" key={q.id} className="mb-3">
              <div className="fw-bold">문제 {q.question_number}.</div>
              <p style={{ whiteSpace: 'pre-wrap', marginTop: '0.5rem' }}>{q.question_text}</p>
              <hr />
              <p className="mb-1"><strong>정답:</strong></p>
              <p style={{ whiteSpace: 'pre-wrap' }}>{q.correct_answer || '정답 정보 없음'}</p>
              {q.explanation && (
                <>
                  <p className="mb-1 mt-2"><strong>해설:</strong></p>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{q.explanation}</p>
                </>
              )}
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
    </Container>
  );
}

export default QuestionPage;