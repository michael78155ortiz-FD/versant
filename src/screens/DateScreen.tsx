import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native'

const VENUES = [
  {
    id: '1',
    name: 'Almanac Coffee',
    category: 'Café',
    distance: '0.3 mi',
    price: '$',
    emoji: '☕',
    bg: '#F5EFE8',
    description:
      'Cozy tables, soft music, no phone policy at the bar. Order at the counter and just talk.',
  },
  {
    id: '2',
    name: 'The Still Studio',
    category: 'Art class',
    distance: '0.7 mi',
    price: '$$',
    emoji: '🎨',
    bg: '#EAF0F5',
    description:
      'A 90-min guided painting session. Phones stay in a basket at the door. Laughter guaranteed.',
  },
  {
    id: '3',
    name: 'Botanica Wine Bar',
    category: 'Wine bar',
    distance: '1.1 mi',
    price: '$$',
    emoji: '🍷',
    bg: '#EEF5EA',
    description:
      'Candle-lit tables, natural wine, and a no-phones-at-the-table rule enforced by staff.',
  },
  {
    id: '4',
    name: 'Parlor Improv',
    category: 'Experience',
    distance: '1.8 mi',
    price: '$$',
    emoji: '🎭',
    bg: '#F5EAF0',
    description:
      'You both participate in a beginner improv session. Ice-breaker built in. Phones off, always.',
  },
]

export default function DateScreen({ navigation }: any) {
  const [selectedVenue, setSelectedVenue] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const selected = VENUES.find((v) => v.id === selectedVenue)

  function handleSend() {
    setSent(true)
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>Plan a Date</Text>
        <View style={styles.topSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Match Info */}
        <View style={styles.matchBox}>
          <Text style={styles.matchTitle}>With Sophia, 26</Text>
          <Text style={styles.matchSub}>
            You revealed 2 hours ago · 91% compatible · Ready to meet?
          </Text>
        </View>

        {/* Phone Free Label */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            📵 Phone-free venues near you
          </Text>
          <Text style={styles.sectionRange}>0.3 – 1.8 mi</Text>
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Text style={styles.infoBannerText}>
            🌿  These spots are phone-free zones — no scrolling, no
            distractions. Just you two, fully present.
          </Text>
        </View>

        {/* Venue Cards */}
        {!sent ? (
          <>
            <View style={styles.venueGrid}>
              {VENUES.map((venue) => (
                <TouchableOpacity
                  key={venue.id}
                  style={[
                    styles.venueCard,
                    selectedVenue === venue.id && styles.venueCardSelected,
                  ]}
                  onPress={() => setSelectedVenue(venue.id)}
                >
                  {/* Venue Image */}
                  <View
                    style={[
                      styles.venueImageArea,
                      { backgroundColor: venue.bg },
                    ]}
                  >
                    <Text style={styles.venueEmoji}>{venue.emoji}</Text>
                  </View>

                  {/* Venue Info */}
                  <View style={styles.venueBody}>
                    <Text style={styles.venueName}>{venue.name}</Text>
                    <Text style={styles.venueMeta}>
                      {venue.distance} · {venue.category} · {venue.price}
                    </Text>
                    <View style={styles.phoneFreeBadge}>
                      <Text style={styles.phoneFreeText}>
                        📵 Phone-free
                      </Text>
                    </View>
                  </View>

                  {/* Selected Check */}
                  {selectedVenue === venue.id && (
                    <View style={styles.checkBadge}>
                      <Text style={styles.checkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Selected Venue Detail */}
            {selected && (
              <View style={styles.selectedDetail}>
                <Text style={styles.selectedDetailName}>{selected.name}</Text>
                <Text style={styles.selectedDetailMeta}>
                  {selected.distance} away · {selected.category}
                </Text>
                <View style={styles.selectedDetailDesc}>
                  <Text style={styles.selectedDetailDescLabel}>
                    What to expect
                  </Text>
                  <Text style={styles.selectedDetailDescText}>
                    {selected.description}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.sendButton}
                  onPress={handleSend}
                >
                  <Text style={styles.sendButtonText}>
                    Send Suggestion to Sophia
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        ) : (
          /* Sent Confirmation */
          <View style={styles.sentConfirm}>
            <Text style={styles.sentEmoji}>🎉</Text>
            <Text style={styles.sentTitle}>Suggestion sent!</Text>
            <Text style={styles.sentSub}>
              Sophia will see your date idea. No phones allowed — just good
              conversation.
            </Text>
            <TouchableOpacity
              style={styles.backToPodsButton}
              onPress={() => navigation.navigate('Pods')}
            >
              <Text style={styles.backToPodsText}>Back to Pods</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom Nav */}
        <View style={styles.bottomNav}>
          {[
            { label: 'Discover', screen: 'Discover', active: false },
            { label: 'Pods', screen: 'Pods', active: false },
            { label: 'Messages', screen: 'Chat', active: false },
            { label: 'Date', screen: 'Date', active: true },
          ].map((tab) => (
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 48,
    gap: 12,
  },
  matchBox: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FDF0EB',
    borderWidth: 1,
    borderColor: '#F2D4C8',
  },
  matchTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#C85A2A',
    marginBottom: 3,
  },
  matchSub: {
    fontSize: 11,
    color: '#C85A2A',
    opacity: 0.75,
    lineHeight: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A18',
  },
  sectionRange: {
    fontSize: 11,
    color: '#ABABAA',
  },
  infoBanner: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#E8F8F2',
    borderWidth: 1,
    borderColor: '#C0EAD8',
  },
  infoBannerText: {
    fontSize: 12,
    color: '#1D9E75',
    lineHeight: 18,
  },
  venueGrid: {
    gap: 10,
  },
  venueCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EBEBEA',
    overflow: 'hidden',
    position: 'relative',
  },
  venueCardSelected: {
    borderColor: '#C85A2A',
    backgroundColor: '#FDF0EB',
  },
  venueImageArea: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  venueEmoji: {
    fontSize: 30,
  },
  venueBody: {
    flex: 1,
    padding: 12,
    gap: 3,
  },
  venueName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A18',
  },
  venueMeta: {
    fontSize: 11,
    color: '#6B6B68',
  },
  phoneFreeBadge: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 20,
    backgroundColor: '#E8F8F2',
    borderWidth: 1,
    borderColor: '#C0EAD8',
  },
  phoneFreeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1D9E75',
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#C85A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  selectedDetail: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBEBEA',
    gap: 8,
  },
  selectedDetailName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A18',
  },
  selectedDetailMeta: {
    fontSize: 12,
    color: '#6B6B68',
  },
  selectedDetailDesc: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#E8F8F2',
    borderWidth: 1,
    borderColor: '#C0EAD8',
    gap: 4,
  },
  selectedDetailDescLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1D9E75',
  },
  selectedDetailDescText: {
    fontSize: 12,
    color: '#1D9E75',
    opacity: 0.85,
    lineHeight: 18,
  },
  sendButton: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#C85A2A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C85A2A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  sendButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sentConfirm: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  sentEmoji: {
    fontSize: 48,
  },
  sentTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1A1A18',
    letterSpacing: -0.3,
  },
  sentSub: {
    fontSize: 14,
    color: '#6B6B68',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  backToPodsButton: {
    marginTop: 8,
    height: 48,
    paddingHorizontal: 32,
    borderRadius: 14,
    backgroundColor: '#C85A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backToPodsText: {
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