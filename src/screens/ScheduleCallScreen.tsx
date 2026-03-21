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

const TIME_SLOTS = [
  '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM',
  '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM',
  '8:00 PM', '9:00 PM', '10:00 PM',
]

function getNextDays(count: number) {
  const days = []
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  for (let i = 0; i < count; i++) {
    const date = new Date()
    date.setDate(date.getDate() + i)
    days.push({
      label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : dayNames[date.getDay()],
      sublabel: `${monthNames[date.getMonth()]} ${date.getDate()}`,
      date,
    })
  }
  return days
}

export default function ScheduleCallScreen({ navigation, route }: any) {
  const matchId = route?.params?.matchId ?? null
  const matchName = route?.params?.matchName ?? 'Your Match'
  const userId = route?.params?.userId ?? null

  const [selectedDay, setSelectedDay] = useState(0)
  const [selectedTime, setSelectedTime] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  const days = getNextDays(7)

  async function handleSchedule() {
    if (!selectedTime) {
      if (Platform.OS === 'web') {
        window.alert('Please select a time.')
      } else {
        Alert.alert('Select a time', 'Please pick a time slot.')
      }
      return
    }

    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const selectedDate = days[selectedDay].date
    const [time, period] = selectedTime.split(' ')
    const [hours, minutes] = time.split(':')
    let hour = parseInt(hours)
    if (period === 'PM' && hour !== 12) hour += 12
    if (period === 'AM' && hour === 12) hour = 0
    selectedDate.setHours(hour, parseInt(minutes), 0, 0)

    const { error } = await supabase
      .from('scheduled_calls')
      .insert({
        match_id: matchId,
        user_one: user.id,
        user_two: userId,
        scheduled_at: selectedDate.toISOString(),
        status: 'pending',
      })

    setSaving(false)

    if (error) {
      if (Platform.OS === 'web') {
        window.alert('Error: ' + error.message)
      } else {
        Alert.alert('Error', error.message)
      }
      return
    }

    setConfirmed(true)
  }

  if (confirmed) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.confirmedWrap}>
          <Text style={styles.confirmedEmoji}>📅</Text>
          <Text style={styles.confirmedTitle}>Call Scheduled!</Text>
          <Text style={styles.confirmedSub}>
            {days[selectedDay].label} · {selectedTime}
          </Text>
          <Text style={styles.confirmedNote}>
            {matchName} will be notified. Your 15-minute call will unlock the reveal if you both stay on for the full time.
          </Text>
          <View style={styles.revealInfo}>
            <Text style={styles.revealInfoTitle}>⏱️ How the reveal works</Text>
            <Text style={styles.revealInfoText}>
              Stay on the call for 15 minutes → photos automatically reveal for both of you. If either person hangs up early, photos stay hidden.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => navigation.navigate('Messages')}
          >
            <Text style={styles.doneBtnText}>Back to Messages →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Header */}
        <View style={styles.matchBox}>
          <Text style={styles.matchTitle}>Call with {matchName}</Text>
          <Text style={styles.matchSub}>
            Stay on for 15 minutes to unlock the photo reveal
          </Text>
        </View>

        {/* Timer Info */}
        <View style={styles.timerBox}>
          <Text style={styles.timerBoxTitle}>⏱️ 15 minute minimum</Text>
          <Text style={styles.timerBoxText}>
            A timer runs during your call. At 15 minutes both photos automatically reveal. No contact info is ever exchanged — everything happens inside Versant.
          </Text>
        </View>

        {/* Day Picker */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pick a day</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dayScroll}
          >
            {days.map((day, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayCard,
                  selectedDay === index && styles.dayCardSelected,
                ]}
                onPress={() => setSelectedDay(index)}
              >
                <Text style={[
                  styles.dayLabel,
                  selectedDay === index && styles.dayLabelSelected,
                ]}>
                  {day.label}
                </Text>
                <Text style={[
                  styles.daySubLabel,
                  selectedDay === index && styles.daySubLabelSelected,
                ]}>
                  {day.sublabel}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Time Picker */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pick a time</Text>
          <View style={styles.timeGrid}>
            {TIME_SLOTS.map(time => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.timeSlot,
                  selectedTime === time && styles.timeSlotSelected,
                ]}
                onPress={() => setSelectedTime(time)}
              >
                <Text style={[
                  styles.timeSlotText,
                  selectedTime === time && styles.timeSlotTextSelected,
                ]}>
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Privacy Note */}
        <View style={styles.privacyBox}>
          <Text style={styles.privacyText}>
            🔒 No phone numbers or contact info is ever shared. Your call happens entirely inside Versant.
          </Text>
        </View>
      </ScrollView>

      {/* Schedule Button */}
      <View style={styles.bottomArea}>
        <TouchableOpacity
          style={[
            styles.scheduleBtn,
            !selectedTime && styles.scheduleBtnDisabled,
          ]}
          onPress={handleSchedule}
          disabled={saving || !selectedTime}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.scheduleBtnText}>
              {selectedTime
                ? `Schedule for ${days[selectedDay].label} · ${selectedTime}`
                : 'Select a time to continue'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAF8' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#EBEBEA',
  },
  backText: { fontSize: 15, color: '#C85A2A', fontWeight: '500' },
  topTitle: { fontSize: 17, fontWeight: '600', color: '#1A1A18' },
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32, gap: 16 },
  matchBox: {
    padding: 16, borderRadius: 16, backgroundColor: '#FDF0EB',
    borderWidth: 1, borderColor: '#F2D4C8', gap: 4,
  },
  matchTitle: { fontSize: 15, fontWeight: '600', color: '#C85A2A' },
  matchSub: { fontSize: 12, color: '#C85A2A', opacity: 0.8 },
  timerBox: {
    padding: 16, borderRadius: 16, backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: '#EBEBEA', gap: 8,
  },
  timerBoxTitle: { fontSize: 14, fontWeight: '600', color: '#1A1A18' },
  timerBoxText: { fontSize: 13, color: '#6B6B68', lineHeight: 20 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#1A1A18' },
  dayScroll: { gap: 8, paddingRight: 4 },
  dayCard: {
    alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16,
    borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1.5,
    borderColor: '#EBEBEA', minWidth: 72,
  },
  dayCardSelected: { backgroundColor: 'rgba(200,90,42,0.08)', borderColor: '#C85A2A' },
  dayLabel: { fontSize: 13, fontWeight: '600', color: '#1A1A18' },
  dayLabelSelected: { color: '#C85A2A' },
  daySubLabel: { fontSize: 11, color: '#ABABAA', marginTop: 2 },
  daySubLabelSelected: { color: '#C85A2A', opacity: 0.7 },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeSlot: {
    paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12,
    backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#EBEBEA',
  },
  timeSlotSelected: { backgroundColor: 'rgba(200,90,42,0.08)', borderColor: '#C85A2A' },
  timeSlotText: { fontSize: 13, fontWeight: '500', color: '#6B6B68' },
  timeSlotTextSelected: { color: '#C85A2A', fontWeight: '600' },
  privacyBox: {
    padding: 14, borderRadius: 14, backgroundColor: '#F5F4F2',
    borderWidth: 1, borderColor: '#EBEBEA',
  },
  privacyText: { fontSize: 12, color: '#6B6B68', lineHeight: 18 },
  bottomArea: {
    padding: 20, backgroundColor: '#FFFFFF',
    borderTopWidth: 1, borderTopColor: '#EBEBEA',
  },
  scheduleBtn: {
    height: 54, borderRadius: 16, backgroundColor: '#C85A2A',
    alignItems: 'center', justifyContent: 'center',
  },
  scheduleBtnDisabled: { backgroundColor: '#E8E8E4' },
  scheduleBtnText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  confirmedWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: 32, gap: 14,
  },
  confirmedEmoji: { fontSize: 56 },
  confirmedTitle: { fontSize: 24, fontWeight: '600', color: '#1A1A18', letterSpacing: -0.3 },
  confirmedSub: { fontSize: 16, fontWeight: '500', color: '#C85A2A' },
  confirmedNote: {
    fontSize: 14, color: '#6B6B68', textAlign: 'center',
    lineHeight: 22, paddingHorizontal: 8,
  },
  revealInfo: {
    width: '100%', padding: 16, borderRadius: 16,
    backgroundColor: '#FDF0EB', borderWidth: 1, borderColor: '#F2D4C8', gap: 6,
  },
  revealInfoTitle: { fontSize: 13, fontWeight: '600', color: '#C85A2A' },
  revealInfoText: { fontSize: 12, color: '#C85A2A', opacity: 0.8, lineHeight: 18 },
  doneBtn: {
    height: 52, paddingHorizontal: 32, borderRadius: 16,
    backgroundColor: '#C85A2A', alignItems: 'center', justifyContent: 'center',
  },
  doneBtnText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
})