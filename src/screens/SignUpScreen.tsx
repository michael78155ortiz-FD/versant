import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native'
import { supabase } from '../lib/supabase'

const TERMS_TEXT = `VERSANT TERMS OF SERVICE & PRIVACY POLICY

Last updated: March 2026

1. ACCEPTANCE OF TERMS
By creating an account on Versant, you agree to these Terms of Service and Privacy Policy. If you do not agree, do not use the app.

2. ELIGIBILITY
You must be at least 18 years old to use Versant. By registering, you confirm you are 18 or older.

3. YOUR ACCOUNT
You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate information and keep it updated.

4. ACCEPTABLE USE
You agree NOT to:
- Harass, abuse, or harm other users
- Post false or misleading information
- Use the app for any illegal purpose
- Attempt to access other users accounts
- Share explicit or inappropriate content

5. PRIVACY & PHOTOS
Your photos are completely hidden from other users until both parties mutually agree to a reveal. We do not sell your photos or personal data to third parties.

6. VOICE NOTES
Voice notes sent within pods are private between the two users. Versant does not store or share voice recordings beyond their intended use.

7. MATCHING & COMPATIBILITY
Compatibility scores are based on quiz answers and are intended as guidance only. Versant does not guarantee any specific match outcome.

8. TERMINATION
We reserve the right to suspend or terminate accounts that violate these terms without prior notice.

9. LIMITATION OF LIABILITY
Versant is provided as is without warranties. We are not liable for any damages arising from your use of the app.

10. CONTACT
For questions about these terms contact us at legal@versantapp.com

By creating your account you confirm you have read understood and agree to these Terms of Service and Privacy Policy.`

const GENDER_OPTIONS = [
  { value: 'man', label: 'Man', emoji: '👨' },
  { value: 'woman', label: 'Woman', emoji: '👩' },
  { value: 'nonbinary', label: 'Non-binary', emoji: '🧑' },
]

const SEEKING_OPTIONS = [
  { value: 'men', label: 'Men', emoji: '👨' },
  { value: 'women', label: 'Women', emoji: '👩' },
  { value: 'everyone', label: 'Everyone', emoji: '💛' },
]

const EDUCATION_OPTIONS = [
  { value: 'high_school', label: 'High School' },
  { value: 'some_college', label: 'Some College' },
  { value: 'trade_school', label: 'Trade School' },
  { value: 'bachelors', label: 'Bachelor\'s Degree' },
  { value: 'masters', label: 'Master\'s Degree' },
  { value: 'phd', label: 'PhD / Doctorate' },
  { value: 'other', label: 'Other' },
]

const POLITICS_OPTIONS = [
  { value: 'very_important', label: 'Very important — must align', emoji: '🗳️' },
  { value: 'somewhat', label: 'Somewhat important', emoji: '🤝' },
  { value: 'not_important', label: 'Not important at all', emoji: '💛' },
]

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
]

export default function SignUpScreen({ navigation }: any) {
  const [step, setStep] = useState(1)
  const [fullName, setFullName] = useState('')
  const [nickname, setNickname] = useState('')
  const [age, setAge] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [occupation, setOccupation] = useState('')
  const [education, setEducation] = useState('')
  const [politicsImportance, setPoliticsImportance] = useState('')
  const [gender, setGender] = useState('')
  const [seeking, setSeeking] = useState('')
  const [minAge, setMinAge] = useState(18)
  const [maxAge, setMaxAge] = useState(45)
  const [loading, setLoading] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [showStateDropdown, setShowStateDropdown] = useState(false)
  const [showEducationDropdown, setShowEducationDropdown] = useState(false)

  const displayName = nickname.trim() || fullName.trim().split(' ')[0]

  function canProceedStep1() {
    return fullName.trim() && age && parseInt(age) >= 18 && city.trim() && state && email.trim() && password.length >= 8
  }

  function canProceedStep2() {
    return gender && seeking && politicsImportance
  }

  async function handleSignUp() {
    if (!agreedToTerms) {
      if (Platform.OS === 'web') {
        window.alert('Please agree to the Terms of Service to continue.')
      } else {
        Alert.alert('Terms Required', 'Please agree to the Terms of Service to continue.')
      }
      return
    }

    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { full_name: fullName.trim() } }
    })

    if (error) {
      if (Platform.OS === 'web') {
        window.alert('Error: ' + error.message)
      } else {
        Alert.alert('Error', error.message)
      }
      setLoading(false)
      return
    }

    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          full_name: fullName.trim(),
          nickname: nickname.trim() || null,
          age: parseInt(age),
          city: city.trim(),
          state: state,
          gender: gender,
          seeking: seeking,
          min_age: minAge,
          max_age: maxAge,
          occupation: occupation.trim() || null,
          education: education || null,
          politics_importance: politicsImportance || null,
        })

      if (profileError) {
        if (Platform.OS === 'web') {
          window.alert('Error: ' + profileError.message)
        } else {
          Alert.alert('Error', profileError.message)
        }
        setLoading(false)
        return
      }

      setLoading(false)
      navigation.navigate('PhotoUpload')
      return
    }

    setLoading(false)
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Terms Modal */}
      <Modal visible={showTerms} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalTopBar}>
            <Text style={styles.modalTitle}>Terms & Privacy Policy</Text>
            <TouchableOpacity onPress={() => setShowTerms(false)}>
              <Text style={styles.modalClose}>Close</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <Text style={styles.termsText}>{TERMS_TEXT}</Text>
          </ScrollView>
          <View style={styles.modalBottom}>
            <TouchableOpacity
              style={styles.agreeButton}
              onPress={() => { setAgreedToTerms(true); setShowTerms(false) }}
            >
              <Text style={styles.agreeButtonText}>I Agree & Accept</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* State Picker Modal */}
      <Modal visible={showStateDropdown} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalTopBar}>
            <Text style={styles.modalTitle}>Select Your State</Text>
            <TouchableOpacity onPress={() => setShowStateDropdown(false)}>
              <Text style={styles.modalClose}>Close</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.stateScroll}>
            {US_STATES.map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.stateRow, state === s && styles.stateRowSelected]}
                onPress={() => { setState(s); setShowStateDropdown(false) }}
              >
                <Text style={[styles.stateText, state === s && styles.stateTextSelected]}>{s}</Text>
                {state === s && <Text style={styles.stateCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Education Picker Modal */}
      <Modal visible={showEducationDropdown} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalTopBar}>
            <Text style={styles.modalTitle}>Education Level</Text>
            <TouchableOpacity onPress={() => setShowEducationDropdown(false)}>
              <Text style={styles.modalClose}>Close</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.stateScroll}>
            {EDUCATION_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.stateRow, education === opt.value && styles.stateRowSelected]}
                onPress={() => { setEducation(opt.value); setShowEducationDropdown(false) }}
              >
                <Text style={[styles.stateText, education === opt.value && styles.stateTextSelected]}>
                  {opt.label}
                </Text>
                {education === opt.value && <Text style={styles.stateCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => step === 1 ? navigation.goBack() : setStep(prev => prev - 1)}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          {/* Progress Bar */}
          <View style={styles.progressRow}>
            {[1, 2, 3].map(s => (
              <View key={s} style={[styles.progressStep, step >= s && styles.progressStepActive]} />
            ))}
          </View>

          {/* STEP 1 — Basic Info */}
          {step === 1 && (
            <>
              <View style={styles.headerArea}>
                <Text style={styles.title}>Create your{'\n'}Versant profile</Text>
                <Text style={styles.slogan}>Real attraction starts with conversation.</Text>
              </View>

              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Full Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Your full name"
                    placeholderTextColor="#ABABAA"
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    Nickname <Text style={styles.optional}>(optional)</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="What people call you"
                    placeholderTextColor="#ABABAA"
                    value={nickname}
                    onChangeText={setNickname}
                    autoCapitalize="words"
                  />
                  {displayName ? (
                    <Text style={styles.hint}>You will appear as "{displayName}" to matches</Text>
                  ) : null}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Age (must be 18 or older)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Your age"
                    placeholderTextColor="#ABABAA"
                    value={age}
                    onChangeText={setAge}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                </View>

                <View style={styles.rowGroup}>
                  <View style={[styles.inputGroup, { flex: 2 }]}>
                    <Text style={styles.label}>City</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Your city"
                      placeholderTextColor="#ABABAA"
                      value={city}
                      onChangeText={setCity}
                      autoCapitalize="words"
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>State</Text>
                    <TouchableOpacity
                      style={styles.stateSelector}
                      onPress={() => setShowStateDropdown(true)}
                    >
                      <Text style={[styles.stateSelectorText, !state && styles.stateSelectorPlaceholder]}>
                        {state || 'State'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Occupation <Text style={styles.optional}>(optional)</Text></Text>
                  <TextInput
                    style={styles.input}
                    placeholder="What do you do for work?"
                    placeholderTextColor="#ABABAA"
                    value={occupation}
                    onChangeText={setOccupation}
                    autoCapitalize="words"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Education <Text style={styles.optional}>(optional)</Text></Text>
                  <TouchableOpacity
                    style={styles.stateSelector}
                    onPress={() => setShowEducationDropdown(true)}
                  >
                    <Text style={[styles.stateSelectorText, !education && styles.stateSelectorPlaceholder]}>
                      {education ? EDUCATION_OPTIONS.find(e => e.value === education)?.label : 'Select education level'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="your@email.com"
                    placeholderTextColor="#ABABAA"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="At least 8 characters"
                    placeholderTextColor="#ABABAA"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.button, !canProceedStep1() && styles.buttonDisabled]}
                onPress={() => setStep(2)}
                disabled={!canProceedStep1()}
              >
                <Text style={styles.buttonText}>Continue →</Text>
              </TouchableOpacity>
            </>
          )}

          {/* STEP 2 — Gender + Seeking + Politics */}
          {step === 2 && (
            <>
              <View style={styles.headerArea}>
                <Text style={styles.title}>A little more{'\n'}about you</Text>
                <Text style={styles.subtitle}>This helps us find the right matches for you.</Text>
              </View>

              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.sectionLabel}>I am a</Text>
                  <View style={styles.optionGrid}>
                    {GENDER_OPTIONS.map(opt => (
                      <TouchableOpacity
                        key={opt.value}
                        style={[styles.optionCard, gender === opt.value && styles.optionCardSelected]}
                        onPress={() => setGender(opt.value)}
                      >
                        <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                        <Text style={[styles.optionLabel, gender === opt.value && styles.optionLabelSelected]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.sectionLabel}>I want to meet</Text>
                  <View style={styles.optionGrid}>
                    {SEEKING_OPTIONS.map(opt => (
                      <TouchableOpacity
                        key={opt.value}
                        style={[styles.optionCard, seeking === opt.value && styles.optionCardSelected]}
                        onPress={() => setSeeking(opt.value)}
                      >
                        <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                        <Text style={[styles.optionLabel, seeking === opt.value && styles.optionLabelSelected]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.sectionLabel}>Shared political views are</Text>
                  <View style={styles.politicsGrid}>
                    {POLITICS_OPTIONS.map(opt => (
                      <TouchableOpacity
                        key={opt.value}
                        style={[
                          styles.politicsCard,
                          politicsImportance === opt.value && styles.politicsCardSelected,
                        ]}
                        onPress={() => setPoliticsImportance(opt.value)}
                      >
                        <Text style={styles.politicsEmoji}>{opt.emoji}</Text>
                        <Text style={[
                          styles.politicsLabel,
                          politicsImportance === opt.value && styles.politicsLabelSelected,
                        ]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.button, !canProceedStep2() && styles.buttonDisabled]}
                onPress={() => setStep(3)}
                disabled={!canProceedStep2()}
              >
                <Text style={styles.buttonText}>Continue →</Text>
              </TouchableOpacity>
            </>
          )}

          {/* STEP 3 — Age Range + Terms */}
          {step === 3 && (
            <>
              <View style={styles.headerArea}>
                <Text style={styles.title}>Age preference</Text>
                <Text style={styles.subtitle}>
                  We will match you closest to your age first within your chosen range.
                </Text>
              </View>

              <View style={styles.form}>
                <View style={styles.ageRangeBox}>
                  <Text style={styles.ageRangeLabel}>
                    Looking for ages{' '}
                    <Text style={styles.ageRangeValue}>{minAge} – {maxAge}</Text>
                  </Text>

                  <View style={styles.ageRow}>
                    <Text style={styles.ageRowLabel}>Min age: {minAge}</Text>
                    <View style={styles.ageStepper}>
                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => setMinAge(prev => Math.max(18, prev - 1))}
                      >
                        <Text style={styles.stepperBtnText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.stepperValue}>{minAge}</Text>
                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => setMinAge(prev => Math.min(maxAge - 1, prev + 1))}
                      >
                        <Text style={styles.stepperBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.ageRow}>
                    <Text style={styles.ageRowLabel}>Max age: {maxAge}</Text>
                    <View style={styles.ageStepper}>
                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => setMaxAge(prev => Math.max(minAge + 1, prev - 1))}
                      >
                        <Text style={styles.stepperBtnText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.stepperValue}>{maxAge}</Text>
                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => setMaxAge(prev => Math.min(99, prev + 1))}
                      >
                        <Text style={styles.stepperBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.ageNote}>
                    <Text style={styles.ageNoteText}>
                      💡 We prioritize matches within 5 years of your age first
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.termsRow}
                onPress={() => setAgreedToTerms(!agreedToTerms)}
              >
                <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
                  {agreedToTerms && <Text style={styles.checkboxCheck}>✓</Text>}
                </View>
                <Text style={styles.termsLabel}>
                  I agree to the{' '}
                  <Text style={styles.termsLink} onPress={() => setShowTerms(true)}>
                    Terms of Service & Privacy Policy
                  </Text>
                </Text>
              </TouchableOpacity>

              <View style={styles.trustBox}>
                <Text style={styles.trustText}>
                  🔒 Your photo is never shown until you both agree to reveal.
                  Your voice is what matters here.
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.button, (!agreedToTerms || loading) && styles.buttonDisabled]}
                onPress={handleSignUp}
                disabled={loading || !agreedToTerms}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Create My Profile 💛</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLinkText}>
              Already have an account?{' '}
              <Text style={styles.loginLinkBold}>Log in</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAF8' },
  modalContainer: { flex: 1, backgroundColor: '#FFFFFF' },
  modalTopBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#EBEBEA' },
  modalTitle: { fontSize: 17, fontWeight: '600', color: '#1A1A18' },
  modalClose: { fontSize: 15, color: '#C85A2A', fontWeight: '500' },
  modalScroll: { padding: 24 },
  termsText: { fontSize: 13, color: '#6B6B68', lineHeight: 22 },
  modalBottom: { padding: 20, borderTopWidth: 1, borderTopColor: '#EBEBEA' },
  agreeButton: { height: 54, borderRadius: 16, backgroundColor: '#C85A2A', alignItems: 'center', justifyContent: 'center' },
  agreeButtonText: { fontSize: 17, fontWeight: '600', color: '#FFFFFF' },
  stateScroll: { paddingHorizontal: 20, paddingVertical: 8 },
  stateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F5F4F2' },
  stateRowSelected: { backgroundColor: 'rgba(200,90,42,0.05)' },
  stateText: { fontSize: 15, color: '#1A1A18' },
  stateTextSelected: { color: '#C85A2A', fontWeight: '600' },
  stateCheck: { fontSize: 16, color: '#C85A2A', fontWeight: '700' },
  keyboardView: { flex: 1 },
  scroll: { paddingHorizontal: 28, paddingBottom: 48 },
  backButton: { paddingTop: 16, paddingBottom: 8 },
  backText: { fontSize: 15, color: '#C85A2A', fontWeight: '500' },
  progressRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  progressStep: { flex: 1, height: 4, borderRadius: 4, backgroundColor: '#EBEBEA' },
  progressStepActive: { backgroundColor: '#C85A2A' },
  headerArea: { marginTop: 16, marginBottom: 28 },
  title: { fontSize: 30, fontWeight: '600', color: '#1A1A18', letterSpacing: -0.5, lineHeight: 38, marginBottom: 8 },
  slogan: { fontSize: 15, color: '#C85A2A', fontWeight: '500', fontStyle: 'italic' },
  subtitle: { fontSize: 14, color: '#6B6B68', lineHeight: 22 },
  form: { gap: 16, marginBottom: 20 },
  inputGroup: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: '#1A1A18' },
  optional: { fontWeight: '400', color: '#ABABAA' },
  hint: { fontSize: 11, color: '#C85A2A', marginTop: 3 },
  input: { height: 52, backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#EBEBEA', paddingHorizontal: 16, fontSize: 15, color: '#1A1A18' },
  rowGroup: { flexDirection: 'row', gap: 10 },
  stateSelector: { height: 52, backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#EBEBEA', paddingHorizontal: 16, justifyContent: 'center' },
  stateSelectorText: { fontSize: 15, color: '#1A1A18' },
  stateSelectorPlaceholder: { color: '#ABABAA' },
  sectionLabel: { fontSize: 15, fontWeight: '600', color: '#1A1A18', marginBottom: 4 },
  optionGrid: { flexDirection: 'row', gap: 10 },
  optionCard: { flex: 1, padding: 16, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#EBEBEA', alignItems: 'center', gap: 8 },
  optionCardSelected: { borderColor: '#C85A2A', backgroundColor: 'rgba(200,90,42,0.06)' },
  optionEmoji: { fontSize: 28 },
  optionLabel: { fontSize: 13, fontWeight: '500', color: '#6B6B68', textAlign: 'center' },
  optionLabelSelected: { color: '#C85A2A', fontWeight: '600' },
  politicsGrid: { gap: 10 },
  politicsCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#EBEBEA' },
  politicsCardSelected: { borderColor: '#C85A2A', backgroundColor: 'rgba(200,90,42,0.06)' },
  politicsEmoji: { fontSize: 22 },
  politicsLabel: { flex: 1, fontSize: 14, color: '#6B6B68', fontWeight: '500' },
  politicsLabelSelected: { color: '#C85A2A', fontWeight: '600' },
  ageRangeBox: { backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#EBEBEA', padding: 20, gap: 16 },
  ageRangeLabel: { fontSize: 16, fontWeight: '600', color: '#1A1A18', textAlign: 'center' },
  ageRangeValue: { color: '#C85A2A' },
  ageRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ageRowLabel: { fontSize: 14, color: '#6B6B68', fontWeight: '500' },
  ageStepper: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stepperBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F4F2', borderWidth: 1, borderColor: '#EBEBEA', alignItems: 'center', justifyContent: 'center' },
  stepperBtnText: { fontSize: 20, color: '#C85A2A', fontWeight: '600' },
  stepperValue: { fontSize: 18, fontWeight: '600', color: '#1A1A18', minWidth: 30, textAlign: 'center' },
  ageNote: { padding: 12, borderRadius: 12, backgroundColor: '#FDF0EB', borderWidth: 1, borderColor: '#F2D4C8' },
  ageNoteText: { fontSize: 12, color: '#C85A2A', lineHeight: 18 },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16, paddingHorizontal: 4 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#EBEBEA', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  checkboxChecked: { backgroundColor: '#C85A2A', borderColor: '#C85A2A' },
  checkboxCheck: { fontSize: 13, color: '#FFFFFF', fontWeight: '700' },
  termsLabel: { flex: 1, fontSize: 13, color: '#6B6B68', lineHeight: 20 },
  termsLink: { color: '#C85A2A', fontWeight: '600', textDecorationLine: 'underline' },
  trustBox: { backgroundColor: '#FDF0EB', borderRadius: 14, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#F2D4C8' },
  trustText: { fontSize: 13, color: '#C85A2A', lineHeight: 20 },
  button: { backgroundColor: '#C85A2A', borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginBottom: 16 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { fontSize: 17, fontWeight: '600', color: '#FFFFFF', letterSpacing: -0.2 },
  loginLink: { alignItems: 'center', paddingVertical: 8 },
  loginLinkText: { fontSize: 14, color: '#6B6B68' },
  loginLinkBold: { color: '#C85A2A', fontWeight: '600' },
})