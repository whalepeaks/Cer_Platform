import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Container, Spinner, Alert, ListGroup, Badge } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { getMySubmissions } from '../api/submissionApi';

function MyRecordsPage() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      alert("기록을 보려면 로그인이 필요합니다.");
      navigate('/login');
      return;
    }

    const fetchRecords = async () => {
      setLoading(true);
      try {
        const response = await getMySubmissions(user.userId);
        setSubmissions(response.data);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecords();
  }, [user, navigate]);

  if (loading) return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;
  if (error) return <Container className="mt-5"><Alert variant="danger">{error}</Alert></Container>;

  return (
    <>
      <h2>나의 모의고사 기록</h2>
      {submissions.length === 0 ? (
        <Alert variant="info" className="mt-3">아직 응시한 모의고사 기록이 없습니다.</Alert>
      ) : (
        <ListGroup className="mt-3">
          {submissions.map(sub => (
            <ListGroup.Item key={sub.submissionId} action as={RouterLink} to={`/results/${sub.submissionId}`} className="d-flex justify-content-between align-items-start">
              <div className="ms-2 me-auto">
                <div className="fw-bold">{sub.examTypeName}</div>
                제출일: {new Date(sub.submitted_at).toLocaleString('ko-KR')}
              </div>
              <Badge bg="primary" pill>
                {sub.answeredQuestionsCount} 문제 답변
              </Badge>
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
    </>
  );
}

export default MyRecordsPage;