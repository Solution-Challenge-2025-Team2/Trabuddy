import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://3.106.58.224:3000';

// 네트워크 요청 로깅 헬퍼 함수
const logNetworkRequest = async (url, method, headers, body) => {
    console.log('📡 API 요청 ===================');
    console.log(`URL: ${url}`);
    console.log(`Method: ${method}`);
    console.log('Headers:', headers);
    if (body) {
        console.log('Body:', body);
    }
    console.log('==============================');
};

// 네트워크 응답 로깅 헬퍼 함수
const logNetworkResponse = async (url, status, data) => {
    console.log('📡 API 응답 ===================');
    console.log(`URL: ${url}`);
    console.log(`Status: ${status}`);
    console.log('Data:', data);
    console.log('==============================');
};

/**
 * 새로운 채팅 세션을 생성하는 함수
 * @returns {Promise<number>} - 생성된 세션 ID
 */
export const createChatSession = async () => {
    try {
        // JWT 토큰 가져오기
        const token = await AsyncStorage.getItem('access_token');

        if (!token) {
            throw new Error('로그인이 필요합니다');
        }

        const url = `${API_URL}/chat/session`;
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        // 요청 로깅
        await logNetworkRequest(url, 'POST', headers);

        // API 요청
        const response = await fetch(url, {
            method: 'POST',
            headers: headers
        });

        // 응답 처리
        const data = await response.json();

        // 응답 로깅
        await logNetworkResponse(url, response.status, data);

        if (!response.ok) {
            console.error('세션 생성 API 에러:', response.status, data);
            throw new Error(`세션 생성 오류 (${response.status}): ${data.message || '알 수 없는 오류'}`);
        }

        // 세션 ID를 로컬 스토리지에 저장
        await AsyncStorage.setItem('current_session_id', data.sessionId.toString());

        console.log('채팅 세션 생성 성공:', data.sessionId);
        return data.sessionId;

    } catch (error) {
        console.error('채팅 세션 생성 오류:', error);
        throw error;
    }
};

/**
 * 로그인된 사용자의 메시지를 서버로 전송하고 응답을 받아오는 함수
 * @param {string} message - 사용자가 입력한 메시지
 * @returns {Promise<string>} - AI 응답
 */
export const sendChatMessage = async (message) => {
    try {
        // JWT 토큰 가져오기
        const token = await AsyncStorage.getItem('access_token');

        if (!token) {
            throw new Error('로그인이 필요합니다');
        }

        // 현재 세션 ID 가져오기
        let sessionId = await AsyncStorage.getItem('current_session_id');

        // 세션 ID가 없다면 새로 생성
        if (!sessionId) {
            try {
                sessionId = await createChatSession();
            } catch (error) {
                console.error('세션 생성 실패, 기본값 사용:', error);
                sessionId = '1'; // 기본값
            }
        }

        const url = `${API_URL}/chat/session/${sessionId}`;
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
        const body = { message };

        // 요청 로깅
        await logNetworkRequest(url, 'POST', headers, body);

        // API 요청
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
        });

        // 응답 처리
        const data = await response.json();

        // 응답 로깅
        await logNetworkResponse(url, response.status, data);

        if (!response.ok) {
            console.error('API 에러:', response.status, data);
            throw new Error(`API 오류 (${response.status}): ${data.message || '알 수 없는 오류'}`);
        }

        return data.response;

    } catch (error) {
        console.error('채팅 메시지 전송 오류:', error);
        throw error;
    }
}; 