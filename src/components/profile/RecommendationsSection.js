import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';

const iconMap = {
  location: 'location-outline',
  pricetag: 'pricetag-outline',
  star: 'star-outline',
};

export default function RecommendationsSection({ recommendations }) {
  if (!recommendations?.length) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Smart recommendations</Text>
      {recommendations.map((item) => (
        <View key={item.id} style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name={iconMap[item.icon] || 'bulb-outline'} size={20} color={colors.primaryDark} />
          </View>
          <View style={styles.body}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardDesc}>{item.description}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.panel,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  body: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: colors.secondaryText,
    lineHeight: 18,
  },
});
