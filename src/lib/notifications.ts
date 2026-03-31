import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'
import { supabase } from './supabase'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('Push notifications only work on real devices')
    return null
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission denied')
    return null
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#C85A2A',
    })
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data
  return token
}

export async function savePushToken(token: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase
    .from('profiles')
    .update({ push_token: token })
    .eq('id', user.id)
}

export async function sendPushNotification(
  token: string,
  title: string,
  body: string,
  data?: object
) {
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: token,
      sound: 'default',
      title,
      body,
      data: data ?? {},
    }),
  })
}

export async function notifyNewMatch(matchedUserName: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const { data: profile } = await supabase
    .from('profiles')
    .select('push_token, notifications_enabled')
    .eq('id', user.id)
    .single()
  if (!profile?.push_token || !profile?.notifications_enabled) return
  await sendPushNotification(
    profile.push_token,
    '💛 New Match!',
    `You matched with ${matchedUserName}. Start a conversation!`,
    { screen: 'Messages' }
  )
}

export async function notifyNewMessage(senderName: string, matchId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const { data: profile } = await supabase
    .from('profiles')
    .select('push_token, notifications_enabled')
    .eq('id', user.id)
    .single()
  if (!profile?.push_token || !profile?.notifications_enabled) return
  await sendPushNotification(
    profile.push_token,
    '💬 New Message',
    `${senderName} sent you a message`,
    { screen: 'Chat', matchId }
  )
}

export async function notifyCallScheduled(schedulerName: string, scheduledAt: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const { data: profile } = await supabase
    .from('profiles')
    .select('push_token, notifications_enabled')
    .eq('id', user.id)
    .single()
  if (!profile?.push_token || !profile?.notifications_enabled) return
  const time = new Date(scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  await sendPushNotification(
    profile.push_token,
    '📞 Call Scheduled',
    `${schedulerName} scheduled a call with you at ${time}`,
    { screen: 'Messages' }
  )
}

export async function notifyCallReminder(matchName: string, scheduledAt: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const { data: profile } = await supabase
    .from('profiles')
    .select('push_token, notifications_enabled')
    .eq('id', user.id)
    .single()
  if (!profile?.push_token || !profile?.notifications_enabled) return
  const time = new Date(scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  await sendPushNotification(
    profile.push_token,
    '⏰ Call Reminder',
    `Your call with ${matchName} is in 1 hour at ${time}`,
    { screen: 'Messages' }
  )
}

export async function notifyPhotosRevealed(matchName: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const { data: profile } = await supabase
    .from('profiles')
    .select('push_token, notifications_enabled')
    .eq('id', user.id)
    .single()
  if (!profile?.push_token || !profile?.notifications_enabled) return
  await sendPushNotification(
    profile.push_token,
    '🎉 Photos Revealed!',
    `Your photos with ${matchName} have been revealed. Check them out!`,
    { screen: 'Messages' }
  )
}