import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native'
import { supabase } from '../lib/supabase'

interface Match {
  id: string
  matched_user_id: string
  status: string
  created_at: string
  profile?: {
    full_name: string
    city: string
    age: number
    quiz_completed: boolean
  }
}

const MOCK_PODS = [
  {
    id: '1',
    name: 'Sophia',
    age: 26,
    preview: 'Ready to reveal — 23 min talked',
    time: 'now',
    status: 'reveal',
    bg: '#E8D0C0',
  },
  {
    id: '2',
    name: 'Maya',
    age: 27,
    preview: 'Voice note · 0:32',
    time: '2m',
    status: 'active',
    bg: '#C8D8E8',
  },
  {
    id: '3',
    name: 'Jordan',
    age: 29,
    preview: 'You: loved what you said about...',
    time: '1h',
    status: 'unread',
    bg: '#D4C8E8',
  },
]

export default function PodsScreen({ navigation }: any) {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [matchCount, setMatchCount] = useState(0)

  useEffect(() => {
    loadMatches()
  }, [])

  async function loadMatches() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, count } = await supabase
      .from('matches')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    setMatches(data ?? [])
    setMatchCount(count ?? 0)
    setLoading(false)
  }

  async function handleUnmatch(matchId: string, name: string) {
    const doUnmatch = async () => {
      const { error } = await supabase
        .from('matches')
        .update({ status: 'unmatched' })
        .eq('id', matchId)

      if (error) {
        if (Platform.OS === 'web') {
          window.alert('Error: ' + error.message)
        } else {
          Alert.alert('Error', error.message)
        }
        return
      }

      setMatches(prev => prev.filter(m => m.id !== matchId))
      setMatchCount(prev => prev - 1)
    }

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        `Unmatch with ${name}? This will end your pod and all messages will be lost.`
      )
      if (confirmed) doUnmatch()
    } else {
      Alert.alert(
        `Unmatch ${name}?`,
        'This will end your pod and all messages will be lost.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Unmatch',
            style: 'destructive',
            onPress: doUnmatch,
          },
        ]
      )
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator color="#C85A2A" size="large" />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.title}>My Pods</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{matchCount} of 8 active</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💬  You can have up to 8 active pods. Unmatch to open a new spot.
          </Text>
        </View>

        {/* Real Matches */}
        {matches.length > 0 && (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Matches</Text>
          </View>
        )}

        {matches.map(match => (
          <View key={match.id} style={styles.podRow}>
            <TouchableOpacity
              style={styles.podRowMain}
              onPress={() => navigation.navigate('Chat', { match })}
            >
              <View style={[styles.avatar, { backgroundColor: '#E8D5C4' }]}>
                <Text style={styles.avatarIcon}>👤</Text>
              </View>
              <View style={styles.podInfo}>
                <Text style={styles.podName}>
                  {match.profile?.full_name ?? 'Your Match'}
                </Text>
                <Text style={styles.podPreview}>
                  {match.profile?.city ?? 'New match'} · Tap to open pod
                </Text>
              </View>
              <View style={styles.podRight}>
                <View style={styles.activePill}>
                  <Text style={styles.activePillText}>Active</Text>
                </View>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.unmatchBtn}
              onPress={() =>
                handleUnmatch(
                  match.id,
                  match.profile?.full_name ?? 'this person'
                )
              }
            >
              <Text style={styles.unmatchBtnText}>Unmatch</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Demo Pods */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Demo Pods</Text>
          <Text style={styles.sectionSub}>Preview of how pods work</Text>
        </View>

        {MOCK_PODS.map(pod => (
          <View key={pod.id} style={styles.podRow}>
            <TouchableOpacity
              style={styles.podRowMain}
              onPress={() =>
                pod.status === 'reveal'
                  ? navigation.navigate('Reveal')
                  : navigation.navigate('Chat', { pod })
              }
            >
              <View style={styles.avatarWrap}>
                <View style={[styles.avatar, { backgroundColor: pod.bg }]}>
                  <Text style={styles.avatarIcon}>👤</Text>
                </View>
                {pod.status === 'reveal' && (
                  <View style={[styles.statusDot, styles.dotReveal]} />
                )}
                {pod.status === 'active' && (
                  <View style={[styles.statusDot, styles.dotActive]} />
                )}
                {pod.status === 'unread' && (
                  <View style={[styles.statusDot, styles.dotUnread]} />
                )}
              </View>

              <View style={styles.podInfo}>
                <Text style={styles.podName}>
                  {pod.name}, {pod.age}
                </Text>
                <Text style={styles.podPreview} numberOfLines={1}>
                  {pod.preview}
                </Text>
              </View>

              <View style={styles.podRight}>
                <Text style={styles.podTime}>{pod.time}</Text>
                {pod.status === 'reveal' && (
                  <View style={styles.revealPill}>
                    <Text style={styles.revealPillText}>Reveal!</Text>
                  </View>
                )}
                {pod.status === 'active' && (
                  <View style={styles.activePill}>
                    <Text style={styles.activePillText}>Active</Text>
                  </View>
                )}
                {pod.status === 'unread' && (
                  <View style={styles.unreadDot} />
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.unmatchBtn}
              onPress={() => handleUnmatch(pod.id, pod.name)}
            >
              <Text style={styles.unmatchBtnText}>Unmatch</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Limit Box */}
        <View style={styles.limitBox}>
          <Text style={styles.limitTitle}>
            {matchCount >= 8 ? '🔒 Pod limit reached' : `${8 - matchCount} spots remaining`}
          </Text>
          <Text style={styles.limitText}>
            {matchCount >= 8
              ? 'Unmatch someone above to open a new pod.'
              : 'Every conversation deserves your full attention.'}
          </Text>
        </View>

        {/* Bottom Nav */}
        <View style={styles.bottomNav}>
          {[
            { label: 'Discover', screen: 'Discover', active: false },
            { label: 'Pods', screen: 'Pods', active: true },
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAF8',
  },
  container: {
    flex: 1,
    backgroundColor: '#FAFAF8',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEA',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A18',
    letterSpacing: -0.3,
  },
  countBadge: {
    backgroundColor: '#F5F4F2',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#EBEBEA',
  },
  countText: {
    fontSize: 11,
    color: '#6B6B68',
    fontWeight: '500',
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 10,
  },
  infoBox: {
    backgroundColor: '#FDF0EB',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F2D4C8',
  },
  infoText: {
    fontSize: 13,
    color: '#C85A2A',
    lineHeight: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    paddingHorizontal: 4,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A18',
    letterSpacing: 0.2,
  },
  sectionSub: {
    fontSize: 11,
    color: '#ABABAA',
  },
  podRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EBEBEA',
    overflow: 'hidden',
  },
  podRowMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarIcon: {
    fontSize: 20,
    opacity: 0.5,
  },
  statusDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  dotReveal: { backgroundColor: '#C85A2A' },
  dotActive: { backgroundColor: '#1D9E75' },
  dotUnread: { backgroundColor: '#ABABAA' },
  podInfo: {
    flex: 1,
    gap: 3,
  },
  podName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A18',
  },
  podPreview: {
    fontSize: 12,
    color: '#6B6B68',
  },
  podRight: {
    alignItems: 'flex-end',
    gap: 5,
  },
  podTime: {
    fontSize: 10,
    color: '#ABABAA',
  },
  revealPill: {
    backgroundColor: '#FDF0EB',
    borderRadius: 20,
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderWidth: 1,
    borderColor: '#F2D4C8',
  },
  revealPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#C85A2A',
  },
  activePill: {
    backgroundColor: '#E8F8F2',
    borderRadius: 20,
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderWidth: 1,
    borderColor: '#C0EAD8',
  },
  activePillText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1D9E75',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C85A2A',
  },
  unmatchBtn: {
    borderTopWidth: 1,
    borderTopColor: '#F5F4F2',
    paddingVertical: 10,
    alignItems: 'center',
  },
  unmatchBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  limitBox: {
    backgroundColor: '#F5F4F2',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EBEBEA',
    gap: 4,
  },
  limitTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A18',
  },
  limitText: {
    fontSize: 12,
    color: '#6B6B68',
    lineHeight: 18,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EBEBEA',
    marginTop: 8,
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