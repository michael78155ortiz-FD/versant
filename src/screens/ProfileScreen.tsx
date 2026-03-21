import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Image,
  Platform,
  Alert,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { supabase } from '../lib/supabase'

export default function ProfileScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [fullName, setFullName] = useState('')
  const [age, setAge] = useState('')
  const [city, setCity] = useState('')
  const [bio, setBio] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [travelMode, setTravelModeState] = useState(false)
  const [travelCity, setTravelCity] = useState('')
  const [matchCount, setMatchCount] = useState(0)

  useEffect(() => {
    loadProfile()
    loadMatchCount()
  }, [])

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    if (data) {
      setFullName(data.full_name ?? '')
      setAge(data.age?.toString() ?? '')
      setCity(data.city ?? '')
      setBio(data.bio ?? '')
      setPhotos(data.photos ?? [])
      setQuizCompleted(data.quiz_completed ?? false)
      setTravelModeState(data.travel_mode ?? false)
      setTravelCity(data.travel_city ?? '')
    }
    setLoading(false)
  }

  async function loadMatchCount() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { count } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'active')
    setMatchCount(count ?? 0)
  }

  async function handleSave() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        age: parseInt(age),
        city: city.trim(),
        bio: bio.trim(),
      })
      .eq('id', user.id)
    setSaving(false)
    if (error) {
      Platform.OS === 'web' ? window.alert('Error: ' + error.message) : Alert.alert('Error', error.message)
    } else {
      Platform.OS === 'web' ? window.alert('Saved! Your profile has been updated.') : Alert.alert('Saved ✓', 'Your profile has been updated.')
    }
  }

  async function handleAddPhoto() {
    if (photos.length >= 3) {
      Platform.OS === 'web' ? window.alert('Maximum 3 photos allowed.') : Alert.alert('Max photos', 'You can have up to 3 photos.')
      return
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Platform.OS === 'web' ? window.alert('Please allow access to your photos.') : Alert.alert('Permission needed', 'Please allow access to your photos.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.8,
    })
    if (!result.canceled && result.assets[0]) {
      setUploadingPhoto(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const uri = result.assets[0].uri
      const fileName = `${user.id}/${Date.now()}.jpg`
      try {
        const response = await fetch(uri)
        const blob = await response.blob()
        const { error: uploadError } = await supabase.storage
          .from('profile-photos')
          .upload(fileName, blob, { contentType: 'image/jpeg', upsert: true })
        if (uploadError) throw uploadError
        const { data: urlData } = supabase.storage.from('profile-photos').getPublicUrl(fileName)
        const newPhotos = [...photos, urlData.publicUrl]
        await supabase.from('profiles').update({ photos: newPhotos, avatar_url: newPhotos[0] }).eq('id', user.id)
        setPhotos(newPhotos)
        Platform.OS === 'web' ? window.alert('Photo added!') : Alert.alert('Photo added ✓')
      } catch (err: any) {
        Platform.OS === 'web' ? window.alert('Failed to upload: ' + err.message) : Alert.alert('Error', 'Failed to upload photo.')
      }
      setUploadingPhoto(false)
    }
  }

  async function handleDeletePhoto(index: number) {
    const doDelete = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const newPhotos = photos.filter((_, i) => i !== index)
      await supabase.from('profiles').update({ photos: newPhotos, avatar_url: newPhotos[0] ?? null }).eq('id', user.id)
      setPhotos(newPhotos)
    }
    if (Platform.OS === 'web') {
      if (window.confirm('Remove this photo?')) doDelete()
    } else {
      Alert.alert('Remove Photo', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: doDelete },
      ])
    }
  }

  async function handleSignOut() {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to sign out?')) {
        await supabase.auth.signOut()
      }
    } else {
      Alert.alert('Sign Out', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: async () => await supabase.auth.signOut() },
      ])
    }
  }

  async function handleDeleteAccount() {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('This will permanently delete your account and all your data. This cannot be undone. Are you sure?')
      if (!confirmed) return
      const doubleConfirm = window.confirm('Last chance — delete everything forever?')
      if (!doubleConfirm) return
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('profiles').delete().eq('id', user.id)
      await supabase.auth.signOut()
    } else {
      Alert.alert('Delete Account', 'This will permanently delete your account and all your data. This cannot be undone.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever', style: 'destructive', onPress: async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            await supabase.from('profiles').delete().eq('id', user.id)
            await supabase.auth.signOut()
          }
        },
      ])
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator color="#C85A2A" size="large" />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.topTitle}>My Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#C85A2A" size="small" /> : <Text style={styles.saveText}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Photos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Photos</Text>
          <Text style={styles.sectionSub}>Hidden from everyone until your 15 min call reveal</Text>
          <View style={styles.photoGrid}>
            {[0, 1, 2].map(index => (
              <View key={index} style={styles.photoSlot}>
                {photos[index] ? (
                  <View style={styles.photoContainer}>
                    <Image source={{ uri: photos[index] }} style={styles.photoImage} />
                    <TouchableOpacity style={styles.photoDelete} onPress={() => handleDeletePhoto(index)}>
                      <Text style={styles.photoDeleteText}>×</Text>
                    </TouchableOpacity>
                    {index === 0 && (
                      <View style={styles.mainBadge}>
                        <Text style={styles.mainBadgeText}>Main</Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.photoEmpty, index === 0 && styles.photoEmptyMain]}
                    onPress={handleAddPhoto}
                    disabled={uploadingPhoto}
                  >
                    {uploadingPhoto && index === photos.length ? (
                      <ActivityIndicator color="#C85A2A" size="small" />
                    ) : (
                      <>
                        <Text style={styles.photoEmptyIcon}>+</Text>
                        <Text style={styles.photoEmptyLabel}>{index === 0 ? 'Main photo' : `Photo ${index + 1}`}</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* About You */}
        <View style={styles.section}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarCircle}>
              {photos[0] ? (
                <Image source={{ uri: photos[0] }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarInitial}>{fullName ? fullName[0].toUpperCase() : 'V'}</Text>
              )}
            </View>
            <View>
              <Text style={styles.profileName}>{fullName || 'Your Name'}</Text>
              <Text style={styles.profileCity}>{city || 'Your City'}</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput style={styles.input} value={fullName} onChangeText={setFullName} autoCapitalize="words" placeholderTextColor="#ABABAA" placeholder="Your name" />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Age (must be 18 or older)</Text>
            <TextInput style={styles.input} value={age} onChangeText={setAge} keyboardType="number-pad" placeholderTextColor="#ABABAA" placeholder="Your age" maxLength={2} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>City</Text>
            <TextInput style={styles.input} value={city} onChangeText={setCity} autoCapitalize="words" placeholderTextColor="#ABABAA" placeholder="Your city" />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>About Me</Text>
            <TextInput style={styles.textArea} value={bio} onChangeText={setBio} placeholder="Tell people a little about yourself..." placeholderTextColor="#ABABAA" multiline numberOfLines={4} maxLength={300} />
            <Text style={styles.charCount}>{bio.length} / 300</Text>
          </View>
        </View>

        {/* Match Count */}
        <View style={styles.matchBox}>
          <View>
            <Text style={styles.matchBoxTitle}>Active Matches</Text>
            <Text style={styles.matchBoxSub}>Unmatch someone to open a new spot</Text>
          </View>
          <View style={styles.matchCount}>
            <Text style={styles.matchCountNum}>{matchCount}</Text>
            <Text style={styles.matchCountMax}>/8</Text>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          {[
            { icon: '📝', title: 'Compatibility Quiz', sub: quizCompleted ? 'Retake your quiz' : 'Complete your quiz — helps us find your match', screen: 'Quiz' },
            { icon: '✈️', title: 'Travel Mode', sub: travelMode ? `Active — ${travelCity}` : 'Find matches when traveling', screen: 'TravelMode' },
          ].map(item => (
            <TouchableOpacity key={item.title} style={styles.actionRow} onPress={() => navigation.navigate(item.screen)}>
              <View style={styles.actionLeft}>
                <Text style={styles.actionIcon}>{item.icon}</Text>
                <View>
                  <Text style={styles.actionTitle}>{item.title}</Text>
                  <Text style={styles.actionSub}>{item.sub}</Text>
                </View>
              </View>
              <Text style={styles.actionArrow}>→</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Matches', value: matchCount.toString() },
            { label: 'Calls Made', value: '0' },
            { label: 'Reveals', value: '0' },
          ].map(stat => (
            <View key={stat.label} style={styles.statBox}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* Delete Account */}
        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
          <Text style={styles.deleteButtonText}>⚠️ Delete My Account</Text>
        </TouchableOpacity>
        <Text style={styles.deleteWarning}>
          Deleting your account is permanent and cannot be undone.
        </Text>

        {/* Bottom Nav */}
        <View style={styles.bottomNav}>
          {[
            { label: 'Discover', screen: 'Discover' },
            { label: 'Messages', screen: 'Messages' },
            { label: 'Date', screen: 'Date' },
            { label: 'Profile', screen: 'Profile' },
          ].map(tab => (
            <TouchableOpacity key={tab.label} style={styles.navTab} onPress={() => navigation.navigate(tab.screen)}>
              <Text style={[styles.navLabel, tab.label === 'Profile' && styles.navLabelActive]}>{tab.label}</Text>
              {tab.label === 'Profile' && <View style={styles.navDot} />}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAFAF8' },
  container: { flex: 1, backgroundColor: '#FAFAF8' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EBEBEA' },
  topTitle: { fontSize: 20, fontWeight: '600', color: '#1A1A18' },
  saveText: { fontSize: 15, color: '#C85A2A', fontWeight: '600' },
  scroll: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 48, gap: 16 },
  section: { backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#EBEBEA', padding: 16, gap: 14 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#1A1A18' },
  sectionSub: { fontSize: 12, color: '#ABABAA', marginTop: -8 },
  photoGrid: { flexDirection: 'row', gap: 8 },
  photoSlot: { flex: 1, aspectRatio: 4 / 5 },
  photoContainer: { flex: 1, borderRadius: 14, overflow: 'hidden', position: 'relative' },
  photoImage: { width: '100%', height: '100%' },
  photoDelete: { position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  photoDeleteText: { fontSize: 14, color: '#FFFFFF', fontWeight: '600' },
  mainBadge: { position: 'absolute', bottom: 6, left: 6, paddingVertical: 2, paddingHorizontal: 7, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)' },
  mainBadgeText: { fontSize: 9, color: '#FFFFFF', fontWeight: '600' },
  photoEmpty: { flex: 1, borderRadius: 14, borderWidth: 1.5, borderColor: '#EBEBEA', borderStyle: 'dashed', backgroundColor: '#FAFAF8', alignItems: 'center', justifyContent: 'center', gap: 4 },
  photoEmptyMain: { borderColor: '#C85A2A' },
  photoEmptyIcon: { fontSize: 22, color: '#C85A2A' },
  photoEmptyLabel: { fontSize: 10, color: '#ABABAA', fontWeight: '500' },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#F5F4F2' },
  avatarCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#C85A2A', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: '100%', height: '100%' },
  avatarInitial: { fontSize: 22, fontWeight: '600', color: '#FFFFFF' },
  profileName: { fontSize: 16, fontWeight: '600', color: '#1A1A18' },
  profileCity: { fontSize: 13, color: '#6B6B68' },
  inputGroup: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: '#6B6B68' },
  input: { height: 50, backgroundColor: '#FAFAF8', borderRadius: 12, borderWidth: 1, borderColor: '#EBEBEA', paddingHorizontal: 14, fontSize: 15, color: '#1A1A18' },
  textArea: { height: 100, backgroundColor: '#FAFAF8', borderRadius: 12, borderWidth: 1, borderColor: '#EBEBEA', paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#1A1A18', textAlignVertical: 'top' },
  charCount: { fontSize: 11, color: '#ABABAA', textAlign: 'right' },
  matchBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#EBEBEA', padding: 16 },
  matchBoxTitle: { fontSize: 15, fontWeight: '600', color: '#1A1A18' },
  matchBoxSub: { fontSize: 12, color: '#6B6B68', marginTop: 2 },
  matchCount: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  matchCountNum: { fontSize: 32, fontWeight: '600', color: '#C85A2A' },
  matchCountMax: { fontSize: 16, color: '#ABABAA', fontWeight: '500' },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F5F4F2' },
  actionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  actionIcon: { fontSize: 22 },
  actionTitle: { fontSize: 15, fontWeight: '600', color: '#1A1A18', marginBottom: 2 },
  actionSub: { fontSize: 12, color: '#6B6B68' },
  actionArrow: { fontSize: 16, color: '#ABABAA' },
  statsRow: { flexDirection: 'row', gap: 10 },
  statBox: { flex: 1, padding: 14, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EBEBEA', alignItems: 'center', gap: 4 },
  statValue: { fontSize: 24, fontWeight: '600', color: '#C85A2A' },
  statLabel: { fontSize: 10, color: '#ABABAA', textAlign: 'center' },
  signOutButton: { height: 52, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EBEBEA', alignItems: 'center', justifyContent: 'center' },
  signOutText: { fontSize: 15, fontWeight: '500', color: '#6B6B68' },
  deleteButton: { height: 52, borderRadius: 16, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', alignItems: 'center', justifyContent: 'center' },
  deleteButtonText: { fontSize: 15, fontWeight: '600', color: '#DC2626' },
  deleteWarning: { fontSize: 11, color: '#ABABAA', textAlign: 'center', lineHeight: 16 },
  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16, backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#EBEBEA' },
  navTab: { alignItems: 'center', gap: 4 },
  navLabel: { fontSize: 11, fontWeight: '500', color: '#ABABAA' },
  navLabelActive: { color: '#C85A2A', fontWeight: '600' },
  navDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#C85A2A' },
})