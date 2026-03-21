import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
} from 'react-native'

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    color: '#F5F4F2',
    textColor: '#1A1A18',
    borderColor: '#EBEBEA',
    features: [
      { text: '3 matches at a time', included: true },
      { text: 'Voice notes & messaging', included: true },
      { text: 'Compatibility quiz', included: true },
      { text: 'Schedule voice calls', included: true },
      { text: 'Unlimited matches', included: false },
      { text: 'Priority matching', included: false },
      { text: 'See who liked you', included: false },
      { text: 'Travel mode', included: false },
      { text: 'Advanced filters', included: false },
    ],
  },
  {
    id: 'plus',
    name: 'Versant+',
    price: '$19.99',
    period: 'per month',
    color: '#C85A2A',
    textColor: '#FFFFFF',
    borderColor: '#C85A2A',
    badge: 'Most Popular',
    features: [
      { text: '8 matches at a time', included: true },
      { text: 'Voice notes & messaging', included: true },
      { text: 'Compatibility quiz', included: true },
      { text: 'Schedule voice calls', included: true },
      { text: 'Unlimited matches', included: true },
      { text: 'Priority matching', included: true },
      { text: 'See who liked you', included: true },
      { text: 'Travel mode', included: true },
      { text: 'Advanced filters', included: false },
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$34.99',
    period: 'per month',
    color: '#1A1A18',
    textColor: '#FFFFFF',
    borderColor: '#1A1A18',
    badge: 'Best Value',
    features: [
      { text: '8 matches at a time', included: true },
      { text: 'Voice notes & messaging', included: true },
      { text: 'Compatibility quiz', included: true },
      { text: 'Schedule voice calls', included: true },
      { text: 'Unlimited matches', included: true },
      { text: 'Priority matching', included: true },
      { text: 'See who liked you', included: true },
      { text: 'Travel mode', included: true },
      { text: 'Advanced filters', included: true },
    ],
  },
]

export default function PaywallScreen({ navigation }: any) {
  const [selected, setSelected] = useState('plus')

  function handleSubscribe() {
    const plan = PLANS.find(p => p.id === selected)
    if (selected === 'free') {
      navigation.goBack()
      return
    }
    // RevenueCat integration goes here when ready
    navigation.goBack()
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.closeText}>✕ Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <Image source={require('../../assets/icon.png')} style={styles.logo} />
          <Text style={styles.title}>Find your person faster</Text>
          <Text style={styles.subtitle}>
            Upgrade to get more matches, priority placement, and the tools to build a real connection.
          </Text>
        </View>

        {/* Plans */}
        {PLANS.map(plan => (
          <TouchableOpacity
            key={plan.id}
            style={[
              styles.planCard,
              { borderColor: selected === plan.id ? plan.borderColor : '#EBEBEA' },
              selected === plan.id && { backgroundColor: plan.id === 'free' ? '#F5F4F2' : plan.color },
            ]}
            onPress={() => setSelected(plan.id)}
          >
            {plan.badge && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{plan.badge}</Text>
              </View>
            )}

            <View style={styles.planHeader}>
              <View>
                <Text style={[
                  styles.planName,
                  selected === plan.id && plan.id !== 'free' && { color: '#FFFFFF' },
                ]}>
                  {plan.name}
                </Text>
                <Text style={[
                  styles.planPeriod,
                  selected === plan.id && plan.id !== 'free' && { color: 'rgba(255,255,255,0.7)' },
                ]}>
                  {plan.period}
                </Text>
              </View>
              <Text style={[
                styles.planPrice,
                selected === plan.id && plan.id !== 'free' && { color: '#FFFFFF' },
              ]}>
                {plan.price}
              </Text>
            </View>

            <View style={styles.featureList}>
              {plan.features.map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <Text style={[
                    styles.featureCheck,
                    !feature.included && styles.featureCross,
                    selected === plan.id && plan.id !== 'free' && feature.included && { color: '#FFFFFF' },
                    selected === plan.id && plan.id !== 'free' && !feature.included && { color: 'rgba(255,255,255,0.4)' },
                  ]}>
                    {feature.included ? '✓' : '✕'}
                  </Text>
                  <Text style={[
                    styles.featureText,
                    !feature.included && styles.featureTextMuted,
                    selected === plan.id && plan.id !== 'free' && feature.included && { color: '#FFFFFF' },
                    selected === plan.id && plan.id !== 'free' && !feature.included && { color: 'rgba(255,255,255,0.4)' },
                  ]}>
                    {feature.text}
                  </Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        ))}

        {/* Trust */}
        <View style={styles.trustRow}>
          {['Cancel anytime', 'No hidden fees', 'Secure payment'].map(item => (
            <View key={item} style={styles.trustItem}>
              <Text style={styles.trustText}>✓ {item}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.legalText}>
          Subscriptions auto-renew unless cancelled 24 hours before the renewal date.
          Manage subscriptions in your App Store settings.
        </Text>
      </ScrollView>

      {/* CTA Button */}
      <View style={styles.bottomArea}>
        <TouchableOpacity style={styles.subscribeBtn} onPress={handleSubscribe}>
          <Text style={styles.subscribeBtnText}>
            {selected === 'free'
              ? 'Continue with Free'
              : `Start ${PLANS.find(p => p.id === selected)?.name} — ${PLANS.find(p => p.id === selected)?.price}/mo`}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAF8' },
  topBar: {
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EBEBEA',
    alignItems: 'flex-end',
  },
  closeText: { fontSize: 14, color: '#6B6B68', fontWeight: '500' },
  scroll: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 32, gap: 14 },
  header: { alignItems: 'center', gap: 10, marginBottom: 8 },
  logo: { width: 64, height: 64, borderRadius: 16 },
  title: { fontSize: 26, fontWeight: '600', color: '#1A1A18', letterSpacing: -0.3, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#6B6B68', lineHeight: 22, textAlign: 'center', paddingHorizontal: 16 },
  planCard: {
    borderRadius: 20, borderWidth: 2, padding: 18,
    backgroundColor: '#FFFFFF', gap: 14, position: 'relative',
  },
  badge: {
    position: 'absolute', top: -12, right: 16,
    backgroundColor: '#C85A2A', borderRadius: 20,
    paddingVertical: 4, paddingHorizontal: 12,
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  planName: { fontSize: 18, fontWeight: '600', color: '#1A1A18' },
  planPeriod: { fontSize: 12, color: '#6B6B68', marginTop: 2 },
  planPrice: { fontSize: 24, fontWeight: '700', color: '#1A1A18' },
  featureList: { gap: 8 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureCheck: { fontSize: 13, fontWeight: '700', color: '#1D9E75', width: 16 },
  featureCross: { color: '#ABABAA' },
  featureText: { fontSize: 13, color: '#1A1A18', flex: 1 },
  featureTextMuted: { color: '#ABABAA' },
  trustRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 4 },
  trustItem: {},
  trustText: { fontSize: 11, color: '#6B6B68', fontWeight: '500' },
  legalText: { fontSize: 10, color: '#ABABAA', textAlign: 'center', lineHeight: 16, paddingHorizontal: 8 },
  bottomArea: { padding: 20, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#EBEBEA' },
  subscribeBtn: { height: 54, borderRadius: 16, backgroundColor: '#C85A2A', alignItems: 'center', justifyContent: 'center' },
  subscribeBtnText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF', letterSpacing: -0.2 },
})