// src/pages/WeaknessDrillPage.js

import React, { useState, useEffect } from 'react';
import { Container, Spinner, Alert, Card, Button, ListGroup, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom'; // 페이지 이동을 위해 useNavigate 임포트

// 실제 백엔드 주소로 설정해야 합니다.
const BACKEND_URL = 'http://34.64.241.71:3001';

function WeaknessDrillPage() {
    const [weakTopics, setWeakTopics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [loadingDrillFor, setLoadingDrillFor] = useState(null); // 어떤 주제의 드릴을 생성 중인지
    const navigate = useNavigate(); // 페이지 이동 함수

    useEffect(() => {
        const fetchWeakTopics = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`${BACKEND_URL}/api/user/weakness-topics`);
                if (!response.ok) {
                    throw new Error('약점 데이터를 불러오는 데 실패했습니다.');
                }
                const data = await response.json();
                setWeakTopics(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchWeakTopics();
    }, []);

    const handleStartDrill = async (topic) => {
        setLoadingDrillFor(topic); // 로딩 시작
        try {
            const response = await fetch(`${BACKEND_URL}/api/ai/generate-drill`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || '드릴 문제 생성에 실패했습니다.');

            // 성공 시, 문제 데이터를 가지고 드릴 세션 페이지로 이동
            navigate('/drill-session', { state: { questions: data, topic: topic } });

        } catch (err) {
            alert(`오류: ${err.message}`);
            setLoadingDrillFor(null); // 오류 발생 시 로딩 해제
        }
    };

    if (loading) {
        return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;
    }

    if (error) {
        return <Container className="mt-5"><Alert variant="danger">오류 발생: {error}</Alert></Container>;
    }

    return (
        <Container className="mt-4">
            <Card className="mb-4">
                <Card.Header as="h2" className="text-center">AI 약점 분석 및 집중 훈련</Card.Header>
                <Card.Body>
                    <Card.Text>
                        AI가 채점한 결과를 바탕으로, 현재 가장 취약한 주제들을 분석했습니다.
                        보완이 필요한 주제를 선택하여 집중 공략 드릴을 시작해보세요.
                    </Card.Text>
                </Card.Body>
            </Card>

            {weakTopics.length > 0 ? (
                <ListGroup as="ol" numbered>
                    {weakTopics.map((item, index) => (
                        <ListGroup.Item
                            key={index}
                            as="li"
                            className="d-flex justify-content-between align-items-start p-3"
                        >
                            <div className="ms-2 me-auto">
                                <div className="fw-bold fs-5">{item.topic}</div>
                                <div>
                                    <Badge bg="danger" className="me-2">오답 {item.incorrect_count}개</Badge>
                                    <Badge bg="warning" text="dark">평균 {Math.round(item.average_score)}점</Badge>
                                </div>
                            </div>
                            <Button 
                                variant="primary" 
                                onClick={() => handleStartDrill(item.topic)}
                                disabled={loadingDrillFor === item.topic}
                            >
                                {loadingDrillFor === item.topic ? '문제 생성 중...' : '드릴 시작하기'}
                            </Button>
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            ) : (
                <Alert variant="info" className="text-center">
                    아직 분석된 약점이 없습니다. 모의고사를 풀고 각 문제에 대해 'AI 채점하기'를 진행해주세요.
                </Alert>
            )}
        </Container>
    );
}

export default WeaknessDrillPage;