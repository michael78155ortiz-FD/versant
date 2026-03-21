import React, { useState } from 'react'
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
  Platform,
} from 'react-native'
import { supabase } from '../lib/supabase'

const TOTAL_STEPS = 16

const VALUES_OPTIONS = [
  { value: 'family', label: 'Family', emoji: '👨‍👩‍👧' },
  { value: 'honesty', label: 'Honesty', emoji: '🤝' },
  { value: 'adventure', label: 'Adventure', emoji: '🌍' },
  { value: 'growth', label: 'Growth', emoji: '🌱' },
  { value: 'faith', label: 'Faith', emoji: '🙏' },
  { value: 'security', label: 'Security', emoji: '🏠' },
  { value: 'kindness', label: 'Kindness', emoji: '💛' },
  { value: 'ambition', label: 'Ambition', emoji: '🚀' },
  { value: 'health', label: 'Health', emoji: '💪' },
  { value: 'humor', label: 'Humor', emoji: '😂' },
  { value: 'environment', label: 'Environment', emoji: '🌿' },
  { value: 'stability', label: 'Stability', emoji: '⚓' },
]

const LIFE_VISION_OPTIONS = [
  { value: 'cityEnergy', label: 'Big city energy', emoji: '🏙️' },
  { value: 'suburbsFamily', label: 'Suburbs & family', emoji: '🏡' },
  { value: 'travelNomad', label: 'Travel & explore', emoji: '✈️' },
  { value: 'ruralSimple', label: 'Quiet rural life', emoji: '🌾' },
  { value: 'careerFirst', label: 'Career-driven', emoji: '💼' },
]

const KIDS_OPTIONS = [
  { value: 'yesSoon', label: 'Yes — soon', emoji: '👶' },
  { value: 'yesLater', label: 'Yes — later', emoji: '⏳' },
  { value: 'maybe', label: 'Maybe', emoji: '🤔' },
  { value: 'neverKids', label: 'Child-free', emoji: '🚫' },
]

const MONEY_OPTIONS = [
  { value: 'bigSaver', label: 'Big saver', emoji: '🐷' },
  { value: 'balancedSpender', label: 'Balanced', emoji: '⚖️' },
  { value: 'liveInMoment', label: 'Live now', emoji: '✨' },
  { value: 'investFirst', label: 'Invest first', emoji: '📈' },
]

const LOCATION_OPTIONS = [
  { value: 'stayLocal', label: 'Stay local', emoji: '📍' },
  { value: 'openToMove', label: 'Open to moving', emoji: '🗺️' },
  { value: 'followLove', label: 'Follow love', emoji: '💕' },
  { value: 'remoteAnywhere', label: 'Remote anywhere', emoji: '💻' },
]

const LOVE_LANGUAGE_OPTIONS = [
  { value: 'wordsAffirmation', label: 'Words of affirmation', emoji: '💬' },
  { value: 'qualityTime', label: 'Quality time', emoji: '⏰' },
  { value: 'physicalTouch', label: 'Physical touch', emoji: '🤗' },
  { value: 'actsService', label: 'Acts of service', emoji: '🛠️' },
  { value: 'giftsThoughtful', label: 'Thoughtful gifts', emoji: '🎁' },
]

const HABITS_OPTIONS = [
  { value: 'earlyBird', label: 'Early bird', emoji: '🌅' },
  { value: 'nightOwl', label: 'Night owl', emoji: '🦉' },
  { value: 'exerciseRegular', label: 'Exercise 4x+/week', emoji: '🏋️' },
  { value: 'noAlcohol', label: 'No/low alcohol', emoji: '🚱' },
  { value: 'plantBased', label: 'Plant-based diet', emoji: '🥗' },
  { value: 'screenFreeEve', label: 'Screen-free evenings', emoji: '📵' },
  { value: 'meditates', label: 'Meditates', emoji: '🧘' },
  { value: 'socialWeekends', label: 'Social weekends', emoji: '🎉' },
  { value: 'homebody', label: 'Homebody', emoji: '🏠' },
  { value: 'petLover', label: 'Pet lover', emoji: '🐾' },
]

const CONFLICT_OPTIONS = [
  { value: 'harmonizer', label: 'Talk it out calmly', emoji: '🕊️' },
  { value: 'validator', label: 'Listen first', emoji: '👂' },
  { value: 'avoider', label: 'Need space first', emoji: '🚶' },
  { value: 'direct', label: 'Address immediately', emoji: '⚡' },
  { value: 'therapyOriented', label: 'Therapy-oriented', emoji: '💆' },
]

const GROWTH_OPTIONS = [
  { value: 'inTherapy', label: 'In therapy', emoji: '🛋️' },
  { value: 'selfHelp', label: 'Self-help reader', emoji: '📚' },
  { value: 'openFeedback', label: 'Open to feedback', emoji: '🔄' },
  { value: 'workingOnIt', label: 'Working on it', emoji: '🌱' },
  { value: 'spiritual', label: 'Spiritual practice', emoji: '✨' },
]

const ATTACHMENT_OPTIONS = [
  { value: 'secure', label: 'I feel comfortable with closeness and independence equally', emoji: '💚' },
  { value: 'anxious', label: 'I tend to worry about my partner pulling away', emoji: '💛' },
  { value: 'avoidant', label: 'I value independence and sometimes feel crowded', emoji: '🔵' },
  { value: 'disorganized', label: 'I want closeness but it sometimes feels scary', emoji: '🔴' },
]

const DEALBREAKER_OPTIONS = [
  { value: 'smoking', label: 'Smoking', emoji: '🚬' },
  { value: 'heavyDrinking', label: 'Heavy drinking', emoji: '🍺' },
  { value: 'drugUse', label: 'Drug use', emoji: '💊' },
  { value: 'differentReligion', label: 'Different religion', emoji: '⛪' },
  { value: 'differentPolitics', label: 'Strong political diff.', emoji: '🗳️' },
  { value: 'noKidsEver', label: 'Never wants kids', emoji: '🚫' },
  { value: 'longDistance', label: 'Long distance', emoji: '✈️' },
  { value: 'noMarriage', label: 'Against marriage', emoji: '💍' },
]

const WEEKEND_OPTIONS = [
  { value: 'active', label: 'Hiking, gym, outdoor sports', emoji: '🏃' },
  { value: 'casual', label: 'Walks, markets, casual outings', emoji: '🛍️' },
  { value: 'homebody', label: 'Movies, cooking, relaxing', emoji: '🛋️' },
  { value: 'social', label: 'Nightlife, events, social scenes', emoji: '🎉' },
]

const ACTIVITY_OPTIONS = [
  { value: 'veryActive', label: 'Very active — I move every day', emoji: '💪' },
  { value: 'moderate', label: 'Moderate — few times a week', emoji: '🚶' },
  { value: 'light', label: 'Light — mostly work and home', emoji: '🏠' },
  { value: 'building', label: 'Building new habits', emoji: '🌱' },
]

const HEALTH_OPTIONS = [
  { value: 'veryImportant', label: 'A lot — I eat clean and train', emoji: '🥗' },
  { value: 'somewhat', label: 'Somewhat — I stay balanced', emoji: '⚖️' },
  { value: 'moderate', label: 'Moderation — I enjoy everything', emoji: '😊' },
  { value: 'workingOnIt', label: 'Working on it', emoji: '🌱' },
]

const PARTNER_ENERGY_OPTIONS = [
  { value: 'matchMine', label: 'Matches mine exactly', emoji: '🎯' },
  { value: 'moreRelaxed', label: 'Slightly more relaxed than me', emoji: '😌' },
  { value: 'moreActive', label: 'Slightly more active than me', emoji: '⚡' },
  { value: 'doesntMatter', label: "Doesn't matter to me", emoji: '💛' },
]

const STEP_TITLES = [
  'What do you value most?',
  'Your life vision',
  'Kids & family',
  'Your money style',
  'Where you want to live',
  'How you feel loved',
  'Independence level',
  'Your daily habits',
  'How you handle conflict',
  'Your growth journey',
  'Your attachment style',
  'Dealbreakers',
  'Your typical weekend',
  'How active are you?',
  'Health & lifestyle',
  'Your ideal partner energy',
]

const STEP_SUBTITLES = [
  'Pick 3–5 that matter most',
  'Where do you see yourself in 10 years?',
  'Be honest — this is a big one',
  'How do you relate to money?',
  'How flexible are you?',
  'Pick your top 2',
  'How much alone time do you need?',
  'What habits are non-negotiable?',
  'When things get hard, you...',
  'How do you work on yourself?',
  'Which sounds most like you?',
  'Select anything that would end things',
  'Pick what fits best',
  'Be honest — this matters for matching',
  'How important is health to you?',
  'What energy level works for you?',
]

export default function QuizScreen({ navigation }: any) {
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  const [values, setValues] = useState<string[]>([])
  const [lifeVision, setLifeVision] = useState('')
  const [kidsChoice, setKidsChoice] = useState('')
  const [moneyStyle, setMoneyStyle] = useState('')
  const [locationFlex, setLocationFlex] = useState('')
  const [loveLanguage, setLoveLanguage] = useState<string[]>([])
  const [independenceLevel, setIndependenceLevel] = useState(5)
  const [dailyHabits, setDailyHabits] = useState<string[]>([])
  const [conflictStyle, setConflictStyle] = useState('')
  const [growthMindset, setGrowthMindset] = useState<string[]>([])
  const [attachmentStyle, setAttachmentStyle] = useState('')
  const [dealbreakers, setDealbreakers] = useState<string[]>([])
  const [weekendStyle, setWeekendStyle] = useState('')
  const [activityLevel, setActivityLevel] = useState('')
  const [healthImportance, setHealthImportance] = useState('')
  const [partnerEnergy, setPartnerEnergy] = useState('')
  const [aboutMe, setAboutMe] = useState('')

  function toggleMulti(value: string, current: string[], setter: (v: string[]) => void, max: number) {
    if (current.includes(value)) {
      setter(current.filter(v => v !== value))
    } else if (current.length < max) {
      setter([...current, value])
    }
  }

  function canProceed(): boolean {
    switch (step) {
      case 0: return values.length >= 3
      case 1: return lifeVision !== ''
      case 2: return kidsChoice !== ''
      case 3: return moneyStyle !== ''
      case 4: return locationFlex !== ''
      case 5: return loveLanguage.length >= 1
      case 6: return true
      case 7: return dailyHabits.length >= 1
      case 8: return conflictStyle !== ''
      case 9: return growthMindset.length >= 1
      case 10: return attachmentStyle !== ''
      case 11: return true
      case 12: return weekendStyle !== ''
      case 13: return activityLevel !== ''
      case 14: return healthImportance !== ''
      case 15: return partnerEnergy !== ''
      default: return true
    }
  }

  async function handleFinish() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const quizAnswers = {
      values, lifeVision, kidsChoice, moneyStyle, locationFlex,
      loveLanguage, independenceLevel, dailyHabits, conflictStyle,
      growthMindset, dealbreakers, aboutMe,
    }

    const lifestyleAnswers = {
      weekendStyle, activityLevel, healthImportance, partnerEnergy,
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        quiz_answers: quizAnswers,
        lifestyle_answers: lifestyleAnswers,
        attachment_style: attachmentStyle,
        dealbreakers: dealbreakers,
        quiz_completed: true,
        bio: aboutMe || null,
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

  const progress = ((step + 1) / TOTAL_STEPS) * 100

  function renderStep() {
    switch (step) {
      case 0: return <ChipGrid options={VALUES_OPTIONS} selected={values} onToggle={v => toggleMulti(v, values, setValues, 5)} hint="Choose 3 to 5" />
      case 1: return <SingleSelect options={LIFE_VISION_OPTIONS} selected={lifeVision} onSelect={setLifeVision} />
      case 2: return <SingleSelect options={KIDS_OPTIONS} selected={kidsChoice} onSelect={setKidsChoice} />
      case 3: return <SingleSelect options={MONEY_OPTIONS} selected={moneyStyle} onSelect={setMoneyStyle} />
      case 4: return <SingleSelect options={LOCATION_OPTIONS} selected={locationFlex} onSelect={setLocationFlex} />
      case 5: return <ChipGrid options={LOVE_LANGUAGE_OPTIONS} selected={loveLanguage} onToggle={v => toggleMulti(v, loveLanguage, setLoveLanguage, 2)} hint="Pick your top 2" />
      case 6: return <SliderStep label="How much alone time do you need?" leftLabel="Always together" rightLabel="Lots of alone time" value={independenceLevel} onValueChange={setIndependenceLevel} />
      case 7: return <ChipGrid options={HABITS_OPTIONS} selected={dailyHabits} onToggle={v => toggleMulti(v, dailyHabits, setDailyHabits, 6)} hint="Select all that apply" />
      case 8: return <SingleSelect options={CONFLICT_OPTIONS} selected={conflictStyle} onSelect={setConflictStyle} />
      case 9: return <ChipGrid options={GROWTH_OPTIONS} selected={growthMindset} onToggle={v => toggleMulti(v, growthMindset, setGrowthMindset, 4)} hint="Select all that apply" />
      case 10: return <SingleSelect options={ATTACHMENT_OPTIONS} selected={attachmentStyle} onSelect={setAttachmentStyle} />
      case 11: return (
        <View style={{ gap: 12 }}>
          <ChipGrid options={DEALBREAKER_OPTIONS} selected={dealbreakers} onToggle={v => toggleMulti(v, dealbreakers, setDealbreakers, 9)} hint="Select any that apply" />
          <View style={styles.aboutSection}>
            <Text style={styles.aboutLabel}>About me <Text style={styles.aboutOptional}>(optional)</Text></Text>
            <TextInput style={styles.aboutInput} value={aboutMe} onChangeText={setAboutMe} placeholder="What should people know about you?" placeholderTextColor="#ABABAA" multiline maxLength={150} />
            <Text style={styles.charCount}>{aboutMe.length} / 150</Text>
          </View>
        </View>
      )
      case 12: return <SingleSelect options={WEEKEND_OPTIONS} selected={weekendStyle} onSelect={setWeekendStyle} />
      case 13: return <SingleSelect options={ACTIVITY_OPTIONS} selected={activityLevel} onSelect={setActivityLevel} />
      case 14: return <SingleSelect options={HEALTH_OPTIONS} selected={healthImportance} onSelect={setHealthImportance} />
      case 15: return <SingleSelect options={PARTNER_ENERGY_OPTIONS} selected={partnerEnergy} onSelect={setPartnerEnergy} />
      default: return null
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        {step > 0 ? (
          <TouchableOpacity onPress={() => setStep(s => s - 1)}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 50 }} />
        )}
        <Text style={styles.stepCount}>{step + 1} of {TOTAL_STEPS}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Discover')}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>{STEP_TITLES[step]}</Text>
          <Text style={styles.subtitle}>{STEP_SUBTITLES[step]}</Text>
        </View>

        {step >= 12 && (
          <View style={styles.encourageBox}>
            <Text style={styles.encourageText}>
              🏃 These last 4 questions help us match your lifestyle perfectly
            </Text>
          </View>
        )}

        {step >= 6 && step < 12 && (
          <View style={styles.encourageBox}>
            <Text style={styles.encourageText}>
              {step < 10 ? `You're doing great — ${TOTAL_STEPS - step - 1} left!` : "Almost done — you're building something real 💛"}
            </Text>
          </View>
        )}

        {renderStep()}
      </ScrollView>

      <View style={styles.bottomArea}>
        {step < TOTAL_STEPS - 1 ? (
          <TouchableOpacity
            style={[styles.nextButton, !canProceed() && styles.nextButtonDisabled]}
            onPress={() => setStep(s => s + 1)}
            disabled={!canProceed()}
          >
            <Text style={styles.nextButtonText}>Continue →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.finishButton}
            onPress={handleFinish}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.finishButtonText}>Find My Matches 💛</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  )
}

function ChipGrid({ options, selected, onToggle, hint }: { options: { value: string; label: string; emoji: string }[], selected: string[], onToggle: (v: string) => void, hint: string }) {
  return (
    <View>
      <Text style={styles.hintText}>{hint}</Text>
      <View style={styles.chipGrid}>
        {options.map(opt => {
          const isSelected = selected.includes(opt.value)
          return (
            <TouchableOpacity key={opt.value} style={[styles.chip, isSelected && styles.chipSelected]} onPress={() => onToggle(opt.value)}>
              <Text style={styles.chipEmoji}>{opt.emoji}</Text>
              <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>{opt.label}</Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

function SingleSelect({ options, selected, onSelect }: { options: { value: string; label: string; emoji: string }[], selected: string, onSelect: (v: string) => void }) {
  return (
    <View style={styles.singleSelectGrid}>
      {options.map(opt => {
        const isSelected = selected === opt.value
        return (
          <TouchableOpacity key={opt.value} style={[styles.singleOption, isSelected && styles.singleOptionSelected]} onPress={() => onSelect(opt.value)}>
            <Text style={styles.singleEmoji}>{opt.emoji}</Text>
            <Text style={[styles.singleLabel, isSelected && styles.singleLabelSelected]}>{opt.label}</Text>
            {isSelected && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

function SliderStep({ label, leftLabel, rightLabel, value, onValueChange }: { label: string, leftLabel: string, rightLabel: string, value: number, onValueChange: (v: number) => void }) {
  return (
    <View style={styles.sliderWrap}>
      <Text style={styles.sliderLabel}>{label}</Text>
      <View style={styles.sliderTrack}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
          <TouchableOpacity key={n} style={[styles.sliderDot, value === n && styles.sliderDotActive]} onPress={() => onValueChange(n)}>
            <Text style={[styles.sliderDotText, value === n && styles.sliderDotTextActive]}>{n}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.sliderLabels}>
        <Text style={styles.sliderSideLabel}>{leftLabel}</Text>
        <Text style={styles.sliderSideLabel}>{rightLabel}</Text>
      </View>
    </View>
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
  stepCount: { fontSize: 13, fontWeight: '600', color: '#1A1A18' },
  skipText: { fontSize: 13, color: '#ABABAA', fontWeight: '500' },
  progressTrack: { height: 3, backgroundColor: '#F5F4F2' },
  progressFill: { height: '100%', backgroundColor: '#C85A2A' },
  scroll: { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 32, gap: 20 },
  header: { gap: 6, marginBottom: 4 },
  title: { fontSize: 26, fontWeight: '600', color: '#1A1A18', letterSpacing: -0.3 },
  subtitle: { fontSize: 14, color: '#6B6B68', lineHeight: 20 },
  encourageBox: { padding: 12, borderRadius: 12, backgroundColor: '#FDF0EB', borderWidth: 1, borderColor: '#F2D4C8' },
  encourageText: { fontSize: 13, color: '#C85A2A', fontWeight: '500', textAlign: 'center' },
  hintText: { fontSize: 12, color: '#ABABAA', marginBottom: 12, fontWeight: '500' },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 9, paddingHorizontal: 14, borderRadius: 9999, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#EBEBEA' },
  chipSelected: { backgroundColor: 'rgba(200,90,42,0.08)', borderColor: '#C85A2A' },
  chipEmoji: { fontSize: 14 },
  chipLabel: { fontSize: 13, fontWeight: '500', color: '#6B6B68' },
  chipLabelSelected: { color: '#C85A2A', fontWeight: '600' },
  singleSelectGrid: { gap: 10 },
  singleOption: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#EBEBEA' },
  singleOptionSelected: { backgroundColor: 'rgba(200,90,42,0.06)', borderColor: '#C85A2A' },
  singleEmoji: { fontSize: 24 },
  singleLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: '#1A1A18' },
  singleLabelSelected: { color: '#C85A2A', fontWeight: '600' },
  checkmark: { fontSize: 16, color: '#C85A2A', fontWeight: '700' },
  sliderWrap: { gap: 16, padding: 20, backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#EBEBEA' },
  sliderLabel: { fontSize: 15, fontWeight: '600', color: '#1A1A18', textAlign: 'center' },
  sliderTrack: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
  sliderDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F5F4F2', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#EBEBEA' },
  sliderDotActive: { backgroundColor: '#C85A2A', borderColor: '#C85A2A' },
  sliderDotText: { fontSize: 12, fontWeight: '600', color: '#6B6B68' },
  sliderDotTextActive: { color: '#FFFFFF' },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  sliderSideLabel: { fontSize: 11, color: '#ABABAA' },
  aboutSection: { gap: 8 },
  aboutLabel: { fontSize: 13, fontWeight: '600', color: '#1A1A18' },
  aboutOptional: { fontWeight: '400', color: '#ABABAA' },
  aboutInput: { height: 100, backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1.5, borderColor: '#EBEBEA', paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#1A1A18', textAlignVertical: 'top' },
  charCount: { fontSize: 11, color: '#ABABAA', textAlign: 'right' },
  bottomArea: { padding: 20, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#EBEBEA' },
  nextButton: { height: 54, borderRadius: 16, backgroundColor: '#C85A2A', alignItems: 'center', justifyContent: 'center' },
  nextButtonDisabled: { backgroundColor: '#E8E8E4' },
  nextButtonText: { fontSize: 17, fontWeight: '600', color: '#FFFFFF', letterSpacing: -0.2 },
  finishButton: { height: 54, borderRadius: 16, backgroundColor: '#C85A2A', alignItems: 'center', justifyContent: 'center' },
  finishButtonText: { fontSize: 17, fontWeight: '600', color: '#FFFFFF', letterSpacing: -0.2 },
})