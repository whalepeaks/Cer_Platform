// Gemini 라이브러리를 가져옵니다.
const { GoogleGenerativeAI } = require("@google/generative-ai");

require('dotenv').config();

// [추가] .env 파일에서 Google API 키를 가져와 Gemini 클라이언트를 초기화합니다.
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// aiService.js 파일에서 이 함수를 찾아 아래 내용으로 교체해주세요.

// 1. 상세 피드백 생성 함수
async function generateFeedbackForAnswer(questionText, correctAnswerOrKeywords, userAnswer) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = `
You are an expert on information security and a question author for professional certifications.
Based on the provided [Problem], [Model Answer/Keywords], and [User's Answer], provide constructive feedback to help the user achieve a better score on their actual certification exam.

The feedback must be based on objective facts. It should analyze the intent of the problem and guide the user to learn by focusing on the core keywords.
- Briefly explain the overall concept and theory behind the problem and its answer.
- If there are comparable topics or areas that require additional study, explain them concisely.
- To improve the user's metacognition, verify if they have accurately understood the core concepts.

[IMPORTANT] The entire feedback **must be written in Korean.** and formatted in Markdown with the following sections exactly as shown. Do not add any other text or explanation.

## [개념과 해설]
## [보완할 점 및 개선 방안]
## [총평 및 키워드 학습 조언]
---
[Problem]:
${questionText}
[Model Answer/Keywords]:
${correctAnswerOrKeywords}
[User's Answer]:
${userAnswer}
---
[Feedback to be generated]:
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return text;
  } catch (error) {
    console.error("Gemini API call error (generateFeedbackForAnswer):", error);
    throw new Error("An error occurred while generating AI feedback from Gemini.");
  }
}

module.exports = {
  generateFeedbackForAnswer,
  generateSimilarQuestion,
  getAiScoreForAnswer,
  generateHierarchicalTags,
};

// JSON 출력이 필요한 함수들을 위한 헬퍼 함수
async function generateJsonFromGemini(prompt, modelName = "gemini-1.5-flash") {
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonText = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonText);
  } catch (error) {
    console.error(`Gemini API JSON 생성 중 오류 발생 (프롬프트: ${prompt.substring(0, 50)}...):`, error);
    throw new Error("Gemini AI로부터 유효한 JSON 응답을 받는 데 실패했습니다.");
  }
}

// aiService.js 파일에서 이 함수를 찾아 아래 내용으로 교체해주세요.

// 2. 유사 문제 생성 함수
async function generateSimilarQuestion(originalQuestionText, questionType) {
  // [수정] 프롬프트를 영어로 변경하고, 각 필드의 역할을 명확하게 지시합니다.
  const prompt = `
You are an expert question author for the 'Information Security Engineer' certification exam in Korea.
Your task is to analyze the provided [Original Problem] and create one new, similar problem that tests the same core concept but uses a different context or format.

[Original Problem Information]:
- Problem Type: ${questionType}
- Problem Text: ${originalQuestionText}

**CRITICAL INSTRUCTIONS FOR JSON FORMATTING:**
Your response MUST be ONLY a single JSON object. Do not add any text or explanations outside of the JSON structure.

**FIELD-SPECIFIC INSTRUCTIONS:**
- **"question_text"**: Write the new problem text here. Must be in KOREAN.
- **"correct_answer"**: **This field MUST BE CONCISE.** It should only contain essential keywords, key phrases, or a bulleted list of main points, NOT a full essay. This is for a keyword-based exam. Must be in KOREAN.
- **"explanation"**: This field should contain the detailed, long-form explanation and background for the problem and answer. Must be in KOREAN.
- **"question_type"**: This should be the same as the original problem's type.

**JSON STRUCTURE TO USE:**
{
  "question_text": "Write the content of the newly created question here in your language.",
  "correct_answer": "Write your keyword or concise answer sentence here.",
  "explanation": "Write only a 2-3 sentence explanation of why the correct answer is the correct answer.",
  "question_type": "${questionType}"
}
---
[JSON to generate]:
  `;
  return await generateJsonFromGemini(prompt);
}

// 3. AI 채점 함수
async function getAiScoreForAnswer(questionText, correctAnswer, userAnswer) {
  const prompt = `
You are a strict and fair grader for the 'Information Security Engineer' certification exam.
Based on the [Problem] and the [Model Answer], evaluate how accurately the [User's Answer] understands and describes the core concepts.
Assign a score as an integer between 0 and 100.

**CRITICAL:** Your response MUST be ONLY a single JSON object in the exact format specified below. Do not add any text, explanations, or markdown formatting.

{ "score": 85 }
---
[Problem]:
${questionText}
---
[Model Answer]:
${correctAnswer}
---
[User's Answer]:
${userAnswer}
---
[JSON to generate]:
  `;
  const resultJson = await generateJsonFromGemini(prompt);
  return resultJson.score; 
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