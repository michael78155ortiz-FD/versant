import React, { useState } from 'react'
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
import { notifyCallScheduled } from '../lib/notifications'

const DAYS = [
  { label: 'Today', sublabel: 'Mar 31' },
  { label: 'Tomorrow', sublabel: 'Apr 1' },
  { label: 'Mon', sublabel: 'Apr 2' },
  { label: 'Tue', sublabel: 'Apr 3' },
  { label: 'Wed', sublabel: 'Apr 4' },
  { label: 'Thu', sublabel: 'Apr 5' },
  { label: 'Fri', sublabel: 'Apr 6' },
]

const TIMES = [
  '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM',
  '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM',
  '8:00 PM', '9:00 PM', '10:00 PM',
]

export default function ScheduleCallScreen({ navigation, route }: any) {
  const [selectedDay, setSelectedDay] = useState(0)
  const [selectedTime, setSelectedTime] = useState('12:00 PM')
  const [saving, setSaving] = useState(false)

  const matchId = route?.params?.matchId ?? null
  const matchName = route?.params?.matchName ?? 'Your Match'
  const userId = route?.params?.userId ?? null

  async function handleSchedule() {
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setSaving(false)
      return
    }

    const day = DAYS[selectedDay]
    const scheduledAt = `${day.sublabel} 2026 ${selectedTime}`

    const { error } = await supabase
      .from('scheduled_calls')
      .insert({
        match_id: matchId ?? 'unknown',
        user_one: user.id,
        user_two: userId ?? 'unknown',
        scheduled_at: new Date(scheduledAt).toISOString(),
        status: 'scheduled',
      })

    if (error) {
      if (Platform.OS === 'web') {
        window.alert('Error scheduling call: ' + error.message)
      } else {
        Alert.alert('Error', error.message)
      }
      setSaving(false)
      return
    }

    await notifyCallScheduled(matchName, new Date(scheduledAt).toISOString())

    setSaving(false)

    if (Platform.OS === 'web') {
      window.alert(`Call scheduled with ${matchName} on ${day.label} at ${selectedTime}`)
    } else {
      Alert.alert(
        'Call Scheduled! 📞',
        `Your call with ${matchName} is set for ${day.label} at ${selectedTime}.\n\nYou will both need to stay on for 15 minutes for photos to reveal.`,
        [{ text: 'Got it', onPress: () => navigation.goBack() }]
      )
    }

    navigation.goBack()
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>Schedule a Call</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.heroBox}>
          <Text style={styles.heroIcon}>📞</Text>
          <Text style={styles.heroTitle}>Call with {matchName}</Text>
          <Text style={styles.heroSub}>
            Stay on for 15 minutes together and photos reveal automatically for both of you.
          </Text>
        </View>

        <View style={styles.ruleBox}>
          <View style={styles.ruleRow}>
            <Text style={styles.ruleIcon}>⏱️</Text>
            <Text style={styles.ruleText}>15 minute minimum</Text>
          </View>
          <Text style={styles.ruleSub}>
            A timer runs during your call. At 15 minutes both photos automatically reveal. No contact info is ever exchanged — everything happens inside Versant.
          </Text>
        </View>

        <Text style={styles.sectionLabel}>Pick a day</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daysRow}>
          {DAYS.map((day, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.dayBtn, selectedDay === index && styles.dayBtnActive]}
              onPress={() => setSelectedDay(index)}
            >
              <Text style={[styles.dayLabel, selectedDay === index && styles.dayLabelActive]}>
                {day.label}
              </Text>
              <Text style={[styles.daySub, selectedDay === index && styles.daySubActive]}>
                {day.sublabel}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.sectionLabel}>Pick a time</Text>
        <View style={styles.timesGrid}>
          {TIMES.map(time => (
            <TouchableOpacity
              key={time}
              style={[styles.timeBtn, selectedTime === time && styles.timeBtnActive]}
              onPress={() => setSelectedTime(time)}
            >
              <Text style={[styles.timeText, selectedTime === time && styles.timeTextActive]}>
                {time}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>
            📅 {DAYS[selectedDay].label} at {selectedTime}
          </Text>
          <Text style={styles.summarySub}>
            with {matchName}
          </Text>
        </View>

        <View style={styles.privacyNote}>
          <Text style={styles.privacyText}>
            🔒 No phone numbers or contact info is ever shared. Your call happens entirely inside Versant.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.scheduleBtn, saving && styles.scheduleBtnDisabled]}
          onPress={handleSchedule}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.scheduleBtnText}>Confirm Call Schedule →</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAF8' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EBEBEA' },
  backText: { fontSize: 15, color: '#C85A2A', fontWeight: '500' },
  topTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A18' },
  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 48, gap: 16 },
  heroBox: { alignItems: 'center', padding: 24, backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#EBEBEA', gap: 8 },
  heroIcon: { fontSize: 48 },
  heroTitle: { fontSize: 20, fontWeight: '600', color: '#1A1A18', textAlign: 'center' },
  heroSub: { fontSize: 13, color: '#6B6B68', textAlign: 'center', lineHeight: 20 },
  ruleBox: { padding: 16, borderRadius: 16, backgroundColor: '#FDF0EB', borderWidth: 1, borderColor: '#F2D4C8', gap: 8 },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ruleIcon: { fontSize: 18 },
  ruleText: { fontSize: 15, fontWeight: '600', color: '#C85A2A' },
  ruleSub: { fontSize: 13, color: '#C85A2A', opacity: 0.8, lineHeight: 20 },
  sectionLabel: { fontSize: 15, fontWeight: '600', color: '#1A1A18' },
  daysRow: { gap: 8, paddingRight: 4 },
  dayBtn: { alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#EBEBEA', minWidth: 72 },
  dayBtnActive: { backgroundColor: '#C85A2A', borderColor: '#C85A2A' },
  dayLabel: { fontSize: 13, fontWeight: '600', color: '#1A1A18' },
  dayLabelActive: { color: '#FFFFFF' },
  daySub: { fontSize: 11, color: '#ABABAA', marginTop: 2 },
  daySubActive: { color: 'rgba(255,255,255,0.8)' },
  timesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#EBEBEA' },
  timeBtnActive: { backgroundColor: '#C85A2A', borderColor: '#C85A2A' },
  timeText: { fontSize: 13, fontWeight: '500', color: '#1A1A18' },
  timeTextActive: { color: '#FFFFFF', fontWeight: '600' },
  summaryBox: { padding: 16, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EBEBEA', alignItems: 'center', gap: 4 },
  summaryTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A18' },
  summarySub: { fontSize: 13, color: '#6B6B68' },
  privacyNote: { padding: 14, borderRadius: 14, backgroundColor: '#E8F8F2', borderWidth: 1, borderColor: '#C0EAD8' },
  privacyText: { fontSize: 12, color: '#1D9E75', lineHeight: 18 },
  scheduleBtn: { height: 56, borderRadius: 18, backgroundColor: '#C85A2A', alignItems: 'center', justifyContent: 'center', shadowColor: '#C85A2A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12 },
  scheduleBtnDisabled: { opacity: 0.5 },
  scheduleBtnText: { fontSize: 17, fontWeight: '600', color: '#FFFFFF', letterSpacing: -0.2 },
})