// src/pages/ResultsPage.js
import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { Container, Spinner, Alert, Card, ListGroup, Button, Collapse, Badge } from 'react-bootstrap'; // Card 임포트 확인
import ReactMarkdown from 'react-markdown'; 
import remarkGfm from 'remark-gfm';
import { toKSTString } from '../utils/formatDate';

//const BACKEND_URL = 'http://34.64.241.71:3001'; // 로컬 백엔드 주소

function ResultsPage() {
  const { submissionId } = useParams();
  const [resultData, setResultData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [aiFeedbacks, setAiFeedbacks] = useState({});
  const [loadingAiFeedbackFor, setLoadingAiFeedbackFor] = useState(null);
  const [generatedProblems, setGeneratedProblems] = useState({});
  const [loadingSimilar, setLoadingSimilar] = useState(null);
  const [loadingScoreFor, setLoadingScoreFor] = useState(null);
  const [finalScore, setFinalScore] = useState(null);
  const [loadingFinalScore, setLoadingFinalScore] = useState(false);

  useEffect(() => {
    if (submissionId) {
      setLoading(true);
      setError(null);
      const apiUrl = `${process.env.REACT_APP_BACKEND_URL}/api/submission-results/${submissionId}`;
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
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/ai/feedback`, {
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
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/ai/generate-and-save-question`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                originalQuestionId: questionId,
                userId: userId,
                questionType: questionItem.question_type
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
// 최종 점수 확인
  const handleGetScore = async (questionId) => {
    // 1. 특정 문제의 채점 버튼이 로딩 상태임을 표시
    setLoadingScoreFor(questionId);

    try {
      // 2. 백엔드에 만들어둔 'score-answer' API를 호출합니다.
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/ai/score-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: parseInt(submissionId),
          questionId: questionId,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || '채점에 실패했습니다.');

      // 3. API 호출 성공 시, 전체 데이터(resultData)를 업데이트하여 점수를 반영합니다.
      setResultData(prevData => {
        // 기존 answeredQuestions 배열을 순회하며
        const updatedQuestions = prevData.answeredQuestions.map(q => {
          // 현재 채점한 문제와 ID가 일치하는 항목을 찾으면
          if (q.questionId === questionId) {
            // 해당 항목에 ai_score 속성을 추가하여 새로운 객체를 반환
            return { ...q, ai_score: data.score };
          }
          // 다른 문제들은 그대로 반환
          return q;
        });
        // 전체 resultData 객체를 새로운 answeredQuestions 배열로 교체하여 업데이트
        return { ...prevData, answeredQuestions: updatedQuestions };
      });

    } catch (err) {
      alert(`오류: ${err.message}`);
    } finally {
      // 4. 작업이 성공하든 실패하든 로딩 상태를 해제
      setLoadingScoreFor(null);
    }
  };

const handleGetFinalScore = async () => {
    setLoadingFinalScore(true);
    setFinalScore(null); // 이전 점수가 있다면 초기화

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/results/${submissionId}/final-score`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '최종 점수 계산에 실패했습니다.');
      }

      setFinalScore(data.finalScore);

    } catch (err) {
      // 채점되지 않은 답변이 있을 경우 백엔드에서 400 오류와 메시지를 보냅니다.
      alert(`오류: ${err.message}`);
    } finally {
      setLoadingFinalScore(false);
    }
  };

  return (
    <Container className="mt-4">
      <h2>모의고사 결과: {submissionInfo.examTypeName}</h2>
      <p>제출일: {toKSTString(submissionInfo.submitted_at)}</p>
      <hr />
      <Card className="mb-4 text-center">
        <Card.Header as="h5">최종 점수</Card.Header>
        <Card.Body>
          {finalScore !== null ? (
            // 최종 점수가 계산되었으면 점수를 보여줍니다.
            <h3 className="display-4 text-primary">{finalScore} / 100점</h3>
          ) : (
            // 아직 계산 전이면 버튼을 보여줍니다.
            <Button
              variant="success"
              size="lg"
              onClick={handleGetFinalScore}
              disabled={loadingFinalScore}
            >
              {loadingFinalScore ? (
                <><Spinner as="span" animation="border" size="sm" /> 계산 중...</>
              ) : (
                '최종 점수 계산하기'
              )}
            </Button>
          )}
          <Card.Text className="text-muted mt-2">
            모든 문제에 대해 'AI 채점하기'를 먼저 진행해야 정확한 점수가 계산됩니다.
          </Card.Text>
        </Card.Body>
      </Card>
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
            
            <div className="d-flex justify-content-between align-items-center mb-1 mt-3">
            <strong className="mb-0">내가 제출한 답:</strong>
              {item.ai_score !== null && typeof item.ai_score !== 'undefined' ? (
                <Badge bg="primary" pill style={{ fontSize: '1rem' }}>
                AI 점수: {item.ai_score}점
                </Badge>
  ) : (
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => handleGetScore(item.questionId)}
                  disabled={loadingScoreFor === item.questionId}
                >
                {loadingScoreFor === item.questionId ? (
                <><Spinner as="span" animation="border" size="sm" /> 채점 중...</>
                ) : (
                  'AI 채점하기'
                )}
                </Button>
                 )}
              </div>
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