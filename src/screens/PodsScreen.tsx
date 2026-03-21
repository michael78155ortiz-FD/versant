import React, { useState, useEffect, useCallback } from 'react'
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
import { useFocusEffect } from '@react-navigation/native'

interface Match {
  id: string
  matched_user_id: string
  matched_user_name: string
  status: string
  created_at: string
}

export default function PodsScreen({ navigation }: any) {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  useFocusEffect(
    useCallback(() => {
      loadMatches()
    }, [])
  )

  async function loadMatches() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('matches')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
    setMatches(data ?? [])
    setLoading(false)
  }

  async function handleUnmatch(id: string, name: string) {
    const doIt = async () => {
      await supabase.from('matches').update({ status: 'unmatched' }).eq('id', id)
      setMatches(prev => prev.filter(m => m.id !== id))
    }
    if (Platform.OS === 'web') {
      if (window.confirm(`Unmatch ${name}? This cannot be undone.`)) doIt()
    } else {
      Alert.alert(`Unmatch ${name}?`, 'This cannot be undone.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Unmatch', style: 'destructive', onPress: doIt },
      ])
    }
  }

  const spotsLeft = 8 - matches.length

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
        <Text style={styles.title}>Messages</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{matches.length} of 8 active</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💬  {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} remaining · unmatch to open new ones
          </Text>
        </View>

        {matches.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>💬</Text>
            <Text style={styles.emptyTitle}>No active matches yet</Text>
            <Text style={styles.emptySub}>Go to Discover and match with someone you like.</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('Discover')}>
              <Text style={styles.emptyBtnText}>Go to Discover →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          matches.map((match) => (
            <View key={match.id} style={styles.podRow}>
              <TouchableOpacity
                style={styles.podRowMain}
                onPress={() => navigation.navigate('Chat', { match })}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarInitial}>
                    {match.matched_user_name ? match.matched_user_name[0].toUpperCase() : '?'}
                  </Text>
                </View>
                <View style={styles.podInfo}>
                  <Text style={styles.podName}>{match.matched_user_name || 'Your Match'}</Text>
                  <Text style={styles.podPreview}>Tap to open conversation</Text>
                </View>
                <View style={styles.activePill}>
                  <Text style={styles.activePillText}>Active</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.unmatchBtn}
                onPress={() => handleUnmatch(match.id, match.matched_user_name || 'this person')}
              >
                <Text style={styles.unmatchText}>Unmatch</Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        <View style={styles.bottomNav}>
          {[
            { label: 'Discover', screen: 'Discover', active: false },
            { label: 'Messages', screen: 'Messages', active: true },
            { label: 'Date', screen: 'Date', active: false },
            { label: 'Profile', screen: 'Profile', active: false },
          ].map(tab => (
            <TouchableOpacity
              key={tab.label}
              style={styles.navTab}
              onPress={() => navigation.navigate(tab.screen)}
            >
              <Text style={[styles.navLabel, tab.active && styles.navLabelActive]}>
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
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAFAF8' },
  container: { flex: 1, backgroundColor: '#FAFAF8' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EBEBEA' },
  title: { fontSize: 20, fontWeight: '600', color: '#1A1A18' },
  countBadge: { backgroundColor: '#F5F4F2', borderRadius: 20, paddingVertical: 4, paddingHorizontal: 10, borderWidth: 1, borderColor: '#EBEBEA' },
  countText: { fontSize: 11, color: '#6B6B68', fontWeight: '500' },
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32, gap: 10 },
  infoBox: { backgroundColor: '#FDF0EB', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#F2D4C8' },
  infoText: { fontSize: 13, color: '#C85A2A', lineHeight: 20 },
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A18' },
  emptySub: { fontSize: 13, color: '#6B6B68', textAlign: 'center', lineHeight: 20, paddingHorizontal: 24 },
  emptyBtn: { marginTop: 8, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 14, backgroundColor: '#C85A2A' },
  emptyBtnText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  podRow: { backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#EBEBEA', overflow: 'hidden' },
  podRowMain: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#C85A2A', alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 20, fontWeight: '600', color: '#FFFFFF' },
  podInfo: { flex: 1, gap: 3 },
  podName: { fontSize: 15, fontWeight: '600', color: '#1A1A18' },
  podPreview: { fontSize: 12, color: '#6B6B68' },
  activePill: { backgroundColor: '#E8F8F2', borderRadius: 20, paddingVertical: 3, paddingHorizontal: 9, borderWidth: 1, borderColor: '#C0EAD8' },
  activePillText: { fontSize: 10, fontWeight: '600', color: '#1D9E75' },
  unmatchBtn: { borderTopWidth: 1, borderTopColor: '#F5F4F2', paddingVertical: 10, alignItems: 'center' },
  unmatchText: { fontSize: 12, fontWeight: '600', color: '#DC2626' },
  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16, backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#EBEBEA', marginTop: 8 },
  navTab: { alignItems: 'center', gap: 4 },
  navLabel: { fontSize: 11, fontWeight: '500', color: '#ABABAA' },
  navLabelActive: { color: '#C85A2A', fontWeight: '600' },
  navDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#C85A2A' },
})