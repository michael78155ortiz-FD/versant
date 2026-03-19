import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { Audio } from 'expo-av'
import { supabase } from '../lib/supabase'

const MOCK_MESSAGES = [
  {
    id: '1',
    type: 'audio',
    sender: 'them',
    duration: '0:31',
    time: '9:14 AM',
  },
  {
    id: '2',
    type: 'text',
    sender: 'me',
    content: 'your take on that was actually really surprising — in the best way',
    time: '9:18 AM',
  },
  {
    id: '3',
    type: 'text',
    sender: 'them',
    content: 'most people expect the safe answer lol',
    time: '9:19 AM',
  },
  {
    id: '4',
    type: 'ai_prompt',
    content: 'You both value financial independence. Ask: "what does enough actually look like to you?"',
  },
  {
    id: '5',
    type: 'text',
    sender: 'me',
    content: 'ok real question — what does "enough money" look like to you?',
    time: '9:22 AM',
  },
  {
    id: '6',
    type: 'audio',
    sender: 'them',
    duration: '0:47',
    time: '9:24 AM',
  },
]

export default function ChatScreen({ navigation, route }: any) {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState(MOCK_MESSAGES)
  const [recording, setRecording] = useState<Audio.Recording | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [uploading, setUploading] = useState(false)
  const scrollRef = useRef<ScrollView>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const podName = route?.params?.pod?.name ?? route?.params?.match?.profile?.full_name ?? 'Maya'
  const talkTime = route?.params?.pod?.talkTime ?? 12

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (recording) recording.stopAndUnloadAsync()
    }
  }, [])

  async function startRecording() {
    try {
      const permission = await Audio.requestPermissionsAsync()
      if (!permission.granted) {
        if (Platform.OS === 'web') {
          window.alert('Microphone permission is required to send voice notes.')
        }
        return
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      })

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      )

      setRecording(newRecording)
      setIsRecording(true)
      setRecordingDuration(0)

      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1)
      }, 1000)
    } catch (err) {
      console.error('Failed to start recording:', err)
      if (Platform.OS === 'web') {
        window.alert('Voice recording is not supported in the browser. It works on the iPhone app.')
      }
    }
  }

  async function stopRecording() {
    if (!recording) return

    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    setIsRecording(false)
    setUploading(true)

    try {
      await recording.stopAndUnloadAsync()
      const uri = recording.getURI()
      setRecording(null)

      if (uri) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const fileName = `voice/${user.id}/${Date.now()}.m4a`
        const response = await fetch(uri)
        const blob = await response.blob()

        await supabase.storage
          .from('voice-notes')
          .upload(fileName, blob, {
            contentType: 'audio/m4a',
            upsert: true,
          })

        const duration = recordingDuration
        const mins = Math.floor(duration / 60)
        const secs = duration % 60
        const durationStr = `${mins}:${secs.toString().padStart(2, '0')}`

        const newMessage = {
          id: Date.now().toString(),
          type: 'audio',
          sender: 'me',
          duration: durationStr,
          time: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        }

        setMessages(prev => [...prev, newMessage])
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
      }
    } catch (err) {
      console.error('Failed to stop recording:', err)
    }

    setUploading(false)
    setRecordingDuration(0)
  }

  function handleSend() {
    if (!message.trim()) return

    const newMessage = {
      id: Date.now().toString(),
      type: 'text',
      sender: 'me',
      content: message.trim(),
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }

    setMessages(prev => [...prev, newMessage])
    setMessage('')
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
  }

  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progressPercent = Math.min((talkTime / 20) * 100, 100)

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.topCenter}>
          <Text style={styles.topName}>{podName}</Text>
          <Text style={styles.topSub}>
            {talkTime} / 20 min · {20 - talkTime} min to reveal
          </Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Reveal')}>
          <Text style={styles.revealText}>Reveal</Text>
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressWrap}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={90}
      >
        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() =>
            scrollRef.current?.scrollToEnd({ animated: true })
          }
        >
          <Text style={styles.dateDivider}>Pod started · Today 9:12 AM</Text>

          {messages.map(msg => {
            if (msg.type === 'ai_prompt') {
              return (
                <View key={msg.id} style={styles.aiPrompt}>
                  <Text style={styles.aiPromptLabel}>✨ AI conversation starter</Text>
                  <Text style={styles.aiPromptText}>{msg.content}</Text>
                </View>
              )
            }

            if (msg.type === 'audio') {
              return (
                <View
                  key={msg.id}
                  style={[
                    styles.msgWrap,
                    msg.sender === 'me' ? styles.msgWrapMe : styles.msgWrapThem,
                  ]}
                >
                  <View style={styles.audioBubble}>
                    <TouchableOpacity style={styles.playButton}>
                      <Text style={styles.playIcon}>▶</Text>
                    </TouchableOpacity>
                    <View style={styles.waveform}>
                      {[6, 14, 10, 18, 8, 16, 12, 6, 14, 10].map((h, i) => (
                        <View key={i} style={[styles.waveBar, { height: h }]} />
                      ))}
                    </View>
                    <Text style={styles.audioDuration}>{msg.duration}</Text>
                  </View>
                  {msg.time && <Text style={styles.msgTime}>{msg.time}</Text>}
                </View>
              )
            }

            return (
              <View
                key={msg.id}
                style={[
                  styles.msgWrap,
                  msg.sender === 'me' ? styles.msgWrapMe : styles.msgWrapThem,
                ]}
              >
                <View
                  style={[
                    styles.bubble,
                    msg.sender === 'me' ? styles.bubbleMe : styles.bubbleThem,
                  ]}
                >
                  <Text
                    style={[
                      styles.bubbleText,
                      msg.sender === 'me' ? styles.bubbleTextMe : styles.bubbleTextThem,
                    ]}
                  >
                    {msg.content}
                  </Text>
                </View>
                {msg.time && <Text style={styles.msgTime}>{msg.time}</Text>}
              </View>
            )
          })}

          {/* Reveal Nudge */}
          <View style={styles.revealNudge}>
            <Text style={styles.revealNudgeTitle}>
              Almost there — {20 - talkTime} minutes left
            </Text>
            <Text style={styles.revealNudgeSub}>
              Keep talking to unlock the reveal
            </Text>
            <TouchableOpacity
              style={styles.revealNudgeBtn}
              onPress={() => navigation.navigate('Reveal')}
            >
              <Text style={styles.revealNudgeBtnText}>Request Reveal Now</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Recording indicator */}
        {isRecording && (
          <View style={styles.recordingBanner}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>
              Recording... {formatDuration(recordingDuration)}
            </Text>
            <Text style={styles.recordingHint}>Tap mic to send</Text>
          </View>
        )}

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Message..."
            placeholderTextColor="#ABABAA"
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={500}
            onSubmitEditing={handleSend}
          />

          {uploading ? (
            <View style={styles.micButton}>
              <ActivityIndicator color="#FFFFFF" size="small" />
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.micButton,
                isRecording && styles.micButtonRecording,
              ]}
              onPress={isRecording ? stopRecording : startRecording}
            >
              <Text style={styles.micIcon}>🎙️</Text>
            </TouchableOpacity>
          )}

          {message.trim().length > 0 && (
            <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
              <Text style={styles.sendIcon}>↑</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF8',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEA',
  },
  backText: {
    fontSize: 15,
    color: '#C85A2A',
    fontWeight: '500',
  },
  topCenter: {
    alignItems: 'center',
  },
  topName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A18',
  },
  topSub: {
    fontSize: 10,
    color: '#ABABAA',
    marginTop: 1,
  },
  revealText: {
    fontSize: 14,
    color: '#C85A2A',
    fontWeight: '600',
  },
  progressWrap: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 1,
  },
  progressTrack: {
    height: 3,
    backgroundColor: '#F5F4F2',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#C85A2A',
  },
  keyboardView: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 10,
  },
  dateDivider: {
    textAlign: 'center',
    fontSize: 10,
    color: '#ABABAA',
    marginBottom: 4,
  },
  msgWrap: {
    maxWidth: '76%',
    gap: 3,
  },
  msgWrapMe: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  msgWrapThem: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  bubble: {
    padding: 12,
    borderRadius: 18,
  },
  bubbleMe: {
    backgroundColor: '#C85A2A',
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBEBEA',
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleTextMe: {
    color: '#FFFFFF',
  },
  bubbleTextThem: {
    color: '#1A1A18',
  },
  audioBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBEBEA',
  },
  playButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#C85A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    fontSize: 10,
    color: '#FFFFFF',
    marginLeft: 2,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 20,
  },
  waveBar: {
    width: 2.5,
    borderRadius: 2,
    backgroundColor: '#EBEBEA',
  },
  audioDuration: {
    fontSize: 11,
    color: '#ABABAA',
  },
  msgTime: {
    fontSize: 9,
    color: '#ABABAA',
  },
  aiPrompt: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#FDF0EB',
    borderWidth: 1,
    borderColor: '#F2D4C8',
    marginVertical: 4,
  },
  aiPromptLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#C85A2A',
    marginBottom: 4,
  },
  aiPromptText: {
    fontSize: 12,
    color: '#C85A2A',
    opacity: 0.85,
    lineHeight: 18,
  },
  revealNudge: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#FDF0EB',
    borderWidth: 1,
    borderColor: '#F2D4C8',
    alignItems: 'center',
    marginTop: 8,
  },
  revealNudgeTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#C85A2A',
    marginBottom: 4,
  },
  revealNudgeSub: {
    fontSize: 11,
    color: '#C85A2A',
    opacity: 0.7,
    marginBottom: 10,
  },
  revealNudgeBtn: {
    width: '100%',
    height: 38,
    borderRadius: 10,
    backgroundColor: '#C85A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  revealNudgeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  recordingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FDF0EB',
    borderTopWidth: 1,
    borderTopColor: '#F2D4C8',
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DC2626',
  },
  recordingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#C85A2A',
    flex: 1,
  },
  recordingHint: {
    fontSize: 11,
    color: '#C85A2A',
    opacity: 0.7,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EBEBEA',
  },
  input: {
    flex: 1,
    minHeight: 38,
    maxHeight: 100,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EBEBEA',
    backgroundColor: '#FAFAF8',
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1A1A18',
  },
  micButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#C85A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micButtonRecording: {
    backgroundColor: '#DC2626',
  },
  micIcon: {
    fontSize: 16,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#C85A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
})