// src/pages/ResultsPage.js
import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { Container, Spinner, Alert, Card, ListGroup, Button, Collapse } from 'react-bootstrap'; // Card 임포트 확인
import ReactMarkdown from 'react-markdown'; 
import remarkGfm from 'remark-gfm';

const BACKEND_URL = 'http://localhost:3001'; // 로컬 백엔드 주소

function ResultsPage() {
  const { submissionId } = useParams();
  const [resultData, setResultData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [aiFeedbacks, setAiFeedbacks] = useState({});
  const [loadingAiFeedbackFor, setLoadingAiFeedbackFor] = useState(null);
  const [generatedProblems, setGeneratedProblems] = useState({});
  const [loadingSimilar, setLoadingSimilar] = useState(null);

  useEffect(() => {
    if (submissionId) {
      setLoading(true);
      setError(null);
      const apiUrl = `${BACKEND_URL}/api/submission-results/${submissionId}`;
      console.log("결과 데이터 요청 URL:", apiUrl);

      fetch(apiUrl)
        .then(response => {
          if (!response.ok) {
            // 오류 응답 처리 개선
            return response.json().then(errData => {
                 throw new Error(errData.message || `HTTP 오류! 상태: ${response.status}`);
            });
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

  // AI 맞춤 해설 가져오기 함수
   const handleGetAiFeedback = async (questionItem) => {
    // submissionId와 questionId가 있는지 먼저 확인
    if (!submissionId || !questionItem || questionItem.questionId === undefined) {
      console.error("AI 해설 요청 실패: 필수 정보 부족", { submissionId, questionItem });
      setAiFeedbacks(prev => ({ ...prev, [questionItem.questionId]: "오류: 해설 요청에 필요한 정보가 부족합니다." }));
      return;
    }

    setLoadingAiFeedbackFor(questionItem.questionId); // 로딩 시작
    setAiFeedbacks(prev => ({ ...prev, [questionItem.questionId]: undefined })); // 이전 해설 초기화

    try {
      // 1. 새로 만든 통합 API('/api/ai/feedback')를 호출합니다.
      const response = await fetch(`${BACKEND_URL}/api/ai/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submissionId: parseInt(submissionId), // URL 파라미터에서 가져온 submissionId
          questionId: questionItem.questionId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'AI 해설을 가져오는 데 실패했습니다.');
      }
      
      // 2. 백엔드가 모든 처리를 끝내고 보내준 최종 해설을 화면 상태에 저장합니다.
      const feedbackText = data.feedback;
      if (feedbackText === undefined) {
          throw new Error("API 응답에서 해설 텍스트를 찾을 수 없습니다.");
      }
      setAiFeedbacks(prev => ({ ...prev, [questionItem.questionId]: feedbackText }));

    } catch (err) {
      console.error("AI Feedback 요청 오류:", err);
      setAiFeedbacks(prev => ({ ...prev, [questionItem.questionId]: `해설을 가져오는 데 실패했습니다: ${err.message}` }));
    } finally {
      setLoadingAiFeedbackFor(null); // 로딩 종료
    }
  };

  const handleGenerateSimilar = async (questionItem) => {
    // 1. 로컬 스토리지에서 현재 로그인한 사용자 정보를 가져옵니다.
    const storedUser = localStorage.getItem('currentUser');
    if (!storedUser) {
        alert('유사 문제 생성을 위해서는 로그인이 필요합니다.');
        return;
    }
    const userId = JSON.parse(storedUser).userId;
    const questionId = questionItem.questionId;

    // 2. 로딩 상태를 '현재 진행 중'으로 변경합니다.
    setLoadingSimilar(questionId);
    // 이전에 생성된 문제가 있다면 지워서 새로 받아오게 합니다.
    setGeneratedProblems(prev => ({...prev, [questionId]: undefined}));


    try {
        // 3. 백엔드에 만들어둔 'generate-and-save-question' API를 호출합니다.
        const response = await fetch(`${BACKEND_URL}/api/ai/generate-and-save-question`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                originalQuestionId: questionId,
                userId: userId,
            }),
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || '유사 문제 생성에 실패했습니다.');
        }

        // 4. API 호출에 성공하면, 반환된 새로운 문제 객체를 상태에 저장합니다.
        setGeneratedProblems(prev => ({ ...prev, [questionId]: data }));

    } catch (err) {
        alert(`오류가 발생했습니다: ${err.message}`);
    } finally {
        // 5. 작업이 성공하든 실패하든 로딩 상태를 해제합니다.
        setLoadingSimilar(null);
    }
  };

  if (loading && !resultData) { // 초기 페이지 데이터 로딩
    return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;
  }
  if (error) {
    return <Container className="mt-5"><Alert variant="danger">결과를 불러오는 중 오류 발생: {error}</Alert></Container>;
  }
  if (!resultData || !resultData.submissionInfo || !resultData.answeredQuestions) {
    return <Container className="mt-5"><Alert variant="warning">결과 데이터를 찾을 수 없거나 형식이 올바르지 않습니다.</Alert></Container>;
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

            <Card.Text as="div" className="mb-1 mt-3"><strong>모범 정답:</strong></Card.Text>
            <Card.Text as="div" style={{ whiteSpace: 'pre-wrap' }}>
              {item.correct_answer || '정답 정보 없음'}
            </Card.Text>

            {item.explanation && ( // 기존 DB 해설 (선택적 표시)
              <>
                <Card.Text as="div" className="mb-1 mt-3"><strong>참고 해설:</strong></Card.Text>
                <Card.Text as="div" style={{ whiteSpace: 'pre-wrap' }}>
                  {item.explanation}
                </Card.Text>
              </>
            )}

            {/* ▼▼▼▼▼ AI 맞춤 해설 보기 버튼 및 해설 표시 영역 추가 ▼▼▼▼▼ */}
            <div className="mt-3">
              <Button
                variant="outline-info"
                size="sm"
                onClick={() => handleGetAiFeedback(item)} // 현재 문제(item) 정보를 넘겨줌
                disabled={loadingAiFeedbackFor === item.questionId} // 해당 문제 해설 로딩 중이면 비활성화
              >
                {loadingAiFeedbackFor === item.questionId ? (
                  <Spinner as="span" animation="border" size="sm" className="me-1" />
                ) : null}
                AI 맞춤 해설 보기
              </Button>

              {aiFeedbacks[item.questionId] && ( // 해당 문제의 AI 해설이 있으면 표시
                <Card className="mt-2">
                  <Card.Header as="h6" style={{backgroundColor: '#e6f7ff'}}>AI 자동 해설</Card.Header>
                  <Card.Body>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {aiFeedbacks[item.questionId]}
                    </ReactMarkdown>
                  </Card.Body>
                </Card>
              )}
            </div>
            {/* ▲▲▲▲▲ AI 맞춤 해설 보기 버튼 및 해설 표시 영역 끝 ▲▲▲▲▲ */}
            <div className="mt-2">
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => handleGenerateSimilar(item)}
                disabled={loadingSimilar === item.questionId}
              >
                {loadingSimilar === item.questionId 
                    ? <><Spinner as="span" animation="border" size="sm" /> 생성 중...</> 
                    : 'AI 유사 문제 생성'
                }
              </Button>

              {/* 생성된 문제가 있으면 Collapse 애니메이션과 함께 보여줍니다 */}
              <Collapse in={!!generatedProblems[item.questionId]}>
                <div className="mt-3">
                  <Card border="primary">
                      <Card.Header as="h6" style={{backgroundColor: '#e6f7ff'}}>AI 생성 유사 문제</Card.Header>
                      <Card.Body>
                          <Card.Text as="div" style={{ whiteSpace: 'pre-wrap', fontWeight: 'bold' }}>
                              {generatedProblems[item.questionId]?.question_text}
                          </Card.Text>
                          <hr/>
                          <p className="mb-1"><strong>정답:</strong></p>
                          <Card.Text as="div" style={{ whiteSpace: 'pre-wrap' }}>
                              {generatedProblems[item.questionId]?.correct_answer}
                          </Card.Text>
                          {generatedProblems[item.questionId]?.explanation && (
                            <>
                              <p className="mb-1 mt-2"><strong>해설:</strong></p>
                              <p style={{ whiteSpace: 'pre-wrap' }}>
                                {generatedProblems[item.questionId]?.explanation}
                              </p>
                            </>
                          )}
                      </Card.Body>
                  </Card>
                </div>
              </Collapse>
            </div>

          </ListGroup.Item>
        ))}
      </ListGroup>
      <Button as={RouterLink} to="/my-records" variant="secondary" className="mt-4">내 기록 목록으로</Button>
    </Container>
  );
}

export default ResultsPage;