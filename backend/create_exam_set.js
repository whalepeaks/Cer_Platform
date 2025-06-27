// backend/create_exam_set.js
const pool = require('./config/database');

async function createExamSet() {
  // 스크립트 실행 시 전달된 인자(argument)를 가져옵니다.
  const setName = process.argv[2];
  const examTypeId = parseInt(process.argv[3], 10);

  if (!setName || !examTypeId) {
    console.error('오류: 모의고사 이름과 자격증 ID를 입력해주세요.');
    console.log('사용법: node create_exam_set.js "모의고사 이름" [자격증_ID]');
    process.exit(1);
  }

  const connection = await pool.getConnection();

  try {
    console.log(`'${setName}' 모의고사 생성을 시작합니다...`);
    await connection.beginTransaction();

    // 1. 아직 출제되지 않은 문제들을 랜덤으로 가져옵니다. (단답형 12, 서술형 4, 실무형 2)
    const questionTypes = [
        { type: '단답형', count: 12 },
        { type: '서술형', count: 4 },
        { type: '실무형', count: 2 }
    ];
    
    let selectedQuestions = [];
    for (const qt of questionTypes) {
        const [rows] = await connection.query(
            `SELECT id FROM questions 
             WHERE id NOT IN (SELECT question_id FROM mock_exam_set_questions) 
             AND exam_type_id = ? AND question_type = ?
             ORDER BY RAND() LIMIT ?`,
            [examTypeId, qt.type, qt.count]
        );
        if (rows.length < qt.count) {
            throw new Error(`출제할 ${qt.type} 문제가 부족합니다. (${rows.length}/${qt.count})`);
        }
        selectedQuestions = selectedQuestions.concat(rows);
    }

    console.log(`${selectedQuestions.length}개의 문제를 성공적으로 선택했습니다.`);

    // 2. 'mock_exam_sets' 테이블에 새로운 세트 정보를 삽입합니다.
    const [setResult] = await connection.query(
      'INSERT INTO mock_exam_sets (set_name, exam_type_id) VALUES (?, ?)',
      [setName, examTypeId]
    );
    const newSetId = setResult.insertId;
    console.log(`새로운 모의고사 세트가 생성되었습니다. (ID: ${newSetId})`);

    // 3. 'mock_exam_set_questions' 테이블에 문제들을 연결합니다.
    const questionLinks = selectedQuestions.map(q => [newSetId, q.id]);
    await connection.query(
      'INSERT INTO mock_exam_set_questions (set_id, question_id) VALUES ?',
      [questionLinks]
    );
    console.log(`세트와 문제 연결이 완료되었습니다.`);

    await connection.commit();
    console.log('\n모든 작업이 성공적으로 완료되었습니다!');

  } catch (error) {
    await connection.rollback();
    console.error('\n오류가 발생하여 작업을 롤백했습니다:', error.message);
  } finally {
    connection.release();
    pool.end(); // 스크립트이므로 실행 후 풀을 종료합니다.
  }
}

createExamSet();