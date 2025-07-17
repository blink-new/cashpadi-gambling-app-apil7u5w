import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://acqcgwlzkbmiwknthpbn.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjcWNnd2x6a2JtaXdrbnRocGJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3ODMxMzgsImV4cCI6MjA2ODM1OTEzOH0.UbZe1TtNCruow1HVypIv1kvqb1H2DQ9Hlv5Vqy85-aA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface User {
  id: string
  user_id: string
  email: string
  display_name?: string
  balance: number
  free_spins_used: number
  has_played_paid_game: boolean
  referral_code: string
  total_winnings: number
  total_spins: number
  free_game_credits: number
  created_at: string
  updated_at: string
}

export interface GameSession {
  id: string
  user_id: string
  stake_amount: number
  win_amount: number
  multiplier: number
  is_free_spin: boolean
  session_data?: any
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  type: 'deposit' | 'withdrawal' | 'win' | 'stake' | 'bonus' | 'referral'
  amount: number
  status: 'pending' | 'completed' | 'failed'
  method?: string
  reference?: string
  metadata?: any
  payment_reference?: string
  payment_gateway?: string
  payment_method?: string
  bank_code?: string
  account_number?: string
  account_name?: string
  estimated_completion?: string
  failure_reason?: string
  created_at: string
}

export interface DailyBonus {
  id: string
  user_id: string
  bonus_day: number
  amount: number
  claimed_at: string
}

export interface Referral {
  id: string
  referrer_user_id: string
  referred_user_id: string
  referral_code: string
  bonus_amount: number
  status: 'pending' | 'completed'
  created_at: string
}