import React, { useEffect, useState, useRef } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { View, ActivityIndicator, Platform } from 'react-native'
import { supabase } from '../lib/supabase'
import { Session } from '@supabase/supabase-js'
import * as Notifications from 'expo-notifications'
import { registerForPushNotifications, savePushToken } from '../lib/notifications'
import Purchases, { LOG_LEVEL } from 'react-native-purchases'

import WelcomeScreen from '../screens/WelcomeScreen'
import SignUpScreen from '../screens/SignUpScreen'
import LoginScreen from '../screens/LoginScreen'
import DiscoverScreen from '../screens/DiscoverScreen'
import PodsScreen from '../screens/PodsScreen'
import ChatScreen from '../screens/ChatScreen'
import RevealScreen from '../screens/RevealScreen'
import DateScreen from '../screens/DateScreen'
import ProfileScreen from '../screens/ProfileScreen'
import QuizScreen from '../screens/QuizScreen'
import PhotoUploadScreen from '../screens/PhotoUploadScreen'
import TravelModeScreen from '../screens/TravelModeScreen'
import ScheduleCallScreen from '../screens/ScheduleCallScreen'
import PaywallScreen from '../screens/PaywallScreen'

const Stack = createNativeStackNavigator()

export default function Navigation() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const navigationRef = useRef<any>(null)
  const notificationListener = useRef<any>()
  const responseListener = useRef<any>()

  useEffect(() => {
    // Initialize RevenueCat — iOS only, not web
    if (Platform.OS !== 'web') {
      Purchases.setLogLevel(LOG_LEVEL.VERBOSE)
      Purchases.configure({
        apiKey: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY!,
      })
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === 'SIGNED_IN' && !session) return
      setSession(session)
      if (session) {
        setupPushNotifications()
        // Identify user in RevenueCat — iOS only
        if (session.user?.id && Platform.OS !== 'web') {
          Purchases.logIn(session.user.id)
        }
      }
    })
  }, [])

  useEffect(() => {
    if (session) {
      setupPushNotifications()
    }
  }, [session])

  async function setupPushNotifications() {
    const token = await registerForPushNotifications()
    if (token) {
      await savePushToken(token)
    }

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification)
    })

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data
      if (data?.screen && navigationRef.current) {
        if (data.screen === 'Messages') {
          navigationRef.current.navigate('Messages')
        } else if (data.screen === 'Chat' && data.matchId) {
          navigationRef.current.navigate('Messages')
        }
      }
    })

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current)
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current)
      }
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAFAF8' }}>
        <ActivityIndicator color="#C85A2A" size="large" />
      </View>
    )
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {session ? (
          <>
            <Stack.Screen name="Discover" component={DiscoverScreen} />
            <Stack.Screen name="Messages" component={PodsScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="Reveal" component={RevealScreen} />
            <Stack.Screen name="Date" component={DateScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Quiz" component={QuizScreen} />
            <Stack.Screen name="PhotoUpload" component={PhotoUploadScreen} />
            <Stack.Screen name="TravelMode" component={TravelModeScreen} />
            <Stack.Screen name="ScheduleCall" component={ScheduleCallScreen} />
            <Stack.Screen name="Paywall" component={PaywallScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}