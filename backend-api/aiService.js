// aiService.js
const axios = require('axios');
require('dotenv').config();

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PPLX_CHAT_COMPLETIONS_URL = 'https://api.perplexity.ai/chat/completions';

/**
 * 사용자 답안에 대한 상세 피드백을 Perplexity API를 통해 생성합니다.
 * @param {string} questionText - 원본 문제 내용
 * @param {string} correctAnswerOrKeywords - 모범 답안 또는 핵심 키워드
 * @param {string} userAnswer - 사용자가 제출한 답안
 * @param {string} modelName - 사용할 Perplexity 모델 이름
 * @returns {Promise<string>} 생성된 AI 피드백 텍스트
 */
async function generateFeedbackForAnswer(questionText, correctAnswerOrKeywords, userAnswer, modelName = "sonar") { // 함수 이름 및 파라미터 변경
  if (!PERPLEXITY_API_KEY) {
    console.error("Perplexity API 키가 .env 파일에 설정되지 않았습니다.");
    throw new Error("Perplexity API 키가 설정되지 않았습니다.");
  }
  // PPLX_CHAT_COMPLETIONS_URL 유효성 검사는 유지

  const prompt = `
당신은 IT 자격증 시험의 경험 많은 채점관이자 친절한 튜터입니다. 주어진 [문제], [모범 답안/핵심 키워드], 
그리고 [사용자 답안]을 바탕으로, 사용자가 실제 자격증 시험에서 더 좋은 점수를 받을 수 있도록 상세하지만 간략하게게 피드백을 제공해주세요.
피드백은 다음 항목을 포함하여 한국어로 작성해주세요:
1.  [잘된 점]: 사용자 답안에서 긍정적으로 평가할 수 있는 부분을 간략히 언급해주세요.
2.  [보완할 점 및 누락된 핵심 내용]: 사용자 답안에서 부족하거나 명확하지 않은 부분, 그리고 [모범 답안/핵심 키워드]에 비추어 누락된 중요한 개념이나 키워드가 있다면 구체적으로 지적해주세요.
3.  [개선 방안]: 어떻게 수정하거나 내용을 추가하면 더 완성도 높고 정확한 답안이 될 수 있는지 구체적인 제안을 해주세요.
4.  [총평 및 학습 조언]: 사용자 답안에 대한 전반적인 평가와 함께, 해당 주제에 대해 더 깊이 학습하거나 다음 시험을 준비하는 데 도움이 될 만한 짧은 조언을 덧붙여주세요.

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
    console.log(`Perplexity API 피드백 요청 시작. 모델: ${modelName}`);
    // console.log(`전송될 프롬프트: ${prompt}`); // 디버깅 시 프롬프트 내용 확인용 (너무 길면 일부만)

    const requestBody = {
      model: modelName,
      messages: [
        { role: "user", content: prompt }
      ],
      // temperature: 0.5, // 좀 더 일관된 답변 유도
      // max_tokens: 700,  // 충분한 피드백 길이를 위해 조정
    };

    const headers = {
      'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    const response = await axios.post(PPLX_CHAT_COMPLETIONS_URL, requestBody, { headers: headers });

    if (response.data && response.data.choices && response.data.choices[0] && response.data.choices[0].message && response.data.choices[0].message.content) {
      const generatedFeedback = response.data.choices[0].message.content.trim();
      console.log("Perplexity API로부터 받은 피드백 (일부):", generatedFeedback.substring(0, 100));
      return generatedFeedback;
    } else {
      console.error("Perplexity API로부터 예상치 못한 응답 형식:", response.data);
      throw new Error("Perplexity API 응답 형식이 예상과 다릅니다.");
    }

  } catch (error) {
    console.error("Perplexity API 호출 중 오류 발생 (generateFeedbackForAnswer):");
    // ... (이전 답변의 상세 오류 처리 로직) ...
    if (error.response) {
      console.error("오류 상태 코드:", error.response.status);
      console.error("오류 응답 데이터:", error.response.data);
      const apiErrorMessage = error.response.data?.error?.message || error.response.data?.message || JSON.stringify(error.response.data);
      throw new Error(`Perplexity API 오류: ${error.response.status} - ${apiErrorMessage}`);
    } else if (error.request) {
      console.error("Perplexity API로부터 응답을 받지 못했습니다:", error.request);
      throw new Error("Perplexity API로부터 응답을 받지 못했습니다.");
    } else {
      console.error("Perplexity API 요청 설정 중 오류:", error.message);
      throw new Error(`Perplexity API 요청 설정 중 오류: ${error.message}`);
    }
  }
}

// server.js에서 사용할 수 있도록 함수를 export 합니다.
// 이전에는 generateTextWithPerplexitySDK 라는 키로 export 했으므로, 그 키를 유지하거나 server.js에서 호출하는 이름을 바꿔야 합니다.
// 여기서는 함수 이름을 변경했으므로, export하는 객체의 키도 맞춰주거나 server.js에서 호출하는 이름을 변경합니다.
module.exports = { generateFeedbackForAnswer };