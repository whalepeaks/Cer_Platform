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

module.exports = {
  generateFeedbackForAnswer,
  generateSimilarQuestion,
  getAiScoreForAnswer
};