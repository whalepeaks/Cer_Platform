// aiService.js
const axios = require('axios');
require('dotenv').config();

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PPLX_CHAT_COMPLETIONS_URL = 'https://api.perplexity.ai/chat/completions';

async function generateFeedbackForAnswer(questionText, correctAnswerOrKeywords, userAnswer, modelName = "sonar-pro") { // <<-- Perplexity 문서에서 정확한 모델명 확인 필수!
  if (!PERPLEXITY_API_KEY) {
    console.error("Perplexity API 키가 .env 파일에 설정되지 않았습니다.");
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
    console.log(`Perplexity API 피드백 요청 시작. 모델: ${modelName}`);
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
      const generatedFeedback = response.data.choices[0].message.content.trim();
      console.log("Perplexity API로부터 받은 피드백 (일부):", generatedFeedback.substring(0, 100));
      return generatedFeedback;
    } else {
      console.error("Perplexity API로부터 예상치 못한 응답 형식:", response.data);
      throw new Error("Perplexity API 응답 형식이 예상과 다릅니다.");
    }
  } catch (error) {
    console.error("Perplexity API 호출 중 오류 발생 (generateFeedbackForAnswer):");
    if (error.response) {
      console.error("오류 상태 코드:", error.response.status);
      console.error("오류 응답 데이터:", error.response.data);
      const apiErrorMessage = error.response.data?.error?.message || error.response.data?.message || JSON.stringify(error.response.data);
      throw new Error(`Perplexity API 오류: ${error.response.status} - ${apiErrorMessage}`);
    } else if (error.request) {
      throw new Error("Perplexity API로부터 응답을 받지 못했습니다.");
    } else {
      throw new Error(`Perplexity API 요청 설정 중 오류: ${error.message}`);
    }
  }
}

// generateFeedbackForAnswer 함수 하나만 객체 형태로 export
module.exports = { generateFeedbackForAnswer };