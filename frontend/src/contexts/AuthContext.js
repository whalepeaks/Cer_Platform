import React, { createContext, useState, useContext, useEffect } from 'react';
import { login as loginApi } from '../api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // 초기 로딩 상태 추가

    useEffect(() => {
        try {
            const storedUser = localStorage.getItem('currentUser');
            const token = localStorage.getItem('authToken');
            if (storedUser && token) {
                setUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.error("Failed to parse user from localStorage", error);
        } finally {
            setLoading(false); // 로딩 완료
        }
    }, []);

    const login = async (credentials) => {
        try {
            const response = await loginApi(credentials);
            const { token, userId, username } = response.data;
            const userData = { userId, username };

            localStorage.setItem('authToken', token);
            localStorage.setItem('currentUser', JSON.stringify(userData));
            setUser(userData);
            return { success: true };
        } catch (error) {
            console.error("Login failed:", error);
            const message = error.response?.data?.message || '로그인에 실패했습니다. 아이디 또는 비밀번호를 확인해주세요.';
            return { success: false, message };
        }
    };

    const logout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        setUser(null);
    };

    const value = { user, login, logout, isAuthenticated: !!user, isLoading: loading };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};