import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native'
import { BlurView } from 'expo-blur'
import { supabase } from '../lib/supabase'

const MAX_MATCHES = 8

const MOCK_PROFILES = [
  {
    id: '1',
    first_name: 'Maya',
    age: 27,
    city: 'New York',
    profession: 'Architect',
    distance: '2.1 mi',
    talk_time: 12,
    total_time: 20,
    compatibility: 87,
    values: ['Ambition-driven', 'Family first', 'Outdoorsy'],
    bg: '#E8D5C4',
  },
  {
    id: '2',
    first_name: 'Jordan',
    age: 29,
    city: 'Brooklyn',
    profession: 'Designer',
    distance: '3.4 mi',
    talk_time: 5,
    total_time: 20,
    compatibility: 91,
    values: ['Creative', 'Adventurous', 'Deep thinker'],
    bg: '#C8D8E8',
  },
  {
    id: '3',
    first_name: 'Sofia',
    age: 26,
    city: 'Manhattan',
    profession: 'Writer',
    distance: '1.8 mi',
    talk_time: 3,
    total_time: 20,
    compatibility: 79,
    values: ['Creativity', 'Independence', 'Growth'],
    bg: '#D4C8E8',
  },
]

export default function DiscoverScreen({ navigation }: any) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [voiceRecording, setVoiceRecording] = useState(false)
  const [voiceSent, setVoiceSent] = useState(false)
  const [matchCount, setMatchCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const profile = MOCK_PROFILES[currentIndex % MOCK_PROFILES.length]

  useEffect(() => {
    loadMatchCount()
  }, [])

  async function loadMatchCount() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { count } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'active')

    setMatchCount(count ?? 0)
    setLoading(false)
  }

  async function handleOpenPod() {
    if (matchCount >= MAX_MATCHES) {
      Alert.alert(
        '8 Match Limit Reached',
        'You have reached your maximum of 8 matches. Unmatch with someone from your Profile to open a new spot.',
        [
          { text: 'View Matches', onPress: () => navigation.navigate('Profile') },
          { text: 'Cancel', style: 'cancel' },
        ]
      )
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('matches')
      .insert({
        user_id: user.id,
        matched_user_id: profile.id,
        status: 'active',
      })

    if (error && !error.message.includes('unique')) {
      Alert.alert('Error', error.message)
      return
    }

    setMatchCount(prev => Math.min(prev + 1, MAX_MATCHES))
    navigation.navigate('Pods')
  }

  function handlePass() {
    setVoiceSent(false)
    setCurrentIndex(prev => prev + 1)
  }

  function handleVoice() {
    setVoiceRecording(true)
    setTimeout(() => {
      setVoiceRecording(false)
      setVoiceSent(true)
    }, 3000)
  }

  const progressPercent = (profile.talk_time / profile.total_time) * 100
  const matchesLeft = MAX_MATCHES - matchCount
  const atLimit = matchCount >= MAX_MATCHES

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.logoRow}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoLetter}>V</Text>
          </View>
          <Text style={styles.logoText}>Versant</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.profileText}>My Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Match limit bar */}
      <View style={styles.matchBar}>
        <View style={styles.matchBarLeft}>
          <Text style={styles.matchBarLabel}>
            {atLimit
              ? '🔒 Match limit reached'
              : `${matchesLeft} match spot${matchesLeft !== 1 ? 's' : ''} available`}
          </Text>
        </View>
        <View style={styles.matchDots}>
          {Array.from({ length: MAX_MATCHES }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.matchDot,
                i < matchCount && styles.matchDotFilled,
              ]}
            />
          ))}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* At limit banner */}
        {atLimit && (
          <View style={styles.limitBanner}>
            <Text style={styles.limitBannerTitle}>
              You have 8 active matches
            </Text>
            <Text style={styles.limitBannerSub}>
              Go to your profile to unmatch someone and open a new spot.
            </Text>
            <TouchableOpacity
              style={styles.limitBannerBtn}
              onPress={() => navigation.navigate('Profile')}
            >
              <Text style={styles.limitBannerBtnText}>
                Manage Matches →
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Profile Card */}
        <View style={[styles.card, atLimit && styles.cardDimmed]}>
          {/* Blurred Photo */}
          <View
            style={[styles.photoArea, { backgroundColor: profile.bg }]}
          >
            <BlurView intensity={80} style={styles.blurOverlay}>
              <View style={styles.silhouetteCircle}>
                <Text style={styles.silhouetteIcon}>👤</Text>
              </View>
              <Text style={styles.hiddenLabel}>IDENTITY HIDDEN</Text>
              <Text style={styles.hiddenSub}>
                send a voice note to connect
              </Text>
            </BlurView>
            <View style={styles.verifiedBadge}>
              <View style={styles.verifiedDot} />
              <Text style={styles.verifiedText}>AI Verified</Text>
            </View>
            <View style={styles.compatBadge}>
              <Text style={styles.compatBadgeText}>
                {profile.compatibility}% match
              </Text>
            </View>
          </View>

          {/* Card Body */}
          <View style={styles.cardBody}>
            <Text style={styles.name}>
              {profile.first_name}, {profile.age}
            </Text>
            <Text style={styles.meta}>
              {profile.city} · {profile.profession} · {profile.distance} away
            </Text>

            {/* Progress */}
            <View style={styles.progressSection}>
              <View style={styles.progressLabelRow}>
                <Text style={styles.progressLabel}>Talk time to reveal</Text>
                <Text style={styles.progressValue}>
                  {profile.talk_time} / {profile.total_time} min
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${progressPercent}%` },
                  ]}
                />
              </View>
            </View>

            {/* Values */}
            <View style={styles.chipsRow}>
              {profile.values.map((value, index) => (
                <View key={index} style={styles.chip}>
                  <Text style={styles.chipText}>{value}</Text>
                </View>
              ))}
            </View>

            {/* Compatibility */}
            <View style={styles.compatBox}>
              <Text style={styles.compatNum}>
                {profile.compatibility}%
              </Text>
              <Text style={styles.compatText}>
                compatibility · matched on values, conflict style & life goals
              </Text>
            </View>

            {/* Voice Button */}
            <TouchableOpacity
              style={[
                styles.voiceButton,
                voiceRecording && styles.voiceButtonRecording,
                voiceSent && styles.voiceButtonSent,
              ]}
              onPress={handleVoice}
              disabled={voiceRecording || voiceSent || atLimit}
            >
              <Text style={styles.voiceButtonIcon}>🎙️</Text>
              <Text
                style={[
                  styles.voiceButtonText,
                  voiceRecording && styles.voiceButtonTextRecording,
                  voiceSent && styles.voiceButtonTextSent,
                ]}
              >
                {voiceRecording
                  ? 'Recording...'
                  : voiceSent
                  ? 'Voice note sent ✓'
                  : 'Send a voice note'}
              </Text>
            </TouchableOpacity>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.passButton}
                onPress={handlePass}
              >
                <Text style={styles.passButtonText}>Pass</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.podButton,
                  atLimit && styles.podButtonDisabled,
                ]}
                onPress={handleOpenPod}
              >
                <Text style={styles.podButtonText}>
                  {atLimit ? '🔒 Limit Reached' : 'Open Pod'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Bottom Nav */}
        <View style={styles.bottomNav}>
          {[
            { label: 'Discover', screen: 'Discover', active: true },
            { label: 'Pods', screen: 'Pods', active: false },
            { label: 'Messages', screen: 'Chat', active: false },
            { label: 'Date', screen: 'Date', active: false },
            { label: 'Profile', screen: 'Profile', active: false },
          ].map(tab => (
            <TouchableOpacity
              key={tab.label}
              style={styles.navTab}
              onPress={() => navigation.navigate(tab.screen)}
            >
              <Text
                style={[
                  styles.navLabel,
                  tab.active && styles.navLabelActive,
                ]}
              >
                {tab.label}
              </Text>
              {tab.active && <View style={styles.navDot} />}
            </TouchableOpacity>
          ))}
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
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEA',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#C85A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  logoText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A18',
    letterSpacing: -0.3,
  },
  profileText: {
    fontSize: 14,
    color: '#C85A2A',
    fontWeight: '600',
  },
  matchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEA',
  },
  matchBarLeft: {
    flex: 1,
  },
  matchBarLabel: {
    fontSize: 12,
    color: '#6B6B68',
    fontWeight: '500',
  },
  matchDots: {
    flexDirection: 'row',
    gap: 4,
  },
  matchDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EBEBEA',
    borderWidth: 1,
    borderColor: '#E0DDD8',
  },
  matchDotFilled: {
    backgroundColor: '#C85A2A',
    borderColor: '#C85A2A',
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  limitBanner: {
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 16,
    marginBottom: 16,
    gap: 6,
  },
  limitBannerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
  limitBannerSub: {
    fontSize: 12,
    color: '#DC2626',
    opacity: 0.8,
    lineHeight: 18,
  },
  limitBannerBtn: {
    marginTop: 6,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#DC2626',
  },
  limitBannerBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EBEBEA',
    overflow: 'hidden',
    marginBottom: 20,
  },
  cardDimmed: {
    opacity: 0.6,
  },
  photoArea: {
    width: '100%',
    height: 240,
    position: 'relative',
  },
  blurOverlay: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  silhouetteCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  silhouetteIcon: {
    fontSize: 36,
    opacity: 0.6,
  },
  hiddenLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 1,
  },
  hiddenSub: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#C8EFE3',
  },
  verifiedDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#1D9E75',
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1D9E75',
  },
  compatBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(200,90,42,0.9)',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  compatBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardBody: {
    padding: 18,
  },
  name: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1A1A18',
    marginBottom: 3,
    letterSpacing: -0.3,
  },
  meta: {
    fontSize: 13,
    color: '#6B6B68',
    marginBottom: 16,
  },
  progressSection: {
    marginBottom: 14,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 11,
    color: '#ABABAA',
  },
  progressValue: {
    fontSize: 11,
    color: '#C85A2A',
    fontWeight: '600',
  },
  progressTrack: {
    height: 3,
    backgroundColor: '#F5F4F2',
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#C85A2A',
    borderRadius: 3,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  chip: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#F5F4F2',
    borderWidth: 1,
    borderColor: '#EBEBEA',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B6B68',
  },
  compatBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: '#FDF0EB',
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F2D4C8',
  },
  compatNum: {
    fontSize: 24,
    fontWeight: '600',
    color: '#C85A2A',
  },
  compatText: {
    flex: 1,
    fontSize: 11,
    color: '#C85A2A',
    opacity: 0.8,
    lineHeight: 16,
  },
  voiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EBEBEA',
    backgroundColor: '#FAFAF8',
    marginBottom: 12,
  },
  voiceButtonRecording: {
    backgroundColor: '#FDF0EB',
    borderColor: '#C85A2A',
  },
  voiceButtonSent: {
    backgroundColor: '#E8F8F2',
    borderColor: '#1D9E75',
  },
  voiceButtonIcon: {
    fontSize: 16,
  },
  voiceButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A18',
  },
  voiceButtonTextRecording: {
    color: '#C85A2A',
  },
  voiceButtonTextSent: {
    color: '#1D9E75',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  passButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F5F4F2',
    borderWidth: 1,
    borderColor: '#EBEBEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  passButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B6B68',
  },
  podButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#C85A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  podButtonDisabled: {
    backgroundColor: '#E8E8E4',
  },
  podButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EBEBEA',
  },
  navTab: {
    alignItems: 'center',
    gap: 4,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#ABABAA',
  },
  navLabelActive: {
    color: '#C85A2A',
    fontWeight: '600',
  },
  navDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#C85A2A',
  },
})