// aiService.js
const axios = require('axios');
require('dotenv').config(); // .env 파일에서 환경 변수를 불러오기 위함

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PPLX_CHAT_COMPLETIONS_URL = 'https://api.perplexity.ai/chat/completions';

/**
 * Perplexity API를 사용하여 주어진 프롬프트에 대한 텍스트를 생성합니다.
 * @param {string} prompt - AI에게 전달할 프롬프트 또는 질문 내용입니다.
 * @param {string} modelName - 사용할 Perplexity 모델 이름입니다 (예: 'llama-3-sonar-small-32k-chat').
 * @returns {Promise<string>} 생성된 텍스트를 반환합니다.
 */
async function generateTextWithPerplexity(prompt, modelName = "sonar") { 
  if (!PERPLEXITY_API_KEY) {
    console.error("Perplexity API 키가 .env 파일에 설정되지 않았습니다.");
    throw new Error("Perplexity API 키가 설정되지 않았습니다.");
  }
  if (!PPLX_CHAT_COMPLETIONS_URL.startsWith('https://api.perplexity.ai/')) {
      console.error("Perplexity API 엔드포인트 URL이 올바르게 설정되지 않았습니다. 공식 문서를 확인하세요.");
    throw new Error("Perplexity API 엔드포인트 URL이 올바르지 않습니다.");
  }

  try {
    console.log(`Perplexity API 요청 시작. 모델: ${modelName}, 프롬프트: "${prompt.substring(0, 50)}..."`);

    const requestBody = {
      model: modelName, // Perplexity API 문서에서 사용 가능한 정확한 모델 이름을 확인하세요.
      messages: [
        // { role: "system", content: "당신은 유용한 AI 어시스턴트입니다." }, // 필요에 따라 시스템 메시지 추가
        { role: "user", content: prompt }
      ],
      // 기타 옵션들 (Perplexity API 문서에서 확인)
      // temperature: 0.7,
      // max_tokens: 1024,
    };

    const headers = {
      'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json' // 응답을 JSON으로 받고 싶다는 것을 명시
    };

    const response = await axios.post(PPLX_CHAT_COMPLETIONS_URL, requestBody, { headers: headers });
    
    if (response.data && response.data.choices && response.data.choices[0] && response.data.choices[0].message && response.data.choices[0].message.content) {
      const generatedText = response.data.choices[0].message.content.trim();
      console.log("Perplexity API로부터 받은 텍스트 (일부):", generatedText.substring(0, 100));
      return generatedText;
    } else {
      // Perplexity API의 실제 응답 구조가 다를 수 있으므로, 디버깅을 위해 전체 응답을 로그로 남깁니다.
      console.error("Perplexity API로부터 예상치 못한 응답 형식:", response.data);
      throw new Error("Perplexity API 응답 형식이 예상과 다릅니다.");
    }

  } catch (error) {
    console.error("Perplexity API 호출 중 오류 발생:");
    if (error.response) {
      // API 서버가 오류 응답을 반환한 경우 (예: 4xx, 5xx 상태 코드)
      console.error("오류 상태 코드:", error.response.status);
      console.error("오류 응답 데이터:", error.response.data);
      // Perplexity API가 제공하는 구체적인 오류 메시지를 error.response.data.error.message 등에서 찾을 수 있습니다.
      const apiErrorMessage = error.response.data?.error?.message || error.response.data?.message || JSON.stringify(error.response.data);
      throw new Error(`Perplexity API 오류: ${error.response.status} - ${apiErrorMessage}`);
    } else if (error.request) {
      // 요청은 이루어졌으나 응답을 받지 못한 경우
      console.error("Perplexity API로부터 응답을 받지 못했습니다:", error.request);
      throw new Error("Perplexity API로부터 응답을 받지 못했습니다.");
    } else {
      // 요청을 설정하는 중에 오류가 발생한 경우
      console.error("Perplexity API 요청 설정 중 오류:", error.message);
      throw new Error(`Perplexity API 요청 설정 중 오류: ${error.message}`);
    }
  }
}

// server.js에서 이 함수를 사용할 수 있도록 export 합니다.
// 이전과 동일한 함수 이름을 사용하면 server.js 수정이 최소화됩니다.
module.exports = { generateTextWithPerplexitySDK: generateTextWithPerplexity };