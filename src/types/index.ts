export interface Profile {
  id: string
  full_name: string
  age: number
  city: string
  bio: string
  voice_intro_url: string | null
  avatar_url: string | null
  is_verified: boolean
  created_at: string
}

export interface Pod {
  id: string
  user_one: string
  user_two: string
  status: 'active' | 'revealed' | 'closed'
  talk_time_seconds: number
  reveal_requested_by: string | null
  revealed_at: string | null
  created_at: string
}

export interface Message {
  id: string
  pod_id: string
  sender_id: string
  content: string | null
  audio_url: string | null
  message_type: 'text' | 'audio'
  created_at: string
}

export interface Venue {
  id: string
  name: string
  category: string
  address: string
  city: string
  lat: number
  lng: number
  is_phone_free: boolean
  description: string
  price_range: string
  created_at: string
}

export interface DateSuggestion {
  id: string
  pod_id: string
  venue_id: string
  suggested_by: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
}