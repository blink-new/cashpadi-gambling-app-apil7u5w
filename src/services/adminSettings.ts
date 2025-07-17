// Admin Settings Service
// Manages admin-configurable settings like withdrawal limits

import { supabase } from '../lib/supabase'

export interface AdminSettings {
  id: string
  setting_key: string
  setting_value: string | number | boolean
  description?: string
  updated_by?: string
  updated_at: string
  created_at: string
}

export interface WithdrawalLimits {
  minWithdrawal: number
  maxWithdrawal: number
  dailyLimit: number
  monthlyLimit: number
  enabled: boolean
}

export interface GameSettings {
  minStake: number
  maxStake: number
  maxMultiplier: number
  houseEdge: number
  freeSpinsPerUser: number
}

export class AdminSettingsService {
  // Default settings
  private static defaultSettings = {
    min_withdrawal_amount: 100,
    max_withdrawal_amount: 50000,
    daily_withdrawal_limit: 100000,
    monthly_withdrawal_limit: 1000000,
    withdrawal_enabled: true,
    min_stake_amount: 50,
    max_stake_amount: 500,
    max_multiplier: 10,
    house_edge: 0.05,
    free_spins_per_user: 1,
    referral_bonus_amount: 25,
    daily_bonus_enabled: true
  }

  // Get a specific setting
  static async getSetting(key: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('setting_value')
        .eq('setting_key', key)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // Setting not found, return default
          return this.defaultSettings[key as keyof typeof this.defaultSettings] || null
        }
        throw error
      }

      // Parse the value based on type
      const value = data.setting_value
      if (typeof value === 'string') {
        // Try to parse as number or boolean
        if (value === 'true') return true
        if (value === 'false') return false
        if (!isNaN(Number(value))) return Number(value)
      }
      
      return value
    } catch (error) {
      console.error(`Error getting setting ${key}:`, error)
      return this.defaultSettings[key as keyof typeof this.defaultSettings] || null
    }
  }

  // Get multiple settings
  static async getSettings(keys: string[]): Promise<Record<string, any>> {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('setting_key, setting_value')
        .in('setting_key', keys)

      if (error) throw error

      const settings: Record<string, any> = {}
      
      // Add fetched settings
      data?.forEach(item => {
        let value = item.setting_value
        // Parse the value
        if (typeof value === 'string') {
          if (value === 'true') value = true
          else if (value === 'false') value = false
          else if (!isNaN(Number(value))) value = Number(value)
        }
        settings[item.setting_key] = value
      })

      // Add defaults for missing settings
      keys.forEach(key => {
        if (!(key in settings)) {
          settings[key] = this.defaultSettings[key as keyof typeof this.defaultSettings] || null
        }
      })

      return settings
    } catch (error) {
      console.error('Error getting settings:', error)
      // Return defaults on error
      const settings: Record<string, any> = {}
      keys.forEach(key => {
        settings[key] = this.defaultSettings[key as keyof typeof this.defaultSettings] || null
      })
      return settings
    }
  }

  // Update a setting
  static async updateSetting(key: string, value: any, updatedBy?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('admin_settings')
        .upsert({
          setting_key: key,
          setting_value: value,
          updated_by: updatedBy,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'setting_key'
        })

      if (error) throw error
    } catch (error) {
      console.error(`Error updating setting ${key}:`, error)
      throw error
    }
  }

  // Get withdrawal limits
  static async getWithdrawalLimits(): Promise<WithdrawalLimits> {
    const settings = await this.getSettings([
      'min_withdrawal_amount',
      'max_withdrawal_amount',
      'daily_withdrawal_limit',
      'monthly_withdrawal_limit',
      'withdrawal_enabled'
    ])

    return {
      minWithdrawal: settings.min_withdrawal_amount,
      maxWithdrawal: settings.max_withdrawal_amount,
      dailyLimit: settings.daily_withdrawal_limit,
      monthlyLimit: settings.monthly_withdrawal_limit,
      enabled: settings.withdrawal_enabled
    }
  }

  // Update withdrawal limits
  static async updateWithdrawalLimits(limits: Partial<WithdrawalLimits>, updatedBy?: string): Promise<void> {
    const updates: Array<Promise<void>> = []

    if (limits.minWithdrawal !== undefined) {
      updates.push(this.updateSetting('min_withdrawal_amount', limits.minWithdrawal, updatedBy))
    }
    if (limits.maxWithdrawal !== undefined) {
      updates.push(this.updateSetting('max_withdrawal_amount', limits.maxWithdrawal, updatedBy))
    }
    if (limits.dailyLimit !== undefined) {
      updates.push(this.updateSetting('daily_withdrawal_limit', limits.dailyLimit, updatedBy))
    }
    if (limits.monthlyLimit !== undefined) {
      updates.push(this.updateSetting('monthly_withdrawal_limit', limits.monthlyLimit, updatedBy))
    }
    if (limits.enabled !== undefined) {
      updates.push(this.updateSetting('withdrawal_enabled', limits.enabled, updatedBy))
    }

    await Promise.all(updates)
  }

  // Get game settings
  static async getGameSettings(): Promise<GameSettings> {
    const settings = await this.getSettings([
      'min_stake_amount',
      'max_stake_amount',
      'max_multiplier',
      'house_edge',
      'free_spins_per_user'
    ])

    return {
      minStake: settings.min_stake_amount,
      maxStake: settings.max_stake_amount,
      maxMultiplier: settings.max_multiplier,
      houseEdge: settings.house_edge,
      freeSpinsPerUser: settings.free_spins_per_user
    }
  }

  // Check if user has exceeded daily withdrawal limit
  static async checkDailyWithdrawalLimit(userId: string, amount: number): Promise<{
    allowed: boolean
    currentTotal: number
    limit: number
    remaining: number
  }> {
    try {
      const dailyLimit = await this.getSetting('daily_withdrawal_limit')
      const today = new Date().toISOString().split('T')[0]

      // Get today's withdrawals
      const { data, error } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', userId)
        .eq('type', 'withdrawal')
        .eq('status', 'completed')
        .gte('created_at', today + 'T00:00:00.000Z')
        .lt('created_at', today + 'T23:59:59.999Z')

      if (error) throw error

      const currentTotal = data?.reduce((sum, t) => sum + t.amount, 0) || 0
      const remaining = Math.max(0, dailyLimit - currentTotal)
      const allowed = (currentTotal + amount) <= dailyLimit

      return {
        allowed,
        currentTotal,
        limit: dailyLimit,
        remaining
      }
    } catch (error) {
      console.error('Error checking daily withdrawal limit:', error)
      // Allow withdrawal on error (fail open)
      return {
        allowed: true,
        currentTotal: 0,
        limit: this.defaultSettings.daily_withdrawal_limit,
        remaining: this.defaultSettings.daily_withdrawal_limit
      }
    }
  }

  // Initialize default settings (run once during setup)
  static async initializeDefaultSettings(): Promise<void> {
    try {
      const settingsToInsert = Object.entries(this.defaultSettings).map(([key, value]) => ({
        setting_key: key,
        setting_value: value,
        description: this.getSettingDescription(key),
        updated_at: new Date().toISOString()
      }))

      const { error } = await supabase
        .from('admin_settings')
        .upsert(settingsToInsert, {
          onConflict: 'setting_key',
          ignoreDuplicates: true
        })

      if (error) throw error
    } catch (error) {
      console.error('Error initializing default settings:', error)
      throw error
    }
  }

  // Get setting description
  private static getSettingDescription(key: string): string {
    const descriptions: Record<string, string> = {
      min_withdrawal_amount: 'Minimum amount users can withdraw (in Naira)',
      max_withdrawal_amount: 'Maximum amount users can withdraw per transaction (in Naira)',
      daily_withdrawal_limit: 'Maximum amount users can withdraw per day (in Naira)',
      monthly_withdrawal_limit: 'Maximum amount users can withdraw per month (in Naira)',
      withdrawal_enabled: 'Whether withdrawals are currently enabled',
      min_stake_amount: 'Minimum stake amount for games (in Naira)',
      max_stake_amount: 'Maximum stake amount for games (in Naira)',
      max_multiplier: 'Maximum multiplier for game wins',
      house_edge: 'House edge percentage (0.05 = 5%)',
      free_spins_per_user: 'Number of free spins given to new users',
      referral_bonus_amount: 'Bonus amount for successful referrals (in Naira)',
      daily_bonus_enabled: 'Whether daily bonuses are enabled'
    }
    return descriptions[key] || ''
  }
}