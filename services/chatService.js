import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://3.106.58.224:3000';

// Network request logging helper function
const logNetworkRequest = async (url, method, headers, body) => {
    console.log('📡 API Request ===================');
    console.log(`URL: ${url}`);
    console.log(`Method: ${method}`);
    console.log('Headers:', headers);
    if (body) {
        console.log('Body:', body);
    }
    console.log('==============================');
};

// Network response logging helper function
const logNetworkResponse = async (url, status, data) => {
    console.log('📡 API Response ===================');
    console.log(`URL: ${url}`);
    console.log(`Status: ${status}`);
    console.log('Data:', data);
    console.log('==============================');
};

/**
 * Function to create a new chat session
 * @returns {Promise<number>} - The created session ID
 */
export const createChatSession = async () => {
    try {
        console.log('createChatSession: 새 세션 생성 시작');

        // Get JWT token
        const token = await AsyncStorage.getItem('access_token');
        console.log('createChatSession: 토큰 존재 여부:', !!token);

        if (!token) {
            console.error('createChatSession: 토큰 없음 - 로그인 필요');
            throw new Error('Login required');
        }

        const url = `${API_URL}/chat/session`;
        console.log('createChatSession: API 요청 URL:', url);

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        // Log request
        await logNetworkRequest(url, 'POST', headers);

        // API request
        console.log('createChatSession: API 요청 전송 중...');
        const response = await fetch(url, {
            method: 'POST',
            headers: headers
        });
        console.log('createChatSession: API 응답 상태 코드:', response.status);

        // Process response
        const data = await response.json();

        // Log response
        await logNetworkResponse(url, response.status, data);

        if (!response.ok) {
            console.error('Session creation API error:', response.status, data);
            throw new Error(`Session creation error (${response.status}): ${data.message || 'Unknown error'}`);
        }

        // Save session ID to local storage
        await AsyncStorage.setItem('current_session_id', data.sessionId.toString());
        console.log('createChatSession: 새 세션 ID 저장됨:', data.sessionId);

        console.log('createChatSession: 세션 생성 완료');
        return data.sessionId;

    } catch (error) {
        console.error('createChatSession: 세션 생성 오류:', error);
        throw error;
    }
};

/**
 * Function to send a message from logged-in user to the server and get a response
 * @param {string} message - User input message
 * @returns {Promise<string>} - AI response
 */
export const sendChatMessage = async (message) => {
    try {
        console.log('chatService: 메시지 전송 시작', message.substring(0, 30) + (message.length > 30 ? '...' : ''));

        // Get JWT token
        const token = await AsyncStorage.getItem('access_token');
        console.log('chatService: 토큰 존재 여부:', !!token);

        if (!token) {
            console.error('chatService: 토큰 없음 - 로그인 필요');
            throw new Error('Login required');
        }

        // Get current session ID
        let sessionId = await AsyncStorage.getItem('current_session_id');
        console.log('chatService: 현재 세션ID:', sessionId || 'null');

        // Create new session if session ID doesn't exist
        if (!sessionId) {
            try {
                console.log('chatService: 세션ID가 없어 새 세션을 생성합니다');
                sessionId = await createChatSession();
                console.log('chatService: 새 세션 생성 완료:', sessionId);
            } catch (error) {
                console.error('chatService: 세션 생성 실패:', error);
                throw new Error('Failed to create chat session');
            }
        }

        const url = `${API_URL}/chat/session/${sessionId}`;
        console.log('chatService: API 요청 URL:', url);

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
        const body = { message };

        // Log request
        await logNetworkRequest(url, 'POST', headers, body);

        // API request
        console.log('chatService: API 요청 전송 중...');
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
        });
        console.log('chatService: API 응답 상태 코드:', response.status);

        // Process response
        const data = await response.json();

        // Log response
        await logNetworkResponse(url, response.status, data);

        if (!response.ok) {
            console.error('API error:', response.status, data);
            throw new Error(`API error (${response.status}): ${data.message || 'Unknown error'}`);
        }

        console.log('chatService: 메시지 전송 성공');

        // 응답 형식 확인 및 처리
        if (data.response && typeof data.response === 'object') {
            console.log('chatService: 서버에서 복합 응답 객체를 반환했습니다');
            console.log('chatService: 응답 객체 키:', Object.keys(data.response));
            // 전체 응답 객체 반환
            return data.response;
        } else {
            // 기존 방식 유지
            return data.response;
        }

    } catch (error) {
        console.error('chatService: 메시지 전송 오류:', error);
        throw error;
    }
};

/**
 * Function to send a message from a guest (non-logged in user) to the server
 * @param {string} message - User input message
 * @returns {Promise<string>} - AI response
 */
export const sendGuestChatMessage = async (message) => {
    try {
        console.log('Guest Chat API: 게스트 메시지 전송 시작', message.substring(0, 30) + (message.length > 30 ? '...' : ''));

        const url = `${API_URL}/chat/guest`;
        console.log('Guest Chat API: 요청 URL:', url);

        const headers = {
            'Content-Type': 'application/json'
        };
        const body = { message };

        // Log request
        await logNetworkRequest(url, 'POST', headers, body);

        // API request
        console.log('Guest Chat API: 요청 전송 중...');
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
        });
        console.log('Guest Chat API: 응답 상태 코드:', response.status);

        // Process response
        const data = await response.json();

        // Log response
        await logNetworkResponse(url, response.status, data);

        if (!response.ok) {
            console.error('Guest Chat API 오류:', response.status, data);
            throw new Error(`API error (${response.status}): ${data.message || 'Unknown error'}`);
        }

        console.log('Guest Chat API: 메시지 전송 성공');

        // 응답 형식 확인 및 처리
        if (data.response && typeof data.response === 'object') {
            console.log('Guest Chat API: 서버에서 복합 응답 객체를 반환했습니다');
            console.log('Guest Chat API: 응답 객체 키:', Object.keys(data.response));
            // 전체 응답 객체 반환
            return data.response;
        } else {
            // 기존 방식 유지
            return data.response;
        }

    } catch (error) {
        console.error('Guest Chat API: 메시지 전송 오류:', error);
        throw error;
    }
}; 