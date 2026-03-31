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
  Modal,
} from 'react-native'
import { Audio } from 'expo-av'
import { supabase } from '../lib/supabase'

const REPORT_REASONS = [
  { value: 'harassment', label: 'Harassment or bullying', emoji: '😡' },
  { value: 'threatening', label: 'Threatening behavior', emoji: '⚠️' },
  { value: 'inappropriate', label: 'Inappropriate content', emoji: '🚫' },
  { value: 'fake', label: 'Fake profile or impersonation', emoji: '🎭' },
  { value: 'underage', label: 'Possibly underage', emoji: '👶' },
  { value: 'spam', label: 'Spam or scam', emoji: '📵' },
  { value: 'other', label: 'Other', emoji: '💬' },
]

export default function ChatScreen({ navigation, route }: any) {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<any[]>([])
  const [recording, setRecording] = useState<Audio.Recording | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [iceBreakers, setIceBreakers] = useState<string[]>([])
  const [deepQuestion, setDeepQuestion] = useState<string | null>(null)
  const [loadingDeepQ, setLoadingDeepQ] = useState(false)
  const [shownQuestionIds, setShownQuestionIds] = useState<string[]>([])
  const [showReportModal, setShowReportModal] = useState(false)
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<any>(null)
  const [selectedReason, setSelectedReason] = useState('')
  const [submittingReport, setSubmittingReport] = useState(false)
  const [reportSuccess, setReportSuccess] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)
  const scrollRef = useRef<ScrollView>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const podName = route?.params?.pod?.name ?? route?.params?.match?.matched_user_name ?? 'Your Match'
  const matchId = route?.params?.match?.id ?? route?.params?.pod?.id ?? null
  const matchedUserId = route?.params?.match?.matched_user_id ?? null
  const matchedUserName = route?.params?.match?.matched_user_name ?? 'Your Match'

  useEffect(() => {
    loadIceBreakers()
    loadDateSuggestions()
    checkIfBlocked()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (recording) recording.stopAndUnloadAsync()
    }
  }, [])

  async function checkIfBlocked() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !matchedUserId) return
    const { data } = await supabase
      .from('blocked_users')
      .select('id')
      .eq('blocker_id', user.id)
      .eq('blocked_id', matchedUserId)
      .single()
    if (data) setIsBlocked(true)
  }

  async function loadIceBreakers() {
    const { data } = await supabase
      .from('ice_breakers')
      .select('id, question')
      .limit(100)
    if (data && data.length > 0) {
      const shuffled = data.sort(() => Math.random() - 0.5)
      const picked = shuffled.slice(0, 3)
      setIceBreakers(picked.map(q => q.question))
      setShownQuestionIds(picked.map(q => q.id))
    }
  }

  async function loadDateSuggestions() {
    if (!matchId) return
    const { data } = await supabase
      .from('date_suggestions')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true })
    if (data && data.length > 0) {
      const suggestionMessages = data.map(s => ({
        id: `suggestion_${s.id}`,
        type: 'date_suggestion',
        sender: 'me',
        venue_name: s.venue_name,
        venue_address: s.venue_address,
        time: new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }))
      setMessages(prev => [...prev, ...suggestionMessages])
    }
  }

  async function generateDeepQuestion() {
    setLoadingDeepQ(true)
    const { data } = await supabase
      .from('deep_questions')
      .select('id, question')
      .limit(200)
    if (data && data.length > 0) {
      const unseen = data.filter(q => !shownQuestionIds.includes(q.id))
      const pool = unseen.length > 0 ? unseen : data
      const picked = pool[Math.floor(Math.random() * pool.length)]
      setDeepQuestion(picked.question)
      setShownQuestionIds(prev => [...prev, picked.id])
    }
    setLoadingDeepQ(false)
  }

  async function handleBlock() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('blocked_users').insert({
      blocker_id: user.id,
      blocked_id: matchedUserId || matchId,
      blocked_name: matchedUserName,
    })
    await supabase.from('matches')
      .update({ status: 'blocked' })
      .eq('id', matchId)
    setIsBlocked(true)
    setShowBlockModal(false)
    navigation.navigate('Messages')
  }

  async function handleReport() {
    if (!selectedReason) return
    setSubmittingReport(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('reports').insert({
      reporter_id: user.id,
      reported_user_id: matchedUserId || null,
      match_id: matchId,
      message_id: selectedMessage?.id || null,
      message_content: selectedMessage?.content || selectedMessage?.duration || null,
      message_type: selectedMessage?.type || 'text',
      reason: selectedReason,
      status: 'pending',
    })

    await supabase.from('strikes').insert({
      user_id: matchedUserId || null,
      reason: selectedReason,
    })

    const { count } = await supabase
      .from('strikes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', matchedUserId)

    if ((count ?? 0) >= 3) {
      await supabase.from('profiles')
        .update({ is_suspended: true, suspended_reason: 'Three reports — pending review' })
        .eq('id', matchedUserId)
    }

    setSubmittingReport(false)
    setReportSuccess(true)
    setSelectedReason('')
    setSelectedMessage(null)
  }

  async function startRecording() {
    try {
      const permission = await Audio.requestPermissionsAsync()
      if (!permission.granted) {
        if (Platform.OS === 'web') window.alert('Microphone access needed. Works on iPhone app.')
        return
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true })
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      )
      setRecording(newRecording)
      setIsRecording(true)
      setRecordingDuration(0)
      timerRef.current = setInterval(() => setRecordingDuration(prev => prev + 1), 1000)
    } catch {
      if (Platform.OS === 'web') window.alert('Voice notes work on the iPhone app.')
    }
  }

  async function stopRecording() {
    if (!recording) return
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
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
        await supabase.storage.from('voice-notes').upload(fileName, blob, { contentType: 'audio/m4a', upsert: true })
        const mins = Math.floor(recordingDuration / 60)
        const secs = recordingDuration % 60
        const newMsg = {
          id: Date.now().toString(),
          type: 'audio',
          sender: 'me',
          duration: `${mins}:${secs.toString().padStart(2, '0')}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
        setMessages(prev => [...prev, newMsg])
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
      }
    } catch (err) { console.error(err) }
    setUploading(false)
    setRecordingDuration(0)
  }

  function handleSend() {
    if (!message.trim()) return
    const newMsg = {
      id: Date.now().toString(),
      type: 'text',
      sender: 'me',
      content: message.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages(prev => [...prev, newMsg])
    setMessage('')
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
  }

  function openReport(msg: any) {
    setSelectedMessage(msg)
    setReportSuccess(false)
    setSelectedReason('')
    setShowReportModal(true)
  }

  return (
    <SafeAreaView style={styles.container}>

      {/* Report Modal */}
      <Modal visible={showReportModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalTopBar}>
            <Text style={styles.modalTitle}>Report Message</Text>
            <TouchableOpacity onPress={() => { setShowReportModal(false); setReportSuccess(false) }}>
              <Text style={styles.modalClose}>Close</Text>
            </TouchableOpacity>
          </View>

          {reportSuccess ? (
            <View style={styles.reportSuccess}>
              <Text style={styles.reportSuccessEmoji}>✅</Text>
              <Text style={styles.reportSuccessTitle}>Report submitted</Text>
              <Text style={styles.reportSuccessText}>
                Thank you for keeping Versant safe. We will review this within 24 hours.
              </Text>
              <TouchableOpacity style={styles.reportSuccessBtn} onPress={() => { setShowReportModal(false); setReportSuccess(false) }}>
                <Text style={styles.reportSuccessBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <ScrollView contentContainerStyle={styles.modalScroll}>
                <Text style={styles.modalSubtitle}>What is the reason for this report?</Text>

                {selectedMessage && (
                  <View style={styles.reportedPreview}>
                    <Text style={styles.reportedLabel}>Reported message:</Text>
                    <Text style={styles.reportedContent}>
                      {selectedMessage.type === 'audio'
                        ? `🎙️ Voice note (${selectedMessage.duration})`
                        : selectedMessage.content}
                    </Text>
                  </View>
                )}

                {REPORT_REASONS.map(reason => (
                  <TouchableOpacity
                    key={reason.value}
                    style={[styles.reasonRow, selectedReason === reason.value && styles.reasonRowSelected]}
                    onPress={() => setSelectedReason(reason.value)}
                  >
                    <Text style={styles.reasonEmoji}>{reason.emoji}</Text>
                    <Text style={[styles.reasonLabel, selectedReason === reason.value && styles.reasonLabelSelected]}>
                      {reason.label}
                    </Text>
                    {selectedReason === reason.value && <Text style={styles.reasonCheck}>✓</Text>}
                  </TouchableOpacity>
                ))}

                <View style={styles.reportNote}>
                  <Text style={styles.reportNoteText}>
                    🔒 Reports are reviewed within 24 hours. All content is kept on file for legal purposes.
                  </Text>
                </View>
              </ScrollView>

              <View style={styles.modalBottom}>
                <TouchableOpacity
                  style={[styles.submitBtn, (!selectedReason || submittingReport) && styles.submitBtnDisabled]}
                  onPress={handleReport}
                  disabled={!selectedReason || submittingReport}
                >
                  {submittingReport ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitBtnText}>Submit Report</Text>}
                </TouchableOpacity>
              </View>
            </>
          )}
        </SafeAreaView>
      </Modal>

      {/* Block Modal */}
      <Modal visible={showBlockModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalTopBar}>
            <Text style={styles.modalTitle}>Block {matchedUserName}?</Text>
            <TouchableOpacity onPress={() => setShowBlockModal(false)}>
              <Text style={styles.modalClose}>Cancel</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.blockContent}>
            <Text style={styles.blockEmoji}>🚫</Text>
            <Text style={styles.blockTitle}>Block {matchedUserName}</Text>
            <Text style={styles.blockText}>
              They will not be able to message you or find you on Versant. They will not be notified.
            </Text>
            <View style={styles.blockNote}>
              <Text style={styles.blockNoteText}>
                💡 To report a specific message tap the 🚩 flag next to it.
              </Text>
            </View>
            <TouchableOpacity style={styles.blockBtn} onPress={handleBlock}>
              <Text style={styles.blockBtnText}>Yes Block {matchedUserName}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.blockCancelBtn} onPress={() => setShowBlockModal(false)}>
              <Text style={styles.blockCancelBtnText}>Never mind</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.topCenter}>
          <Text style={styles.topName}>{podName}</Text>
          <Text style={styles.topSub}>Photos hidden until your 15 min call</Text>
        </View>
        <TouchableOpacity style={styles.moreBtn} onPress={() => setShowBlockModal(true)}>
          <Text style={styles.moreBtnText}>⋯</Text>
        </TouchableOpacity>
      </View>

      {isBlocked && (
        <View style={styles.blockedBanner}>
          <Text style={styles.blockedBannerText}>🚫 You have blocked this person.</Text>
        </View>
      )}

      {!isBlocked && (
        <TouchableOpacity
          style={styles.scheduleCallBtn}
          onPress={() => navigation.navigate('ScheduleCall', { matchId, matchName: podName, userId: matchedUserId })}
        >
          <Text style={styles.scheduleCallIcon}>📞</Text>
          <View style={styles.scheduleCallInfo}>
            <Text style={styles.scheduleCallTitle}>Schedule Your Call</Text>
            <Text style={styles.scheduleCallSub}>Stay on 15 min → photos reveal automatically</Text>
          </View>
          <View style={styles.scheduleCallBadge}>
            <Text style={styles.scheduleCallBadgeText}>Tap</Text>
          </View>
        </TouchableOpacity>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {iceBreakers.length > 0 && (
            <View style={styles.iceBreakerCard}>
              <Text style={styles.iceBreakerTitle}>🎉 You matched! Break the ice:</Text>
              {iceBreakers.map((q, i) => (
                <View key={i} style={styles.iceBreakerRow}>
                  <Text style={styles.iceBreakerEmoji}>{i === 0 ? '😂' : i === 1 ? '🤔' : '😄'}</Text>
                  <Text style={styles.iceBreakerText}>{q}</Text>
                </View>
              ))}
            </View>
          )}

          <Text style={styles.dateDivider}>Conversation started today</Text>

          {messages.map(msg => {
            if (msg.type === 'date_suggestion') {
              return (
                <View key={msg.id} style={[styles.msgWrap, styles.msgWrapMe]}>
                  <View style={styles.dateSuggestionCard}>
                    <Text style={styles.dateSuggestionLabel}>📅 Date suggestion sent</Text>
                    <Text style={styles.dateSuggestionVenue}>{msg.venue_name}</Text>
                    <Text style={styles.dateSuggestionAddress}>📍 {msg.venue_address}</Text>
                  </View>
                  {msg.time && <Text style={styles.msgTime}>{msg.time}</Text>}
                </View>
              )
            }

            if (msg.type === 'audio') {
              return (
                <View key={msg.id} style={[styles.msgWrap, msg.sender === 'me' ? styles.msgWrapMe : styles.msgWrapThem]}>
                  {msg.sender === 'them' && (
                    <TouchableOpacity style={styles.flagBtn} onPress={() => openReport(msg)}>
                      <Text style={styles.flagBtnText}>🚩</Text>
                    </TouchableOpacity>
                  )}
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
              <View key={msg.id} style={[styles.msgWrap, msg.sender === 'me' ? styles.msgWrapMe : styles.msgWrapThem]}>
                {msg.sender === 'them' && (
                  <TouchableOpacity style={styles.flagBtn} onPress={() => openReport(msg)}>
                    <Text style={styles.flagBtnText}>🚩</Text>
                  </TouchableOpacity>
                )}
                <View style={[styles.bubble, msg.sender === 'me' ? styles.bubbleMe : styles.bubbleThem]}>
                  <Text style={[styles.bubbleText, msg.sender === 'me' ? styles.bubbleTextMe : styles.bubbleTextThem]}>
                    {msg.content}
                  </Text>
                </View>
                {msg.time && <Text style={styles.msgTime}>{msg.time}</Text>}
              </View>
            )
          })}

          {deepQuestion && (
            <View style={styles.deepQuestionCard}>
              <Text style={styles.deepQuestionLabel}>✨ Deep question</Text>
              <Text style={styles.deepQuestionText}>{deepQuestion}</Text>
              <TouchableOpacity style={styles.newQuestionBtn} onPress={generateDeepQuestion} disabled={loadingDeepQ}>
                <Text style={styles.newQuestionBtnText}>{loadingDeepQ ? 'Loading...' : 'Generate another →'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {!deepQuestion && !isBlocked && (
          <TouchableOpacity style={styles.generateBtn} onPress={generateDeepQuestion} disabled={loadingDeepQ}>
            {loadingDeepQ ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.generateBtnText}>✨ Generate a deeper question</Text>}
          </TouchableOpacity>
        )}

        {isRecording && (
          <View style={styles.recordingBanner}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>
              Recording... {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
            </Text>
            <Text style={styles.recordingHint}>Tap 🎙️ again to send</Text>
          </View>
        )}

        {!isBlocked && (
          <View style={styles.inputBar}>
            {uploading ? (
              <View style={styles.micButton}><ActivityIndicator color="#FFFFFF" size="small" /></View>
            ) : (
              <TouchableOpacity
                style={[styles.micButton, isRecording && styles.micButtonRecording]}
                onPress={isRecording ? stopRecording : startRecording}
              >
                <Text style={styles.micIcon}>🎙️</Text>
              </TouchableOpacity>
            )}
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor="#ABABAA"
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={500}
            />
            {message.trim().length > 0 && (
              <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
                <Text style={styles.sendIcon}>↑</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAF8' },
  modalContainer: { flex: 1, backgroundColor: '#FAFAF8' },
  modalTopBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EBEBEA' },
  modalTitle: { fontSize: 17, fontWeight: '600', color: '#1A1A18' },
  modalClose: { fontSize: 15, color: '#C85A2A', fontWeight: '500' },
  modalScroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32, gap: 10 },
  modalSubtitle: { fontSize: 14, color: '#6B6B68', marginBottom: 8 },
  modalBottom: { padding: 20, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#EBEBEA' },
  reportedPreview: { padding: 14, borderRadius: 14, backgroundColor: '#F5F4F2', borderWidth: 1, borderColor: '#EBEBEA', marginBottom: 8 },
  reportedLabel: { fontSize: 11, fontWeight: '600', color: '#ABABAA', marginBottom: 4 },
  reportedContent: { fontSize: 14, color: '#1A1A18', lineHeight: 20 },
  reasonRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1.5, borderColor: '#EBEBEA' },
  reasonRowSelected: { borderColor: '#C85A2A', backgroundColor: 'rgba(200,90,42,0.04)' },
  reasonEmoji: { fontSize: 22 },
  reasonLabel: { flex: 1, fontSize: 14, color: '#1A1A18', fontWeight: '500' },
  reasonLabelSelected: { color: '#C85A2A', fontWeight: '600' },
  reasonCheck: { fontSize: 16, color: '#C85A2A', fontWeight: '700' },
  reportNote: { padding: 14, borderRadius: 14, backgroundColor: '#E8F8F2', borderWidth: 1, borderColor: '#C0EAD8', marginTop: 8 },
  reportNoteText: { fontSize: 12, color: '#1D9E75', lineHeight: 18 },
  submitBtn: { height: 54, borderRadius: 16, backgroundColor: '#DC2626', alignItems: 'center', justifyContent: 'center' },
  submitBtnDisabled: { backgroundColor: '#E8E8E4' },
  submitBtnText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  reportSuccess: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 },
  reportSuccessEmoji: { fontSize: 56 },
  reportSuccessTitle: { fontSize: 22, fontWeight: '600', color: '#1A1A18' },
  reportSuccessText: { fontSize: 14, color: '#6B6B68', textAlign: 'center', lineHeight: 22 },
  reportSuccessBtn: { height: 52, paddingHorizontal: 32, borderRadius: 16, backgroundColor: '#C85A2A', alignItems: 'center', justifyContent: 'center' },
  reportSuccessBtnText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  blockContent: { flex: 1, padding: 28, alignItems: 'center', gap: 14 },
  blockEmoji: { fontSize: 56 },
  blockTitle: { fontSize: 22, fontWeight: '600', color: '#1A1A18', textAlign: 'center' },
  blockText: { fontSize: 14, color: '#6B6B68', textAlign: 'center', lineHeight: 22 },
  blockNote: { padding: 14, borderRadius: 14, backgroundColor: '#FDF0EB', borderWidth: 1, borderColor: '#F2D4C8', width: '100%' },
  blockNoteText: { fontSize: 13, color: '#C85A2A', lineHeight: 20 },
  blockBtn: { width: '100%', height: 54, borderRadius: 16, backgroundColor: '#DC2626', alignItems: 'center', justifyContent: 'center' },
  blockBtnText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  blockCancelBtn: { width: '100%', height: 48, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EBEBEA', alignItems: 'center', justifyContent: 'center' },
  blockCancelBtnText: { fontSize: 15, color: '#6B6B68', fontWeight: '500' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EBEBEA' },
  backText: { fontSize: 15, color: '#C85A2A', fontWeight: '500' },
  topCenter: { alignItems: 'center', flex: 1 },
  topName: { fontSize: 16, fontWeight: '600', color: '#1A1A18' },
  topSub: { fontSize: 11, color: '#ABABAA', marginTop: 2, textAlign: 'center' },
  moreBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F4F2', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#EBEBEA' },
  moreBtnText: { fontSize: 18, color: '#6B6B68', fontWeight: '700' },
  blockedBanner: { padding: 12, backgroundColor: '#FEF2F2', borderBottomWidth: 1, borderBottomColor: '#FECACA' },
  blockedBannerText: { fontSize: 13, color: '#DC2626', textAlign: 'center', fontWeight: '500' },
  scheduleCallBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, margin: 12, padding: 16, borderRadius: 18, backgroundColor: '#C85A2A', shadowColor: '#C85A2A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12 },
  scheduleCallIcon: { fontSize: 24 },
  scheduleCallInfo: { flex: 1 },
  scheduleCallTitle: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  scheduleCallSub: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  scheduleCallBadge: { paddingVertical: 5, paddingHorizontal: 12, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.25)' },
  scheduleCallBadgeText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  keyboardView: { flex: 1 },
  messagesContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16, gap: 10 },
  iceBreakerCard: { padding: 16, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#EBEBEA', gap: 12, marginBottom: 8 },
  iceBreakerTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A18' },
  iceBreakerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  iceBreakerEmoji: { fontSize: 20, marginTop: 2 },
  iceBreakerText: { flex: 1, fontSize: 14, color: '#6B6B68', lineHeight: 22 },
  dateDivider: { textAlign: 'center', fontSize: 11, color: '#ABABAA', marginBottom: 4 },
  msgWrap: { maxWidth: '80%', gap: 3 },
  msgWrapMe: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  msgWrapThem: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  flagBtn: { alignSelf: 'flex-start', paddingHorizontal: 4, paddingVertical: 2, marginBottom: 2 },
  flagBtnText: { fontSize: 14 },
  bubble: { padding: 14, borderRadius: 20 },
  bubbleMe: { backgroundColor: '#C85A2A', borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EBEBEA', borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  bubbleTextMe: { color: '#FFFFFF' },
  bubbleTextThem: { color: '#1A1A18' },
  dateSuggestionCard: { padding: 14, borderRadius: 16, backgroundColor: '#FDF0EB', borderWidth: 1.5, borderColor: '#C85A2A', gap: 4, maxWidth: 280 },
  dateSuggestionLabel: { fontSize: 11, fontWeight: '600', color: '#C85A2A', marginBottom: 4 },
  dateSuggestionVenue: { fontSize: 15, fontWeight: '600', color: '#1A1A18' },
  dateSuggestionAddress: { fontSize: 12, color: '#6B6B68' },
  audioBubble: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 20, borderBottomLeftRadius: 4, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EBEBEA' },
  playButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#C85A2A', alignItems: 'center', justifyContent: 'center' },
  playIcon: { fontSize: 12, color: '#FFFFFF', marginLeft: 2 },
  waveform: { flexDirection: 'row', alignItems: 'center', gap: 2, height: 20 },
  waveBar: { width: 3, borderRadius: 2, backgroundColor: '#EBEBEA' },
  audioDuration: { fontSize: 12, color: '#ABABAA' },
  msgTime: { fontSize: 10, color: '#ABABAA' },
  deepQuestionCard: { padding: 16, borderRadius: 18, backgroundColor: '#F5F0FF', borderWidth: 1.5, borderColor: '#D4BBFF', gap: 10, marginTop: 8 },
  deepQuestionLabel: { fontSize: 12, fontWeight: '700', color: '#7C3AED' },
  deepQuestionText: { fontSize: 15, color: '#1A1A18', lineHeight: 24, fontWeight: '500' },
  newQuestionBtn: { alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#7C3AED' },
  newQuestionBtnText: { fontSize: 12, fontWeight: '600', color: '#FFFFFF' },
  generateBtn: { marginHorizontal: 16, marginBottom: 8, height: 46, borderRadius: 14, backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center' },
  generateBtnText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  recordingBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FEF2F2', borderTopWidth: 1, borderTopColor: '#FECACA' },
  recordingDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#DC2626' },
  recordingText: { fontSize: 14, fontWeight: '600', color: '#DC2626', flex: 1 },
  recordingHint: { fontSize: 12, color: '#DC2626', opacity: 0.7 },
  inputBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#EBEBEA' },
  input: { flex: 1, minHeight: 44, maxHeight: 120, borderRadius: 22, borderWidth: 1, borderColor: '#EBEBEA', backgroundColor: '#FAFAF8', paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: '#1A1A18' },
  micButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#C85A2A', alignItems: 'center', justifyContent: 'center' },
  micButtonRecording: { backgroundColor: '#DC2626' },
  micIcon: { fontSize: 18 },
  sendButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#C85A2A', alignItems: 'center', justifyContent: 'center' },
  sendIcon: { fontSize: 20, color: '#FFFFFF', fontWeight: '600' },
})