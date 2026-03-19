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
- Attempt to access other users' accounts
- Share explicit or inappropriate content

5. PRIVACY & PHOTOS
Your photos are completely hidden from other users until both parties mutually agree to a "reveal." We do not sell your photos or personal data to third parties.

6. VOICE NOTES
Voice notes sent within pods are private between the two users. Versant does not store or share voice recordings beyond their intended use.

7. MATCHING & COMPATIBILITY
Compatibility scores are based on quiz answers and are intended as guidance only. Versant does not guarantee any specific match outcome.

8. TERMINATION
We reserve the right to suspend or terminate accounts that violate these terms without prior notice.

9. LIMITATION OF LIABILITY
Versant is provided "as is" without warranties. We are not liable for any damages arising from your use of the app.

10. CONTACT
For questions about these terms, contact us at legal@versantapp.com

By creating your account, you confirm you have read, understood, and agree to these Terms of Service and Privacy Policy.`

export default function SignUpScreen({ navigation }: any) {
  const [fullName, setFullName] = useState('')
  const [age, setAge] = useState('')
  const [city, setCity] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [showTerms, setShowTerms] = useState(false)

  async function handleSignUp() {
    if (!fullName || !age || !city || !email || !password) {
      Alert.alert('Missing info', 'Please fill in all fields.')
      return
    }

    if (parseInt(age) < 18) {
      Alert.alert('Age requirement', 'You must be 18 or older to use Versant.')
      return
    }

    if (password.length < 8) {
      Alert.alert('Weak password', 'Password must be at least 8 characters.')
      return
    }

    if (!agreedToTerms) {
      Alert.alert(
        'Terms Required',
        'Please agree to the Terms of Service and Privacy Policy to continue.'
      )
      return
    }

    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
    })

    if (error) {
      Alert.alert('Error', error.message)
      setLoading(false)
      return
    }

    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          full_name: fullName.trim(),
          age: parseInt(age),
          city: city.trim(),
        })

      if (profileError) {
        Alert.alert('Error', profileError.message)
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
      <Modal
        visible={showTerms}
        animationType="slide"
        presentationStyle="pageSheet"
      >
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
              onPress={() => {
                setAgreedToTerms(true)
                setShowTerms(false)
              }}
            >
              <Text style={styles.agreeButtonText}>I Agree & Accept</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.headerArea}>
            <Text style={styles.title}>Create your{'\n'}Versant profile</Text>
            <Text style={styles.subtitle}>
              Your face stays hidden until you both decide to reveal.
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Your name"
                placeholderTextColor="#ABABAA"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Age</Text>
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

            <View style={styles.inputGroup}>
              <Text style={styles.label}>City</Text>
              <TextInput
                style={styles.input}
                placeholder="Where do you live?"
                placeholderTextColor="#ABABAA"
                value={city}
                onChangeText={setCity}
                autoCapitalize="words"
              />
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

          {/* Terms Checkbox */}
          <TouchableOpacity
            style={styles.termsRow}
            onPress={() => setAgreedToTerms(!agreedToTerms)}
          >
            <View
              style={[
                styles.checkbox,
                agreedToTerms && styles.checkboxChecked,
              ]}
            >
              {agreedToTerms && (
                <Text style={styles.checkboxCheck}>✓</Text>
              )}
            </View>
            <Text style={styles.termsLabel}>
              I agree to the{' '}
              <Text
                style={styles.termsLink}
                onPress={() => setShowTerms(true)}
              >
                Terms of Service & Privacy Policy
              </Text>
            </Text>
          </TouchableOpacity>

          {/* Trust Box */}
          <View style={styles.trustBox}>
            <Text style={styles.trustText}>
              🔒 Your photo is never shown until you both agree to reveal.
              Your voice is what matters here.
            </Text>
          </View>

          {/* Sign Up Button */}
          <TouchableOpacity
            style={[
              styles.button,
              (!agreedToTerms || loading) && styles.buttonDisabled,
            ]}
            onPress={handleSignUp}
            disabled={loading || !agreedToTerms}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Create My Profile</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login')}
          >
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
  container: {
    flex: 1,
    backgroundColor: '#FAFAF8',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEA',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A18',
  },
  modalClose: {
    fontSize: 15,
    color: '#C85A2A',
    fontWeight: '500',
  },
  modalScroll: {
    padding: 24,
  },
  termsText: {
    fontSize: 13,
    color: '#6B6B68',
    lineHeight: 22,
  },
  modalBottom: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#EBEBEA',
  },
  agreeButton: {
    height: 54,
    borderRadius: 16,
    backgroundColor: '#C85A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  agreeButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 28,
    paddingBottom: 48,
  },
  backButton: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  backText: {
    fontSize: 15,
    color: '#C85A2A',
    fontWeight: '500',
  },
  headerArea: {
    marginTop: 24,
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    color: '#1A1A18',
    letterSpacing: -0.5,
    lineHeight: 40,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B6B68',
    lineHeight: 22,
  },
  form: {
    gap: 16,
    marginBottom: 20,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A18',
    letterSpacing: 0.1,
  },
  input: {
    height: 52,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EBEBEA',
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#1A1A18',
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#EBEBEA',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: '#C85A2A',
    borderColor: '#C85A2A',
  },
  checkboxCheck: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  termsLabel: {
    flex: 1,
    fontSize: 13,
    color: '#6B6B68',
    lineHeight: 20,
  },
  termsLink: {
    color: '#C85A2A',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  trustBox: {
    backgroundColor: '#FDF0EB',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F2D4C8',
  },
  trustText: {
    fontSize: 13,
    color: '#C85A2A',
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#C85A2A',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  loginLinkText: {
    fontSize: 14,
    color: '#6B6B68',
  },
  loginLinkBold: {
    color: '#C85A2A',
    fontWeight: '600',
  },
})