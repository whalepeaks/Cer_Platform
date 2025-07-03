const pool = require('./config/database');

async function createRecyclableExamSet() {
  const setName = process.argv[2];
  const examTypeId = parseInt(process.argv[3], 10);

  if (!setName || !examTypeId) {
    console.error('오류: 모의고사 이름과 자격증 ID를 입력해주세요.');
    console.log('사용법: node create_exam_set_recyclable.js "모의고사 이름" [자격증_ID]');
    process.exit(1);
  }

  const connection = await pool.getConnection();

  try {
    console.log(`(재사용 가능) '${setName}' 모의고사 생성을 시작합니다...`);
    await connection.beginTransaction();

    const questionTypes = [
        { type: '단답형', count: 12 },
        { type: '서술형', count: 4 },
        { type: '실무형', count: 2 }
    ];

    let selectedQuestions = [];
    for (const qt of questionTypes) {
        // [수정] WHERE id NOT IN (...) 조건절을 삭제하여 모든 문제를 대상으로 합니다.
        const [rows] = await connection.query(
            `SELECT id FROM questions 
             WHERE exam_type_id = ? AND question_type = ?
             ORDER BY RAND() LIMIT ?`,
            [examTypeId, qt.type, qt.count]
        );
        if (rows.length < qt.count) {
            // 이 오류는 DB에 해당 유형의 문제가 부족할 때만 발생합니다.
            throw new Error(`DB에 저장된 ${qt.type} 문제가 ${qt.count}개보다 적습니다.`);
        }
        selectedQuestions = selectedQuestions.concat(rows);
    }

    console.log(`${selectedQuestions.length}개의 문제를 성공적으로 선택했습니다.`);

    const [setResult] = await connection.query(
      'INSERT INTO mock_exam_sets (set_name, exam_type_id) VALUES (?, ?)',
      [setName, examTypeId]
    );
    const newSetId = setResult.insertId;
    console.log(`새로운 모의고사 세트가 생성되었습니다. (ID: ${newSetId})`);

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
    pool.end();
  }
}

createRecyclableExamSet();