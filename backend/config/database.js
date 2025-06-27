const mysql = require('mysql2/promise');
require('dotenv').config(); // .env 파일을 읽기 위해 추가

const dbConfig = {
    host: process.env.DB_HOST, 
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    charset: 'utf8mb4',
    timezone: '+09:00',
    // 여러 쿼리를 동시에 처리할 수 있도록 connectionLimit을 추가하는 것이 좋습니다.
    connectionLimit: 10
};

// mysql.createPool은 내부적으로 커넥션을 관리해주어 더 효율적이고 안전합니다.
const pool = mysql.createPool(dbConfig);

// 다른 파일에서 이 pool을 가져다 쓸 수 있도록 내보냅니다.
module.exports = pool;