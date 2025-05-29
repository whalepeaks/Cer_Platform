// aiService.js
const axios = require('axios');
require('dotenv').config();

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PPLX_CHAT_COMPLETIONS_URL = 'https://api.perplexity.ai/chat/completions';

/**
 * 사용자 답안, 문제, 모범 답안을 기반으로 AI 텍스트(해설/피드백)를 생성합니다.
 * @param {string} questionText - 원본 문제 내용
 * @param {string} correctAnswerOrKeywords - 모범 답안 또는 핵심 키워드
 * @param {string} userAnswer - 사용자가 제출한 답안
 * @param {string} modelName - 사용할 Perplexity 모델 이름
 * @returns {Promise<string>} 생성된 AI 텍스트
 */
async function generateDetailedTextForAnswer(questionText, correctAnswerOrKeywords, userAnswer, modelName = "sonar-small-chat") { // 모델명은 Perplexity 문서에서 확인!
  if (!PERPLEXITY_API_KEY) {
    console.error("Perplexity API 키가 .env 파일에 설정되지 않았습니다.");
    throw new Error("Perplexity API 키가 설정되지 않았습니다.");
  }

  const prompt = `
당신은 IT 자격증 시험의 경험 많은 채점관이자 친절한 튜터입니다. 주어진 [문제], [모범 답안/핵심 키워드], 
그리고 [사용자 답안]을 바탕으로, 사용자가 실제 자격증 시험에서 더 좋은 점수를 받을 수 있도록 상세하지만 간략하게 피드백을 제공해주세요.
피드백은 다음 항목을 포함하여 한국어로 작성해주세요:
1.  [잘된 점]
2.  [보완할 점 및 누락된 핵심 내용]
3.  [개선 방안]
4.  [총평 및 학습 조언]
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
    console.log(`Perplexity API 요청 시작 (상세 피드백). 모델: ${modelName}`);
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
      const generatedText = response.data.choices[0].message.content.trim();
      console.log("Perplexity API로부터 받은 피드백 (일부):", generatedText.substring(0, 100));
      return generatedText;
    } else {
      console.error("Perplexity API로부터 예상치 못한 응답 형식:", response.data);
      throw new Error("Perplexity API 응답 형식이 예상과 다릅니다.");
    }
  } catch (error) {
    // ... (이전과 동일한 상세 오류 처리 로직) ...
    console.error("Perplexity API 호출 중 오류 발생 (generateDetailedTextForAnswer):");
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

// server.js에서 일관된 이름으로 사용할 수 있도록 export
module.exports = { generateText: generateDetailedTextForAnswer }; // "generateText"라는 이름으로 export