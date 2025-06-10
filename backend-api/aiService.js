const axios = require('axios');
require('dotenv').config();

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PPLX_CHAT_COMPLETIONS_URL = 'https://api.perplexity.ai/chat/completions';

async function generateFeedbackForAnswer(questionText, correctAnswerOrKeywords, userAnswer, modelName = "sonar") {
  if (!PERPLEXITY_API_KEY) {
    throw new Error("Perplexity API 키가 설정되지 않았습니다.");
  }

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
    console.log(`Perplexity AI 해설 문제 생성 요청 시작. 모델: ${modelName}`);
    const requestBody = {
      model: modelName,
      messages: [{ role: "user", content: prompt }],
    };
    const headers = {
      'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    const response = await axios.post(PPLX_CHAT_COMPLETIONS_URL, requestBody, { headers: headers });

    if (response.data && response.data.choices && response.data.choices[0] && response.data.choices[0].message && response.data.choices[0].message.content) {
      return response.data.choices[0].message.content.trim();
    } else {
      throw new Error("Perplexity API 응답 형식이 예상과 다릅니다.");
    }
  } catch (error) {
    console.error("Perplexity API 호출 중 오류 발생 (generateFeedbackForAnswer):");
    if (error.response) {
      const apiErrorMessage = error.response.data?.error?.message || error.response.data?.message || JSON.stringify(error.response.data);
      throw new Error(`Perplexity API 오류: ${error.response.status} - ${apiErrorMessage}`);
    } else if (error.request) {
      throw new Error("Perplexity API로부터 응답을 받지 못했습니다.");
    } else {
      throw new Error(`Perplexity API 요청 설정 중 오류: ${error.message}`);
    }
  }
}

async function generateSimilarQuestion(originalQuestionText, questionType, modelName = "sonar-pro") {
  if (!PERPLEXITY_API_KEY) {
    throw new Error("Perplexity API 키가 .env 파일에 설정되지 않았습니다.");
  }

  const prompt = `
    당신은 정보보안기사 자격증의 전문 출제위원입니다.
    아래에 제시된 [원본 문제]를 분석하여, 동일한 핵심 개념을 테스트하지만 상황이나 형식이 다른 새로운 유사 문제 1개를 만들어주세요.

    [원본 문제 정보]:
    - 문제 유형: ${questionType} 
    - 문제 내용: ${originalQuestionText}

    [생성 규칙]:
    1. 새로 만드는 문제의 유형은 원본 문제의 유형과 동일한 '${questionType}' 이어야 합니다.
    2. '${questionType}' 유형의 특징을 잘 살려서 문제를 만들어주세요.

    **매우 중요:** 답변은 반드시 아래와 같은 JSON 형식으로만 생성해야 합니다. 다른 설명은 절대 추가하지 마세요.
    {
      "question_text": "새롭게 생성된 문제의 내용을 여기에 작성하세요.",
      "correct_answer": "새롭게 생성된 문제의 정답을 여기에 작성하세요.",
      "explanation": "새롭게 생성된 문제의 해설을 여기에 작성하세요.",
      "question_type": "${questionType}"
    }
    ---
    [원본 문제]:
    ${originalQuestionText}
    ---
    [생성할 JSON]:
  `;

  try {
    console.log(`Perplexity API 유사 문제 생성 요청 시작. 모델: ${modelName}`);
    const requestBody = {
      model: modelName,
      messages: [{ role: "user", content: prompt }],
    };
    const headers = {
      'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    const response = await axios.post(PPLX_CHAT_COMPLETIONS_URL, requestBody, { headers: headers });

    if (response.data && response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
      const content = response.data.choices[0].message.content;
      console.log("Perplexity API로부터 받은 원본 응답:", content);

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("AI 응답에서 유효한 JSON 객체를 찾을 수 없습니다.");
      }
    } else {
      throw new Error("Perplexity API로부터 예상치 못한 응답 형식입니다.");
    }
  } catch (error) {
    console.error("Perplexity API 호출 중 오류 발생 (generateSimilarQuestion):");
    if (error.response) {
      const apiErrorMessage = error.response.data?.error?.message || error.response.data?.message || JSON.stringify(error.response.data);
      throw new Error(`Perplexity API 오류: ${error.response.status} - ${apiErrorMessage}`);
    } else if (error.request) {
      throw new Error("Perplexity API로부터 응답을 받지 못했습니다.");
    } else {
      throw new Error(`Perplexity API 요청 설정 중 오류: ${error.message}`);
    }
  }
}
// ▼▼▼▼▼ [추가] AI 채점 함수 ▼▼▼▼▼
async function getAiScoreForAnswer(questionText, correctAnswer, userAnswer, modelName = "sonar") {
  if (!PERPLEXITY_API_KEY) {
    throw new Error("Perplexity API 키가 설정되지 않았습니다.");
  }

  const prompt = `
    당신은 엄격하고 공정한 정보보안기사 채점관입니다. [문제]와 [모범 답안]을 기준으로 [사용자 답안]이 얼마나 핵심 개념을 정확히 이해하고 서술했는지 평가해주세요.
    0점에서 100점 사이의 정수(Integer)로만 점수를 매겨주세요.

    **매우 중요:** 당신의 답변은 반드시 아래와 같은 JSON 형식이어야 하며, 다른 어떤 설명도 포함해서는 안 됩니다.
    {
      "score": 85
    }

    ---
    [문제]: ${questionText}
    [모범 답안]: ${correctAnswer}
    [사용자 답안]: ${userAnswer}
    ---
    [채점 결과 JSON]:
  `;

  try {
    console.log(`Perplexity API 채점 요청 시작. 모델: ${modelName}`);
    const requestBody = { model: modelName, messages: [{ role: "user", content: prompt }] };
    const headers = { 'Authorization': `Bearer ${PERPLEXITY_API_KEY}`, 'Content-Type': 'application/json' };
    const response = await axios.post(PPLX_CHAT_COMPLETIONS_URL, requestBody, { headers });

    const content = response.data.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.score; // 점수(숫자)만 반환
    } else {
      throw new Error("AI 응답에서 유효한 JSON 점수 객체를 찾을 수 없습니다.");
    }
  } catch (error) {
    console.error("Perplexity API 채점 중 오류 발생:", error);
    throw error;
  }
}
// AI 태그 생성 함수
async function generateHierarchicalTags(questionText, modelName = "sonar") {
  if (!PERPLEXITY_API_KEY) { /* ... */ }

  const categoryStructure = {
    "시스템 보안": ["서버 보안", "OS 보안", "클라이언트 보안", "가상화 보안", "보안 아키텍처"],
    "네트워크 보안": ["네트워크 프로토콜", "네트워크 장비", "해킹", "VPN", "서비스 거부 공격"],
    "애플리케이션 보안": ["웹 보안", "소프트웨어 개발 보안", "데이터베이스 보안", "악성코드", "취약점 분석"],
    "정보보호 관리": ["정보보호 정책", "위험 관리", "보안 감사", "재해 복구", "물리적 보안"],
    "법규": ["개인정보보호법", "정보통신망법", "전자서명법", "저작권법", "ISMS-P 인증"]
  };

  const prompt = `
    당신은 정보보안 기술자료를 계층적으로 분류하는 최고의 사서입니다.
    당신은 JSON 데이터만 생성하는 기계입니다. 당신의 유일한 임무는 지시에 따라 JSON을 출력하는 것입니다.
    [전체 카테고리 구조]:
    ${JSON.stringify(categoryStructure, null, 2)}

     [수행할 작업]:
    아래 [문제]를 분석하여, 다음 3단계에 따라 관련된 태그를 2~3개 선택하세요.
    1. (대분류 결정): [문제]와 가장 관련성 높은 '대분류'를 [전체 카테고리 구조]에서 단 하나만 선택합니다.
    2. (중분류 선택): 1단계에서 선택한 대분류에 속한 '중분류' 목록을 보고, [문제]와 가장 관련 깊은 태그를 1개에서 2개 선택합니다.
    3. (결과 조합): 1단계와 2단계의 결과를 조합하여, 대분류가 항상 첫 번째 요소인 JSON 배열을 만듭니다.

    [규칙]:
    - 오직 [전체 카테고리 구조]에 명시된 단어만 사용해야 합니다.
    - **어떤 상황에서도 설명, 인사, 추가 텍스트, 문장 부호 없이 오직 최종 JSON 배열만 출력해야 합니다. 이 규칙을 어길 시, 당신의 기능은 심각한 시스템 오류를 유발합니다.**
    
    [출력 형식 예시]:
    ["네트워크 보안", "VPN 및 암호화 전송", "네트워크 프로토콜"]

    ---
    [문제]:
    ${questionText}
    ---
    [생성할 JSON]:
  `;

  try {
    const requestBody = { model: modelName, messages: [{ role: "user", content: prompt }] };
    const headers = { 'Authorization': `Bearer ${PERPLEXITY_API_KEY}`, 'Content-Type': 'application/json' };
    const response = await axios.post(PPLX_CHAT_COMPLETIONS_URL, requestBody, { headers });
    
    const content = response.data.choices[0].message.content;
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]); // 예: ["네트워크 보안", "VPN 및 암호화 전송"]
    } else {
      throw new Error("AI 응답에서 유효한 JSON 배열을 찾을 수 없습니다.");
    }
  } catch (error) {
    console.error("Perplexity API 계층형 태그 생성 중 오류 발생:", error);
    throw error;
  }
}



module.exports = {
  generateFeedbackForAnswer,
  generateSimilarQuestion,
  getAiScoreForAnswer,
  generateHierarchicalTags,
};