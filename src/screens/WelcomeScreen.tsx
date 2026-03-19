import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

const { height } = Dimensions.get('window')

export default function WelcomeScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#FDF6F0', '#FAF0E8', '#F5E6D8']}
        style={styles.gradient}
      >
        {/* Logo Area */}
        <View style={styles.logoArea}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoLetter}>V</Text>
          </View>
          <Text style={styles.appName}>Versant</Text>
          <Text style={styles.tagline}>
            Voice first.{'\n'}Everything else second.
          </Text>
        </View>

        {/* Feature Pills */}
        <View style={styles.pillsArea}>
          {[
            '🎙️  Connect through voice',
            '🌫️  Identity revealed over time',
            '📵  Phone-free date venues',
            '💛  Real connection first',
          ].map((item, index) => (
            <View key={index} style={styles.pill}>
              <Text style={styles.pillText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* Buttons */}
        <View style={styles.buttonArea}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('SignUp')}
          >
            <Text style={styles.primaryButtonText}>Find Your Person</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.secondaryButtonText}>I already have an account</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          By continuing you agree to our Terms & Privacy Policy
        </Text>
      </LinearGradient>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF6F0',
  },
  gradient: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 32,
  },
  logoArea: {
    alignItems: 'center',
    marginTop: 20,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#C85A2A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#C85A2A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  logoLetter: {
    fontSize: 32,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  appName: {
    fontSize: 36,
    fontWeight: '600',
    color: '#1A1A18',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  tagline: {
    fontSize: 17,
    color: '#6B6B68',
    textAlign: 'center',
    lineHeight: 26,
  },
  pillsArea: {
    gap: 10,
  },
  pill: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#EBEBEA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  pillText: {
    fontSize: 15,
    color: '#1A1A18',
    fontWeight: '500',
  },
  buttonArea: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#C85A2A',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#C85A2A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  secondaryButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    color: '#6B6B68',
    fontWeight: '500',
  },
  footer: {
    fontSize: 11,
    color: '#ABABAA',
    textAlign: 'center',
    lineHeight: 16,
  },
})