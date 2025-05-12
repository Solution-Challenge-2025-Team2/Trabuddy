import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    RefreshControl,
    SafeAreaView,
    Image,
    Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Frame from "../Frame";
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useChat } from '../context/ChatContext';

// 채팅 내역 상세보기 컴포넌트
const ChatHistoryScreen = ({ visible, sessionId, onClose }) => {
    const [chatHistory, setChatHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (visible && sessionId) {
            fetchChatHistory();
        }
    }, [visible, sessionId]);

    const fetchChatHistory = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('access_token');

            if (!token) {
                Alert.alert('Error', 'Login required');
                onClose();
                return;
            }

            const response = await fetch(`http://3.106.58.224:3000/chat/session/${sessionId}/history`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch chat history');
            }

            setChatHistory(data.sessionHistory || []);
        } catch (error) {
            console.error('Error fetching chat history:', error);
            Alert.alert('Error', 'There was a problem loading chat history');
        } finally {
            setLoading(false);
        }
    };

    // 메시지 날짜 포맷
    const formatMessageDate = (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }).format(date);
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={false}
            onRequestClose={onClose}
        >
            <LinearGradient
                colors={['#B2E4FF', '#FFFFFF']}
                style={styles.gradient}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 0.8 }}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={onClose}
                        >
                            <Ionicons name="chevron-back" size={30} color="#000" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Chat History</Text>
                        <View style={styles.spacer} />
                    </View>

                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#40ABE5" />
                            <Text style={styles.loadingText}>Loading chat history...</Text>
                        </View>
                    ) : (
                        <ScrollView
                            style={styles.chatHistoryScrollView}
                            contentContainerStyle={styles.chatHistoryContent}
                        >
                            {chatHistory.length === 0 ? (
                                <View style={styles.emptyContainer}>
                                    <Text style={styles.emptyTitle}>No chat history</Text>
                                </View>
                            ) : (
                                chatHistory.map((message) => (
                                    <View
                                        key={message.id}
                                        style={[
                                            styles.messageBubble,
                                            message.role === 'user' ? styles.userMessage : styles.aiMessage
                                        ]}
                                    >
                                        <View style={styles.messageHeader}>
                                            <Text style={styles.messageRole}>
                                                {message.role === 'user' ? 'Me' : 'TraBuddy'}
                                            </Text>
                                            <Text style={styles.messageTime}>
                                                {formatMessageDate(message.createdAt)}
                                            </Text>
                                        </View>
                                        <Text style={styles.messageText}>{message.message}</Text>
                                        {(message.imageURL || message.image_url) && (
                                            <View style={styles.imageContainer}>
                                                <Image
                                                    source={{ uri: message.imageURL || message.image_url }}
                                                    style={styles.messageImage}
                                                    resizeMode="cover"
                                                    onError={(e) => console.log('Image loading error:', e.nativeEvent.error)}
                                                />
                                            </View>
                                        )}
                                        {message.category && (
                                            <View style={styles.categoryTag}>
                                                <Text style={styles.categoryText}>{message.category}</Text>
                                            </View>
                                        )}
                                    </View>
                                ))
                            )}
                        </ScrollView>
                    )}
                </SafeAreaView>
            </LinearGradient>
        </Modal>
    );
};

export default function PreviousChatScreen() {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [currentSessionId, setCurrentSessionId] = useState(null);
    const [selectedSessionId, setSelectedSessionId] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [deletingSessionId, setDeletingSessionId] = useState(null);
    const navigation = useNavigation();
    const { resetChat } = useChat();

    useEffect(() => {
        fetchCurrentSessionId();
        fetchSessions();
    }, []);

    const fetchCurrentSessionId = async () => {
        try {
            const sessionId = await AsyncStorage.getItem('current_session_id');
            setCurrentSessionId(sessionId);
        } catch (error) {
            console.error('Error fetching session ID:', error);
        }
    };

    const fetchSessions = async () => {
        setLoading(true);
        try {
            // 토큰 가져오기
            const token = await AsyncStorage.getItem('access_token');

            if (!token) {
                Alert.alert('Error', 'Login required');
                navigation.navigate('Login');
                return;
            }

            // API 요청
            const response = await fetch('http://3.106.58.224:3000/chat/sessions', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            // 응답 처리
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch session list');
            }

            // 세션 데이터 설정
            setSessions(data.sessions || []);
        } catch (error) {
            console.error('Error fetching session list:', error);
            Alert.alert('Error', 'There was a problem loading chat history');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchCurrentSessionId();
        fetchSessions();
    };

    // 날짜 포맷팅 함수
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        // 24시간 이내면 "오늘", 어제면 "어제", 그 이외는 날짜 표시
        if (diffDays === 0) {
            return `Today ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        } else if (diffDays === 1) {
            return `Yesterday ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        } else {
            return new Intl.DateTimeFormat('en-US', {
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }).format(date);
        }
    };

    // 세션 상세 내역 열기
    const openSessionDetail = (sessionId) => {
        setSelectedSessionId(sessionId);
        setModalVisible(true);
    };

    // 세션 상세 내역 닫기
    const closeSessionDetail = () => {
        setModalVisible(false);
        setSelectedSessionId(null);
    };

    // Delete session function
    const deleteSession = async (sessionId) => {
        try {
            setDeletingSessionId(sessionId);

            // Get token
            const token = await AsyncStorage.getItem('access_token');

            if (!token) {
                Alert.alert('Error', 'Login required');
                return;
            }

            // API request
            const response = await fetch(`http://3.106.58.224:3000/chat/session/${sessionId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to delete session');
            }

            // Remove deleted session from state
            setSessions(prevSessions =>
                prevSessions.filter(session => session.id !== sessionId)
            );

            // Show success message
            Alert.alert('Success', 'Chat session deleted successfully');

        } catch (error) {
            console.error('Error deleting session:', error);
            Alert.alert('Error', 'Failed to delete chat session');
        } finally {
            setDeletingSessionId(null);
        }
    };

    // Handle delete button press
    const handleDeletePress = (e, sessionId) => {
        e.stopPropagation(); // Prevent session card click event

        Alert.alert(
            'Delete Chat',
            'Are you sure you want to delete this chat session?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel'
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => deleteSession(sessionId)
                }
            ]
        );
    };

    // 현재 세션을 제외한 이전 채팅 세션만 필터링
    const filteredSessions = sessions.filter(
        session => session.id.toString() !== currentSessionId
    );

    return (
        <LinearGradient
            colors={['#B2E4FF', '#FFFFFF']}
            style={styles.gradient}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.8 }}
        >
            <Frame>
                <SafeAreaView style={styles.container}>
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Ionicons name="chevron-back" size={30} color="#000" />
                        </TouchableOpacity>
                        <Text style={styles.title}>Previous Chats</Text>
                        <View style={styles.spacer} />
                    </View>

                    {loading && !refreshing ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#40ABE5" />
                            <Text style={styles.loadingText}>Loading chat history...</Text>
                        </View>
                    ) : (
                        <ScrollView
                            style={styles.scrollView}
                            contentContainerStyle={styles.scrollViewContent}
                            refreshControl={
                                <RefreshControl
                                    refreshing={refreshing}
                                    onRefresh={onRefresh}
                                    colors={['#40ABE5']}
                                    tintColor="#40ABE5"
                                />
                            }
                        >
                            {filteredSessions.length === 0 ? (
                                <View style={styles.emptyContainer}>
                                    <Ionicons name="chatbubbles-outline" size={80} color="#B2E4FF" />
                                    <Text style={styles.emptyTitle}>No Chat History</Text>
                                    <Text style={styles.emptyText}>
                                        You don't have any previous chats yet.{'\n'}
                                        Start a chat to build your conversation history.
                                    </Text>
                                </View>
                            ) : (
                                filteredSessions.map((session) => (
                                    <TouchableOpacity
                                        key={session.id}
                                        style={styles.sessionCard}
                                        activeOpacity={0.7}
                                        onPress={() => openSessionDetail(session.id)}
                                    >
                                        <View style={styles.sessionHeader}>
                                            <View style={styles.sessionInfo}>
                                                <Ionicons name="chatbubbles" size={26} color="#40ABE5" style={styles.sessionIcon} />
                                                <Text style={styles.sessionTitle}>
                                                    {session.title || `Chat ${session.id}`}
                                                </Text>
                                            </View>
                                            <View style={styles.actionsContainer}>
                                                {deletingSessionId === session.id ? (
                                                    <ActivityIndicator size="small" color="#F03E3E" />
                                                ) : (
                                                    <TouchableOpacity
                                                        onPress={(e) => handleDeletePress(e, session.id)}
                                                        style={styles.deleteButton}
                                                    >
                                                        <Ionicons name="trash-outline" size={22} color="#F03E3E" />
                                                    </TouchableOpacity>
                                                )}
                                                <Ionicons name="chevron-forward" size={22} color="#40ABE5" />
                                            </View>
                                        </View>
                                        <Text style={styles.sessionDate}>
                                            {formatDate(session.createdAt)}
                                        </Text>
                                    </TouchableOpacity>
                                ))
                            )}
                        </ScrollView>
                    )}

                    {/* 채팅 내역 상세 모달 */}
                    <ChatHistoryScreen
                        visible={modalVisible}
                        sessionId={selectedSessionId}
                        onClose={closeSessionDetail}
                    />
                </SafeAreaView>
            </Frame>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    gradient: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    backButton: {
        padding: 5,
    },
    title: {
        fontFamily: 'OriginalSurfer',
        fontSize: 24,
        color: '#000',
        textShadowColor: "#89D6FF",
        textShadowOffset: { width: 0, height: 2 },
        textShadowOpacity: 0.3,
        textShadowRadius: 3,
    },
    spacer: {
        width: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#555',
        fontFamily: 'Outfit',
    },
    scrollView: {
        flex: 1,
    },
    scrollViewContent: {
        paddingHorizontal: 16,
        paddingBottom: 24,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
    },
    emptyTitle: {
        marginTop: 16,
        fontSize: 24,
        color: '#333',
        fontFamily: 'Outfit',
        fontWeight: '600',
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
        fontFamily: 'Outfit',
        textAlign: 'center',
        lineHeight: 24,
    },
    sessionCard: {
        backgroundColor: '#F6FEFF',
        borderRadius: 12,
        padding: 16,
        marginVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#E5F6FF',
    },
    sessionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    sessionInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sessionIcon: {
        marginRight: 8,
    },
    sessionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#00527E',
        fontFamily: 'Outfit',
    },
    sessionDate: {
        fontSize: 14,
        color: '#666',
        fontFamily: 'Outfit',
        marginTop: 4,
        marginLeft: 34,  // 아이콘 width + marginRight와 비슷하게
    },

    // 모달 스타일
    modalContainer: {
        flex: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    modalTitle: {
        fontFamily: 'OriginalSurfer',
        fontSize: 24,
        color: '#000',
        textShadowColor: "#89D6FF",
        textShadowOffset: { width: 0, height: 2 },
        textShadowOpacity: 0.3,
        textShadowRadius: 3,
    },
    chatHistoryScrollView: {
        flex: 1,
    },
    chatHistoryContent: {
        padding: 16,
        paddingBottom: 40,
    },
    messageBubble: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        maxWidth: '90%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    userMessage: {
        backgroundColor: '#ECF8FF',
        marginLeft: 'auto',
        borderTopRightRadius: 4,
    },
    aiMessage: {
        backgroundColor: '#FFFFFF',
        marginRight: 'auto',
        borderTopLeftRadius: 4,
    },
    messageHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    messageRole: {
        fontFamily: 'Outfit',
        fontSize: 14,
        fontWeight: '600',
        color: '#40ABE5',
    },
    messageTime: {
        fontFamily: 'Outfit',
        fontSize: 12,
        color: '#888',
    },
    messageText: {
        fontFamily: 'Outfit',
        fontSize: 16,
        color: '#333',
        lineHeight: 22,
    },
    messageImage: {
        width: '100%',
        height: 180,
        borderRadius: 8,
    },
    imageContainer: {
        marginTop: 12,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#F0F0F0',
    },
    categoryTag: {
        backgroundColor: '#40ABE5',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginTop: 12,
    },
    categoryText: {
        fontFamily: 'Outfit',
        fontSize: 12,
        color: '#FFFFFF',
        fontWeight: '500',
    },
    actionsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    deleteButton: {
        padding: 8,
        marginRight: 8,
    },
}); 