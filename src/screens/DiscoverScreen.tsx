import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Platform,
  Image,
  Alert,
} from 'react-native'
import { BlurView } from 'expo-blur'
import { supabase } from '../lib/supabase'
import { notifyNewMatch } from '../lib/notifications'
import { useFocusEffect } from '@react-navigation/native'
import Purchases from 'react-native-purchases'

const MAX_MATCHES = 8
const FREE_SWIPES_PER_DAY = 5

const MOCK_PROFILES = [
  { id: 'mock1', first_name: 'Maya', age: 27, city: 'New York', profession: 'Architect', distance: '2.1 mi', talk_time: 12, total_time: 20, compatibility: 87, values: ['Ambition-driven', 'Family first', 'Outdoorsy'], bg: '#E8D5C4' },
  { id: 'mock2', first_name: 'Jordan', age: 29, city: 'Brooklyn', profession: 'Designer', distance: '3.4 mi', talk_time: 5, total_time: 20, compatibility: 91, values: ['Creative', 'Adventurous', 'Deep thinker'], bg: '#C8D8E8' },
  { id: 'mock3', first_name: 'Sofia', age: 26, city: 'Manhattan', profession: 'Writer', distance: '1.8 mi', talk_time: 3, total_time: 20, compatibility: 79, values: ['Creativity', 'Independence', 'Growth'], bg: '#D4C8E8' },
  { id: 'mock4', first_name: 'Ava', age: 25, city: 'Austin', profession: 'Nurse', distance: '0.9 mi', talk_time: 8, total_time: 20, compatibility: 84, values: ['Compassion', 'Loyalty', 'Adventure'], bg: '#C8E8D4' },
  { id: 'mock5', first_name: 'Priya', age: 28, city: 'Houston', profession: 'Engineer', distance: '4.2 mi', talk_time: 2, total_time: 20, compatibility: 93, values: ['Intelligence', 'Growth', 'Balance'], bg: '#E8E0C8' },
]

export default function DiscoverScreen({ navigation }: any) {
  const [matchCount, setMatchCount] = useState(0)
  const [userCity, setUserCity] = useState('')
  const [travelMode, setTravelMode] = useState(false)
  const [travelCity, setTravelCity] = useState('')
  const [activeMatchIds, setActiveMatchIds] = useState<string[]>([])
  const [seenIds, setSeenIds] = useState<string[]>([])
  const [swipesUsed, setSwipesUsed] = useState(0)
  const [isPaid, setIsPaid] = useState(false)
  const [swipeLimitHit, setSwipeLimitHit] = useState(false)

  const unavailableIds = [...new Set([...activeMatchIds, ...seenIds])]
  const remainingProfiles = MOCK_PROFILES.filter(p => !unavailableIds.includes(p.id))
  const profile = remainingProfiles[0] ?? null
  const atMatchLimit = matchCount >= MAX_MATCHES
  const atSwipeLimit = !isPaid && swipesUsed >= FREE_SWIPES_PER_DAY
  const progressPercent = profile ? (profile.talk_time / profile.total_time) * 100 : 0
  const activeCity = travelMode && travelCity ? travelCity : userCity

  useFocusEffect(
    useCallback(() => {
      loadUserData()
      checkSubscription()
    }, [])
  )

  async function checkSubscription() {
    try {
      const info = await Purchases.getCustomerInfo()
      const active = info.entitlements.active
      setIsPaid(Object.keys(active).length > 0)
    } catch (e) {
      setIsPaid(false)
    }
  }

  async function loadUserData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [matchRes, profileRes, swipeRes] = await Promise.all([
      supabase.from('matches').select('matched_user_id').eq('user_id', user.id).eq('status', 'active'),
      supabase.from('profiles').select('city, travel_mode, travel_city').eq('id', user.id).single(),
      supabase.from('swipe_limits').select('swipes_used, last_swipe_at').eq('user_id', user.id).single(),
    ])

    const ids = (matchRes.data ?? []).map((m: any) => m.matched_user_id)
    setActiveMatchIds(ids)
    setMatchCount(ids.length)

    if (profileRes.data) {
      setUserCity(profileRes.data.city ?? '')
      setTravelMode(profileRes.data.travel_mode ?? false)
      setTravelCity(profileRes.data.travel_city ?? '')
    }

    if (swipeRes.data) {
      const lastSwipe = new Date(swipeRes.data.last_swipe_at)
      const now = new Date()
      const hoursSinceLastSwipe = (now.getTime() - lastSwipe.getTime()) / (1000 * 60 * 60)
      if (hoursSinceLastSwipe >= 24) {
        // Reset swipes
        await supabase.from('swipe_limits').update({ swipes_used: 0, last_swipe_at: now.toISOString() }).eq('user_id', user.id)
        setSwipesUsed(0)
        setSwipeLimitHit(false)
      } else {
        setSwipesUsed(swipeRes.data.swipes_used)
        setSwipeLimitHit(swipeRes.data.swipes_used >= FREE_SWIPES_PER_DAY)
      }
    }
  }

  async function recordSwipe() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const newCount = swipesUsed + 1
    setSwipesUsed(newCount)

    const { data: existing } = await supabase.from('swipe_limits').select('id').eq('user_id', user.id).single()
    if (existing) {
      await supabase.from('swipe_limits').update({ swipes_used: newCount, last_swipe_at: new Date().toISOString() }).eq('user_id', user.id)
    } else {
      await supabase.from('swipe_limits').insert({ user_id: user.id, swipes_used: newCount, last_swipe_at: new Date().toISOString() })
    }

    if (newCount >= FREE_SWIPES_PER_DAY) {
      setSwipeLimitHit(true)
    }
  }

  async function handleMatch() {
    if (atMatchLimit) {
      Alert.alert('Match limit reached', 'Go to Messages to unmatch someone.')
      return
    }
    if (atSwipeLimit) {
      navigation.navigate('Paywall')
      return
    }
    if (!profile) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('matches').insert({
      user_id: user.id,
      matched_user_id: profile.id,
      matched_user_name: profile.first_name,
      status: 'active',
    })
    setMatchCount(prev => Math.min(prev + 1, MAX_MATCHES))
    setActiveMatchIds(prev => [...prev, profile.id])
    await notifyNewMatch(profile.first_name)
    await recordSwipe()
  }

  function handlePass() {
    if (atSwipeLimit) {
      navigation.navigate('Paywall')
      return
    }
    if (!profile) return
    setSeenIds(prev => [...prev, profile.id])
    recordSwipe()
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.logoRow}>
          <Image source={require('../../assets/icon.png')} style={styles.logoImage} />
          <Text style={styles.logoText}>Versant</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.profileText}>My Profile</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoBar}>
        <TouchableOpacity
          style={[styles.locationBadge, travelMode && styles.locationBadgeTravel]}
          onPress={() => navigation.navigate('TravelMode')}
        >
          <Text style={styles.locationIcon}>{travelMode ? '✈️' : '📍'}</Text>
          <Text style={[styles.locationText, travelMode && styles.locationTextTravel]}>
            {travelMode ? `Traveling — ${travelCity || 'Set destination'}` : `Local — ${activeCity || 'Set your city'}`}
          </Text>
          <Text style={[styles.locationChange, travelMode && styles.locationChangeTravel]}>Change</Text>
        </TouchableOpacity>
        <View style={styles.matchDots}>
          {Array.from({ length: MAX_MATCHES }).map((_, i) => (
            <View key={i} style={[styles.matchDot, i < matchCount && styles.matchDotFilled]} />
          ))}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Swipe Limit Banner */}
        {atSwipeLimit && !isPaid && (
          <View style={styles.swipeLimitBanner}>
            <Text style={styles.swipeLimitTitle}>Daily swipes used 🔒</Text>
            <Text style={styles.swipeLimitSub}>Upgrade to get unlimited swipes every day.</Text>
            <TouchableOpacity style={styles.swipeLimitBtn} onPress={() => navigation.navigate('Paywall')}>
              <Text style={styles.swipeLimitBtnText}>Upgrade to Versant+ →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Free swipes counter */}
        {!isPaid && !atSwipeLimit && (
          <View style={styles.swipeCounter}>
            <Text style={styles.swipeCounterText}>
              {FREE_SWIPES_PER_DAY - swipesUsed} free swipes left today
            </Text>
          </View>
        )}

        {atMatchLimit && (
          <View style={styles.limitBanner}>
            <Text style={styles.limitBannerTitle}>8 active matches</Text>
            <Text style={styles.limitBannerSub}>Go to Messages to unmatch someone.</Text>
            <TouchableOpacity style={styles.limitBannerBtn} onPress={() => navigation.navigate('Messages')}>
              <Text style={styles.limitBannerBtnText}>Go to Messages →</Text>
            </TouchableOpacity>
          </View>
        )}

        {remainingProfiles.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🎉</Text>
            <Text style={styles.emptyTitle}>You have seen everyone!</Text>
            <Text style={styles.emptySub}>Check back soon for new people in your area.</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('Messages')}>
              <Text style={styles.emptyBtnText}>Go to Messages →</Text>
            </TouchableOpacity>
          </View>
        ) : profile ? (
          <View style={[styles.card, atMatchLimit && styles.cardDimmed]}>
            <View style={[styles.photoArea, { backgroundColor: profile.bg }]}>
              <BlurView intensity={80} style={styles.blurOverlay}>
                <View style={styles.silhouetteCircle}>
                  <Text style={styles.silhouetteIcon}>👤</Text>
                </View>
                <Text style={styles.hiddenLabel}>IDENTITY HIDDEN</Text>
                <Text style={styles.hiddenSub}>Match to start a conversation</Text>
              </BlurView>
              <View style={styles.verifiedBadge}>
                <View style={styles.verifiedDot} />
                <Text style={styles.verifiedText}>AI Verified</Text>
              </View>
              <View style={styles.compatBadge}>
                <Text style={styles.compatBadgeText}>{profile.compatibility}% match</Text>
              </View>
            </View>

            <View style={styles.cardBody}>
              <Text style={styles.name}>{profile.first_name}, {profile.age}</Text>
              <Text style={styles.meta}>{profile.city} · {profile.profession} · {profile.distance} away</Text>

              <View style={styles.progressSection}>
                <View style={styles.progressLabelRow}>
                  <Text style={styles.progressLabel}>Talk time to reveal</Text>
                  <Text style={styles.progressValue}>{profile.talk_time} / {profile.total_time} min</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
                </View>
              </View>

              <View style={styles.chipsRow}>
                {profile.values.map((value, index) => (
                  <View key={index} style={styles.chip}>
                    <Text style={styles.chipText}>{value}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.compatBox}>
                <Text style={styles.compatNum}>{profile.compatibility}%</Text>
                <Text style={styles.compatText}>compatibility · matched on values, conflict style & life goals</Text>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.passButton} onPress={handlePass}>
                  <Text style={styles.passButtonText}>Pass</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.matchButton, (atMatchLimit || atSwipeLimit) && styles.matchButtonDisabled]}
                  onPress={handleMatch}
                >
                  <Text style={styles.matchButtonText}>
                    {atMatchLimit ? '🔒 Limit Reached' : atSwipeLimit ? '🔒 Upgrade' : '💛 Match'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : null}

        <View style={styles.bottomNav}>
          {[
            { label: 'Discover', screen: 'Discover', active: true },
            { label: 'Messages', screen: 'Messages', active: false },
            { label: 'Date', screen: 'Date', active: false },
            { label: 'Profile', screen: 'Profile', active: false },
          ].map(tab => (
            <TouchableOpacity key={tab.label} style={styles.navTab} onPress={() => navigation.navigate(tab.screen)}>
              <Text style={[styles.navLabel, tab.active && styles.navLabelActive]}>{tab.label}</Text>
              {tab.active && <View style={styles.navDot} />}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAF8' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EBEBEA' },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoImage: { width: 36, height: 36, borderRadius: 8 },
  logoText: { fontSize: 18, fontWeight: '600', color: '#1A1A18', letterSpacing: -0.3 },
  profileText: { fontSize: 14, color: '#C85A2A', fontWeight: '600' },
  infoBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EBEBEA' },
  locationBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 20, backgroundColor: '#F5F4F2', borderWidth: 1, borderColor: '#EBEBEA' },
  locationBadgeTravel: { backgroundColor: 'rgba(200,90,42,0.08)', borderColor: '#C85A2A' },
  locationIcon: { fontSize: 12 },
  locationText: { fontSize: 12, fontWeight: '500', color: '#6B6B68' },
  locationTextTravel: { color: '#C85A2A' },
  locationChange: { fontSize: 10, color: '#ABABAA', fontWeight: '500' },
  locationChangeTravel: { color: '#C85A2A', opacity: 0.7 },
  matchDots: { flexDirection: 'row', gap: 4 },
  matchDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EBEBEA', borderWidth: 1, borderColor: '#E0DDD8' },
  matchDotFilled: { backgroundColor: '#C85A2A', borderColor: '#C85A2A' },
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },
  swipeLimitBanner: { backgroundColor: '#FDF0EB', borderRadius: 16, borderWidth: 1, borderColor: '#F2D4C8', padding: 16, marginBottom: 16, gap: 6 },
  swipeLimitTitle: { fontSize: 14, fontWeight: '600', color: '#C85A2A' },
  swipeLimitSub: { fontSize: 12, color: '#C85A2A', opacity: 0.8 },
  swipeLimitBtn: { marginTop: 6, alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#C85A2A' },
  swipeLimitBtnText: { fontSize: 12, fontWeight: '600', color: '#FFFFFF' },
  swipeCounter: { alignItems: 'center', marginBottom: 12 },
  swipeCounterText: { fontSize: 12, color: '#ABABAA', fontWeight: '500' },
  limitBanner: { backgroundColor: '#FEF2F2', borderRadius: 16, borderWidth: 1, borderColor: '#FECACA', padding: 16, marginBottom: 16, gap: 6 },
  limitBannerTitle: { fontSize: 14, fontWeight: '600', color: '#DC2626' },
  limitBannerSub: { fontSize: 12, color: '#DC2626', opacity: 0.8 },
  limitBannerBtn: { marginTop: 6, alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#DC2626' },
  limitBannerBtnText: { fontSize: 12, fontWeight: '600', color: '#FFFFFF' },
  emptyState: { alignItems: 'center', paddingVertical: 80, gap: 12 },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: 22, fontWeight: '600', color: '#1A1A18', letterSpacing: -0.3 },
  emptySub: { fontSize: 14, color: '#6B6B68', textAlign: 'center', lineHeight: 22, paddingHorizontal: 24 },
  emptyBtn: { marginTop: 8, paddingVertical: 14, paddingHorizontal: 28, borderRadius: 16, backgroundColor: '#C85A2A' },
  emptyBtnText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 24, borderWidth: 1, borderColor: '#EBEBEA', overflow: 'hidden', marginBottom: 20 },
  cardDimmed: { opacity: 0.6 },
  photoArea: { width: '100%', height: 260, position: 'relative' },
  blurOverlay: { position: 'absolute', inset: 0, width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', gap: 10 },
  silhouetteCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)', alignItems: 'center', justifyContent: 'center' },
  silhouetteIcon: { fontSize: 36, opacity: 0.6 },
  hiddenLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.8)', letterSpacing: 1 },
  hiddenSub: { fontSize: 11, color: 'rgba(255,255,255,0.6)' },
  verifiedBadge: { position: 'absolute', top: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.94)', borderRadius: 20, paddingVertical: 4, paddingHorizontal: 10, borderWidth: 1, borderColor: '#C8EFE3' },
  verifiedDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#1D9E75' },
  verifiedText: { fontSize: 10, fontWeight: '600', color: '#1D9E75' },
  compatBadge: { position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(200,90,42,0.9)', borderRadius: 20, paddingVertical: 4, paddingHorizontal: 10 },
  compatBadgeText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF' },
  cardBody: { padding: 20 },
  name: { fontSize: 24, fontWeight: '600', color: '#1A1A18', marginBottom: 4, letterSpacing: -0.3 },
  meta: { fontSize: 13, color: '#6B6B68', marginBottom: 18 },
  progressSection: { marginBottom: 16 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 12, color: '#ABABAA' },
  progressValue: { fontSize: 12, color: '#C85A2A', fontWeight: '600' },
  progressTrack: { height: 4, backgroundColor: '#F5F4F2', borderRadius: 4 },
  progressFill: { height: '100%', backgroundColor: '#C85A2A', borderRadius: 4 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  chip: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#F5F4F2', borderWidth: 1, borderColor: '#EBEBEA' },
  chipText: { fontSize: 13, fontWeight: '500', color: '#6B6B68' },
  compatBox: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: '#FDF0EB', borderRadius: 14, marginBottom: 16, borderWidth: 1, borderColor: '#F2D4C8' },
  compatNum: { fontSize: 26, fontWeight: '600', color: '#C85A2A' },
  compatText: { flex: 1, fontSize: 12, color: '#C85A2A', opacity: 0.8, lineHeight: 18 },
  actionRow: { flexDirection: 'row', gap: 12 },
  passButton: { flex: 1, height: 52, borderRadius: 16, backgroundColor: '#F5F4F2', borderWidth: 1, borderColor: '#EBEBEA', alignItems: 'center', justifyContent: 'center' },
  passButtonText: { fontSize: 16, fontWeight: '500', color: '#6B6B68' },
  matchButton: { flex: 1, height: 52, borderRadius: 16, backgroundColor: '#C85A2A', alignItems: 'center', justifyContent: 'center' },
  matchButtonDisabled: { backgroundColor: '#E8E8E4' },
  matchButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16, backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#EBEBEA' },
  navTab: { alignItems: 'center', gap: 4 },
  navLabel: { fontSize: 11, fontWeight: '500', color: '#ABABAA' },
  navLabelActive: { color: '#C85A2A', fontWeight: '600' },
  navDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#C85A2A' },
})