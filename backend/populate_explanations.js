const pool = require('./config/database');
const aiService = require('./services/aiService');

// API 속도 제한을 피하기 위한 딜레이 함수
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function populateExplanations() {
  console.log('해설이 없는 문제를 찾는 중...');
  
  // explanation 컬럼이 비어있는 모든 문제를 조회합니다.
  const [questionsToUpdate] = await pool.query(
    "SELECT id, question_text, correct_answer FROM questions WHERE explanation IS NULL OR explanation = ''"
  );

  if (questionsToUpdate.length === 0) {
    console.log("모든 문제에 이미 해설이 존재합니다. 작업을 종료합니다.");
    pool.end();
    return;
  }

  console.log(`총 ${questionsToUpdate.length}개의 문제에 대한 AI 해설 생성을 시작합니다...`);

  for (let i = 0; i < questionsToUpdate.length; i++) {
    const q = questionsToUpdate[i];
    try {
      console.log(`  - (${i + 1}/${questionsToUpdate.length}) ${q.id}번 문제 해설 생성 중...`);
      
      // AI를 호출하여 일반 해설을 생성합니다.
      const explanation = await aiService.generateGeneralExplanation(q.question_text, q.correct_answer);
      
      // 받아온 해설을 DB의 explanation 컬럼에 업데이트합니다.
      await pool.query(
        'UPDATE questions SET explanation = ? WHERE id = ?',
        [explanation, q.id]
      );
      console.log(`    -> 성공: ${q.id}번 문제 해설이 DB에 저장되었습니다.`);

    } catch (error) {
      console.error(`    -> 실패: ${q.id}번 문제 처리 중 오류 발생:`, error.message);
    }
    
    // Gemini API의 분당 요청 제한(RPM)을 피하기 위해 각 요청 사이에 딜레이를 줍니다.
    await sleep(1200); // 1.2초 대기
  }

  console.log("\n모든 해설 생성 작업이 완료되었습니다.");
  pool.end(); // 모든 작업이 끝나면 DB 연결을 종료합니다.
}

populateExplanations();