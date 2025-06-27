module.exports = {
  apps: [{
    name: 'cer-backend',
    script: 'server.js',

    // --- [가장 핵심적인 설정] ---
    // 이 설정은 PM2에게 "어디서 실행하든, 항상
    // 이 ecosystem.config.js 파일이 있는 폴더('/var/www/html/backend')를
    // 기준으로 server.js를 실행해라" 라고 명시하는 것입니다.
    // 따라서 server.js는 바로 옆에 있는 .env 파일을 항상 찾을 수 있게 됩니다.
    cwd: __dirname,

    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};
