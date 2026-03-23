import React, { useState, useRef } from 'react'
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

const CORE_VALUES = [
  { v: 'family', l: 'Family', e: '👨‍👩‍👧' },
  { v: 'honesty', l: 'Honesty', e: '🤝' },
  { v: 'loyalty', l: 'Loyalty', e: '💛' },
  { v: 'faith', l: 'Faith', e: '🙏' },
  { v: 'kindness', l: 'Kindness', e: '💖' },
  { v: 'ambition', l: 'Ambition', e: '🚀' },
  { v: 'humor', l: 'Humor', e: '😂' },
  { v: 'freedom', l: 'Freedom', e: '🦅' },
  { v: 'growth', l: 'Growth', e: '🌱' },
  { v: 'compassion', l: 'Compassion', e: '🫂' },
  { v: 'security', l: 'Security', e: '🏠' },
  { v: 'integrity', l: 'Integrity', e: '⚖️' },
]

const LIFESTYLE_WANTS = [
  { v: 'travel', l: 'Travel often', e: '✈️' },
  { v: 'homeowner', l: 'Own a home', e: '🏡' },
  { v: 'build', l: 'Build something', e: '💼' },
  { v: 'fitness', l: 'Stay fit', e: '💪' },
  { v: 'creativity', l: 'Create things', e: '🎨' },
  { v: 'community', l: 'Build community', e: '🤝' },
  { v: 'balance', l: 'Work life balance', e: '⚖️' },
  { v: 'adventure', l: 'Adventure', e: '🧗' },
  { v: 'peace', l: 'Peaceful simple life', e: '🌿' },
  { v: 'success', l: 'Career success', e: '📈' },
  { v: 'spiritual', l: 'Spiritual life', e: '✨' },
  { v: 'giving', l: 'Give back', e: '🙌' },
]

const KIDS_OPTS = [
  { v: 'soon', l: 'Yes — soon', e: '👶' },
  { v: 'later', l: 'Yes — later', e: '⏳' },
  { v: 'maybe', l: 'Maybe', e: '🤔' },
  { v: 'never', l: 'Child free', e: '🚫' },
]

const VISION_OPTS = [
  { v: 'city', l: 'Big city energy', e: '🏙️' },
  { v: 'suburbs', l: 'Suburbs and family', e: '🏡' },
  { v: 'travel', l: 'Travel and explore', e: '✈️' },
  { v: 'rural', l: 'Quiet rural life', e: '🌾' },
  { v: 'career', l: 'Career driven', e: '💼' },
]

const LOCATION_OPTS = [
  { v: 'local', l: 'Stay local', e: '📍' },
  { v: 'open', l: 'Open to moving', e: '🗺️' },
  { v: 'love', l: 'Follow love anywhere', e: '💕' },
  { v: 'remote', l: 'Remote anywhere', e: '💻' },
]

const LOVE_LANG = [
  { v: 'words', l: 'Words of affirmation', e: '💬' },
  { v: 'quality', l: 'Quality time', e: '⏰' },
  { v: 'touch', l: 'Physical touch', e: '🤗' },
  { v: 'acts', l: 'Acts of service', e: '🛠️' },
  { v: 'gifts', l: 'Thoughtful gifts', e: '🎁' },
]

const ACTIVITY_OPTS = [
  { v: 'very', l: 'Very active — every day', e: '💪' },
  { v: 'moderate', l: 'Moderate — few times a week', e: '🚶' },
  { v: 'light', l: 'Light — mostly home', e: '🏠' },
  { v: 'building', l: 'Building new habits', e: '🌱' },
]

const WEEK_OPTS = [
  { v: 'gym', l: 'Gym workouts', e: '🏋️' },
  { v: 'walks', l: 'Morning or evening walks', e: '🚶' },
  { v: 'market', l: 'Farmers market weekends', e: '🥦' },
  { v: 'cooking', l: 'Cooking at home', e: '👨‍🍳' },
  { v: 'social', l: 'Social events and going out', e: '🎉' },
  { v: 'homebody', l: 'Staying in and relaxing', e: '🛋️' },
  { v: 'hiking', l: 'Hiking and nature', e: '🏕️' },
  { v: 'arts', l: 'Museums or live events', e: '🎭' },
  { v: 'volunteering', l: 'Volunteering', e: '🙌' },
  { v: 'sports', l: 'Watching or playing sports', e: '⚽' },
  { v: 'trips', l: 'Weekend trips', e: '🚗' },
  { v: 'reading', l: 'Reading and learning', e: '📚' },
]

const CONFLICT_OPTS = [
  { v: 'calm', l: 'Talk it out calmly', e: '🕊️' },
  { v: 'listen', l: 'Listen first then respond', e: '👂' },
  { v: 'space', l: 'Need space then talk', e: '🚶' },
  { v: 'direct', l: 'Address it immediately', e: '⚡' },
  { v: 'therapy', l: 'Therapy oriented approach', e: '💆' },
]

const DEALBREAKERS = [
  { v: 'smoking', l: 'Smoking', e: '🚬' },
  { v: 'drinking', l: 'Heavy drinking', e: '🍺' },
  { v: 'drugs', l: 'Drug use', e: '💊' },
  { v: 'nokids', l: 'Never wants kids', e: '🚫' },
  { v: 'distance', l: 'Long distance', e: '✈️' },
  { v: 'nomarriage', l: 'Against marriage', e: '💍' },
  { v: 'noambition', l: 'No drive or ambition', e: '😴' },
  { v: 'differentfaith', l: 'Different faith', e: '⛪' },
]

const ATTACHMENT_OPTS = [
  { v: 'secure', l: 'Comfortable with both closeness and independence', e: '💚' },
  { v: 'anxious', l: 'I worry when my partner pulls away', e: '💛' },
  { v: 'avoidant', l: 'I value independence and can feel crowded', e: '🔵' },
  { v: 'disorganized', l: 'I want closeness but it sometimes feels scary', e: '🔴' },
]

interface SectionState {
  values: boolean
  wants: boolean
  lifePlans: boolean
  connect: boolean
  lifestyle: boolean
  mindset: boolean
  dealbreakers: boolean
}

export default function QuizScreen({ navigation }: any) {
  const [saving, setSaving] = useState(false)
  const scrollRef = useRef<ScrollView>(null)

  const [openSections, setOpenSections] = useState<SectionState>({
    values: true,
    wants: false,
    lifePlans: false,
    connect: false,
    lifestyle: false,
    mindset: false,
    dealbreakers: false,
  })

  const [coreValues, setCoreValues] = useState<string[]>([])
  const [lifestyleWants, setLifestyleWants] = useState<string[]>([])
  const [kids, setKids] = useState('')
  const [vision, setVision] = useState('')
  const [location, setLocation] = useState('')
  const [loveLanguage, setLoveLanguage] = useState<string[]>([])
  const [independence, setIndependence] = useState(5)
  const [activity, setActivity] = useState('')
  const [week, setWeek] = useState<string[]>([])
  const [conflict, setConflict] = useState<string[]>([])
  const [attachment, setAttachment] = useState('')
  const [dealbreakers, setDealbreakers] = useState<string[]>([])

  function toggleSection(key: keyof SectionState) {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  function toggleMulti(
    value: string,
    current: string[],
    setter: (v: string[]) => void,
    max: number
  ) {
    if (current.includes(value)) {
      setter(current.filter(v => v !== value))
    } else if (current.length < max) {
      setter([...current, value])
    }
  }

  function getProgress(): number {
    let done = 0
    if (coreValues.length >= 3) done++
    if (lifestyleWants.length >= 3) done++
    if (kids && vision && location) done++
    if (loveLanguage.length >= 1) done++
    if (activity) done++
    if (conflict.length >= 1) done++
    done++ // dealbreakers always counts
    return Math.round((done / 7) * 100)
  }

  async function handleFinish() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const quizAnswers = {
      coreValues,
      lifestyleWants,
      kids,
      vision,
      location,
      loveLanguage,
      independence,
      activity,
      week,
      conflict,
      attachment,
      dealbreakers,
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        quiz_answers: quizAnswers,
        attachment_style: attachment,
        dealbreakers,
        quiz_completed: true,
      })
      .eq('id', user.id)

    setSaving(false)

    if (error) {
      if (Platform.OS === 'web') {
        window.alert('Error: ' + error.message)
      } else {
        Alert.alert('Error', error.message)
      }
      return
    }

    navigation.navigate('Discover')
  }

  const progress = getProgress()

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.navigate('Discover')}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>Compatibility Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.header}>
          <Text style={styles.subtitle}>
            Your answers are only used to match you — never shown to other users.
          </Text>
        </View>

        {/* SECTION 1 — Core Values */}
        <Section
          icon="💛"
          title="Core values"
          subtitle="Who you are at your core"
          badge={coreValues.length >= 3 ? `${coreValues.length} selected` : 'Pick 3–5'}
          done={coreValues.length >= 3}
          open={openSections.values}
          onToggle={() => toggleSection('values')}
        >
          <Text style={styles.hint}>Select 3 to 5</Text>
          <ChipGrid
            options={CORE_VALUES}
            selected={coreValues}
            onToggle={v => toggleMulti(v, coreValues, setCoreValues, 5)}
          />
        </Section>

        {/* SECTION 2 — Lifestyle Wants */}
        <Section
          icon="🌟"
          title="What you want in life"
          subtitle="Your lifestyle goals"
          badge={lifestyleWants.length >= 3 ? `${lifestyleWants.length} selected` : 'Pick 3–5'}
          done={lifestyleWants.length >= 3}
          open={openSections.wants}
          onToggle={() => toggleSection('wants')}
        >
          <Text style={styles.hint}>Select 3 to 5</Text>
          <ChipGrid
            options={LIFESTYLE_WANTS}
            selected={lifestyleWants}
            onToggle={v => toggleMulti(v, lifestyleWants, setLifestyleWants, 5)}
          />
        </Section>

        {/* SECTION 3 — Life Plans */}
        <Section
          icon="🗺️"
          title="Life plans"
          subtitle="Kids, vision, location"
          badge={kids && vision && location ? 'Done' : '3 questions'}
          done={!!(kids && vision && location)}
          open={openSections.lifePlans}
          onToggle={() => toggleSection('lifePlans')}
        >
          <Text style={styles.hint}>Kids?</Text>
          <SingleSelect options={KIDS_OPTS} selected={kids} onSelect={setKids} />
          <Text style={[styles.hint, { marginTop: 16 }]}>Where do you see yourself in 10 years?</Text>
          <SingleSelect options={VISION_OPTS} selected={vision} onSelect={setVision} />
          <Text style={[styles.hint, { marginTop: 16 }]}>Location flexibility?</Text>
          <SingleSelect options={LOCATION_OPTS} selected={location} onSelect={setLocation} />
        </Section>

        {/* SECTION 4 — How You Connect */}
        <Section
          icon="💬"
          title="How you connect"
          subtitle="Love language and space"
          badge={loveLanguage.length >= 1 ? 'Done' : '2 questions'}
          done={loveLanguage.length >= 1}
          open={openSections.connect}
          onToggle={() => toggleSection('connect')}
        >
          <Text style={styles.hint}>Love language — pick top 2</Text>
          <ChipGrid
            options={LOVE_LANG}
            selected={loveLanguage}
            onToggle={v => toggleMulti(v, loveLanguage, setLoveLanguage, 2)}
          />
          <Text style={[styles.hint, { marginTop: 16 }]}>How much alone time do you need?</Text>
          <View style={styles.sliderWrap}>
            <Text style={styles.sliderCurrent}>
              {independence <= 3 ? '🤝 Very together' : independence <= 6 ? '⚖️ Balanced' : '🦅 Lots of independence'}
            </Text>
            <View style={styles.sliderDots}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                <TouchableOpacity
                  key={n}
                  style={[styles.sliderDot, independence === n && styles.sliderDotActive]}
                  onPress={() => setIndependence(n)}
                >
                  <Text style={[styles.sliderDotText, independence === n && styles.sliderDotTextActive]}>
                    {n}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>Always together</Text>
              <Text style={styles.sliderLabel}>Lots of space</Text>
            </View>
          </View>
        </Section>

        {/* SECTION 5 — Lifestyle */}
        <Section
          icon="🏃"
          title="Your lifestyle"
          subtitle="Activity and typical week"
          badge={activity ? 'Done' : '2 questions'}
          done={!!activity}
          open={openSections.lifestyle}
          onToggle={() => toggleSection('lifestyle')}
        >
          <Text style={styles.hint}>Activity level?</Text>
          <SingleSelect options={ACTIVITY_OPTS} selected={activity} onSelect={setActivity} />
          <Text style={[styles.hint, { marginTop: 16 }]}>Your typical week — select all that fit</Text>
          <ChipGrid
            options={WEEK_OPTS}
            selected={week}
            onToggle={v => toggleMulti(v, week, setWeek, 12)}
          />
        </Section>

        {/* SECTION 6 — Mindset */}
        <Section
          icon="🧠"
          title="How you think"
          subtitle="Conflict style and attachment"
          badge={conflict.length >= 1 && attachment ? 'Done' : '2 questions'}
          done={conflict.length >= 1 && !!attachment}
          open={openSections.mindset}
          onToggle={() => toggleSection('mindset')}
        >
          <Text style={styles.hint}>How you handle conflict — pick up to 2</Text>
          <ChipGrid
            options={CONFLICT_OPTS}
            selected={conflict}
            onToggle={v => toggleMulti(v, conflict, setConflict, 2)}
          />
          <Text style={[styles.hint, { marginTop: 16 }]}>Your attachment style</Text>
          <SingleSelect options={ATTACHMENT_OPTS} selected={attachment} onSelect={setAttachment} />
        </Section>

        {/* SECTION 7 — Dealbreakers */}
        <Section
          icon="🚫"
          title="Dealbreakers"
          subtitle="Non-negotiables — optional"
          badge={dealbreakers.length > 0 ? `${dealbreakers.length} selected` : 'Optional'}
          done={dealbreakers.length > 0}
          open={openSections.dealbreakers}
          onToggle={() => toggleSection('dealbreakers')}
        >
          <Text style={styles.hint}>Select anything that would end things</Text>
          <ChipGrid
            options={DEALBREAKERS}
            selected={dealbreakers}
            onToggle={v => toggleMulti(v, dealbreakers, setDealbreakers, 8)}
          />
        </Section>

        {/* Privacy Note */}
        <View style={styles.privacyNote}>
          <Text style={styles.privacyText}>
            🔒 Your quiz answers are only used to match you — they are never shown to other users.
          </Text>
        </View>

        {/* Finish Button */}
        <TouchableOpacity
          style={styles.finishBtn}
          onPress={handleFinish}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.finishBtnText}>Find My Matches 💛</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

function Section({
  icon, title, subtitle, badge, done, open, onToggle, children
}: {
  icon: string
  title: string
  subtitle: string
  badge: string
  done: boolean
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <View style={sectionStyles.wrap}>
      <TouchableOpacity style={sectionStyles.header} onPress={onToggle}>
        <View style={sectionStyles.left}>
          <Text style={sectionStyles.icon}>{icon}</Text>
          <View>
            <Text style={sectionStyles.title}>{title}</Text>
            <Text style={sectionStyles.subtitle}>{subtitle}</Text>
          </View>
        </View>
        <View style={sectionStyles.right}>
          <View style={[sectionStyles.badge, done && sectionStyles.badgeDone]}>
            <Text style={[sectionStyles.badgeText, done && sectionStyles.badgeTextDone]}>
              {badge}
            </Text>
          </View>
          <Text style={sectionStyles.chevron}>{open ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>
      {open && (
        <View style={sectionStyles.body}>
          {children}
        </View>
      )}
    </View>
  )
}

function ChipGrid({
  options, selected, onToggle
}: {
  options: { v: string; l: string; e: string }[]
  selected: string[]
  onToggle: (v: string) => void
}) {
  return (
    <View style={chipStyles.grid}>
      {options.map(opt => {
        const isSelected = selected.includes(opt.v)
        return (
          <TouchableOpacity
            key={opt.v}
            style={[chipStyles.chip, isSelected && chipStyles.chipSelected]}
            onPress={() => onToggle(opt.v)}
          >
            <Text style={chipStyles.emoji}>{opt.e}</Text>
            <Text style={[chipStyles.label, isSelected && chipStyles.labelSelected]}>
              {opt.l}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

function SingleSelect({
  options, selected, onSelect
}: {
  options: { v: string; l: string; e: string }[]
  selected: string
  onSelect: (v: string) => void
}) {
  return (
    <View style={singleStyles.grid}>
      {options.map(opt => {
        const isSelected = selected === opt.v
        return (
          <TouchableOpacity
            key={opt.v}
            style={[singleStyles.option, isSelected && singleStyles.optionSelected]}
            onPress={() => onSelect(opt.v)}
          >
            <Text style={singleStyles.emoji}>{opt.e}</Text>
            <Text style={[singleStyles.label, isSelected && singleStyles.labelSelected]}>
              {opt.l}
            </Text>
            {isSelected && <Text style={singleStyles.check}>✓</Text>}
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAF8' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EBEBEA' },
  topTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A18' },
  skipText: { fontSize: 13, color: '#ABABAA', fontWeight: '500' },
  progressTrack: { height: 3, backgroundColor: '#F5F4F2' },
  progressFill: { height: '100%', backgroundColor: '#C85A2A' },
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 48, gap: 10 },
  header: { marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#6B6B68', lineHeight: 20, textAlign: 'center' },
  hint: { fontSize: 12, color: '#ABABAA', fontWeight: '500', marginBottom: 10 },
  sliderWrap: { gap: 10 },
  sliderCurrent: { fontSize: 14, fontWeight: '600', color: '#C85A2A', textAlign: 'center' },
  sliderDots: { flexDirection: 'row', justifyContent: 'space-between', gap: 3 },
  sliderDot: { flex: 1, height: 32, borderRadius: 16, backgroundColor: '#F5F4F2', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#EBEBEA' },
  sliderDotActive: { backgroundColor: '#C85A2A', borderColor: '#C85A2A' },
  sliderDotText: { fontSize: 11, fontWeight: '600', color: '#6B6B68' },
  sliderDotTextActive: { color: '#FFFFFF' },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  sliderLabel: { fontSize: 10, color: '#ABABAA' },
  privacyNote: { padding: 14, borderRadius: 14, backgroundColor: '#E8F8F2', borderWidth: 1, borderColor: '#C0EAD8' },
  privacyText: { fontSize: 13, color: '#1D9E75', lineHeight: 20, textAlign: 'center' },
  finishBtn: { height: 56, borderRadius: 18, backgroundColor: '#C85A2A', alignItems: 'center', justifyContent: 'center', shadowColor: '#C85A2A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12 },
  finishBtnText: { fontSize: 17, fontWeight: '600', color: '#FFFFFF', letterSpacing: -0.2 },
})

const sectionStyles = StyleSheet.create({
  wrap: { backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#EBEBEA', overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  left: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { fontSize: 22 },
  title: { fontSize: 15, fontWeight: '600', color: '#1A1A18' },
  subtitle: { fontSize: 12, color: '#6B6B68', marginTop: 2 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { paddingVertical: 3, paddingHorizontal: 10, borderRadius: 20, backgroundColor: '#F5F4F2', borderWidth: 1, borderColor: '#EBEBEA' },
  badgeDone: { backgroundColor: '#FDF0EB', borderColor: '#F2D4C8' },
  badgeText: { fontSize: 11, color: '#6B6B68', fontWeight: '500' },
  badgeTextDone: { color: '#C85A2A', fontWeight: '600' },
  chevron: { fontSize: 10, color: '#ABABAA' },
  body: { paddingHorizontal: 16, paddingBottom: 16, borderTopWidth: 1, borderTopColor: '#F5F4F2', paddingTop: 14 },
})

const chipStyles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 9999, backgroundColor: '#FAFAF8', borderWidth: 1.5, borderColor: '#EBEBEA' },
  chipSelected: { backgroundColor: 'rgba(200,90,42,0.08)', borderColor: '#C85A2A' },
  emoji: { fontSize: 13 },
  label: { fontSize: 13, fontWeight: '500', color: '#6B6B68' },
  labelSelected: { color: '#C85A2A', fontWeight: '600' },
})

const singleStyles = StyleSheet.create({
  grid: { gap: 8 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, backgroundColor: '#FAFAF8', borderWidth: 1.5, borderColor: '#EBEBEA' },
  optionSelected: { backgroundColor: 'rgba(200,90,42,0.06)', borderColor: '#C85A2A' },
  emoji: { fontSize: 22 },
  label: { flex: 1, fontSize: 14, fontWeight: '500', color: '#1A1A18' },
  labelSelected: { color: '#C85A2A', fontWeight: '600' },
  check: { fontSize: 16, color: '#C85A2A', fontWeight: '700' },
})