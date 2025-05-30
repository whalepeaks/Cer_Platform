// src/pages/ResultsPage.js
import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { Container, Spinner, Alert, Card, ListGroup, Button } from 'react-bootstrap'; // Card 임포트 확인
import ReactMarkdown from 'react-markdown'; 
import remarkGfm from 'remark-gfm';

const BACKEND_URL = 'http://localhost:3001'; // 로컬 백엔드 주소

function ResultsPage() {
  const { submissionId } = useParams();
  const [resultData, setResultData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // AI 해설을 저장할 상태 추가
  // { questionId1: "해설1", questionId2: "해설2", ... } 형태로 저장
  const [aiFeedbacks, setAiFeedbacks] = useState({});
  // 특정 문제의 AI 해설을 로딩 중인지 표시할 상태 추가
  const [loadingAiFeedbackFor, setLoadingAiFeedbackFor] = useState(null); // questionId 저장

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
    // questionItem 객체에는 questionId, question_text, correct_answer, submitted_answer 등이 있어야 함
    if (!questionItem || !questionItem.questionId || !questionItem.submitted_answer || !questionItem.correct_answer || !questionItem.question_text) {
      setAiFeedbacks(prev => ({ ...prev, [questionItem.questionId]: "AI 해설 생성에 필요한 정보가 부족합니다." }));
      return;
    }

    setLoadingAiFeedbackFor(questionItem.questionId); // 해당 문제 AI 해설 로딩 시작
    setAiFeedbacks(prev => ({ ...prev, [questionItem.questionId]: undefined })); // 이전 해설/오류 메시지 초기화
    const modelToUse = "sonar";
    const rawBody = JSON.stringify({
      questionText: questionItem.question_text,
      correctAnswerOrKeywords: questionItem.correct_answer,
      userAnswer: questionItem.submitted_answer,
      modelName: modelToUse // Postman 요청처럼 modelName 포함
    });

    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Postman에서 자동으로 추가되는 다른 헤더들(Host, Content-Length 등)은
        // fetch에서는 보통 자동으로 처리되므로 명시적으로 넣을 필요는 없습니다.
        // 하지만 Cache-Control 등 특정 헤더가 문제 해결에 영향을 준다면 추가해볼 수 있습니다.
      },
      body: rawBody,
      // redirect: "follow" // fetch의 기본 동작이므로 보통 생략 가능
    };

    const apiUrl = `${BACKEND_URL}/api/ai/generate-text`;
    console.log("AI 해설 요청 URL:", apiUrl);
    console.log("AI 해설 요청 Body:", rawBody); // 보내는 데이터 확인

    try {
      const response = await fetch(apiUrl, requestOptions);

      // 응답을 먼저 텍스트로 받아봅니다 (디버깅을 위해).
      const responseText = await response.text();
      console.log("Raw API Response:", responseText);

      if (!response.ok) {
        // 응답이 JSON이 아닐 수도 있으므로, 텍스트 기반으로 오류 메시지 생성 시도
        let errorMessage = `AI 해설 생성 중 HTTP 오류: ${response.status} - ${response.statusText}`;
        try {
          const errorData = JSON.parse(responseText); // 여기서 오류가 나면 catch로 감
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // JSON 파싱 실패 시 responseText를 그대로 오류 메시지로 활용
          if (responseText.trim().startsWith("<!DOCTYPE html") || responseText.trim().startsWith("<html")) {
            errorMessage = "서버에서 HTML 오류 페이지를 반환했습니다. 백엔드 로그를 확인하세요.";
          } else {
            errorMessage = responseText || errorMessage;
          }
        }
        throw new Error(errorMessage);
      }

      // 응답이 정상적(ok)이면 JSON으로 파싱 시도
      const data = JSON.parse(responseText); // 이미 텍스트로 받았으므로 다시 파싱
      
      // 백엔드 응답 키가 'feedback' 또는 'generatedText' 일 수 있으므로 둘 다 확인
      const feedbackText = data.feedback || data.generatedText;
      if (feedbackText === undefined) {
          throw new Error("API 응답에서 해설 텍스트를 찾을 수 없습니다.");
      }
      setAiFeedbacks(prev => ({ ...prev, [questionItem.questionId]: feedbackText }));

    } catch (err) {
      console.error("AI Feedback 요청 오류:", err);
      setAiFeedbacks(prev => ({ ...prev, [questionItem.questionId]: `해설 생성 실패: ${err.message}` }));
    } finally {
      setLoadingAiFeedbackFor(null);
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

          </ListGroup.Item>
        ))}
      </ListGroup>
      <Button as={RouterLink} to="/my-records" variant="secondary" className="mt-4">내 기록 목록으로</Button>
    </Container>
  );
}

export default ResultsPage;