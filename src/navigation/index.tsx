import React, { useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { supabase } from '../lib/supabase'
import { Session } from '@supabase/supabase-js'

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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, [])

  if (loading) return null

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
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