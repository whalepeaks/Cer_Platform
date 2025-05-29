// src/pages/MockExamPage.js
import React, { useState, useEffect } from 'react';
import { Container, Spinner, Alert, ListGroup, Button, Card } from 'react-bootstrap';

// !!!! 실제 백엔드 API 주소로 변경해주세요 !!!!
// 예시: const BACKEND_URL = 'http://34.64.241.71:3001';
const BACKEND_URL = 'http://localhost:3001'; // 로컬 테스트 시 또는 VM IP:PORT

function MockExamPage() {
  const [mockExam, setMockExam] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 예시: "정보보안기사 필기"의 exam_type_id가 1이라고 가정합니다.
  // 이 값은 나중에 사용자가 선택하거나 다른 방식으로 동적으로 결정할 수 있습니다.
  const targetExamTypeId = 1;

  const generateMockExam = () => {
    setLoading(true);
    setError(null);
    setMockExam(null); // 이전 모의고사 내용 초기화

    const apiUrl = `${BACKEND_URL}/api/mock-exam/generate?examTypeId=${targetExamTypeId}`;
    console.log("모의고사 생성 API 호출 URL:", apiUrl);

    fetch(apiUrl)
      .then(response => {
        if (!response.ok) {
          // 서버에서 오류 응답이 왔을 경우 (예: 4xx, 5xx 상태 코드)
          return response.json().then(errData => {
            throw new Error(errData.message || `HTTP 오류! 상태: ${response.status}`);
          });
        }
        return response.json();
      })
      .then(data => {
        console.log("생성된 모의고사 데이터:", data);
        setMockExam(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('모의고사 생성 중 오류:', err);
        setError(err.message);
        setLoading(false);
      });
  };

  // 페이지가 처음 로드될 때 모의고사를 한번 생성합니다.
  // 원한다면 이 부분을 제거하고, 아래 "새로운 모의고사 생성하기" 버튼 클릭 시에만 생성하도록 할 수 있습니다.
  useEffect(() => {
    generateMockExam();
  }, []); // 빈 의존성 배열은 컴포넌트 마운트 시 1회만 실행됨

  return (
    <Container className="mt-4">
      <h2>모의고사 생성</h2>
      <Button onClick={generateMockExam} disabled={loading} className="mb-3">
        {loading ? '생성 중...' : '새로운 모의고사 생성하기'}
      </Button>

      {error && <Alert variant="danger">오류: {error}</Alert>}

      {loading && !error && ( // 로딩 중이고 에러가 없을 때만 스피너 표시
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      )}

      {mockExam && mockExam.questions && (
        <>
          <h4 className="mt-4">생성된 모의고사 (총 {mockExam.totalQuestions} 문제)</h4>
          {mockExam.generationMessages && mockExam.generationMessages.map((msg, idx) => (
             <Alert variant={msg.startsWith("주의:") ? "warning" : "info"} key={idx} className="mt-2">{msg}</Alert>
          ))}
          <ListGroup as="ol" numbered className="mt-3">
            {mockExam.questions.map((q, index) => (
              <ListGroup.Item as="li" key={q.id || `q-${index}`} className="mb-3 p-3"> {/* 고유한 key 보장 */}
                <div className="fw-bold">
                  문제 {index + 1} (원래 번호: {q.round_identifier}-{q.question_number}, 유형: {q.question_type})
                </div>
                <Card.Text as="div" style={{ whiteSpace: 'pre-wrap', marginTop: '0.5rem' }}>{q.question_text}</Card.Text>
                <hr />
                <Card.Text as="div" className="mb-1"><strong>정답:</strong></Card.Text>
                <Card.Text as="div" style={{ whiteSpace: 'pre-wrap' }}>{q.correct_answer || '정답 정보 없음'}</Card.Text>
                {q.explanation && (
                  <>
                    <Card.Text as="div" className="mb-1 mt-2"><strong>해설:</strong></Card.Text>
                    <Card.Text as="div" style={{ whiteSpace: 'pre-wrap' }}>{q.explanation}</Card.Text>
                  </>
                )}
              </ListGroup.Item>
            ))}
          </ListGroup>
        </>
      )}
    </Container>
  );
}

export default MockExamPage;