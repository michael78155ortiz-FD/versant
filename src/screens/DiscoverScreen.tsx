import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { BlurView } from 'expo-blur'
import { supabase } from '../lib/supabase'
import { notifyNewMatch } from '../lib/notifications'
import { useFocusEffect } from '@react-navigation/native'
import Purchases from 'react-native-purchases'
import { rankProfiles, UserProfile } from '../lib/matching'

const MAX_MATCHES = 8
const FREE_SWIPES_PER_DAY = 5

export default function DiscoverScreen({ navigation }: any) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [profiles, setProfiles] = useState<(UserProfile & { compatibilityScore: number })[]>([])
  const [matchCount, setMatchCount] = useState(0)
  const [activeMatchIds, setActiveMatchIds] = useState<string[]>([])
  const [seenIds, setSeenIds] = useState<string[]>([])
  const [swipesUsed, setSwipesUsed] = useState(0)
  const [isPaid, setIsPaid] = useState(false)
  const [loading, setLoading] = useState(true)

  const remainingProfiles = profiles.filter(p => !seenIds.includes(p.id) && !activeMatchIds.includes(p.id))
  const profile = remainingProfiles[0] ?? null
  const atMatchLimit = matchCount >= MAX_MATCHES
  const atSwipeLimit = !isPaid && swipesUsed >= FREE_SWIPES_PER_DAY
  const progressPercent = profile ? Math.min((profile.compatibilityScore / 100) * 100, 100) : 0

  useFocusEffect(
    useCallback(() => {
      loadEverything()
    }, [])
  )

  async function loadEverything() {
    setLoading(true)
    await Promise.all([loadUserData(), checkSubscription()])
    setLoading(false)
  }

  async function checkSubscription() {
    try {
      const info = await Purchases.getCustomerInfo()
      setIsPaid(Object.keys(info.entitlements.active).length > 0)
    } catch {
      setIsPaid(false)
    }
  }

  async function loadUserData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [matchRes, profileRes, allProfilesRes, swipeRes] = await Promise.all([
      supabase.from('matches').select('matched_user_id').eq('user_id', user.id).eq('status', 'active'),
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('profiles').select('*').neq('id', user.id).limit(100),
      supabase.from('swipe_limits').select('swipes_used, last_swipe_at').eq('user_id', user.id).single(),
    ])

    // Set match data
    const ids = (matchRes.data ?? []).map((m: any) => m.matched_user_id)
    setActiveMatchIds(ids)
    setMatchCount(ids.length)

    // Set current user
    if (profileRes.data) {
      setCurrentUser(profileRes.data)

      // Rank real profiles using algorithm
      if (allProfilesRes.data && allProfilesRes.data.length > 0) {
        const ranked = rankProfiles(profileRes.data, allProfilesRes.data)
        setProfiles(ranked)
      }
    }

    // Handle swipe limits
    if (swipeRes.data) {
      const lastSwipe = new Date(swipeRes.data.last_swipe_at)
      const hoursSince = (Date.now() - lastSwipe.getTime()) / (1000 * 60 * 60)
      if (hoursSince >= 24) {
        await supabase.from('swipe_limits').update({ swipes_used: 0, last_swipe_at: new Date().toISOString() }).eq('user_id', user.id)
        setSwipesUsed(0)
      } else {
        setSwipesUsed(swipeRes.data.swipes_used)
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
  }

  async function handleMatch() {
    if (atMatchLimit) { Alert.alert('Match limit reached', 'Go to Messages to unmatch someone.'); return }
    if (atSwipeLimit) { navigation.navigate('Paywall'); return }
    if (!profile) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const displayName = profile.nickname || profile.full_name?.split(' ')[0] || 'Someone'
    await supabase.from('matches').insert({
      user_id: user.id,
      matched_user_id: profile.id,
      matched_user_name: displayName,
      status: 'active',
    })
    setMatchCount(prev => Math.min(prev + 1, MAX_MATCHES))
    setActiveMatchIds(prev => [...prev, profile.id])
    await notifyNewMatch(displayName)
    await recordSwipe()
  }

  function handlePass() {
    if (atSwipeLimit) { navigation.navigate('Paywall'); return }
    if (!profile) return
    setSeenIds(prev => [...prev, profile.id])
    recordSwipe()
  }

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAFAF8' }}>
        <ActivityIndicator color="#C85A2A" size="large" />
        <Text style={{ marginTop: 12, fontSize: 14, color: '#6B6B68' }}>Finding your matches...</Text>
      </View>
    )
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
          style={styles.locationBadge}
          onPress={() => navigation.navigate('TravelMode')}
        >
          <Text style={styles.locationIcon}>📍</Text>
          <Text style={styles.locationText}>{currentUser?.city || 'Set your city'}</Text>
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
            <Text style={styles.emptyTitle}>You've seen everyone!</Text>
            <Text style={styles.emptySub}>Check back soon for new people in your area.</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('Messages')}>
              <Text style={styles.emptyBtnText}>Go to Messages →</Text>
            </TouchableOpacity>
          </View>
        ) : profile ? (
          <View style={[styles.card, atMatchLimit && styles.cardDimmed]}>
            <View style={[styles.photoArea, { backgroundColor: '#E8D5C4' }]}>
              <BlurView intensity={80} style={styles.blurOverlay}>
                <View style={styles.silhouetteCircle}>
                  <Text style={styles.silhouetteIcon}>👤</Text>
                </View>
                <Text style={styles.hiddenLabel}>IDENTITY HIDDEN</Text>
                <Text style={styles.hiddenSub}>Match to start a conversation</Text>
              </BlurView>
              <View style={styles.verifiedBadge}>
                <View style={styles.verifiedDot} />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
              <View style={styles.compatBadge}>
                <Text style={styles.compatBadgeText}>{profile.compatibilityScore}% match</Text>
              </View>
            </View>

            <View style={styles.cardBody}>
              <Text style={styles.name}>
                {profile.nickname || profile.full_name?.split(' ')[0] || 'Someone'}, {profile.age}
              </Text>
              <Text style={styles.meta}>
                {profile.city}{profile.state ? `, ${profile.state}` : ''}
                {profile.occupation ? ` · ${profile.occupation}` : ''}
              </Text>

              <View style={styles.progressSection}>
                <View style={styles.progressLabelRow}>
                  <Text style={styles.progressLabel}>Compatibility score</Text>
                  <Text style={styles.progressValue}>{profile.compatibilityScore}%</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
                </View>
              </View>

              {/* Shared values chips */}
              {profile.quiz_answers?.coreValues && currentUser?.quiz_answers?.coreValues && (
                <View style={styles.chipsRow}>
                  {profile.quiz_answers.coreValues
                    .filter(v => currentUser?.quiz_answers?.coreValues?.includes(v))
                    .slice(0, 3)
                    .map((value, index) => (
                      <View key={index} style={styles.chip}>
                        <Text style={styles.chipText}>✓ {value}</Text>
                      </View>
                    ))}
                </View>
              )}

              <View style={styles.compatBox}>
                <Text style={styles.compatNum}>{profile.compatibilityScore}%</Text>
                <Text style={styles.compatText}>
                  compatibility · matched on values, conflict style & life goals
                </Text>
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
  locationIcon: { fontSize: 12 },
  locationText: { fontSize: 12, fontWeight: '500', color: '#6B6B68' },
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