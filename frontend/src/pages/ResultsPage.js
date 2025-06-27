import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { Container, Spinner, Alert, Card, ListGroup, Button, Collapse, Badge } from 'react-bootstrap';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '../contexts/AuthContext';
import { getSubmissionResult, scoreAnswer, getFinalScore, getAiFeedback, generateSimilarQuestion } from '../api/submissionApi';

function ResultsPage() {
  const { submissionId } = useParams();
  const { user } = useAuth();
  const [resultData, setResultData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [finalScore, setFinalScore] = useState(null);
  const [loadingStates, setLoadingStates] = useState({}); // 개별 로딩 상태 통합 관리

  const fetchResultData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getSubmissionResult(submissionId);
      setResultData(response.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [submissionId]);

  useEffect(() => {
    fetchResultData();
  }, [fetchResultData]);

  const handleAction = async (actionType, questionId, extraPayload = {}) => {
    setLoadingStates(prev => ({ ...prev, [questionId]: { ...prev[questionId], [actionType]: true } }));
    try {
      let response;
      const submissionData = { submissionId: parseInt(submissionId), questionId };

      switch (actionType) {
        case 'score':
          response = await scoreAnswer(submissionData);
          setResultData(prev => ({
            ...prev,
            answeredQuestions: prev.answeredQuestions.map(q =>
              q.questionId === questionId ? { ...q, ai_score: response.data.score } : q
            ),
          }));
          break;
        case 'feedback':
          response = await getAiFeedback(submissionData);
          setResultData(prev => ({
            ...prev,
            answeredQuestions: prev.answeredQuestions.map(q =>
              q.questionId === questionId ? { ...q, ai_comment: response.data.feedback } : q
            ),
          }));
          break;
        case 'similar':
          response = await generateSimilarQuestion({ originalQuestionId: questionId, userId: user.userId });
          setResultData(prev => ({
            ...prev,
            answeredQuestions: prev.answeredQuestions.map(q =>
              q.questionId === questionId ? { ...q, similar_problem: response.data } : q
            ),
          }));
          break;
        default:
          throw new Error('Unknown action type');
      }
    } catch (err) {
      alert(`오류: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoadingStates(prev => ({ ...prev, [questionId]: { ...prev[questionId], [actionType]: false } }));
    }
  };

  const handleGetFinalScore = async () => {
    setLoadingStates(prev => ({...prev, finalScore: true}));
    try {
        const response = await getFinalScore(submissionId);
        setFinalScore(response.data.finalScore);
    } catch (err) {
        alert(`오류: ${err.response?.data?.message || err.message}`);
    } finally {
        setLoadingStates(prev => ({...prev, finalScore: false}));
    }
  };

  if (loading) return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;
  if (error) return <Container className="mt-5"><Alert variant="danger">{error}</Alert></Container>;
  if (!resultData) return <Container className="mt-5"><Alert variant="warning">결과 데이터가 없습니다.</Alert></Container>;

  const { submissionInfo, answeredQuestions } = resultData;

  return (
    <>
      <h2>모의고사 결과: {submissionInfo.examTypeName}</h2>
      <p>제출일: {new Date(submissionInfo.submitted_at).toLocaleString('ko-KR')}</p>
      <hr />
      <Card className="mb-4 text-center">
        <Card.Header as="h5">최종 점수</Card.Header>
        <Card.Body>
          {finalScore !== null ? (
            <h3 className="display-4 text-primary">{finalScore} / 100점</h3>
          ) : (
            <Button variant="success" size="lg" onClick={handleGetFinalScore} disabled={loadingStates.finalScore}>
              {loadingStates.finalScore ? '계산 중...' : '최종 점수 계산하기'}
            </Button>
          )}
          <Card.Text className="text-muted mt-2">모든 문제에 대해 'AI 채점하기'를 먼저 진행해야 합니다.</Card.Text>
        </Card.Body>
      </Card>
      
      <h3>제출한 답안 및 문제</h3>
      <ListGroup as="ol" numbered className="mt-3">
        {answeredQuestions.map((item, index) => (
          <ListGroup.Item as="li" key={item.questionId} className="mb-3 p-3 shadow-sm">
            <div className="fw-bold">문제 {index + 1} (유형: {item.question_type})</div>
            <p style={{ whiteSpace: 'pre-wrap', marginTop: '0.5rem' }}>{item.question_text}</p>
            
            <div className="d-flex justify-content-between align-items-center mb-1 mt-3">
              <strong>내가 제출한 답:</strong>
              {item.ai_score !== null && typeof item.ai_score !== 'undefined' ? (
                <Badge bg="primary" pill style={{ fontSize: '1rem' }}>AI 점수: {item.ai_score}점</Badge>
              ) : (
                <Button variant="outline-secondary" size="sm" onClick={() => handleAction('score', item.questionId)} disabled={loadingStates[item.questionId]?.score}>
                  {loadingStates[item.questionId]?.score ? '채점 중...' : 'AI 채점하기'}
                </Button>
              )}
            </div>
            <p style={{ whiteSpace: 'pre-wrap', backgroundColor: '#f0f0f0', padding: '10px', borderRadius: '4px' }}>
              {item.submitted_answer || '답변 없음'}
            </p>

            <div className="mt-3">
              <Button variant="outline-info" size="sm" onClick={() => handleAction('feedback', item.questionId)} disabled={loadingStates[item.questionId]?.feedback}>
                {loadingStates[item.questionId]?.feedback ? '해설 생성 중...' : 'AI 맞춤 해설 보기'}
              </Button>
              {item.ai_comment && (
                <Card className="mt-2"><Card.Body><ReactMarkdown remarkPlugins={[remarkGfm]}>{item.ai_comment}</ReactMarkdown></Card.Body></Card>
              )}
            </div>

            <div className="mt-2">
              <Button variant="outline-primary" size="sm" onClick={() => handleAction('similar', item.questionId)} disabled={loadingStates[item.questionId]?.similar}>
                {loadingStates[item.questionId]?.similar ? '생성 중...' : 'AI 유사 문제 생성'}
              </Button>
              <Collapse in={!!item.similar_problem}>
                <div className="mt-2">
                  {item.similar_problem && (
                    <Card border="primary">
                      <Card.Header as="h6">AI 생성 유사 문제</Card.Header>
                      <Card.Body>
                          <p style={{ whiteSpace: 'pre-wrap', fontWeight: 'bold' }}>{item.similar_problem.question_text}</p>
                          <hr/>
                          <p className="mb-1"><strong>정답:</strong> {item.similar_problem.correct_answer}</p>
                          <p className="mb-1 mt-2"><strong>해설:</strong> {item.similar_problem.explanation}</p>
                      </Card.Body>
                    </Card>
                  )}
                </div>
              </Collapse>
            </div>
          </ListGroup.Item>
        ))}
      </ListGroup>
      <Button as={RouterLink} to="/my-records" variant="secondary" className="mt-4">내 기록 목록으로</Button>
    </>
  );
}

export default ResultsPage;