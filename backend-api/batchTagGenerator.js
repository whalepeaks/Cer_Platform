// batchTagGenerator.js (전체 코드)

require('dotenv').config();
const mysql = require('mysql2/promise');
const aiService = require('./aiService');

const dbConfig = { host: process.env.DB_HOST,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_DATABASE,
                charset: 'utf8mb4',
                timezone: '+09:00'
};
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runBatch() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        // topic이 비어있는 문제만 대상으로 하는 것이 효율적입니다.
        const [questions] = await connection.query("SELECT id, question_text FROM questions WHERE topic IS NULL");
        console.log(`총 ${questions.length}개의 문제에 대한 계층형 태그 작업을 시작합니다.`);

        // ▼▼▼▼▼ [수정] 배치(chunk) 로직을 버리고, 단순 for...of 루프로 변경합니다. ▼▼▼▼▼
        for (const question of questions) {
            try {
                console.log(`[${question.id}번 문제] 태그 생성 중...`);
                // 1. 최적화된 단일 처리 함수를 호출합니다.
                const tagNames = await aiService.generateHierarchicalTags(question.question_text);

                if (!tagNames || tagNames.length < 2) {
                    console.log(`  -> 경고: 유효한 태그를 생성하지 못했습니다.`);
                    continue; // 다음 문제로
                }

                // 2. DB에 저장하는 로직은 계층형 구조 그대로 유지합니다.
                const majorCategoryName = tagNames[0];
                let [rows] = await connection.query("SELECT id FROM tags WHERE name = ? AND parent_id IS NULL", [majorCategoryName]);
                let parentTagId;
                if (rows.length === 0) {
                    const [result] = await connection.query("INSERT INTO tags (name, parent_id) VALUES (?, NULL)", [majorCategoryName]);
                    parentTagId = result.insertId;
                } else {
                    parentTagId = rows[0].id;
                }
                await connection.query("INSERT IGNORE INTO question_tags (question_id, tag_id) VALUES (?, ?)", [question.id, parentTagId]);

                const midCategoryNames = tagNames.slice(1);
                for (const midTagName of midCategoryNames) {
                    [rows] = await connection.query("SELECT id FROM tags WHERE name = ? AND parent_id = ?", [midTagName, parentTagId]);
                    let midTagId;
                    if (rows.length === 0) {
                        const [result] = await connection.query("INSERT INTO tags (name, parent_id) VALUES (?, ?)", [midTagName, parentTagId]);
                        midTagId = result.insertId;
                    } else {
                        midTagId = rows[0].id;
                    }
                    await connection.query("INSERT IGNORE INTO question_tags (question_id, tag_id) VALUES (?, ?)", [question.id, midTagId]);
                }
                
                // 3. 단일 처리 방식이므로, topic 컬럼도 업데이트 해줍니다.
                await connection.query("UPDATE questions SET topic = ? WHERE id = ?", [majorCategoryName, question.id]);

                console.log(`  -> 성공: [${question.id}번 문제]에 ${tagNames.join(', ')} 태그를 연결했습니다.`);

            } catch (error) {
                console.error(`  -> 오류: [${question.id}번 문제] 처리 중 오류 발생:`, error.message);
            }
            
            // API 호출이 매우 많아지므로, 속도 제한에 걸리지 않도록 sleep은 필수입니다.
            await sleep(1000); 
        }
        // ▲▲▲▲▲ [수정] 배치(chunk) 로직을 버리고, 단순 for...of 루프로 변경합니다. ▲▲▲▲▲

        console.log('모든 문제에 대한 태그 작업이 완료되었습니다.');
    } catch (error) {
        console.error('배치 작업 중 심각한 오류가 발생했습니다:', error);
    } finally {
        if (connection) await connection.end();
    }
}

runBatch();