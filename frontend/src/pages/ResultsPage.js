import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { Container, Spinner, Alert, Card, ListGroup, Button, Collapse, Badge, Row, Col} from 'react-bootstrap';
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
  const [loadingStates, setLoadingStates] = useState({});

  const fetchResultData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getSubmissionResult(submissionId);
      // 백엔드에서 받은 데이터에 ai_comment, similar_problem 필드를 초기화해줍니다.
      const initialData = {
        ...response.data,
        answeredQuestions: response.data.answeredQuestions.map(q => ({
          ...q,
          ai_comment: q.ai_comment || null,
          similar_problem: null,
          isCorrectAnswerVisible: false, // 정답 보기 토글 상태 추가
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

  // [수정] 모든 버튼 클릭 이벤트를 하나의 핸들러로 통합
  const handleAction = async (actionType, questionId) => {
    setLoadingStates(prev => ({ ...prev, [`${actionType}-${questionId}`]: true }));
    try {
      let response;
      const payload = { submissionId: parseInt(submissionId), questionId };

      switch (actionType) {
        case 'score':
          response = await scoreAnswer(payload);
          setResultData(prev => ({
            ...prev,
            answeredQuestions: prev.answeredQuestions.map(q =>
              q.questionId === questionId ? { ...q, ai_score: response.data.score } : q
            ),
          }));
          break;
        case 'feedback':
          response = await getAiFeedback(payload);
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
      setLoadingStates(prev => ({ ...prev, [`${actionType}-${questionId}`]: false }));
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
  // [신규] 일괄 채점 버튼 클릭 시 실행될 함수
const handleScoreAll = async () => {
  // 전체 문제 중에서 아직 채점되지 않은 문제들만 필터링
  const ungradedQuestions = answeredQuestions.filter(q => q.ai_score === null || typeof q.ai_score === 'undefined');

  if (ungradedQuestions.length === 0) {
    alert('모든 문제의 채점이 이미 완료되었습니다.');
    return;
  }

  // 버튼 로딩 상태 업데이트
  setLoadingStates(prev => ({ ...prev, scoreAll: true }));
  alert(`총 ${ungradedQuestions.length}개의 문제에 대한 일괄 채점을 시작합니다.`);

  // 채점되지 않은 문제들을 순회하며 하나씩 채점 API 호출
  for (const question of ungradedQuestions) {
    // 기존의 개별 채점 로직 재사용
    await handleAction('score', question.questionId);
  }

  alert('일괄 채점이 모두 완료되었습니다.');
  setLoadingStates(prev => ({ ...prev, scoreAll: false }));
};


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
          {/* [수정] Row와 Col을 사용해 버튼을 좌우로 나눕니다. */}
          <Row>
            {/* 왼쪽 컬럼: 일괄 채점 버튼 */}
            <Col md={6} className="d-grid mb-2 mb-md-0">
              <Button 
                variant="info" 
                size="lg" 
                onClick={handleScoreAll} 
                disabled={loadingStates.scoreAll}
              >
                {loadingStates.scoreAll ? '채점 진행 중...' : '전체 답변 일괄 채점'}
              </Button>
            </Col>

            {/* 오른쪽 컬럼: 최종 점수 계산 버튼 */}
            <Col md={6} className="d-grid">
              {finalScore !== null ? (
                <div className="p-2 border rounded">
                    <h3 className="display-5 text-primary mb-0">{finalScore} / 100점</h3>
                </div>
              ) : (
                <Button 
                  variant="success" 
                  size="lg" 
                  onClick={handleGetFinalScore} 
                  disabled={loadingStates.finalScore}
                >
                  {loadingStates.finalScore ? '계산 중...' : '최종 점수 계산하기'}
                </Button>
              )}
            </Col>
          </Row>
          
          <Card.Text className="text-muted mt-3">
            '일괄 채점'을 먼저 진행한 후 '최종 점수 계산하기'를 눌러주세요.
          </Card.Text>

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
                <Button variant="outline-primary" size="sm" onClick={() => handleAction('score', item.questionId)} disabled={loadingStates[`score-${item.questionId}`]}>
                  {loadingStates[`score-${item.questionId}`] ? '채점 중...' : 'AI 채점하기'}
                </Button>
              )}
            </div>
            <p style={{ whiteSpace: 'pre-wrap', backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '4px' }}>
              {item.submitted_answer || '답변 없음'}
            </p>

            {/* --- [수정] 모범 정답 표시 부분 추가 --- */}
            <div className="mt-3">
                <strong className="mb-1">모범 정답:</strong>
                <p style={{ whiteSpace: 'pre-wrap', backgroundColor: '#e9f7ef', padding: '10px', borderRadius: '4px' }}>
                    {item.correct_answer || '정답 정보 없음'}
                </p>
            </div>
            {/* --- 여기까지 --- */}


            <div className="mt-3">
              <Button variant="outline-info" size="sm" onClick={() => handleAction('feedback', item.questionId)} disabled={loadingStates[`feedback-${item.questionId}`]}>
                {loadingStates[`feedback-${item.questionId}`] ? '해설 생성 중...' : 'AI 맞춤 해설 보기'}
              </Button>
              <Collapse in={!!item.ai_comment}>
                <div className="mt-2">
                  <Card><Card.Header as="h6">AI 자동 해설</Card.Header><Card.Body><ReactMarkdown remarkPlugins={[remarkGfm]}>{item.ai_comment}</ReactMarkdown></Card.Body></Card>
                </div>
              </Collapse>
            </div>

            <div className="mt-2">
              <Button variant="outline-secondary" size="sm" onClick={() => handleAction('similar', item.questionId)} disabled={loadingStates[`similar-${item.questionId}`]}>
                {loadingStates[`similar-${item.questionId}`] ? '생성 중...' : 'AI 유사 문제 생성'}
              </Button>
              <Collapse in={!!item.similar_problem}>
                <div className="mt-2">
                  {item.similar_problem && (
                    <Card border="secondary">
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