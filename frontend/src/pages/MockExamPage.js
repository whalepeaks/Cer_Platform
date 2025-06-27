import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Spinner, Alert, ListGroup, Button, Card, Form } from 'react-bootstrap';
import { generateMockExam } from '../api/examApi';
import { submitAnswers } from '../api/submissionApi';
import { useAuth } from '../contexts/AuthContext';

function MockExamPage() {
  const { examTypeId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const fetchMockExam = async () => {
    setLoading(true);
    setError(null);
    setQuestions([]);
    setUserAnswers({});
    try {
      const response = await generateMockExam(examTypeId);
      setQuestions(response.data.questions || []);
      const initialAnswers = (response.data.questions || []).reduce((acc, q) => {
        acc[q.id] = '';
        return acc;
      }, {});
      setUserAnswers(initialAnswers);
    } catch (err) {
      setError(err.response?.data?.message || err.message || '모의고사 생성 중 오류 발생');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMockExam();
  }, [examTypeId]);

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
      const response = await submitAnswers({
        userId: user.userId,
        examTypeId: parseInt(examTypeId),
        answers: answersToSubmit
      });
      alert(response.data.message);
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
      <h2>모의고사 (자격증 ID: {examTypeId})</h2>
      <Button onClick={fetchMockExam} disabled={loading || submitting} className="mb-3">
        새로운 문제 받기
      </Button>

      {questions.length > 0 ? (
        <>
          <ListGroup as="ol" numbered className="mt-3">
            {questions.map((q, index) => (
              <ListGroup.Item as="li" key={q.id} className="mb-3 p-3 shadow-sm">
                <div className="fw-bold">
                  문제 {index + 1} (유형: {q.question_type})
                </div>
                <Card.Text as="div" style={{ whiteSpace: 'pre-wrap', margin: '1rem 0' }}>{q.question_text}</Card.Text>
                <Form.Group controlId={`answer-${q.id}`}>
                  <Form.Label>나의 답안:</Form.Label>
                  <Form.Control as="textarea" rows={3} value={userAnswers[q.id] || ''} onChange={(e) => handleAnswerChange(q.id, e.target.value)} placeholder="답을 입력하세요..." />
                </Form.Group>
              </ListGroup.Item>
            ))}
          </ListGroup>
          <Button variant="success" className="mt-3 w-100 py-2" onClick={handleSubmit} disabled={submitting || loading}>
            {submitting ? '제출 중...' : '모든 답안 제출하기'}
          </Button>
        </>
      ) : (
        <Alert variant="info" className="mt-3">생성된 모의고사 문제가 없습니다.</Alert>
      )}
    </>
  );
}

export default MockExamPage;