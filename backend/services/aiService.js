// [삭제] axios는 더 이상 필요 없으므로 삭제하거나 주석 처리합니다.
// const axios = require('axios');

// [추가] Gemini 라이브러리를 가져옵니다.
const { GoogleGenerativeAI } = require("@google/generative-ai");

require('dotenv').config();

// [추가] .env 파일에서 Google API 키를 가져와 Gemini 클라이언트를 초기화합니다.
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);


// --- 각 함수들을 아래와 같이 Gemini를 사용하도록 수정합니다. ---

// 1. 상세 피드백 생성 함수
async function generateFeedbackForAnswer(questionText, correctAnswerOrKeywords, userAnswer) {
  // 사용할 Gemini 모델을 선택합니다. (gemini-1.5-flash는 빠르고 저렴합니다)
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  // 프롬프트는 거의 그대로 사용해도 좋습니다.
  const prompt = `
당신은 정보보안에 대한 전문가이자 출제위원입니다. 주어진 [문제], [모범 답안/핵심 키워드], 
그리고 [사용자 답안]을 바탕으로, 사용자가 실제 자격증 시험에서 더 좋은 점수를 받을 수 있도록 피드백을 제공해주세요.
피드백은 객관적인 사실을 기반으로 문제의 출제의도를 파악하고 키워드를 중심으로 학습할 수 있게 해주세요.
문제와 정답에 대한 전체적인 개념과 해설을 간략하게 서술해주세요.
비교할수 있는것이 있거나 추가로 학습이 필요한 경우 간략하게 설명해주세요.
메타인지 파악을 위해 정확한 개념을 파악 했는지 확인해주세요.
피드백은 다음 항목을 포함하여 마크다운형식으로 한국어로 작성해주세요.

## [개념과 해설]
## [보완할 점 및 개선 방안]
## [총평 및 키워드 학습 조언]
---
[문제]:
${questionText}
[모범 답안/핵심 키워드]:
${correctAnswerOrKeywords}
[사용자 답안]:
${userAnswer}
---
[생성할 해설]:
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return text;
  } catch (error) {
    console.error("Gemini API 호출 중 오류 발생 (generateFeedbackForAnswer):", error);
    throw new Error("Gemini AI 해설 생성 중 오류가 발생했습니다.");
  }
}


// JSON 출력이 필요한 함수들을 위한 헬퍼 함수
async function generateJsonFromGemini(prompt, modelName = "gemini-1.5-flash") {
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json", // JSON 출력을 명시적으로 요청
    },
  });

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    // Gemini가 반환한 텍스트에서 JSON 부분만 파싱
    const jsonText = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonText);
  } catch (error) {
    console.error(`Gemini API JSON 생성 중 오류 발생 (프롬프트: ${prompt.substring(0, 50)}...):`, error);
    throw new Error("Gemini AI로부터 유효한 JSON 응답을 받는 데 실패했습니다.");
  }
}


// 2. 유사 문제 생성 함수
async function generateSimilarQuestion(originalQuestionText, questionType) {
  const prompt = `
    당신은 정보보안기사 자격증의 전문 출제위원입니다.
    아래에 제시된 [원본 문제]를 분석하여, 동일한 핵심 개념을 테스트하지만 상황이나 형식이 다른 새로운 유사 문제 1개를 만들어주세요.

    [원본 문제 정보]:
    - 문제 유형: ${questionType} 
    - 문제 내용: ${originalQuestionText}

    **매우 중요:** 답변은 반드시 아래와 같은 JSON 형식으로만 생성해야 합니다. 다른 설명은 절대 추가하지 마세요.
    {
      "question_text": "새롭게 생성된 문제의 내용을 여기에 작성하세요.",
      "correct_answer": "새롭게 생성된 문제의 정답을 여기에 작성하세요.",
      "explanation": "새롭게 생성된 문제의 해설을 여기에 작성하세요.",
      "question_type": "${questionType}"
    }
    ---
    [생성할 JSON]:
  `;
  // JSON 생성 헬퍼 함수 사용
  return await generateJsonFromGemini(prompt);
}


// 3. AI 채점 함수
async function getAiScoreForAnswer(questionText, correctAnswer, userAnswer) {
  const prompt = `
    당신은 엄격하고 공정한 정보보안기사 채점관입니다. [문제]와 [모범 답안]을 기준으로 [사용자 답안]이 얼마나 핵심 개념을 정확히 이해하고 서술했는지 평가해주세요.
    0점에서 100점 사이의 정수(Integer)로만 점수를 매겨주세요.
    **매우 중요:** 당신의 답변은 반드시 아래와 같은 JSON 형식이어야 하며, 다른 어떤 설명도 포함해서는 안 됩니다.
    { "score": 85 }
    ---
    [문제]: ${questionText}
    [모범 답안]: ${correctAnswer}
    [사용자 답안]: ${userAnswer}
    ---
    [채점 결과 JSON]:
  `;
  const resultJson = await generateJsonFromGemini(prompt);
  return resultJson.score; // 점수(숫자)만 반환
}


// 4. AI 계층형 태그 생성 함수
async function generateHierarchicalTags(questionText) {
    const categoryStructure = {
        "시스템 보안": ["서버 보안", "OS 보안", "클라이언트 보안", "가상화 보안", "보안 아키텍처"],
        "네트워크 보안": ["네트워크 프로토콜", "네트워크 장비", "해킹", "VPN", "서비스 거부 공격"],
        "애플리케이션 보안": ["웹 보안", "소프트웨어 개발 보안", "데이터베이스 보안", "악성코드", "취약점 분석"],
        "정보보호 관리": ["정보보호 정책", "위험 관리", "보안 감사", "재해 복구", "물리적 보안"],
        "법규": ["개인정보보호법", "정보통신망법", "전자서명법", "저작권법", "ISMS-P 인증"]
    };

    const prompt = `
        당신은 정보보안 기술자료를 계층적으로 분류하는 최고의 사서입니다.
        [문제]를 분석하여, 아래 [카테고리 구조]에서 가장 관련성 높은 대분류 1개와 중분류 1~2개를 선택하세요.
        - 대분류를 항상 배열의 첫 번째에 위치시키세요.
        - 답변은 JSON 문자열 배열 형식으로만 제공해야 합니다. (예: ["네트워크 보안", "VPN"])
        - 어떤 설명이나 추가 텍스트도 붙이지 마세요.
        ---
        [카테고리 구조]:
        ${JSON.stringify(categoryStructure, null, 2)}
        ---
        [문제]:
        ${questionText}
        ---
        [선택할 태그 JSON]:
    `;
    return await generateJsonFromGemini(prompt);
}




// module.exports에 모든 함수를 그대로 내보냅니다.
module.exports = {
  generateFeedbackForAnswer,
  generateSimilarQuestion,
  getAiScoreForAnswer,
  generateHierarchicalTags,
};