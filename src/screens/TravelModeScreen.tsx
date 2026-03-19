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
  Alert,
  Switch,
} from 'react-native'
import { supabase } from '../lib/supabase'

const TRAVEL_DURATIONS = [
  { value: '24h', label: '24 hours', emoji: '⚡' },
  { value: '3days', label: '3 days', emoji: '🗓️' },
  { value: '1week', label: '1 week', emoji: '📅' },
  { value: '2weeks', label: '2 weeks', emoji: '✈️' },
  { value: 'indefinite', label: 'Indefinitely', emoji: '🌍' },
]

const POPULAR_CITIES = [
  { city: 'New York', emoji: '🗽' },
  { city: 'Los Angeles', emoji: '🌴' },
  { city: 'Chicago', emoji: '🌆' },
  { city: 'Miami', emoji: '🌊' },
  { city: 'Austin', emoji: '🤠' },
  { city: 'San Francisco', emoji: '🌉' },
  { city: 'Seattle', emoji: '☔' },
  { city: 'Nashville', emoji: '🎸' },
  { city: 'Denver', emoji: '🏔️' },
  { city: 'Boston', emoji: '🦞' },
]

export default function TravelModeScreen({ navigation }: any) {
  const [travelMode, setTravelMode] = useState(false)
  const [city, setCity] = useState('')
  const [duration, setDuration] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTravelMode()
  }, [])

  async function loadTravelMode() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('profiles')
      .select('travel_mode, travel_city, travel_duration')
      .eq('id', user.id)
      .single()

    if (data) {
      setTravelMode(data.travel_mode ?? false)
      setCity(data.travel_city ?? '')
      setDuration(data.travel_duration ?? '')
    }

    setLoading(false)
  }

  async function handleSave() {
    setSaving(true)

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      Alert.alert('Error', 'Not logged in.')
      setSaving(false)
      return
    }

    const updateData = travelMode
      ? {
          travel_mode: true,
          travel_city: city.trim(),
          travel_duration: duration,
          travel_started_at: new Date().toISOString(),
        }
      : {
          travel_mode: false,
          travel_city: null,
          travel_duration: null,
          travel_started_at: null,
        }

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)

    setSaving(false)

    if (error) {
      Alert.alert('Error saving', error.message)
      return
    }

    Alert.alert(
      travelMode ? '✈️ Travel Mode On' : 'Travel Mode Off',
      travelMode
        ? `You will now see matches in ${city || 'your destination'}.`
        : 'Showing matches near your home location.',
      [{ text: 'Got it', onPress: () => navigation.goBack() }]
    )
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
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>Travel Mode</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerEmoji}>✈️</Text>
          <Text style={styles.title}>Traveling somewhere?</Text>
          <Text style={styles.subtitle}>
            Turn on Travel Mode to discover meaningful connections
            wherever you are in the world.
          </Text>
        </View>

        {/* Toggle Card */}
        <View style={styles.toggleCard}>
          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleTitle}>Travel Mode</Text>
              <Text style={styles.toggleSubtitle}>
                {travelMode
                  ? 'Showing matches at your destination'
                  : 'Currently showing local matches'}
              </Text>
            </View>
            <Switch
              value={travelMode}
              onValueChange={setTravelMode}
              trackColor={{ false: '#EBEBEA', true: '#C85A2A' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Travel Details */}
        {travelMode && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Where are you going?</Text>
              <TextInput
                style={styles.cityInput}
                value={city}
                onChangeText={setCity}
                placeholder="Enter city name..."
                placeholderTextColor="#ABABAA"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionSubtitle}>Popular cities</Text>
              <View style={styles.cityGrid}>
                {POPULAR_CITIES.map(item => (
                  <TouchableOpacity
                    key={item.city}
                    style={[
                      styles.cityChip,
                      city === item.city && styles.cityChipSelected,
                    ]}
                    onPress={() => setCity(item.city)}
                  >
                    <Text style={styles.cityEmoji}>{item.emoji}</Text>
                    <Text
                      style={[
                        styles.cityLabel,
                        city === item.city && styles.cityLabelSelected,
                      ]}
                    >
                      {item.city}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>How long are you there?</Text>
              <View style={styles.durationGrid}>
                {TRAVEL_DURATIONS.map(opt => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.durationOption,
                      duration === opt.value && styles.durationOptionSelected,
                    ]}
                    onPress={() => setDuration(opt.value)}
                  >
                    <Text style={styles.durationEmoji}>{opt.emoji}</Text>
                    <Text
                      style={[
                        styles.durationLabel,
                        duration === opt.value && styles.durationLabelSelected,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.howItWorks}>
              <Text style={styles.howTitle}>How Travel Mode works</Text>
              {[
                '🗺️  Your profile shows your travel destination',
                '💬  You can still message existing pods',
                '🔒  Your home location stays private',
                '⏰  Auto-turns off when duration ends',
                '💛  Real connections anywhere in the world',
              ].map((item, i) => (
                <Text key={i} style={styles.howItem}>
                  {item}
                </Text>
              ))}
            </View>
          </>
        )}

        {/* Home Mode Info */}
        {!travelMode && (
          <View style={styles.homeModeBox}>
            <Text style={styles.homeModeTitle}>📍 Home mode active</Text>
            <Text style={styles.homeModeText}>
              You are currently seeing matches near your home location.
              Turn on Travel Mode whenever you are away and want to
              connect with people in a new city.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Save Button */}
      <View style={styles.bottomArea}>
        <TouchableOpacity
          style={[
            styles.saveButton,
            travelMode && !city && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={saving || (travelMode && !city)}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>
              {travelMode
                ? city
                  ? `Set destination to ${city} →`
                  : 'Enter a city to continue'
                : 'Save — Stay Local'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 32,
    gap: 20,
  },
  header: {
    alignItems: 'center',
    gap: 10,
    paddingBottom: 8,
  },
  headerEmoji: {
    fontSize: 48,
  },
  title: {
    fontSize: 26,
    fontWeight: '600',
    color: '#1A1A18',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B6B68',
    lineHeight: 22,
    textAlign: 'center',
  },
  toggleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EBEBEA',
    padding: 18,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A18',
    marginBottom: 3,
  },
  toggleSubtitle: {
    fontSize: 12,
    color: '#6B6B68',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A18',
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B6B68',
  },
  cityInput: {
    height: 52,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#EBEBEA',
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#1A1A18',
  },
  cityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 9999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EBEBEA',
  },
  cityChipSelected: {
    backgroundColor: 'rgba(200,90,42,0.08)',
    borderColor: '#C85A2A',
  },
  cityEmoji: {
    fontSize: 13,
  },
  cityLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B6B68',
  },
  cityLabelSelected: {
    color: '#C85A2A',
    fontWeight: '600',
  },
  durationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  durationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EBEBEA',
  },
  durationOptionSelected: {
    backgroundColor: 'rgba(200,90,42,0.08)',
    borderColor: '#C85A2A',
  },
  durationEmoji: {
    fontSize: 14,
  },
  durationLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B6B68',
  },
  durationLabelSelected: {
    color: '#C85A2A',
    fontWeight: '600',
  },
  howItWorks: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F5F4F2',
    borderWidth: 1,
    borderColor: '#EBEBEA',
    gap: 8,
  },
  howTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A18',
    marginBottom: 4,
  },
  howItem: {
    fontSize: 13,
    color: '#6B6B68',
    lineHeight: 20,
  },
  homeModeBox: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FDF0EB',
    borderWidth: 1,
    borderColor: '#F2D4C8',
    gap: 8,
  },
  homeModeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C85A2A',
  },
  homeModeText: {
    fontSize: 13,
    color: '#C85A2A',
    opacity: 0.8,
    lineHeight: 20,
  },
  bottomArea: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EBEBEA',
  },
  saveButton: {
    height: 54,
    borderRadius: 16,
    backgroundColor: '#C85A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#E8E8E4',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
})