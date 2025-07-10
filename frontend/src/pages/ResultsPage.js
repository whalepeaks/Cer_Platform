import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { Container, Spinner, Alert, Card, ListGroup, Button, Collapse, Badge, Row, Col, ProgressBar } from 'react-bootstrap';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '../contexts/AuthContext';
import { getSubmissionResult, scoreAnswer, getFinalScore, generateSimilarQuestion } from '../api/submissionApi';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function ResultsPage() {
  const { submissionId } = useParams();
  const { user } = useAuth();
  const [resultData, setResultData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [finalScore, setFinalScore] = useState(null);
  const [loadingStates, setLoadingStates] = useState({});
  const [visibleStates, setVisibleStates] = useState({});
  const [progress, setProgress] = useState({ current: 0, total: 0, message: '' });

  const fetchResultData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getSubmissionResult(submissionId);
      const initialData = {
        ...response.data,
        answeredQuestions: response.data.answeredQuestions.map(q => ({
          ...q,
          similar_problem: null,
        })),
      };
      setResultData(initialData);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [submissionId]);

  useEffect(() => {
    fetchResultData();
  }, [fetchResultData]);

  const handleAction = useCallback(async (actionType, questionId) => {
    if (actionType === 'explanation') {
      setVisibleStates(prev => ({ ...prev, [questionId]: !prev[questionId] }));
      return;
    }
    setLoadingStates(prev => ({ ...prev, [`${actionType}-${questionId}`]: true }));
    try {
      let response;
      if (actionType === 'score') {
        response = await scoreAnswer({ submissionId: parseInt(submissionId), questionId });
        setResultData(prev => ({...prev, answeredQuestions: prev.answeredQuestions.map(q => q.questionId === questionId ? { ...q, ai_score: response.data.score } : q)}));
      } else if (actionType === 'similar') {
        response = await generateSimilarQuestion({ originalQuestionId: questionId, userId: user.userId });
        setResultData(prev => ({...prev, answeredQuestions: prev.answeredQuestions.map(q => q.questionId === questionId ? { ...q, similar_problem: response.data } : q)}));
      }
    } catch (err) {
      alert(`오류: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoadingStates(prev => ({ ...prev, [`${actionType}-${questionId}`]: false }));
    }
  }, [submissionId, user?.userId]);

  const handleScoreAll = useCallback(async () => {
    if (!resultData) return;
    const ungradedQuestions = resultData.answeredQuestions.filter(q => q.ai_score === null || typeof q.ai_score === 'undefined');
    if (ungradedQuestions.length === 0) {
      alert('모든 문제의 채점이 이미 완료되었습니다.');
      return;
    }
    setLoadingStates(prev => ({ ...prev, scoreAll: true, getFinalScore: true }));
    setProgress({ current: 0, total: ungradedQuestions.length, message: '일괄 채점 진행 중...' });
    for (const question of ungradedQuestions) {
      setProgress(prev => ({ ...prev, current: prev.current + 1 }));
      await handleAction('score', question.questionId);
      await sleep(1200);
    }
    alert('일괄 채점이 모두 완료되었습니다.');
    setProgress({ current: 0, total: 0, message: '' });
    setLoadingStates({});
  }, [resultData, handleAction]);

  const handleGetFinalScore = useCallback(async () => {
    if (!resultData) return;
    const unScoredQuestions = resultData.answeredQuestions.filter(q => q.ai_score === null || typeof q.ai_score === 'undefined');
    if (unScoredQuestions.length > 0) {
        alert(`아직 채점되지 않은 문항이 ${unScoredQuestions.length}개 있습니다. '일괄 채점'을 먼저 진행해주세요.`);
        return;
    }
    setLoadingStates(prev => ({...prev, getFinalScore: true}));
    try {
        const response = await getFinalScore(submissionId);
        setFinalScore(response.data.finalScore);
    } catch (err) {
        alert(`오류: ${err.response?.data?.message || err.message}`);
    } finally {
        setLoadingStates(prev => ({...prev, getFinalScore: false}));
    }
  }, [submissionId, resultData]);
  
  if (loading) return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;
  if (error) return <Container className="mt-5"><Alert variant="danger">{error}</Alert></Container>;
  if (!resultData) return <Container className="mt-5"><Alert variant="warning">결과 데이터가 없습니다.</Alert></Container>;

  const { submissionInfo, answeredQuestions } = resultData;

  return (
    <>
      <h2>모의고사 결과: {submissionInfo.examSetName}</h2>
      <p>제출일: {new Date(submissionInfo.submitted_at).toLocaleString('ko-KR')}</p>
      <hr />
      
      <Card className="mb-4 text-center">
        <Card.Header as="h5">채점 및 점수 확인</Card.Header>
        <Card.Body>
          <Row>
            <Col md={6} className="d-grid mb-2 mb-md-0">
              <Button variant="info" onClick={handleScoreAll} disabled={loadingStates.scoreAll}>
                {loadingStates.scoreAll ? '채점 중...' : '일괄 채점'}
              </Button>
            </Col>
            <Col md={6} className="d-grid">
              {finalScore !== null ? (
                <div className="p-2 border rounded d-flex align-items-center justify-content-center" style={{height: '100%'}}>
                    <h3 className="h5 text-primary mb-0">{finalScore} / 100점</h3>
                </div>
              ) : (
                <Button variant="success" onClick={handleGetFinalScore} disabled={loadingStates.getFinalScore}>
                  {loadingStates.getFinalScore ? '계산 중...' : '최종 점수 계산'}
                </Button>
              )}
            </Col>
          </Row>
          <Card.Text className="text-muted mt-3">
            '일괄 채점'을 먼저 진행한 후 '최종 점수 계산'을 눌러주세요.
          </Card.Text>
        </Card.Body>
      </Card>

      {progress.total > 0 && <ProgressBar now={(progress.current / progress.total) * 100} label={`${progress.message} (${progress.current}/${progress.total})`} animated className="mb-4"/>}
      
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
                <Button variant="outline-primary" size="sm" onClick={() => handleAction('score', item.questionId)} disabled={loadingStates[`score-${item.questionId}`]}>
                  {loadingStates[`score-${item.questionId}`] ? '채점 중...' : 'AI 채점하기'}
                </Button>
              )}
            </div>
            <p style={{ whiteSpace: 'pre-wrap', backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '4px' }}>
              {item.submitted_answer || '답변 없음'}
            </p>

            <div className="mt-3">
                <strong className="mb-1">모범 정답:</strong>
                <p style={{ whiteSpace: 'pre-wrap', backgroundColor: '#e9f7ef', padding: '10px', borderRadius: '4px' }}>
                    {item.correct_answer || '정답 정보 없음'}
                </p>
            </div>
            
            <div className="mt-3">
              <Button variant="outline-info" size="sm" onClick={() => handleAction('explanation', item.questionId)}>
                {visibleStates[item.questionId] ? '해설 숨기기' : '해설 보기'}
              </Button>
              <Collapse in={!!visibleStates[item.questionId]}>
              <div className="mt-2">
              <Card style={{ backgroundColor: '#e7f5ff' }}>
              <Card.Header as="h6">AI 생성 해설</Card.Header>
              <Card.Body>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.explanation || "해설 정보가 없습니다."}</ReactMarkdown>
      </Card.Body>
    </Card>
  </div>
</Collapse>
            </div>

            <div className="mt-2">
              <Button variant="warning" size="sm" onClick={() => handleAction('similar', item.questionId)} disabled={loadingStates[`similar-${item.questionId}`]}>
                {loadingStates[`similar-${item.questionId}`] ? '생성 중...' : 'AI 유사 문제 생성'}
              </Button>
              <Collapse in={!!item.similar_problem}>
                <div className="mt-2">
                  {item.similar_problem && (
                      <Card style={{ backgroundColor: '#fffbe6' }} border="warning">
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