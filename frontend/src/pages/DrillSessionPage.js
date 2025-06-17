
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Container, Card, Button, Form, ListGroup, Alert, Badge} from 'react-bootstrap';

function DrillSessionPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { questions, topic } = location.state || { questions: [], topic: '알 수 없는 주제' };
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState({});
    const [showResults, setShowResults] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [finalDrillResult, setFinalDrillResult] = useState(null);

    if (!questions || questions.length === 0) {
        return (
            <Container className="mt-5">
                <Alert variant="danger">
                    드릴 문제를 불러오지 못했습니다. <Button onClick={() => navigate('/weakness-drill')}>약점 분석 페이지로 돌아가기</Button>
                </Alert>
            </Container>
        );
    }

    const handleAnswerChange = (e) => {
        setUserAnswers({
            ...userAnswers,
            [questions[currentIndex].question_text]: e.target.value // 임시로 문제 텍스트를 key로 사용
        });
    };

    const currentQuestion = questions[currentIndex];

    // 결과제출 및 저장 핸들러
    const handleSubmitDrill = async () => {
        setIsSubmitting(true);
        const storedUser = localStorage.getItem('currentUser');
        const userId = storedUser ? JSON.parse(storedUser).userId : null;

        if (!userId) {
            alert("결과를 저장하려면 로그인이 필요합니다.");
            setIsSubmitting(false);
            return;
        }

        try {
            const response = await fetch('/api/drill-sessions/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userId,
                    topic: topic,
                    questions: questions,
                    userAnswers: userAnswers
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || '결과 저장에 실패했습니다.');

            setFinalDrillResult(data); // 최종 결과(점수 등) 저장
            setShowResults(true); // 결과 보기 화면으로 전환

        } catch (err) {
            alert(`오류: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (showResults) {
        return (
            <Container className="mt-4">
                <h2>'${topic}' 드릴 결과</h2>
                <ListGroup className="mt-3">
                    {questions.map((q, idx) => (
                        <ListGroup.Item key={idx}>
                            <p><strong>문제:</strong> {q.question_text}</p>
                            <p className="text-primary"><strong>나의 답:</strong> {userAnswers[q.question_text] || '답변 안 함'}</p>
                            <p className="text-success"><strong>모범 답안:</strong> {q.correct_answer}</p>
                        </ListGroup.Item>
                    ))}
                </ListGroup>
                <Button className="mt-3" onClick={() => navigate('/weakness-drill')}>약점 분석 페이지로 돌아가기</Button>
            </Container>
        );
    }
    
    
    return (
        <Container className="mt-4">
            <Card>
                <Card.Header as="h3">🎯 '{topic}' 집중 공략 드릴</Card.Header>
                <Card.Body>
                    <Card.Title>문제 {currentIndex + 1} / {questions.length}</Card.Title>
                    <Card.Text as="div" style={{ whiteSpace: 'pre-wrap', margin: '20px 0' }}>
                        {currentQuestion.question_text}
                    </Card.Text>
                    <Form.Group>
                        <Form.Label>나의 답안:</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={4}
                            value={userAnswers[currentQuestion.question_text] || ''}
                            onChange={handleAnswerChange}
                        />
                    </Form.Group>
                </Card.Body>
                <Card.Footer className="d-flex justify-content-between">
                    <Button variant="secondary" onClick={() => setCurrentIndex(p => p - 1)} disabled={currentIndex === 0}>
                        이전 문제
                    </Button>
                    {currentIndex === questions.length - 1 ? (
                        <Button 
                            variant="success" 
                            onClick={handleSubmitDrill}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? '채점 및 저장 중...' : '채점 및 결과 저장'}
                        </Button>
                    ) : (
                        <Button variant="primary" onClick={() => setCurrentIndex(p => p + 1)}>
                            다음 문제
                        </Button>
                    )}
                </Card.Footer>
            </Card>
        </Container>
    );
}

export default DrillSessionPage;