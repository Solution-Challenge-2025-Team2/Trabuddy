import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions
} from 'react-native';
import Frame from "../Frame";
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Entypo from 'react-native-vector-icons/Entypo';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Tab definitions with icons
const TABS = [
  { key: 'All',      label: 'All',      icon: <FontAwesome name="star" size={24} color="#FACC15" /> },
  { key: 'Place',    label: 'Place',    icon: <Entypo name="location-pin" size={24} color="#10B981" /> },
  { key: 'F&B',      label: 'F&B',      icon: <MaterialCommunityIcons name="food" size={24} color="#F97316" /> },
  { key: 'Activity', label: 'Activity', icon: <FontAwesome name="ticket" size={24} color="#F59E0B" /> },
];

// Expanded sample card data: at least 3 items per category
const ALL_CARDS = [
  // Place
  { id: '1', title: 'Uyuni Salt Desert',    img: 'https://example.com/uyuni.jpg',           sub: 'additional info',     category: 'Place' },
  { id: '2', title: 'Gyeongbokgung',        img: 'https://example.com/gyeongbokgung.jpg',   sub: 'historical palace',    category: 'Place' },
  { id: '5', title: 'Eiffel Tower',         img: 'https://example.com/eiffel.jpg',          sub: 'iconic landmark',      category: 'Place' },
  // F&B
  { id: '3', title: 'Coffee & Cake',        img: 'https://example.com/coffee.jpg',          sub: 'best cafe',           category: 'F&B' },
  { id: '6', title: 'Sushi Delight',        img: 'https://example.com/sushi.jpg',           sub: 'fresh sushi',         category: 'F&B' },
  { id: '7', title: 'Taco Fiesta',          img: 'https://example.com/taco.jpg',            sub: 'spicy tacos',         category: 'F&B' },
  // Activity
  { id: '4', title: 'Theme Park Fun',       img: 'https://example.com/themepark.jpg',       sub: 'rides & games',       category: 'Activity' },
  { id: '8', title: 'Scuba Diving',         img: 'https://example.com/scuba.jpg',           sub: 'underwater adventure', category: 'Activity' },
  { id: '9', title: 'Hot Air Balloon',      img: 'https://example.com/balloon.jpg',         sub: 'sky views',           category: 'Activity' },
];

export default function PersonalContentScreen() {
  const [selectedTab, setSelectedTab] = useState('All');

  const filteredCards = useMemo(() => {
    if (selectedTab === 'All') return ALL_CARDS;
    return ALL_CARDS.filter(card => card.category === selectedTab);
  }, [selectedTab]);

  const categories = useMemo(() => TABS.filter(tab => tab.key !== 'All'), []);

  return (
    <Frame>
      <View style={styles.container}>
        {/* 필터 탭 */}
        <FlatList
          data={TABS}
          horizontal
          keyExtractor={item => item.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
          renderItem={({ item }) => {
            const isSelected = item.key === selectedTab;
            return (
              <TouchableOpacity
                style={[
                  styles.tabItem,
                  isSelected ? styles.tabItemSelected : styles.tabItemDefault
                ]}
                onPress={() => setSelectedTab(item.key)}
              >
                <View style={styles.tabIconBox}>{item.icon}</View>
                <Text style={[
                  styles.tabText,
                  isSelected ? styles.tabTextSelected : styles.tabTextDefault
                ]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />

        {/* 콘텐츠 영역 */}
        {selectedTab === 'All' ? (
          <FlatList
            data={categories}
            keyExtractor={item => item.key}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.verticalListContainer}
            renderItem={({ item }) => {
              const cards = ALL_CARDS.filter(c => c.category === item.key);
              return (
                <View style={styles.categorySection}>
                  <Text style={styles.categoryHeader}>{item.label}</Text>
                  <FlatList
                    data={cards}
                    horizontal
                    keyExtractor={c => c.id}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.cardsContainer}
                    renderItem={({ item: card }) => (
                      <View key={card.id} style={styles.card}>
                        <Image
                          source={{ uri: card.img }}
                          style={styles.cardImage}
                          resizeMode="cover"
                        />
                        <View style={styles.cardTextContainer}>
                          <Text style={styles.cardTitle}>{card.title}</Text>
                          <Text style={styles.cardSub}>{card.sub}</Text>
                        </View>
                      </View>
                    )}
                  />
                </View>
              );
            }}
          />
        ) : (
          <FlatList
            data={filteredCards}
            keyExtractor={c => c.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.verticalListContainer}
            renderItem={({ item: card }) => (
              <View style={[styles.card, styles.verticalCard]}>
                <Image
                  source={{ uri: card.img }}
                  style={styles.cardImage}
                  resizeMode="cover"
                />
                <View style={styles.cardTextContainer}>
                  <Text style={styles.cardTitle}>{card.title}</Text>
                  <Text style={styles.cardSub}>{card.sub}</Text>
                </View>
              </View>
            )}
          />
        )}
      </View>
    </Frame>
  );
}

const CARD_WIDTH = SCREEN_WIDTH * 0.8;
const CARD_IMAGE_HEIGHT = CARD_WIDTH * 0.6;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 16,
    // Removed backgroundColor to inherit Frame's background
  },
  tabsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: 'center',
  },
  tabItem: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginRight: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 44,
  },
  tabItemSelected: {
    backgroundColor: '#09BCD4',
  },
  tabItemDefault: {
    backgroundColor: '#E5F9FF',
  },
  tabIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tabTextSelected: {
    color: '#FFFFFF',
  },
  tabTextDefault: {
    color: '#000000',
  },
  verticalListContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  categorySection: {
    marginBottom: 32,
  },
  categoryHeader: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 4,
  },
  cardsContainer: {
    paddingLeft: 4,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    marginRight: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  verticalCard: {
    width: CARD_WIDTH,
    marginBottom: 24,
    alignSelf: 'center',
  },
  cardImage: {
    width: '100%',
    height: CARD_IMAGE_HEIGHT,
  },
  cardTextContainer: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardSub: {
    fontSize: 12,
    color: '#888888',
    marginTop: 4,
  },
});
