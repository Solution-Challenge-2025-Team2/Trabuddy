import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendChatMessage, createChatSession } from "../services/chatService";
import { Alert } from "react-native";

// Create chat context
const ChatContext = createContext();

// Chat context provider component
export const ChatProvider = ({ children }) => {
    const [messages, setMessages] = useState([]);
    const [isChatActive, setIsChatActive] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [currentSessionId, setCurrentSessionId] = useState(null);

    // Check login status and session ID on component mount
    useEffect(() => {
        const initialize = async () => {
            await checkLoginStatus();
            await checkSessionId();
        };

        initialize();
    }, []);

    // Check login status function
    const checkLoginStatus = async () => {
        try {
            console.log('checkLoginStatus 함수 호출됨');
            const token = await AsyncStorage.getItem('access_token');
            console.log('checkLoginStatus - 토큰 존재 여부:', !!token);

            // 토큰 유효성 간단 검사 (최소한의 형식 검사)
            const isValidToken = token && token.trim() !== '' && token.includes('.');
            console.log('checkLoginStatus - 토큰 유효성 검사:', isValidToken);

            // 로그인 상태 업데이트
            const wasLoggedIn = isLoggedIn;
            const shouldBeLoggedIn = !!isValidToken;

            if (wasLoggedIn !== shouldBeLoggedIn) {
                console.log('checkLoginStatus - 로그인 상태 변경:', wasLoggedIn, '->', shouldBeLoggedIn);
                setIsLoggedIn(shouldBeLoggedIn);
            } else {
                console.log('checkLoginStatus - 로그인 상태 유지:', shouldBeLoggedIn);
            }

            return shouldBeLoggedIn;
        } catch (error) {
            console.error('Error checking login status:', error);
            // 오류 발생 시 로그아웃 상태로 설정
            if (isLoggedIn) {
                setIsLoggedIn(false);
                console.log('checkLoginStatus - 오류로 인해 로그아웃 상태로 설정');
            }
            return false;
        }
    };

    // Check session ID function
    const checkSessionId = async () => {
        try {
            const sessionId = await AsyncStorage.getItem('current_session_id');

            if (sessionId) {
                setCurrentSessionId(sessionId);
                console.log('Current session ID:', sessionId);
                return sessionId;
            } else {
                const isLoggedIn = await checkLoginStatus();

                // 로그인한 상태에서 세션이 없는 경우에만 새 세션 생성
                if (isLoggedIn) {
                    try {
                        // 로그인 직후에는 불필요한 세션 생성을 방지하기 위해 
                        // 첫 메시지 전송 시까지 세션 생성을 지연
                        console.log('로그인 상태지만 세션ID가 없습니다. 채팅 시작 시 생성됩니다.');
                        return null;
                    } catch (error) {
                        console.error('Failed to create session:', error);
                        return null;
                    }
                }
                return null;
            }
        } catch (error) {
            console.error('Error checking session ID:', error);
            return null;
        }
    };

    // Simulate API response function (for non-logged in state)
    const getLocalAIResponse = async (userMessage) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    text: `You are not logged in. Please log in for more accurate responses.\n\nTemporary response: Here is a reply to "${userMessage}".`,
                    timestamp: new Date().toISOString(),
                });
            }, 1000);
        });
    };

    // Add new message function
    const addMessage = async (text, isUser = true) => {
        if (!text.trim()) return;

        // 디버깅: 현재 상태 확인
        console.log('메시지 전송 시작 -------------------');
        console.log('입력된 메시지:', text.substring(0, 30) + (text.length > 30 ? '...' : ''));
        console.log('isLoggedIn 상태:', isLoggedIn);
        console.log('현재 세션ID:', currentSessionId || 'null');

        // 토큰 상태 확인
        const token = await AsyncStorage.getItem('access_token');
        console.log('저장된 토큰:', token ? '있음' : '없음');

        const newMessage = {
            id: Date.now().toString(),
            text,
            isUser,
            timestamp: new Date().toISOString(),
        };

        // Add new message to message list
        setMessages((prevMessages) => [...prevMessages, newMessage]);

        // Switch to chat interface
        setIsChatActive(true);

        // Process AI response to user message
        if (isUser) {
            setIsLoading(true);

            try {
                let responseText;

                // Different API calls based on login status
                if (isLoggedIn) {
                    console.log('로그인 상태로 메시지 처리 중...');

                    // Logged in: Call actual backend API
                    responseText = await sendChatMessage(text);

                    // Handle case where responseText is an object, not a string
                    console.log('서버 응답 타입:', typeof responseText);
                    if (typeof responseText === 'object') {
                        console.log('응답 객체 키:', Object.keys(responseText));
                    }

                    // Update current session ID after response (session might be created during API call)
                    const sessionId = await AsyncStorage.getItem('current_session_id');
                    console.log('API 호출 후 세션ID:', sessionId || 'null');
                    if (sessionId && sessionId !== currentSessionId) {
                        console.log('세션ID 업데이트됨:', currentSessionId, '->', sessionId);
                        setCurrentSessionId(sessionId);
                    }
                } else {
                    console.log('비로그인 상태 - 로컬 응답 생성 중...');

                    // Not logged in: Generate local response
                    const response = await getLocalAIResponse(text);
                    responseText = response.text;
                }

                // Create AI response message
                const aiMessage = {
                    id: Date.now().toString() + "-ai",
                    text: responseText, // Could be object or string
                    isUser: false,
                    timestamp: new Date().toISOString(),
                };

                // Add AI response to message list
                setMessages((prevMessages) => [...prevMessages, aiMessage]);
            } catch (error) {
                console.error('Error processing AI response:', error);

                // Display error message
                Alert.alert(
                    "Error",
                    `Problem occurred while processing message: ${error.message}`,
                    [{ text: "OK" }]
                );

                // Show error message in chat
                const errorMessage = {
                    id: Date.now().toString() + "-error",
                    text: "Sorry, there was a problem retrieving the response. Please try again later.",
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

    // Reset chat function
    const resetChat = async () => {
        // Reset messages and deactivate chat interface
        setMessages([]);
        setIsChatActive(false);

        // Check login status
        const isCurrentlyLoggedIn = await checkLoginStatus();

        // Handle differently based on login status
        if (isCurrentlyLoggedIn) {
            try {
                // Start creating new session
                setIsLoading(true);
                console.log('Creating new chat session...');

                // Remove existing session ID
                await AsyncStorage.removeItem('current_session_id');
                setCurrentSessionId(null);

                // Create new session
                const newSessionId = await createChatSession();
                setCurrentSessionId(newSessionId);
                console.log('New chat session created:', newSessionId);
            } catch (error) {
                console.error('Failed to create new session:', error);
                Alert.alert(
                    "Notice",
                    "There was a problem creating a new chat session.",
                    [{ text: "OK" }]
                );
            } finally {
                setIsLoading(false);
            }
        } else {
            // When not logged in, only reset session ID
            await AsyncStorage.removeItem('current_session_id');
            setCurrentSessionId(null);
            console.log('Not logged in - only reset chat');
        }
    };

    // Clear chat messages without creating a new session
    const clearChatOnly = async () => {
        // 기존 메시지 초기화
        setMessages([]);

        // 로그인 후 세션 ID가 있는지 확인
        const sessionId = await AsyncStorage.getItem('current_session_id');
        console.log('clearChatOnly - 세션ID 확인:', sessionId || 'null');

        if (sessionId) {
            try {
                // 현재 세션 ID 설정
                setCurrentSessionId(sessionId);
                console.log('clearChatOnly - 세션ID 설정됨:', sessionId);

                // 토큰 확인
                const token = await AsyncStorage.getItem('access_token');
                if (!token) {
                    console.error('clearChatOnly - 토큰이 없습니다.');
                    setIsChatActive(false);
                    return;
                }

                // 해당 세션의 채팅 내역 불러오기
                setIsLoading(true);
                console.log('clearChatOnly - 채팅 내역 불러오는 중...');

                // API 호출하여 채팅 내역 가져오기
                const response = await fetch(`http://3.106.58.224:3000/chat/session/${sessionId}/history`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                const data = await response.json();
                console.log('clearChatOnly - 채팅 내역 응답:', data);

                if (response.ok && data.sessionHistory) {
                    // 서버 응답 구조 디버깅
                    console.log('clearChatOnly - 첫 번째 메시지 구조:',
                        data.sessionHistory.length > 0 ? JSON.stringify(data.sessionHistory[0]) : '메시지 없음');

                    // 서버의 전체 응답 구조 확인
                    console.log('clearChatOnly - 서버 응답 키:', Object.keys(data));

                    // 채팅 내역이 있으면 메시지 배열로 변환하여 설정
                    const chatHistory = data.sessionHistory.map(msg => {
                        // 디버깅: 메시지별 속성 확인
                        console.log('메시지 속성:', Object.keys(msg));

                        // 메시지가 JSON 문자열인지 확인
                        let messageObj = null;
                        try {
                            if (typeof msg.message === 'string' &&
                                (msg.message.startsWith('{') ||
                                    msg.message.includes('image_url') ||
                                    msg.message.includes('imageURL'))) {
                                messageObj = JSON.parse(msg.message);
                                console.log('JSON 메시지 파싱됨:', Object.keys(messageObj));
                            }
                        } catch (e) {
                            console.log('JSON 파싱 실패, 일반 텍스트로 처리:', e.message);
                        }

                        // 이미지 URL 찾기 - 다양한 속성명 지원
                        let imageUrl = null;
                        const imgProps = ['image_url', 'imageURL', 'imageUrl', 'image', 'img', 'img_url'];

                        // 메시지 객체에서 이미지 URL 찾기
                        if (messageObj) {
                            for (const prop of imgProps) {
                                if (messageObj[prop]) {
                                    imageUrl = messageObj[prop];
                                    console.log(`파싱된 객체에서 이미지 URL 찾음 (${prop}):`, imageUrl);
                                    break;
                                }
                            }
                        }

                        // 메시지 자체에서 이미지 URL 찾기
                        if (!imageUrl) {
                            for (const prop of imgProps) {
                                if (msg[prop]) {
                                    imageUrl = msg[prop];
                                    console.log(`메시지에서 이미지 URL 찾음 (${prop}):`, imageUrl);
                                    break;
                                }
                            }
                        }

                        // 이미지 URL이 있는 경우
                        if (imageUrl) {
                            return {
                                id: msg.id.toString(),
                                text: {
                                    answer: messageObj ?
                                        (messageObj.answer || messageObj.text || messageObj.message || msg.message) :
                                        msg.message,
                                    image_url: imageUrl,
                                    category: messageObj ? messageObj.category : msg.category
                                },
                                isUser: msg.role === 'user',
                                timestamp: msg.createdAt
                            };
                        }

                        // 일반 텍스트 메시지
                        return {
                            id: msg.id.toString(),
                            text: msg.message,
                            isUser: msg.role === 'user',
                            timestamp: msg.createdAt
                        };
                    });

                    // 변환된 첫 번째 메시지 로깅
                    if (chatHistory.length > 0) {
                        console.log('clearChatOnly - 변환된 첫 메시지:',
                            JSON.stringify(chatHistory[0]).substring(0, 200));
                    }

                    // 채팅 내역이 있으면 메시지 설정 및 채팅 활성화
                    if (chatHistory.length > 0) {
                        console.log('clearChatOnly - 채팅 내역 로드 완료:', chatHistory.length, '개 메시지');
                        setMessages(chatHistory);
                        setIsChatActive(true);
                    } else {
                        console.log('clearChatOnly - 채팅 내역이 없습니다.');
                        setIsChatActive(false);
                    }
                } else {
                    console.log('clearChatOnly - 채팅 내역을 가져오는데 실패했습니다.');
                    setIsChatActive(false);
                }
            } catch (error) {
                console.error('clearChatOnly - 채팅 내역 로드 오류:', error);
                setIsChatActive(false);
            } finally {
                setIsLoading(false);
            }
        } else {
            // 세션 ID가 없으면 채팅 인터페이스 비활성화
            console.log('clearChatOnly - 세션ID가 없어 채팅이 초기화되었습니다.');
            setIsChatActive(false);
        }
    };

    // Set context value
    const value = {
        messages,
        isChatActive,
        isLoading,
        currentSessionId,
        addMessage,
        setIsChatActive,
        resetChat,
        clearChatOnly,
        isLoggedIn,
        setCurrentSessionId,
        setIsLoggedIn,
    };

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

// Custom hook to simplify chat context usage
export const useChat = () => {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error("useChat must be used within a ChatProvider");
    }
    return context;
};
