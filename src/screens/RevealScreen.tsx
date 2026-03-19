import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Animated,
} from 'react-native'
import { BlurView } from 'expo-blur'

export default function RevealScreen({ navigation }: any) {
  const [revealed, setRevealed] = useState(false)
  const [loading, setLoading] = useState(false)

  function handleReveal() {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setRevealed(true)
    }, 1500)
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Pods</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>The Reveal</Text>
        <View style={styles.topSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Avatar */}
        <View style={styles.avatarWrap}>
          <View style={styles.avatarOuter}>
            <View
              style={[
                styles.avatarBg,
                { backgroundColor: '#E8D0C0' },
              ]}
            >
              {!revealed ? (
                <BlurView intensity={90} style={styles.blurLayer}>
                  <Text style={styles.avatarIcon}>👤</Text>
                </BlurView>
              ) : (
                <View style={styles.revealedAvatar}>
                  <Text style={styles.revealedEmoji}>😊</Text>
                </View>
              )}
            </View>
          </View>

          {revealed && (
            <View style={styles.revealedBadge}>
              <Text style={styles.revealedBadgeText}>✓ Revealed</Text>
            </View>
          )}
        </View>

        {/* Name + Message */}
        <Text style={styles.nameText}>
          {revealed ? 'Say hello to Sophia 👋' : 'Sophia is ready'}
        </Text>
        <Text style={styles.subText}>
          {revealed
            ? 'You both chose to connect beyond the voice. Time to meet.'
            : 'You talked for 23 minutes.\nBoth of you agreed to reveal.'}
        </Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'compatibility', value: '91%' },
            { label: 'talk time', value: '23m' },
            { label: 'messages', value: '47' },
          ].map((stat) => (
            <View key={stat.label} style={styles.statBox}>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
            </View>
          ))}
        </View>

        {/* Values Match */}
        <View style={styles.valuesBox}>
          <Text style={styles.valuesTitle}>💛 You both value</Text>
          <View style={styles.valuesChips}>
            {[
              'Financial independence',
              'Family first',
              'Ambition',
            ].map((value) => (
              <View key={value} style={styles.valueChip}>
                <Text style={styles.valueChipText}>{value}</Text>
              </View>
            ))}
          </View>
        </View>

        {!revealed ? (
          <>
            {/* Reveal Button */}
            <TouchableOpacity
              style={[
                styles.revealButton,
                loading && styles.revealButtonLoading,
              ]}
              onPress={handleReveal}
              disabled={loading}
            >
              <Text style={styles.revealButtonText}>
                {loading ? 'Revealing...' : 'Reveal Sophia'}
              </Text>
            </TouchableOpacity>

            {/* Note */}
            <Text style={styles.noteText}>
              Both parties must agree · Sophia already tapped reveal
            </Text>
          </>
        ) : (
          <>
            {/* Post Reveal Actions */}
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => navigation.navigate('Date')}
            >
              <Text style={styles.dateButtonText}>
                📵 Plan a Phone-Free Date
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.messageButton}
              onPress={() => navigation.navigate('Chat')}
            >
              <Text style={styles.messageButtonText}>
                Send a Message
              </Text>
            </TouchableOpacity>

            <Text style={styles.noteText}>
              🎉 You are now able to see each other's photos and plan a date
            </Text>
          </>
        )}

        {/* Trust Signal */}
        <View style={styles.trustBox}>
          <Text style={styles.trustText}>
            🔒  Versant never shares your identity without mutual consent.
            Both users must agree before anything is revealed.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF8',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEA',
  },
  backText: {
    fontSize: 15,
    color: '#C85A2A',
    fontWeight: '500',
  },
  topTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A18',
    letterSpacing: -0.3,
  },
  topSpacer: {
    width: 50,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 48,
    alignItems: 'center',
  },
  avatarWrap: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarOuter: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
    borderColor: '#C85A2A',
    overflow: 'hidden',
    shadowColor: '#C85A2A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
  avatarBg: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blurLayer: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarIcon: {
    fontSize: 52,
    opacity: 0.4,
  },
  revealedAvatar: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5E6D8',
  },
  revealedEmoji: {
    fontSize: 64,
  },
  revealedBadge: {
    marginTop: 12,
    backgroundColor: '#E8F8F2',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#C0EAD8',
  },
  revealedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1D9E75',
  },
  nameText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1A1A18',
    letterSpacing: -0.3,
    textAlign: 'center',
    marginBottom: 8,
  },
  subText: {
    fontSize: 14,
    color: '#6B6B68',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBEBEA',
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 10,
    color: '#ABABAA',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '600',
    color: '#C85A2A',
  },
  valuesBox: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FDF0EB',
    borderWidth: 1,
    borderColor: '#F2D4C8',
    marginBottom: 28,
  },
  valuesTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#C85A2A',
    marginBottom: 10,
  },
  valuesChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  valueChip: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F2D4C8',
  },
  valueChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#C85A2A',
  },
  revealButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    backgroundColor: '#C85A2A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#C85A2A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  revealButtonLoading: {
    opacity: 0.7,
  },
  revealButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  dateButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    backgroundColor: '#C85A2A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#C85A2A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  dateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  messageButton: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBEBEA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  messageButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1A18',
  },
  noteText: {
    fontSize: 11,
    color: '#ABABAA',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 24,
  },
  trustBox: {
    width: '100%',
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#F5F4F2',
    borderWidth: 1,
    borderColor: '#EBEBEA',
  },
  trustText: {
    fontSize: 12,
    color: '#6B6B68',
    lineHeight: 18,
    textAlign: 'center',
  },
})