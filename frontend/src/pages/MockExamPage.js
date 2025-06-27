import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Spinner, Alert, ListGroup, Button, Card, Form } from 'react-bootstrap';
import { getExamSetQuestions } from '../api/examApi'; // [수정]
import { submitAnswers } from '../api/submissionApi';
import { useAuth } from '../contexts/AuthContext';

function MockExamPage() {
  const { setId } = useParams(); // [수정] examTypeId -> setId
  const navigate = useNavigate();
  const { user } = useAuth();

  const [examInfo, setExamInfo] = useState({ name: '', questions: [] });
  const [userAnswers, setUserAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!setId) return;

    const fetchExamQuestions = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getExamSetQuestions(setId);
        const questions = response.data;
        setExamInfo({ name: `모의고사 세트 #${setId}`, questions }); // 간단한 이름 설정
        
        const initialAnswers = questions.reduce((acc, q) => {
          acc[q.id] = '';
          return acc;
        }, {});
        setUserAnswers(initialAnswers);
      } catch (err) {
        setError(err.response?.data?.message || err.message || '문제를 불러오는 중 오류 발생');
      } finally {
        setLoading(false);
      }
    };

    fetchExamQuestions();
  }, [setId]);

  const handleAnswerChange = (questionId, value) => {
    setUserAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    if (!user) {
      alert('답안을 제출하려면 로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    const answersToSubmit = Object.entries(userAnswers)
      .filter(([, answer]) => answer.trim() !== '')
      .map(([questionId, answer]) => ({ questionId: parseInt(questionId), answer }));

    if (answersToSubmit.length === 0) {
      alert('입력된 답안이 없습니다.');
      return;
    }

    setSubmitting(true);
    try {
      // [수정] submitAnswers에 setId를 함께 전달합니다.
      // 백엔드 submission.service.js의 submitAnswers 함수도 setId를 받도록 수정해야 합니다.
      const response = await submitAnswers({
        userId: user.userId,
        setId: parseInt(setId),
        answers: answersToSubmit
      });
      alert(response.data.message || '제출이 완료되었습니다.');
      navigate(`/results/${response.data.submissionId}`);
    } catch (err) {
      alert(`제출 실패: ${err.response?.data?.message || err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;
  if (error) return <Container className="mt-5"><Alert variant="danger">{error}</Alert></Container>;

  return (
    <>
      {/* [수정] 제목을 모의고사 세트 이름으로 변경 */}
      <h2>{examInfo.name}</h2>
      
      {/* [삭제] '새로운 문제 받기' 버튼 삭제 */}

      {examInfo.questions.length > 0 ? (
        <>
          <ListGroup as="ol" numbered className="mt-3">
            {examInfo.questions.map((q, index) => (
              <ListGroup.Item as="li" key={q.id} className="mb-3 p-3 shadow-sm">
                <div className="fw-bold">문제 {index + 1} (유형: {q.question_type})</div>
                <Card.Text as="div" style={{ whiteSpace: 'pre-wrap', margin: '1rem 0' }}>{q.question_text}</Card.Text>
                <Form.Group controlId={`answer-${q.id}`}>
                  <Form.Label>나의 답안:</Form.Label>
                  <Form.Control as="textarea" rows={3} value={userAnswers[q.id] || ''} onChange={(e) => handleAnswerChange(q.id, e.target.value)} placeholder="답을 입력하세요..." />
                </Form.Group>
              </ListGroup.Item>
            ))}
          </ListGroup>
          <Button variant="success" className="mt-3 w-100 py-2" onClick={handleSubmit} disabled={submitting || loading}>
            {submitting ? '제출 중...' : '답안 제출하기'}
          </Button>
        </>
      ) : (
        <Alert variant="info" className="mt-3">이 모의고사에 포함된 문제가 없습니다.</Alert>
      )}
    </>
  );
}

export default MockExamPage;