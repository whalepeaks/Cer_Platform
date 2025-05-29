import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Spinner, Alert, ListGroup, Button, Card, Form } from 'react-bootstrap';


// !!!! 실제 백엔드 API 주소로 변경해주세요 !!!!
// 'http://34.64.241.71:3001';
const BACKEND_URL = 'http://localhost:3001';

function MockExamPage() {
  const { examTypeId } = useParams();
  const navigate = useNavigate(); // 페이지 이동을 위해

  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({}); // { questionId: "사용자 답" } 형태
  const [generationMessages, setGenerationMessages] = useState([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false); // 제출 중 로딩 상태
  const [error, setError] = useState(null);
  const [submitMessage, setSubmitMessage] = useState(null); // 제출 결과 메시지

  const generateMockExam = () => {
    // ... (기존 모의고사 생성 로직은 거의 동일) ...
    setLoading(true);
    setError(null);
    setSubmitMessage(null); // 새 모의고사 생성 시 이전 제출 메시지 초기화
    setQuestions([]);
    setUserAnswers({}); // 답안 상태도 초기화
    setGenerationMessages([]);
    setTotalQuestions(0);

    const apiUrl = `${BACKEND_URL}/api/mock-exam/generate?examTypeId=${examTypeId}`;
    fetch(apiUrl)
      .then(response => { /* ... */ if (!response.ok) { return response.json().then(err => { throw new Error(err.message || `HTTP 오류! ${response.status}`)}) } return response.json();})
      .then(data => {
        const questionsWithVisibility = (data.questions || []).map(q => ({
          ...q,
          isAnswerVisible: false, // 정답/해설 보기 기능은 잠시 제외 (또는 유지)
        }));
        setQuestions(questionsWithVisibility);
        setTotalQuestions(data.totalQuestions || 0);
        setGenerationMessages(data.generationMessages || []);
        // 각 문제에 대한 답안 상태 초기화
        const initialAnswers = {};
        questionsWithVisibility.forEach(q => {
          initialAnswers[q.id] = ''; // 각 문제 ID에 대해 빈 문자열로 답안 초기화
        });
        setUserAnswers(initialAnswers);
        setLoading(false);
      })
      .catch(err => { /* ... */ setError(err.message); setLoading(false);});
  };

  useEffect(() => {
    if (examTypeId) { // examTypeId가 있을 때만 모의고사 생성
        generateMockExam();
    }
  }, [examTypeId]); // examTypeId가 변경될 때마다 실행

  const handleAnswerChange = (questionId, value) => {
    setUserAnswers(prevAnswers => ({
      ...prevAnswers,
      [questionId]: value,
    }));
  };

  const handleSubmitAnswers = async () => {
    // 현재 로그인한 사용자 정보 가져오기 (localStorage 또는 Context API 등 사용)
    const storedUser = localStorage.getItem('currentUser');
    if (!storedUser) {
      setError('답안을 제출하려면 로그인이 필요합니다.');
      navigate('/login'); // 로그인 페이지로 이동
      return;
    }
    const currentUser = JSON.parse(storedUser);
    const userId = currentUser.userId;

    if (Object.keys(userAnswers).length === 0) {
      setError('제출할 답안이 없습니다.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSubmitMessage(null);

    const answersToSubmit = Object.entries(userAnswers)
        .filter(([questionId, answer]) => answer.trim() !== '') // 빈 답안은 제외 (선택 사항)
        .map(([questionId, answer]) => ({
            questionId: parseInt(questionId), // questionId를 숫자로 변환
            answer: answer,
        }));

    if (answersToSubmit.length === 0) {
        setError('입력된 답안이 없습니다.');
        setSubmitting(false);
        return;
    }


    try {
      const response = await fetch(`${BACKEND_URL}/api/mock-exam/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          examTypeId: parseInt(examTypeId), 
          answers: answersToSubmit
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || '답안 제출에 실패했습니다.');
      }
      setSubmitMessage({ type: 'success', text: data.message });
      // 성공 후 다음 행동 (예: 결과 페이지로 이동, 현재 페이지 유지 등)
      // generateMockExam(); // 새 모의고사 자동 생성 (선택 사항)

    } catch (err) {
      setError(err.message);
      setSubmitMessage({ type: 'danger', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <Container className="mt-4">
      <h2>자격증 ID {examTypeId} 모의고사</h2>
      <Button onClick={generateMockExam} disabled={loading || submitting} className="mb-3">
        {loading ? '새 모의고사 생성 중...' : '새로운 모의고사 생성하기'}
      </Button>

      {error && <Alert variant="danger" className="mt-3">오류: {error}</Alert>}
      {submitMessage && <Alert variant={submitMessage.type} className="mt-3">{submitMessage.text}</Alert>}


      {loading && !error && (
         <div className="text-center mt-3">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      )}

      {!loading && !error && questions.length > 0 && (
        <>
          <h4 className="mt-4">생성된 모의고사 (총 {totalQuestions} 문제)</h4>
          {generationMessages.map((msg, idx) => (
             <Alert variant={msg.startsWith("주의:") ? "warning" : "info"} key={idx} className="mt-2">{msg}</Alert>
          ))}
          <ListGroup as="ol" numbered className="mt-3">
            {questions.map((q, index) => (
              <ListGroup.Item as="li" key={q.id} className="mb-3 p-3 shadow-sm">
                <div className="fw-bold">
                  문제 {index + 1} (원래 번호: {q.round_identifier}-{q.question_number}, 유형: {q.question_type})
                </div>
                <Card.Text as="div" style={{ whiteSpace: 'pre-wrap', marginTop: '0.5rem', marginBottom: '1rem' }}>
                  {q.question_text}
                </Card.Text>
                
                {/* 답안 입력 영역 */}
                <Form.Group controlId={`answer-${q.id}`} className="mt-2">
                  <Form.Label>나의 답안:</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={userAnswers[q.id] || ''}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    placeholder="여기에 답을 입력하세요..."
                  />
                </Form.Group>

                {/* 이전 정답/해설 보기 버튼은 일단 주석 처리 또는 필요시 유지 */}
                {/* <Button 
                  variant="outline-secondary" 
                  size="sm"
                  className="mt-2"
                  onClick={() => toggleAnswerVisibility(q.id)}
                >
                  {q.isAnswerVisible ? '정답/해설 숨기기' : '정답/해설 보기'}
                </Button>
                {q.isAnswerVisible && ( ... )}
                */}
              </ListGroup.Item>
            ))}
          </ListGroup>
          <Button 
            variant="success" 
            className="mt-3 w-100 py-2" 
            onClick={handleSubmitAnswers}
            disabled={submitting || loading || questions.length === 0}
          >
            {submitting ? '제출 중...' : '모든 답안 제출하기'}
          </Button>
        </>
      )}
      
      {!loading && !error && questions.length === 0 && (
        <Alert variant="info" className="mt-3">
          현재 생성된 모의고사 문제가 없습니다. "새로운 모의고사 생성하기" 버튼을 눌러주세요.
        </Alert>
      )}
    </Container>
  );
}

export default MockExamPage;