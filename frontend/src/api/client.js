import axios from 'axios';
// 1. Axios 인스턴스 생성
const client = axios.create({
    baseURL: process.env.REACT_APP_BACKEND_URL, // .env 파일의 백엔드 주소
    headers: {
        'Content-Type': 'application/json',
    }
});
// 2. 요청 인터셉터(interceptor) 설정
//    모든 API 요청이 보내지기 전에, localStorage에서 토큰을 가져와 헤더에 추가합니다.
client.interceptors.request.use(
    config => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);
export default client;