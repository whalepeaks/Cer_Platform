const pool = require('../config/database');

async function getExamTypes() {
    const [rows] = await pool.query('SELECT id, certification_name, created_at FROM exam_types');
    return rows;
}

async function getRoundsByExamType(examTypeId) {
    const query = `
        SELECT DISTINCT round_identifier 
        FROM questions 
        WHERE exam_type_id = ? 
        ORDER BY round_identifier
    `;
    const [rows] = await pool.query(query, [examTypeId]);
    return rows.map(row => row.round_identifier);
}

async function getQuestions(examTypeId, round) {
    const query = `
        SELECT id, question_number, question_text, correct_answer, explanation, question_type, created_at 
        FROM questions 
        WHERE exam_type_id = ? AND round_identifier = ?
        ORDER BY question_number
    `;
    const [rows] = await pool.query(query, [examTypeId, round]);
    return rows;
}

async function generateMockExam(examTypeId) {
    const questionRequirements = [
        { type: '단답형', count: 12 },
        { type: '서술형', count: 4 },
        { type: '실무형', count: 2 }
    ];
    const randomOrderClause = 'ORDER BY RAND()';

    let mockExamQuestions = [];
    let messages = [];

    for (const requirement of questionRequirements) {
        const query = `
            SELECT id, question_text, correct_answer, explanation, question_type, round_identifier, question_number
            FROM questions
            WHERE exam_type_id = ? AND question_type = ?
            ${randomOrderClause}
            LIMIT ?;
        `;
        const [rows] = await pool.query(query, [examTypeId, requirement.type, requirement.count]);

        if (rows.length < requirement.count) {
            messages.push(`주의: '${requirement.type}' 유형의 문제가 ${requirement.count}개 필요하지만 ${rows.length}개만 찾았습니다.`);
        }
        mockExamQuestions = mockExamQuestions.concat(rows);
    }

    if (mockExamQuestions.length === 0) {
        throw new Error('모의고사를 생성할 문제를 충분히 찾을 수 없습니다.');
    }
    
    return {
        examTypeId: parseInt(examTypeId),
        totalQuestions: mockExamQuestions.length,
        questions: mockExamQuestions,
        generationMessages: messages.length > 0 ? messages : ['모든 유형의 문제가 요청된 수만큼 정상적으로 포함되었습니다.']
    };
}

module.exports = {
    getExamTypes,
    getRoundsByExamType,
    getQuestions,
    generateMockExam
};