import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native'
import Purchases, { PurchasesPackage } from 'react-native-purchases'

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    color: '#F5F4F2',
    textColor: '#1A1A18',
    borderColor: '#EBEBEA',
    rcIdentifier: null,
    features: [
      { text: '5 swipes per day', included: true },
      { text: 'Messaging', included: true },
      { text: 'Compatibility quiz', included: true },
      { text: 'Schedule voice calls', included: true },
      { text: 'Unlimited swipes', included: false },
      { text: 'Priority matching', included: false },
      { text: 'See who liked you', included: false },
      { text: 'Travel mode', included: false },
    ],
  },
  {
    id: 'weekly',
    name: 'Versant+',
    price: '$4.99',
    period: 'per week',
    color: '#C85A2A',
    textColor: '#FFFFFF',
    borderColor: '#C85A2A',
    badge: 'Most Popular',
    rcIdentifier: 'versant_weekly_499',
    features: [
      { text: 'Unlimited swipes', included: true },
      { text: 'Messaging', included: true },
      { text: 'Compatibility quiz', included: true },
      { text: 'Schedule voice calls', included: true },
      { text: 'Unlimited swipes', included: true },
      { text: 'Priority matching', included: true },
      { text: 'See who liked you', included: true },
      { text: 'Travel mode', included: true },
    ],
  },
  {
    id: 'monthly',
    name: 'Versant+ Monthly',
    price: '$14.99',
    period: 'per month',
    color: '#1A1A18',
    textColor: '#FFFFFF',
    borderColor: '#1A1A18',
    badge: 'Best Value',
    rcIdentifier: 'versant_monthly_1499',
    features: [
      { text: 'Unlimited swipes', included: true },
      { text: 'Messaging', included: true },
      { text: 'Compatibility quiz', included: true },
      { text: 'Schedule voice calls', included: true },
      { text: 'Unlimited swipes', included: true },
      { text: 'Priority matching', included: true },
      { text: 'See who liked you', included: true },
      { text: 'Travel mode', included: true },
    ],
  },
]

export default function PaywallScreen({ navigation }: any) {
  const [selected, setSelected] = useState('weekly')
  const [packages, setPackages] = useState<PurchasesPackage[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    loadOfferings()
  }, [])

  async function loadOfferings() {
    try {
      const offerings = await Purchases.getOfferings()
      if (offerings.current?.availablePackages) {
        setPackages(offerings.current.availablePackages)
      }
    } catch (e) {
      console.log('RevenueCat offerings error:', e)
    } finally {
      setFetching(false)
    }
  }

  async function handleSubscribe() {
    if (selected === 'free') {
      navigation.goBack()
      return
    }

    const plan = PLANS.find(p => p.id === selected)
    if (!plan) return

    // Find matching RevenueCat package
    const pkg = packages.find(p =>
      p.product.identifier === plan.rcIdentifier ||
      p.packageType.toLowerCase().includes(selected)
    )

    if (!pkg) {
      // No live products yet — Apple account still pending
      Alert.alert(
        'Coming Soon',
        'Payments will be live once the app launches on the App Store.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      )
      return
    }

    try {
      setLoading(true)
      const { customerInfo } = await Purchases.purchasePackage(pkg)
      if (Object.keys(customerInfo.entitlements.active).length > 0) {
        Alert.alert('Welcome to Versant+! 🎉', 'You now have unlimited swipes.', [
          { text: 'Let\'s go!', onPress: () => navigation.goBack() }
        ])
      }
    } catch (e: any) {
      if (!e.userCancelled) {
        Alert.alert('Purchase failed', 'Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleRestore() {
    try {
      setLoading(true)
      const customerInfo = await Purchases.restorePurchases()
      if (Object.keys(customerInfo.entitlements.active).length > 0) {
        Alert.alert('Restored! ✅', 'Your subscription has been restored.', [
          { text: 'Continue', onPress: () => navigation.goBack() }
        ])
      } else {
        Alert.alert('No purchases found', 'No active subscription found to restore.')
      }
    } catch (e) {
      Alert.alert('Restore failed', 'Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.closeText}>✕ Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Image source={require('../../assets/icon.png')} style={styles.logo} />
          <Text style={styles.title}>Find your person faster</Text>
          <Text style={styles.subtitle}>
            Upgrade to get unlimited swipes and priority matching.
          </Text>
        </View>

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

        <View style={styles.trustRow}>
          {['Cancel anytime', 'No hidden fees', 'Secure payment'].map(item => (
            <View key={item} style={styles.trustItem}>
              <Text style={styles.trustText}>✓ {item}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity onPress={handleRestore} style={styles.restoreBtn}>
          <Text style={styles.restoreText}>Restore purchases</Text>
        </TouchableOpacity>

        <Text style={styles.legalText}>
          Subscriptions auto-renew unless cancelled 24 hours before the renewal date.
          Manage subscriptions in your App Store settings.
        </Text>
      </ScrollView>

      <View style={styles.bottomArea}>
        <TouchableOpacity
          style={[styles.subscribeBtn, loading && styles.subscribeBtnDisabled]}
          onPress={handleSubscribe}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.subscribeBtnText}>
              {selected === 'free'
                ? 'Continue with Free'
                : `Start ${PLANS.find(p => p.id === selected)?.name} — ${PLANS.find(p => p.id === selected)?.price}`}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAF8' },
  topBar: { paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EBEBEA', alignItems: 'flex-end' },
  closeText: { fontSize: 14, color: '#6B6B68', fontWeight: '500' },
  scroll: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 32, gap: 14 },
  header: { alignItems: 'center', gap: 10, marginBottom: 8 },
  logo: { width: 64, height: 64, borderRadius: 16 },
  title: { fontSize: 26, fontWeight: '600', color: '#1A1A18', letterSpacing: -0.3, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#6B6B68', lineHeight: 22, textAlign: 'center', paddingHorizontal: 16 },
  planCard: { borderRadius: 20, borderWidth: 2, padding: 18, backgroundColor: '#FFFFFF', gap: 14, position: 'relative' },
  badge: { position: 'absolute', top: -12, right: 16, backgroundColor: '#C85A2A', borderRadius: 20, paddingVertical: 4, paddingHorizontal: 12 },
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
  restoreBtn: { alignItems: 'center', paddingVertical: 8 },
  restoreText: { fontSize: 13, color: '#C85A2A', fontWeight: '500' },
  legalText: { fontSize: 10, color: '#ABABAA', textAlign: 'center', lineHeight: 16, paddingHorizontal: 8 },
  bottomArea: { padding: 20, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#EBEBEA' },
  subscribeBtn: { height: 54, borderRadius: 16, backgroundColor: '#C85A2A', alignItems: 'center', justifyContent: 'center' },
  subscribeBtnDisabled: { opacity: 0.6 },
  subscribeBtnText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF', letterSpacing: -0.2 },
})