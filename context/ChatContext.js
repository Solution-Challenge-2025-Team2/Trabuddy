import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendChatMessage, createChatSession } from "../services/chatService";
import { Alert } from "react-native";

// 채팅 컨텍스트 생성
const ChatContext = createContext();

// 채팅 컨텍스트 제공자 컴포넌트
export const ChatProvider = ({ children }) => {
    const [messages, setMessages] = useState([]);
    const [isChatActive, setIsChatActive] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [currentSessionId, setCurrentSessionId] = useState(null);

    // 컴포넌트 마운트 시 로그인 상태와 세션 ID 확인
    useEffect(() => {
        const initialize = async () => {
            await checkLoginStatus();
            await checkSessionId();
        };

        initialize();
    }, []);

    // 로그인 상태 확인 함수
    const checkLoginStatus = async () => {
        try {
            const token = await AsyncStorage.getItem('access_token');
            const loggedIn = !!token;
            setIsLoggedIn(loggedIn);

            return loggedIn;
        } catch (error) {
            console.error('로그인 상태 확인 오류:', error);
            return false;
        }
    };

    // 세션 ID 확인 함수
    const checkSessionId = async () => {
        try {
            const sessionId = await AsyncStorage.getItem('current_session_id');

            if (sessionId) {
                setCurrentSessionId(sessionId);
                console.log('현재 세션 ID:', sessionId);
            } else {
                const isLoggedIn = await checkLoginStatus();

                // 로그인 상태이지만 세션 ID가 없는 경우 새로운 세션 생성 시도
                if (isLoggedIn) {
                    try {
                        const newSessionId = await createChatSession();
                        setCurrentSessionId(newSessionId);
                    } catch (error) {
                        console.error('세션 생성 실패:', error);
                    }
                }
            }
        } catch (error) {
            console.error('세션 ID 확인 오류:', error);
        }
    };

    // 가상의 API 응답을 시뮬레이션하는 함수 (비로그인 상태용)
    const getLocalAIResponse = async (userMessage) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    text: `비로그인 상태입니다. 로그인하시면 더 정확한 답변을 받을 수 있습니다.\n\n임시 응답: "${userMessage}"에 대한 응답입니다.`,
                    timestamp: new Date().toISOString(),
                });
            }, 1000);
        });
    };

    // 새 메시지를 추가하는 함수
    const addMessage = async (text, isUser = true) => {
        if (!text.trim()) return;

        const newMessage = {
            id: Date.now().toString(),
            text,
            isUser,
            timestamp: new Date().toISOString(),
        };

        // 메시지 목록에 새 메시지 추가
        setMessages((prevMessages) => [...prevMessages, newMessage]);

        // 채팅 인터페이스로 전환
        setIsChatActive(true);

        // 사용자 메시지에 대한 AI 응답 처리
        if (isUser) {
            setIsLoading(true);

            try {
                let responseText;

                // 로그인 상태에 따라 다른 API 호출
                if (isLoggedIn) {
                    // 로그인 상태: 실제 백엔드 API 호출
                    responseText = await sendChatMessage(text);

                    // responseText가 문자열이 아닌 객체인 경우에도 처리 가능
                    console.log('서버 응답:', typeof responseText, responseText);

                    // 응답 이후 현재 세션 ID 업데이트 (API 호출 중 세션이 생성될 수 있으므로)
                    const sessionId = await AsyncStorage.getItem('current_session_id');
                    if (sessionId && sessionId !== currentSessionId) {
                        setCurrentSessionId(sessionId);
                    }
                } else {
                    // 비로그인 상태: 로컬 응답 생성
                    const response = await getLocalAIResponse(text);
                    responseText = response.text;
                }

                // AI 응답 메시지 생성
                const aiMessage = {
                    id: Date.now().toString() + "-ai",
                    text: responseText, // 객체 또는 문자열이 될 수 있음
                    isUser: false,
                    timestamp: new Date().toISOString(),
                };

                // 메시지 목록에 AI 응답 추가
                setMessages((prevMessages) => [...prevMessages, aiMessage]);
            } catch (error) {
                console.error('AI 응답 처리 오류:', error);

                // 오류 메시지 표시
                Alert.alert(
                    "오류",
                    `메시지 처리 중 문제가 발생했습니다: ${error.message}`,
                    [{ text: "확인" }]
                );

                // 오류 메시지를 채팅창에 표시
                const errorMessage = {
                    id: Date.now().toString() + "-error",
                    text: "죄송합니다. 응답을 가져오는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
                    isUser: false,
                    isError: true,
                    timestamp: new Date().toISOString(),
                };

                setMessages((prevMessages) => [...prevMessages, errorMessage]);
            } finally {
                setIsLoading(false);
            }
        }
    };

    // 채팅을 초기화하는 함수
    const resetChat = async () => {
        // 메시지 초기화 및 채팅 인터페이스 비활성화
        setMessages([]);
        setIsChatActive(false);

        // 로그인 상태 확인
        const isCurrentlyLoggedIn = await checkLoginStatus();

        // 로그인 상태에 따라 다르게 처리
        if (isCurrentlyLoggedIn) {
            try {
                // 새 세션 생성 시작
                setIsLoading(true);
                console.log('새 채팅 세션 생성 중...');

                // 기존 세션 ID 제거
                await AsyncStorage.removeItem('current_session_id');
                setCurrentSessionId(null);

                // 새 세션 생성
                const newSessionId = await createChatSession();
                setCurrentSessionId(newSessionId);
                console.log('새 채팅 세션 생성 완료:', newSessionId);
            } catch (error) {
                console.error('새 세션 생성 실패:', error);
                Alert.alert(
                    "알림",
                    "새 채팅 세션 생성 중 문제가 발생했습니다.",
                    [{ text: "확인" }]
                );
            } finally {
                setIsLoading(false);
            }
        } else {
            // 비로그인 상태일 때는 세션 ID 초기화만 진행
            await AsyncStorage.removeItem('current_session_id');
            setCurrentSessionId(null);
            console.log('비로그인 상태 - 채팅만 초기화됨');
        }
    };

    // 컨텍스트 값 설정
    const value = {
        messages,
        isChatActive,
        isLoading,
        currentSessionId,
        addMessage,
        setIsChatActive,
        resetChat,
        isLoggedIn,
    };

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

// 커스텀 훅을 통해 채팅 컨텍스트 사용 간소화
export const useChat = () => {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error("useChat must be used within a ChatProvider");
    }
    return context;
};
