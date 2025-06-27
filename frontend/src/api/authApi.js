import client from './client';

export const login = (credentials) => client.post('/api/auth/login', credentials);
export const register = (userInfo) => client.post('/api/auth/register', userInfo);