import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  ScrollView,
  Platform
} from 'react-native';
import Frame from "../Frame";
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Figma 색상 상수
const FIGMA_COLORS = {
  backgroundGradientStart: '#B2E4FF',
  backgroundGradientEnd: '#FFFFFF',
  logoText: '#000000',
  notificationIcon: '#353535',
  pageTitleText: '#000000',
  tabSelectedBg: '#00A4C5',
  tabDefaultBg: '#F1FFFF',
  tabSelectedIconBg: '#FFFFFF',
  tabDefaultIconBg: '#FFFFFF',
  tabSelectedText: '#FFFFFF',
  tabDefaultText: '#000000',
  cardBackground: '#FFFFFF',
  cardTitleText: '#000000',
  cardSubText: 'rgba(0, 0, 0, 0.5)',
  categoryHeaderText: '#000000',
  iconAllColor: '#F2EE0F',
  iconPlaceColor: '#09954F',
  iconFoodColor: '#FFA048',
  iconActivityColor: '#E4BE00',
};

// Tab definitions with icons
const TABS = [
  { key: 'All', label: 'All', iconName: 'star', iconColor: FIGMA_COLORS.iconAllColor },
  { key: 'Place', label: 'Place', iconName: 'map-marker', iconColor: FIGMA_COLORS.iconPlaceColor },
  { key: 'F&B', label: 'F&B', iconName: 'cutlery', iconColor: FIGMA_COLORS.iconFoodColor },
  { key: 'Activity', label: 'Activity', iconName: 'ticket', iconColor: FIGMA_COLORS.iconActivityColor },
];

// Expanded sample card data: at least 3 items per category
const ALL_CARDS = [
  { id: '1', title: 'Uyuni Salt Desert', img: require('../assets/figma_images/image_15_143_73.png'), sub: 'additional info', category: 'Place' },
  { id: '2', title: 'Gyeongbokgung', img: require('../assets/figma_images/image_16_143_67.png'), sub: 'historical palace', category: 'Place' },
  { id: '5', title: 'Eiffel Tower', img: { uri: 'https://placehold.co/280x210/eiffel/tower' }, sub: 'iconic landmark', category: 'Place' },
  { id: '3', title: 'Coffee & Cake', img: { uri: 'https://placehold.co/280x210/coffee/cake' }, sub: 'best cafe', category: 'F&B' },
  { id: '6', title: 'Sushi Delight', img: { uri: 'https://placehold.co/280x210/sushi/delight' }, sub: 'fresh sushi', category: 'F&B' },
  { id: '7', title: 'Taco Fiesta', img: { uri: 'https://placehold.co/280x210/taco/fiesta' }, sub: 'spicy tacos', category: 'F&B' },
  { id: '4', title: 'Theme Park Fun', img: { uri: 'https://placehold.co/280x210/theme/park' }, sub: 'rides & games', category: 'Activity' },
  { id: '8', title: 'Scuba Diving', img: { uri: 'https://placehold.co/280x210/scuba/diving' }, sub: 'underwater adventure', category: 'Activity' },
  { id: '9', title: 'Hot Air Balloon', img: { uri: 'https://placehold.co/280x210/air/balloon' }, sub: 'sky views', category: 'Activity' },
];

export default function PersonalContentScreen() {
  const [selectedTab, setSelectedTab] = useState('All');

  const filteredCards = useMemo(() => {
    if (selectedTab === 'All') return ALL_CARDS;
    return ALL_CARDS.filter(card => card.category === selectedTab);
  }, [selectedTab]);

  const categories = useMemo(() => TABS.filter(tab => tab.key !== 'All'), []);

  return (
    <LinearGradient
      colors={[FIGMA_COLORS.backgroundGradientStart, FIGMA_COLORS.backgroundGradientEnd]}
      style={{ flex: 1 }}
      start={{ x: 0.5, y: 0.17 }}
      end={{ x: 0.5, y: 0.65 }}
    >
      <Frame>
        <View style={styles.container}>
          <View style={styles.fixedSection}>
            <Text style={styles.pageTitle}>Places you'll love, chosen for you</Text>

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
                    <View style={[
                      styles.tabIconContainer,
                      isSelected ? styles.tabIconContainerSelected : styles.tabIconContainerDefault,
                      !isSelected && { borderWidth: 1, borderColor: '#E7E7E7' }
                    ]}>
                      <FontAwesome name={item.iconName} size={24} color={item.iconColor} />
                    </View>
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
          </View>

          <View style={styles.scrollableSection}>
            {selectedTab === 'All' ? (
              <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollViewContent}
              >
                {categories.map(category => {
                  const categoryCards = ALL_CARDS.filter(c => c.category === category.key);
                  if (categoryCards.length === 0) return null;
                  return (
                    <View key={category.key} style={styles.categorySectionAll}>
                      <Text style={styles.categoryHeaderAll}>{category.label}</Text>
                      <FlatList
                        data={categoryCards}
                        horizontal
                        keyExtractor={c => c.id}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.cardsContainerAll}
                        renderItem={({ item: card }) => (
                          <TouchableOpacity style={[styles.cardVertical, { marginRight: 16 }]}>
                            <Image
                              source={card.img}
                              style={styles.cardImageVertical}
                              resizeMode="cover"
                            />
                            <View style={styles.cardTextContainerVertical}>
                              <Text style={styles.cardTitleVertical} numberOfLines={1}>{card.title}</Text>
                              <Text style={styles.cardSubVertical} numberOfLines={1}>{card.sub}</Text>
                            </View>
                          </TouchableOpacity>
                        )}
                      />
                    </View>
                  );
                })}
              </ScrollView>
            ) : (
              <FlatList
                data={filteredCards}
                keyExtractor={c => c.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.cardsContainerVertical, styles.scrollViewContent]}
                renderItem={({ item: card }) => (
                  <TouchableOpacity style={styles.cardVertical}>
                    <Image
                      source={card.img}
                      style={styles.cardImageVertical}
                      resizeMode="cover"
                    />
                    <View style={styles.cardTextContainerVertical}>
                      <Text style={styles.cardTitleVertical} numberOfLines={1}>{card.title}</Text>
                      <Text style={styles.cardSubVertical} numberOfLines={1}>{card.sub}</Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Frame>
    </LinearGradient>
  );
}

const CARD_WIDTH_VERTICAL = SCREEN_WIDTH * 0.9;
const CARD_IMAGE_HEIGHT_VERTICAL = CARD_WIDTH_VERTICAL * (198 / 353);
const CARD_TEXT_AREA_HEIGHT_VERTICAL = 90;
const CARD_TOTAL_HEIGHT_VERTICAL = CARD_IMAGE_HEIGHT_VERTICAL + CARD_TEXT_AREA_HEIGHT_VERTICAL;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fixedSection: {
    marginBottom: 12,
  },
  scrollableSection: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 20,
  },
  pageTitle: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 32,
    fontWeight: '400',
    color: FIGMA_COLORS.pageTitleText,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 24,
  },
  tabsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: 'flex-start',
    height: 120,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginRight: 10,
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderRadius: 40,
    height: 110,
    width: 80,
  },
  tabItemSelected: {
    backgroundColor: FIGMA_COLORS.tabSelectedBg,
  },
  tabItemDefault: {
    backgroundColor: FIGMA_COLORS.tabDefaultBg,
  },
  tabIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    backgroundColor: FIGMA_COLORS.tabDefaultIconBg,
  },
  tabIconContainerSelected: {
    backgroundColor: FIGMA_COLORS.tabSelectedIconBg,
  },
  tabIconContainerDefault: {
  },
  tabIcon: {
    width: 24,
    height: 24,
  },
  tabText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 20,
    fontWeight: '400',
    textAlign: 'center',
    marginTop: 4,
  },
  tabTextSelected: {
    color: FIGMA_COLORS.tabSelectedText,
  },
  tabTextDefault: {
    color: FIGMA_COLORS.tabDefaultText,
  },
  categorySectionAll: {
    marginBottom: 24,
  },
  categoryHeaderAll: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 24,
    fontWeight: '400',
    color: FIGMA_COLORS.categoryHeaderText,
    marginBottom: 16,
    marginLeft: 20,
  },
  cardsContainerAll: {
    paddingRight: 20,
    paddingLeft: 5,
  },
  cardVertical: {
    width: CARD_WIDTH_VERTICAL,
    height: CARD_TOTAL_HEIGHT_VERTICAL,
    borderRadius: 30,
    backgroundColor: FIGMA_COLORS.cardBackground,
    marginBottom: 24,
    elevation: 5,
    shadowColor: FIGMA_COLORS.cardTitleText,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  cardImageVertical: {
    width: '100%',
    height: CARD_IMAGE_HEIGHT_VERTICAL,
  },
  cardTextContainerVertical: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitleVertical: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 22,
    fontWeight: '400',
    color: FIGMA_COLORS.cardTitleText,
    textAlign: 'center',
    marginBottom: 4,
  },
  cardSubVertical: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
    fontWeight: '400',
    color: FIGMA_COLORS.cardSubText,
    textAlign: 'center',
  },
  cardsContainerVertical: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 20,
  },
});
