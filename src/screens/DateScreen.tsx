import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Linking,
  Modal,
} from 'react-native'
import { supabase } from '../lib/supabase'

interface Venue {
  id: string
  name: string
  address: string
  rating: number
  totalRatings: number
  isOpen: boolean
  hours: string[]
  phone: string
  website: string
  priceLevel: number
  phoneFree: boolean
  category: string
}

interface Match {
  id: string
  matched_user_id: string
  matched_user_name: string
  created_at: string
}

const PRICE_LABELS = ['', '$', '$$', '$$$', '$$$$']

const VENUE_CATEGORIES = [
  { value: 'all', label: 'All', emoji: '✨' },
  { value: 'cafe', label: 'Cafés', emoji: '☕' },
  { value: 'wine_bar', label: 'Wine Bars', emoji: '🍷' },
  { value: 'art', label: 'Art & Culture', emoji: '🎨' },
  { value: 'experience', label: 'Experiences', emoji: '🎭' },
  { value: 'restaurant', label: 'Restaurants', emoji: '🍽️' },
  { value: 'outdoor', label: 'Outdoor', emoji: '🌿' },
  { value: 'phone_free', label: 'Phone-Free', emoji: '📵' },
]

const MOCK_VENUES: Venue[] = [
  { id: '1', name: 'Almanac Coffee', address: '123 Main St', rating: 4.7, totalRatings: 342, isOpen: true, hours: ['Mon–Fri: 7AM–8PM', 'Sat–Sun: 8AM–9PM'], phone: '(512) 555-0101', website: 'almanaccoffee.com', priceLevel: 1, phoneFree: false, category: 'cafe' },
  { id: '2', name: 'Blue Sparrow Café', address: '45 Oak Ave', rating: 4.5, totalRatings: 210, isOpen: true, hours: ['Daily: 6AM–7PM'], phone: '(512) 555-0110', website: 'bluesparrow.com', priceLevel: 1, phoneFree: true, category: 'cafe' },
  { id: '3', name: 'Botanica Wine Bar', address: '789 Vine St', rating: 4.8, totalRatings: 567, isOpen: false, hours: ['Mon–Thu: 4PM–11PM', 'Fri–Sat: 3PM–12AM'], phone: '(512) 555-0103', website: 'botanicawinebar.com', priceLevel: 2, phoneFree: true, category: 'wine_bar' },
  { id: '4', name: 'The Cellar Door', address: '22 Barrel Lane', rating: 4.6, totalRatings: 189, isOpen: true, hours: ['Tue–Sun: 4PM–11PM'], phone: '(512) 555-0111', website: 'cellardoor.com', priceLevel: 3, phoneFree: false, category: 'wine_bar' },
  { id: '5', name: 'The Still Studio', address: '456 Art District', rating: 4.9, totalRatings: 128, isOpen: true, hours: ['Tue–Sun: 10AM–10PM'], phone: '(512) 555-0102', website: 'thestillstudio.com', priceLevel: 2, phoneFree: true, category: 'art' },
  { id: '6', name: 'Mosaic Gallery', address: '88 Culture Blvd', rating: 4.7, totalRatings: 94, isOpen: true, hours: ['Wed–Sun: 11AM–8PM'], phone: '(512) 555-0112', website: 'mosaicgallery.com', priceLevel: 1, phoneFree: false, category: 'art' },
  { id: '7', name: 'Parlor Improv', address: '321 Comedy Lane', rating: 4.6, totalRatings: 89, isOpen: true, hours: ['Wed–Sun: 6PM–11PM'], phone: '(512) 555-0104', website: 'parlorimprov.com', priceLevel: 2, phoneFree: false, category: 'experience' },
  { id: '8', name: 'Escape Room 512', address: '77 Puzzle St', rating: 4.8, totalRatings: 312, isOpen: true, hours: ['Daily: 12PM–10PM'], phone: '(512) 555-0113', website: 'escaperoom512.com', priceLevel: 2, phoneFree: true, category: 'experience' },
  { id: '9', name: 'Pinot & Paint Studio', address: '34 Canvas Way', rating: 4.5, totalRatings: 156, isOpen: false, hours: ['Thu–Sun: 5PM–9PM'], phone: '(512) 555-0114', website: 'pinotandpaint.com', priceLevel: 2, phoneFree: false, category: 'experience' },
  { id: '10', name: 'The Quiet Table', address: '88 Serenity Ave', rating: 4.8, totalRatings: 203, isOpen: true, hours: ['Tue–Sun: 5PM–11PM'], phone: '(512) 555-0105', website: 'thequiettable.com', priceLevel: 3, phoneFree: true, category: 'restaurant' },
  { id: '11', name: 'Ember & Oak', address: '14 Fireplace Rd', rating: 4.7, totalRatings: 445, isOpen: true, hours: ['Mon–Sun: 5PM–10PM'], phone: '(512) 555-0115', website: 'emberandoak.com', priceLevel: 3, phoneFree: false, category: 'restaurant' },
  { id: '12', name: 'Barton Springs Trail', address: 'Barton Springs Rd', rating: 4.9, totalRatings: 1204, isOpen: true, hours: ['Daily: Sunrise–Sunset'], phone: '', website: '', priceLevel: 0, phoneFree: false, category: 'outdoor' },
  { id: '13', name: 'Zilker Botanical Garden', address: '2220 Barton Springs Rd', rating: 4.8, totalRatings: 876, isOpen: true, hours: ['Daily: 7AM–7PM'], phone: '(512) 555-0116', website: 'zilkergarden.com', priceLevel: 1, phoneFree: false, category: 'outdoor' },
]

export default function DateScreen({ navigation }: any) {
  const [searchCity, setSearchCity] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [allVenues, setAllVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [showMatchPicker, setShowMatchPicker] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [venueToSuggest, setVenueToSuggest] = useState<Venue | null>(null)
  const [sentVenues, setSentVenues] = useState<string[]>([])
  const [sending, setSending] = useState(false)

  useEffect(() => {
    loadUserCity()
    loadMatches()
  }, [])

  async function loadUserCity() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('profiles')
      .select('city, travel_city, travel_mode')
      .eq('id', user.id)
      .single()
    if (data) {
      const activeCity = data.travel_mode && data.travel_city ? data.travel_city : data.city ?? ''
      setSearchCity(activeCity)
      setAllVenues(MOCK_VENUES.map(v => ({ ...v, address: `${v.address}, ${activeCity}` })))
    }
  }

  async function loadMatches() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('matches')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
    setMatches(data ?? [])
  }

  function handleSearch() {
    if (!searchCity.trim()) return
    setLoading(true)
    setTimeout(() => {
      setAllVenues(MOCK_VENUES.map(v => ({ ...v, address: `${v.address}, ${searchCity}` })))
      setLoading(false)
    }, 600)
  }

  function getFilteredVenues() {
    if (selectedCategory === 'phone_free') return allVenues.filter(v => v.phoneFree)
    if (selectedCategory === 'all') return allVenues
    return allVenues.filter(v => v.category === selectedCategory)
  }

  function handleSuggestTap(venue: Venue) {
    setVenueToSuggest(venue)
    setSelectedMatch(null)
    setShowMatchPicker(true)
  }

  async function handleSendSuggestion() {
    if (!selectedMatch || !venueToSuggest) return
    setSending(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('date_suggestions').insert({
      match_id: selectedMatch.id,
      suggested_by: user.id,
      user_id: user.id,
      venue_name: venueToSuggest.name,
      venue_address: venueToSuggest.address,
      venue_phone: venueToSuggest.phone || '',
      venue_website: venueToSuggest.website || '',
      status: 'pending',
    })

    setSending(false)

    if (error) {
      if (typeof window !== 'undefined') {
        window.alert('Error sending suggestion: ' + error.message)
      }
      return
    }

    setShowMatchPicker(false)
    setSentVenues(prev => [...prev, venueToSuggest.id])
    setSelectedVenue(null)
  }

  function openMaps(venue: Venue) {
    Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(venue.name + ' ' + venue.address)}`)
  }

  function openWebsite(venue: Venue) {
    if (venue.website) {
      const url = venue.website.startsWith('http') ? venue.website : `https://${venue.website}`
      Linking.openURL(url)
    }
  }

  function callVenue(venue: Venue) {
    if (venue.phone) Linking.openURL(`tel:${venue.phone}`)
  }

  function renderStars(rating: number) {
    return '★'.repeat(Math.floor(rating)) + (rating % 1 >= 0.5 ? '½' : '')
  }

  const filteredVenues = getFilteredVenues()

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.topTitle}>Plan a Date 📅</Text>
      </View>

      <Modal visible={showMatchPicker} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalTopBar}>
            <Text style={styles.modalTitle}>Who do you want to invite?</Text>
            <TouchableOpacity onPress={() => setShowMatchPicker(false)}>
              <Text style={styles.modalClose}>Cancel</Text>
            </TouchableOpacity>
          </View>

          {venueToSuggest && (
            <View style={styles.modalVenueBox}>
              <Text style={styles.modalVenueName}>{venueToSuggest.name}</Text>
              <Text style={styles.modalVenueAddress}>📍 {venueToSuggest.address}</Text>
            </View>
          )}

          <ScrollView contentContainerStyle={styles.modalScroll}>
            {matches.length === 0 ? (
              <View style={styles.noMatchesBox}>
                <Text style={styles.noMatchesEmoji}>💬</Text>
                <Text style={styles.noMatchesTitle}>No active matches yet</Text>
                <Text style={styles.noMatchesSub}>Go to Discover and match with someone first.</Text>
                <TouchableOpacity
                  style={styles.noMatchesBtn}
                  onPress={() => { setShowMatchPicker(false); navigation.navigate('Discover') }}
                >
                  <Text style={styles.noMatchesBtnText}>Go to Discover →</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={styles.modalSubtitle}>
                  Select one of your {matches.length} active match{matches.length !== 1 ? 'es' : ''}
                </Text>
                {matches.map((match) => (
                  <TouchableOpacity
                    key={match.id}
                    style={[styles.matchRow, selectedMatch?.id === match.id && styles.matchRowSelected]}
                    onPress={() => setSelectedMatch(match)}
                  >
                    <View style={styles.matchAvatar}>
                      <Text style={styles.matchAvatarText}>👤</Text>
                    </View>
                    <View style={styles.matchInfo}>
                      <Text style={styles.matchName}>
                        {match.matched_user_name || 'Your Match'}
                      </Text>
                      <Text style={styles.matchSub}>Active match · tap to select</Text>
                    </View>
                    {selectedMatch?.id === match.id && (
                      <Text style={styles.matchCheck}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </>
            )}
          </ScrollView>

          {matches.length > 0 && (
            <View style={styles.modalBottom}>
              <TouchableOpacity
                style={[styles.sendSuggestionBtn, (!selectedMatch || sending) && styles.sendSuggestionBtnDisabled]}
                onPress={handleSendSuggestion}
                disabled={!selectedMatch || sending}
              >
                {sending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.sendSuggestionBtnText}>
                    {selectedMatch
                      ? `Send to ${selectedMatch.matched_user_name || 'Your Match'} →`
                      : 'Select a match to continue'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </SafeAreaView>
      </Modal>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.introBox}>
          <Text style={styles.introTitle}>Find a great first date spot</Text>
          <Text style={styles.introSub}>Search your city, pick a venue, and invite one of your matches.</Text>
        </View>

        <View style={styles.searchRow}>
          <TextInput
            style={styles.cityInput}
            value={searchCity}
            onChangeText={setSearchCity}
            placeholder="Enter your city..."
            placeholderTextColor="#ABABAA"
            onSubmitEditing={handleSearch}
            autoCapitalize="words"
          />
          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
            <Text style={styles.searchBtnText}>Search</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {VENUE_CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.value}
              style={[
                styles.categoryPill,
                selectedCategory === cat.value && styles.categoryPillActive,
                cat.value === 'phone_free' && styles.categoryPillPhoneFree,
                cat.value === 'phone_free' && selectedCategory === cat.value && styles.categoryPillPhoneFreeActive,
              ]}
              onPress={() => { setSelectedCategory(cat.value); setSelectedVenue(null) }}
            >
              <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
              <Text style={[
                styles.categoryLabel,
                selectedCategory === cat.value && cat.value !== 'phone_free' && styles.categoryLabelActive,
                cat.value === 'phone_free' && selectedCategory !== cat.value && styles.categoryLabelPhoneFree,
                cat.value === 'phone_free' && selectedCategory === cat.value && styles.categoryLabelPhoneFreeSelected,
              ]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {selectedCategory === 'phone_free' && (
          <View style={styles.phoneFreeActiveBanner}>
            <Text style={styles.phoneFreeActiveBannerText}>
              📵 Showing venues with phone-free policies
            </Text>
          </View>
        )}

        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#C85A2A" />
            <Text style={styles.loadingText}>Finding venues near {searchCity}...</Text>
          </View>
        )}

        {!loading && filteredVenues.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyTitle}>No venues found</Text>
            <Text style={styles.emptySub}>Try a different category or city.</Text>
          </View>
        )}

        {!loading && filteredVenues.map(venue => (
          <TouchableOpacity
            key={venue.id}
            style={[styles.venueCard, selectedVenue?.id === venue.id && styles.venueCardSelected]}
            onPress={() => setSelectedVenue(selectedVenue?.id === venue.id ? null : venue)}
          >
            <View style={styles.venueHeader}>
              <View style={styles.venueHeaderLeft}>
                <View style={styles.venueNameRow}>
                  <Text style={styles.venueName}>{venue.name}</Text>
                  {venue.phoneFree && (
                    <View style={styles.phoneFreeTag}>
                      <Text style={styles.phoneFreeTagText}>📵 Phone-Free</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.venueAddress} numberOfLines={1}>📍 {venue.address}</Text>
              </View>
              <View style={styles.venueHeaderRight}>
                {venue.priceLevel > 0 && (
                  <Text style={styles.venuePrice}>{PRICE_LABELS[venue.priceLevel]}</Text>
                )}
                <View style={[styles.openBadge, !venue.isOpen && styles.closedBadge]}>
                  <Text style={[styles.openBadgeText, !venue.isOpen && styles.closedBadgeText]}>
                    {venue.isOpen ? 'Open Now' : 'Closed'}
                  </Text>
                </View>
              </View>
            </View>

            {venue.rating > 0 && (
              <View style={styles.ratingRow}>
                <Text style={styles.ratingStars}>{renderStars(venue.rating)}</Text>
                <Text style={styles.ratingNum}>{venue.rating.toFixed(1)}</Text>
                <Text style={styles.ratingCount}>({venue.totalRatings.toLocaleString()} reviews)</Text>
              </View>
            )}

            {selectedVenue?.id === venue.id && (
              <View style={styles.venueDetails}>
                {venue.hours.length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>⏰ Hours</Text>
                    {venue.hours.map((h, i) => (
                      <Text key={i} style={styles.detailText}>{h}</Text>
                    ))}
                  </View>
                )}

                <View style={styles.actionBtns}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => openMaps(venue)}>
                    <Text style={styles.actionBtnText}>🗺️ Directions</Text>
                  </TouchableOpacity>
                  {venue.phone !== '' && (
                    <TouchableOpacity style={styles.actionBtn} onPress={() => callVenue(venue)}>
                      <Text style={styles.actionBtnText}>📞 Call</Text>
                    </TouchableOpacity>
                  )}
                  {venue.website !== '' && (
                    <TouchableOpacity style={styles.actionBtn} onPress={() => openWebsite(venue)}>
                      <Text style={styles.actionBtnText}>🌐 Website</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {sentVenues.includes(venue.id) ? (
                  <View style={styles.sentBox}>
                    <Text style={styles.sentEmoji}>🎉</Text>
                    <Text style={styles.sentTitle}>Suggestion sent!</Text>
                    <Text style={styles.sentSub}>Your match will see this in their chat.</Text>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.suggestBtn} onPress={() => handleSuggestTap(venue)}>
                    <Text style={styles.suggestBtnText}>Invite a match to this spot →</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </TouchableOpacity>
        ))}

        <View style={styles.partnerBox}>
          <Text style={styles.partnerTitle}>🤝 Own a venue?</Text>
          <Text style={styles.partnerText}>Partner with Versant to be featured as a first date destination.</Text>
          <TouchableOpacity
            style={styles.partnerBtn}
            onPress={() => Linking.openURL('mailto:partnerships@versantapp.com?subject=Venue Partnership')}
          >
            <Text style={styles.partnerBtnText}>Contact us →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomNav}>
          {[
            { label: 'Discover', screen: 'Discover', active: false },
            { label: 'Messages', screen: 'Messages', active: false },
            { label: 'Date', screen: 'Date', active: true },
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
  container: { flex: 1, backgroundColor: '#FAFAF8' },
  topBar: { paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EBEBEA' },
  topTitle: { fontSize: 20, fontWeight: '600', color: '#1A1A18' },
  modalContainer: { flex: 1, backgroundColor: '#FAFAF8' },
  modalTopBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EBEBEA' },
  modalTitle: { fontSize: 17, fontWeight: '600', color: '#1A1A18' },
  modalClose: { fontSize: 15, color: '#C85A2A', fontWeight: '500' },
  modalVenueBox: { margin: 16, padding: 14, borderRadius: 14, backgroundColor: '#FDF0EB', borderWidth: 1, borderColor: '#F2D4C8', gap: 3 },
  modalVenueName: { fontSize: 15, fontWeight: '600', color: '#C85A2A' },
  modalVenueAddress: { fontSize: 12, color: '#C85A2A', opacity: 0.8 },
  modalScroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32, gap: 10 },
  modalSubtitle: { fontSize: 13, color: '#6B6B68', marginBottom: 4 },
  modalBottom: { padding: 20, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#EBEBEA' },
  noMatchesBox: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  noMatchesEmoji: { fontSize: 48 },
  noMatchesTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A18' },
  noMatchesSub: { fontSize: 13, color: '#6B6B68', textAlign: 'center', lineHeight: 20, paddingHorizontal: 24 },
  noMatchesBtn: { marginTop: 8, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 14, backgroundColor: '#C85A2A' },
  noMatchesBtnText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  matchRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1.5, borderColor: '#EBEBEA' },
  matchRowSelected: { borderColor: '#C85A2A', backgroundColor: 'rgba(200,90,42,0.04)' },
  matchAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#E8D5C4', alignItems: 'center', justifyContent: 'center' },
  matchAvatarText: { fontSize: 20, opacity: 0.5 },
  matchInfo: { flex: 1 },
  matchName: { fontSize: 15, fontWeight: '600', color: '#1A1A18' },
  matchSub: { fontSize: 12, color: '#6B6B68', marginTop: 2 },
  matchCheck: { fontSize: 18, color: '#C85A2A', fontWeight: '700' },
  sendSuggestionBtn: { height: 54, borderRadius: 16, backgroundColor: '#C85A2A', alignItems: 'center', justifyContent: 'center' },
  sendSuggestionBtnDisabled: { backgroundColor: '#E8E8E4' },
  sendSuggestionBtnText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 48, gap: 12 },
  introBox: { padding: 16, borderRadius: 16, backgroundColor: '#FDF0EB', borderWidth: 1, borderColor: '#F2D4C8', gap: 4 },
  introTitle: { fontSize: 15, fontWeight: '600', color: '#C85A2A' },
  introSub: { fontSize: 13, color: '#C85A2A', opacity: 0.8, lineHeight: 20 },
  searchRow: { flexDirection: 'row', gap: 8 },
  cityInput: { flex: 1, height: 50, backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1.5, borderColor: '#EBEBEA', paddingHorizontal: 14, fontSize: 15, color: '#1A1A18' },
  searchBtn: { height: 50, paddingHorizontal: 20, borderRadius: 14, backgroundColor: '#C85A2A', alignItems: 'center', justifyContent: 'center' },
  searchBtnText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  categoryScroll: { gap: 8, paddingRight: 4 },
  categoryPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 9999, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#EBEBEA' },
  categoryPillActive: { backgroundColor: 'rgba(200,90,42,0.08)', borderColor: '#C85A2A' },
  categoryPillPhoneFree: { borderColor: '#1D9E75', backgroundColor: '#E8F8F2' },
  categoryPillPhoneFreeActive: { backgroundColor: '#1D9E75', borderColor: '#1D9E75' },
  categoryEmoji: { fontSize: 14 },
  categoryLabel: { fontSize: 13, fontWeight: '500', color: '#6B6B68' },
  categoryLabelActive: { color: '#C85A2A', fontWeight: '600' },
  categoryLabelPhoneFree: { color: '#1D9E75', fontWeight: '600' },
  categoryLabelPhoneFreeSelected: { color: '#FFFFFF', fontWeight: '600' },
  phoneFreeActiveBanner: { padding: 12, borderRadius: 12, backgroundColor: '#E8F8F2', borderWidth: 1, borderColor: '#C0EAD8' },
  phoneFreeActiveBannerText: { fontSize: 13, color: '#1D9E75', lineHeight: 18 },
  loadingBox: { alignItems: 'center', gap: 10, padding: 32 },
  loadingText: { fontSize: 13, color: '#6B6B68' },
  emptyState: { alignItems: 'center', padding: 32, gap: 10 },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A18' },
  emptySub: { fontSize: 13, color: '#6B6B68', textAlign: 'center', lineHeight: 20 },
  venueCard: { backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#EBEBEA', padding: 16, gap: 8 },
  venueCardSelected: { borderColor: '#C85A2A', backgroundColor: '#FFFAF8' },
  venueHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  venueHeaderLeft: { flex: 1, gap: 4 },
  venueNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  venueName: { fontSize: 16, fontWeight: '600', color: '#1A1A18' },
  phoneFreeTag: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 20, backgroundColor: '#E8F8F2', borderWidth: 1, borderColor: '#C0EAD8' },
  phoneFreeTagText: { fontSize: 10, fontWeight: '600', color: '#1D9E75' },
  venueAddress: { fontSize: 12, color: '#6B6B68' },
  venueHeaderRight: { alignItems: 'flex-end', gap: 5 },
  venuePrice: { fontSize: 12, fontWeight: '600', color: '#6B6B68' },
  openBadge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 20, backgroundColor: '#E8F8F2', borderWidth: 1, borderColor: '#C0EAD8' },
  closedBadge: { backgroundColor: '#F5F4F2', borderColor: '#EBEBEA' },
  openBadgeText: { fontSize: 10, fontWeight: '600', color: '#1D9E75' },
  closedBadgeText: { color: '#ABABAA' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  ratingStars: { fontSize: 12, color: '#F59E0B' },
  ratingNum: { fontSize: 13, fontWeight: '600', color: '#1A1A18' },
  ratingCount: { fontSize: 11, color: '#ABABAA' },
  venueDetails: { gap: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F5F4F2' },
  detailSection: { gap: 4 },
  detailLabel: { fontSize: 13, fontWeight: '600', color: '#1A1A18', marginBottom: 2 },
  detailText: { fontSize: 13, color: '#6B6B68', lineHeight: 18 },
  actionBtns: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actionBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#F5F4F2', borderWidth: 1, borderColor: '#EBEBEA' },
  actionBtnText: { fontSize: 13, fontWeight: '500', color: '#1A1A18' },
  suggestBtn: { height: 48, borderRadius: 14, backgroundColor: '#C85A2A', alignItems: 'center', justifyContent: 'center' },
  suggestBtnText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  sentBox: { alignItems: 'center', padding: 16, gap: 4, backgroundColor: '#E8F8F2', borderRadius: 14, borderWidth: 1, borderColor: '#C0EAD8' },
  sentEmoji: { fontSize: 28 },
  sentTitle: { fontSize: 15, fontWeight: '600', color: '#1D9E75' },
  sentSub: { fontSize: 12, color: '#1D9E75', opacity: 0.8, textAlign: 'center' },
  partnerBox: { padding: 16, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EBEBEA', gap: 8 },
  partnerTitle: { fontSize: 14, fontWeight: '600', color: '#1A1A18' },
  partnerText: { fontSize: 13, color: '#6B6B68', lineHeight: 20 },
  partnerBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, backgroundColor: '#FDF0EB', borderWidth: 1, borderColor: '#F2D4C8', alignSelf: 'flex-start' },
  partnerBtnText: { fontSize: 13, fontWeight: '600', color: '#C85A2A' },
  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16, backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#EBEBEA', marginTop: 8 },
  navTab: { alignItems: 'center', gap: 4 },
  navLabel: { fontSize: 11, fontWeight: '500', color: '#ABABAA' },
  navLabelActive: { color: '#C85A2A', fontWeight: '600' },
  navDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#C85A2A' },
})