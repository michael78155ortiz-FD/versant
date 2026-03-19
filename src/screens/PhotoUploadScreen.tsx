import React, { useState } from 'react'
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
import * as ImagePicker from 'expo-image-picker'
import { supabase } from '../lib/supabase'

const MAX_PHOTOS = 3
const MIN_PHOTOS = 2

export default function PhotoUploadScreen({ navigation }: any) {
  const [photos, setPhotos] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([])

  async function pickPhoto() {
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert('Max photos', 'You can upload up to 3 photos.')
      return
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert(
        'Permission needed',
        'Please allow access to your photo library.'
      )
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.8,
    })

    if (!result.canceled && result.assets[0]) {
      setPhotos(prev => [...prev, result.assets[0].uri])
    }
  }

  async function takePhoto() {
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert('Max photos', 'You can upload up to 3 photos.')
      return
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync()
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow access to your camera.')
      return
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.8,
    })

    if (!result.canceled && result.assets[0]) {
      setPhotos(prev => [...prev, result.assets[0].uri])
    }
  }

  function removePhoto(index: number) {
    setPhotos(prev => prev.filter((_, i) => i !== index))
  }

  async function uploadPhotos() {
    if (photos.length < MIN_PHOTOS) {
      Alert.alert(
        'More photos needed',
        'Please add at least 2 photos to continue.'
      )
      return
    }

    setUploading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const urls: string[] = []

    for (let i = 0; i < photos.length; i++) {
      const uri = photos[i]
      const fileName = `${user.id}_${Date.now()}_${i}.jpg`

      try {
        const response = await fetch(uri)
        const blob = await response.blob()

        const { data, error } = await supabase.storage
          .from('profile-photos')
          .upload(fileName, blob, {
            contentType: 'image/jpeg',
            upsert: true,
          })

        if (error) throw error

        const { data: urlData } = supabase.storage
          .from('profile-photos')
          .getPublicUrl(fileName)

        urls.push(urlData.publicUrl)
      } catch (err) {
        console.error('Upload error:', err)
      }
    }

    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: urls[0] })
      .eq('id', user.id)

    if (error) {
      Alert.alert('Error', error.message)
      setUploading(false)
      return
    }

    setUploadedUrls(urls)
    setUploading(false)
    navigation.navigate('Quiz')
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>Your Photos</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Quiz')}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Add your photos</Text>
          <Text style={styles.subtitle}>
            Your photos stay completely hidden until you both agree to reveal.
            Add 2–3 photos that show the real you.
          </Text>
        </View>

        {/* Privacy Badge */}
        <View style={styles.privacyBadge}>
          <Text style={styles.privacyBadgeText}>
            🔒 Hidden until mutual reveal — never shown without your consent
          </Text>
        </View>

        {/* Photo Grid */}
        <View style={styles.photoGrid}>
          {[0, 1, 2].map(index => (
            <View key={index} style={styles.photoSlot}>
              {photos[index] ? (
                <View style={styles.photoContainer}>
                  <Image
                    source={{ uri: photos[index] }}
                    style={styles.photo}
                  />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removePhoto(index)}
                  >
                    <Text style={styles.removeButtonText}>×</Text>
                  </TouchableOpacity>
                  {index === 0 && (
                    <View style={styles.mainBadge}>
                      <Text style={styles.mainBadgeText}>Main</Text>
                    </View>
                  )}
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.emptySlot,
                    index === 0 && styles.emptySlotMain,
                  ]}
                  onPress={pickPhoto}
                >
                  <Text style={styles.emptySlotIcon}>+</Text>
                  <Text style={styles.emptySlotLabel}>
                    {index === 0 ? 'Main photo' : `Photo ${index + 1}`}
                  </Text>
                  {index < MIN_PHOTOS && (
                    <View style={styles.requiredDot} />
                  )}
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Photo count */}
        <Text style={styles.photoCount}>
          {photos.length} of {MAX_PHOTOS} photos added
          {photos.length < MIN_PHOTOS && (
            <Text style={styles.photoCountRequired}>
              {' '}· {MIN_PHOTOS - photos.length} more required
            </Text>
          )}
        </Text>

        {/* Add Photo Buttons */}
        <View style={styles.addButtonsRow}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={pickPhoto}
            disabled={photos.length >= MAX_PHOTOS}
          >
            <Text style={styles.addButtonText}>📁 Choose from Library</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={takePhoto}
            disabled={photos.length >= MAX_PHOTOS}
          >
            <Text style={styles.addButtonText}>📷 Take a Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Tips */}
        <View style={styles.tipsBox}>
          <Text style={styles.tipsTitle}>📸 Photo tips</Text>
          {[
            'Clear face shot as your main photo',
            'Show your personality — hobbies, travel, pets',
            'Natural lighting works best',
            'Recent photos only — be authentic',
          ].map((tip, i) => (
            <Text key={i} style={styles.tipItem}>
              · {tip}
            </Text>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomArea}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            photos.length < MIN_PHOTOS && styles.continueButtonDisabled,
          ]}
          onPress={uploadPhotos}
          disabled={uploading || photos.length < MIN_PHOTOS}
        >
          {uploading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.continueButtonText}>
              {photos.length < MIN_PHOTOS
                ? `Add ${MIN_PHOTOS - photos.length} more photo${
                    MIN_PHOTOS - photos.length > 1 ? 's' : ''
                  }`
                : 'Continue to Quiz →'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
  topTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A18',
    letterSpacing: -0.3,
  },
  skipText: {
    fontSize: 13,
    color: '#ABABAA',
    fontWeight: '500',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 32,
    gap: 20,
  },
  header: {
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#1A1A18',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B6B68',
    lineHeight: 22,
  },
  privacyBadge: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FDF0EB',
    borderWidth: 1,
    borderColor: '#F2D4C8',
  },
  privacyBadgeText: {
    fontSize: 13,
    color: '#C85A2A',
    fontWeight: '500',
    lineHeight: 20,
  },
  photoGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  photoSlot: {
    flex: 1,
    aspectRatio: 4 / 5,
  },
  photoContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  removeButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  mainBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  mainBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptySlot: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#EBEBEA',
    borderStyle: 'dashed',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  emptySlotMain: {
    borderColor: '#C85A2A',
    borderWidth: 1.5,
  },
  emptySlotIcon: {
    fontSize: 24,
    color: '#C85A2A',
    fontWeight: '300',
  },
  emptySlotLabel: {
    fontSize: 11,
    color: '#ABABAA',
    fontWeight: '500',
  },
  requiredDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#C85A2A',
  },
  photoCount: {
    fontSize: 13,
    color: '#6B6B68',
    textAlign: 'center',
    fontWeight: '500',
  },
  photoCountRequired: {
    color: '#C85A2A',
  },
  addButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  addButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBEBEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1A1A18',
  },
  tipsBox: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F5F4F2',
    borderWidth: 1,
    borderColor: '#EBEBEA',
    gap: 6,
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A18',
    marginBottom: 4,
  },
  tipItem: {
    fontSize: 13,
    color: '#6B6B68',
    lineHeight: 20,
  },
  bottomArea: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EBEBEA',
  },
  continueButton: {
    height: 54,
    borderRadius: 16,
    backgroundColor: '#C85A2A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C85A2A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  continueButtonDisabled: {
    backgroundColor: '#E8E8E4',
    shadowOpacity: 0,
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
})