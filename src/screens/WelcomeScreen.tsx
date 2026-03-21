import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Dimensions,
} from 'react-native'

const { width, height } = Dimensions.get('window')

export default function WelcomeScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>

        {/* Logo */}
        <View style={styles.logoWrap}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.logo}
          />
        </View>

        {/* Brand */}
        <View style={styles.brandWrap}>
          <Text style={styles.appName}>Versant</Text>
          <Text style={styles.slogan}>Real attraction starts with conversation.</Text>
        </View>

        {/* Features */}
        <View style={styles.featuresWrap}>
          {[
            { emoji: '🎙️', title: 'Voice first', sub: 'Hear their personality before you see their face' },
            { emoji: '🔒', title: 'Photos stay hidden', sub: 'Until you both agree to reveal after a 15 min call' },
            { emoji: '💛', title: 'Real compatibility', sub: 'Matched on values, lifestyle and what actually matters' },
          ].map(feature => (
            <View key={feature.title} style={styles.featureRow}>
              <Text style={styles.featureEmoji}>{feature.emoji}</Text>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureSub}>{feature.sub}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Buttons */}
        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('SignUp')}
          >
            <Text style={styles.primaryBtnText}>Find Your Person 💛</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.secondaryBtnText}>I already have an account</Text>
          </TouchableOpacity>
        </View>

        {/* Legal */}
        <Text style={styles.legal}>
          By continuing you agree to our Terms of Service and Privacy Policy.
          Must be 18 or older to use Versant.
        </Text>

      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF8',
  },
  inner: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 32,
    justifyContent: 'space-between',
  },
  logoWrap: {
    alignItems: 'center',
    marginTop: 16,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
  },
  brandWrap: {
    alignItems: 'center',
    gap: 8,
  },
  appName: {
    fontSize: 42,
    fontWeight: '700',
    color: '#1A1A18',
    letterSpacing: -1,
  },
  slogan: {
    fontSize: 16,
    color: '#C85A2A',
    fontWeight: '500',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresWrap: {
    gap: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EBEBEA',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  featureEmoji: {
    fontSize: 28,
    width: 40,
    textAlign: 'center',
  },
  featureText: {
    flex: 1,
    gap: 2,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A18',
  },
  featureSub: {
    fontSize: 12,
    color: '#6B6B68',
    lineHeight: 18,
  },
  buttons: {
    gap: 12,
  },
  primaryBtn: {
    height: 56,
    borderRadius: 18,
    backgroundColor: '#C85A2A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C85A2A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  primaryBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  secondaryBtn: {
    height: 52,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EBEBEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B6B68',
  },
  legal: {
    fontSize: 11,
    color: '#ABABAA',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 8,
  },
})