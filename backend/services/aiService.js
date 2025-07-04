const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// 1. 상세 피드백 생성 함수 (영문 프롬프트)
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
    return response.text();
  } catch (error) {
    console.error("Gemini API call error (generateFeedbackForAnswer):", error);
    throw new Error("An error occurred while generating AI feedback from Gemini.");
  }
}

// 2. 유사 문제 생성 함수 (영문 프롬프트, 간결한 답변/해설 요구)
async function generateSimilarQuestion(originalQuestionText, questionType) {
  const prompt = `
You are an expert question author for the 'Information Security Engineer' certification exam in Korea.
Your task is to create one new, similar problem based on the provided [Original Problem].

[Original Problem Information]:
- Problem Type: ${questionType}
- Problem Text: ${originalQuestionText}

**CRITICAL INSTRUCTIONS:**
1.  Your response MUST be ONLY a single JSON object. Do not add any text outside of this JSON.
2.  All text values in the JSON must be written in KOREAN.
3.  Both "correct_answer" and "explanation" must be VERY CONCISE.

**FIELD-SPECIFIC INSTRUCTIONS:**
- **"question_text"**: The new problem text.
- **"correct_answer"**: Provide ONLY the essential keywords or a very short key phrase. (e.g., "스트레스 테스트, 취약점 분석")
- **"explanation"**: Provide a BRIEF core explanation in just 2-3 sentences that directly explains why the answer is correct. Do NOT include lengthy background information or examples.

**JSON STRUCTURE TO USE:**
{
  "question_text": "새로운 문제의 내용을 여기에 작성합니다.",
  "correct_answer": "핵심 키워드만 나열합니다. (예: 제로데이 공격, APT)",
  "explanation": "정답이 왜 정답인지에 대한 2-3 문장의 핵심적인 해설만 작성합니다.",
  "question_type": "${questionType}"
}
---
[JSON to generate]:
  `;
  return await generateJsonFromGemini(prompt);
}

// 3. AI 채점 함수 (영문 프롬프트)
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

// 4. AI 계층형 태그 생성 함수 (기존 한글 프롬프트 유지)
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

// JSON 출력이 필요한 함수들을 위한 헬퍼 함수 (안정성 강화 버전)
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
    let text = response.text();

    // AI가 불필요한 텍스트나 마크다운을 포함해도 JSON만 추출하도록 보강
    const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
      text = jsonMatch[0];
    }

    return JSON.parse(text);
  } catch (error) {
    console.error(`Gemini API JSON 생성 또는 파싱 중 오류 발생:`, error);
    throw new Error("Gemini AI로부터 유효한 JSON 응답을 받는 데 실패했습니다.");
  }
}

// module.exports에 모든 함수를 내보냅니다.
module.exports = {
  generateFeedbackForAnswer,
  generateSimilarQuestion,
  getAiScoreForAnswer,
  generateHierarchicalTags,
};