import React, { createContext, useState, useContext, useEffect } from 'react';

// 채팅 컨텍스트 생성
const ChatContext = createContext();

// 채팅 컨텍스트 제공자 컴포넌트
export const ChatProvider = ({ children }) => {
    const [messages, setMessages] = useState([]);
    const [isChatActive, setIsChatActive] = useState(false);

    // 가상의 API 응답을 시뮬레이션하는 함수
    const getAIResponse = async (userMessage) => {
        // 실제 구현에서는, 여기서 API를 호출합니다
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    text: `당신의 메시지 "${userMessage}"에 대한 응답입니다. 어떻게 도와드릴까요?`,
                    timestamp: new Date().toISOString()
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
            timestamp: new Date().toISOString()
        };

        // 메시지 목록에 새 메시지 추가
        setMessages(prevMessages => [...prevMessages, newMessage]);

        // 채팅 인터페이스로 전환
        setIsChatActive(true);

        // 사용자 메시지에 대한 AI 응답 처리
        if (isUser) {
            const response = await getAIResponse(text);
            const aiMessage = {
                id: Date.now().toString() + '-ai',
                text: response.text,
                isUser: false,
                timestamp: response.timestamp
            };
            setMessages(prevMessages => [...prevMessages, aiMessage]);
        }
    };

    // 컨텍스트 값 설정
    const value = {
        messages,
        isChatActive,
        addMessage,
        setIsChatActive
    };

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

// 커스텀 훅을 통해 채팅 컨텍스트 사용 간소화
export const useChat = () => {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
}; 