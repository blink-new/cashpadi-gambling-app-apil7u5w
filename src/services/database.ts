import { supabase, User, GameSession, Transaction, DailyBonus, Referral } from '../lib/supabase'

export class DatabaseService {
  // User operations
  static async createOrUpdateUser(userData: {
    user_id: string
    email: string
    display_name?: string
  }): Promise<User> {
    // Generate referral code
    const referralCode = 'CP' + Math.random().toString(36).substring(2, 8).toUpperCase()
    
    const { data, error } = await supabase
      .from('users')
      .upsert({
        user_id: userData.user_id,
        email: userData.email,
        display_name: userData.display_name || userData.email.split('@')[0],
        referral_code: referralCode,
        balance: 0,
        free_spins_used: 0,
        has_played_paid_game: false,
        total_winnings: 0,
        total_spins: 0,
        free_game_credits: 1,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating/updating user:', error)
      throw error
    }

    return data
  }

  static async getUser(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // User not found
      }
      console.error('Error fetching user:', error)
      throw error
    }

    return data
  }

  static async updateUserBalance(userId: string, newBalance: number, winnings?: number): Promise<void> {
    const updates: any = {
      balance: newBalance,
      updated_at: new Date().toISOString()
    }

    if (winnings) {
      // Get current total winnings first
      const { data: user } = await supabase
        .from('users')
        .select('total_winnings, total_spins')
        .eq('user_id', userId)
        .single()

      if (user) {
        updates.total_winnings = user.total_winnings + winnings
        updates.total_spins = user.total_spins + 1
      }
    }

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('user_id', userId)

    if (error) {
      console.error('Error updating user balance:', error)
      throw error
    }
  }

  static async markPaidGamePlayed(userId: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ 
        has_played_paid_game: true,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (error) {
      console.error('Error marking paid game played:', error)
      throw error
    }
  }

  static async updateFreeSpinsUsed(userId: string): Promise<void> {
    // Get current values first
    const { data: user } = await supabase
      .from('users')
      .select('free_spins_used, free_game_credits')
      .eq('user_id', userId)
      .single()

    if (user) {
      const { error } = await supabase
        .from('users')
        .update({
          free_spins_used: user.free_spins_used + 1,
          free_game_credits: Math.max(0, user.free_game_credits - 1),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (error) {
        console.error('Error updating free spins:', error)
        throw error
      }
    }
  }

  static async addFundsToWallet(userId: string, amount: number): Promise<void> {
    // Get current balance first
    const { data: user } = await supabase
      .from('users')
      .select('balance')
      .eq('user_id', userId)
      .single()

    if (user) {
      const { error } = await supabase
        .from('users')
        .update({
          balance: user.balance + amount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (error) {
        console.error('Error adding funds:', error)
        throw error
      }

      // Record transaction
      await this.createTransaction({
        user_id: userId,
        type: 'deposit',
        amount: amount,
        status: 'completed',
        method: 'Demo Deposit'
      })
    }
  }

  // Game session operations
  static async createGameSession(sessionData: {
    user_id: string
    stake_amount: number
    win_amount: number
    multiplier: number
    is_free_spin: boolean
    session_data?: any
  }): Promise<GameSession> {
    const { data, error } = await supabase
      .from('game_sessions')
      .insert(sessionData)
      .select()
      .single()

    if (error) {
      console.error('Error creating game session:', error)
      throw error
    }

    return data
  }

  static async getGameSessions(userId: string, limit: number = 50): Promise<GameSession[]> {
    const { data, error } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching game sessions:', error)
      throw error
    }

    return data || []
  }

  // Transaction operations
  static async createTransaction(transactionData: {
    user_id: string
    type: 'deposit' | 'withdrawal' | 'win' | 'stake' | 'bonus' | 'referral'
    amount: number
    status?: 'pending' | 'completed' | 'failed'
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
  }): Promise<Transaction> {
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        ...transactionData,
        status: transactionData.status || 'completed'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating transaction:', error)
      throw error
    }

    return data
  }

  // Update transaction status (for payment processing)
  static async updateTransactionStatus(
    transactionId: string, 
    status: 'pending' | 'completed' | 'failed',
    failureReason?: string,
    estimatedCompletion?: string
  ): Promise<void> {
    const updates: any = {
      status,
      updated_at: new Date().toISOString()
    }

    if (failureReason) {
      updates.failure_reason = failureReason
    }

    if (estimatedCompletion) {
      updates.estimated_completion = estimatedCompletion
    }

    const { error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', transactionId)

    if (error) {
      console.error('Error updating transaction status:', error)
      throw error
    }
  }

  // Get transaction by payment reference
  static async getTransactionByReference(paymentReference: string): Promise<Transaction | null> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('payment_reference', paymentReference)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Transaction not found
      }
      console.error('Error fetching transaction by reference:', error)
      throw error
    }

    return data
  }

  // Get pending transactions for processing
  static async getPendingTransactions(type?: 'deposit' | 'withdrawal'): Promise<Transaction[]> {
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })

    if (type) {
      query = query.eq('type', type)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching pending transactions:', error)
      throw error
    }

    return data || []
  }

  // Process deposit (update user balance and transaction status)
  static async processDeposit(
    userId: string, 
    amount: number, 
    paymentReference: string,
    gateway: string,
    method: string
  ): Promise<void> {
    try {
      // Start transaction
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('balance')
        .eq('user_id', userId)
        .single()

      if (userError) throw userError

      // Update user balance
      const { error: balanceError } = await supabase
        .from('users')
        .update({
          balance: user.balance + amount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (balanceError) throw balanceError

      // Update transaction status
      const { error: transactionError } = await supabase
        .from('transactions')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('payment_reference', paymentReference)

      if (transactionError) throw transactionError

    } catch (error) {
      console.error('Error processing deposit:', error)
      throw error
    }
  }

  // Process withdrawal (deduct balance and update transaction)
  static async processWithdrawal(
    userId: string,
    amount: number,
    paymentReference: string,
    status: 'completed' | 'failed',
    failureReason?: string
  ): Promise<void> {
    try {
      if (status === 'completed') {
        // Deduct from user balance
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('balance')
          .eq('user_id', userId)
          .single()

        if (userError) throw userError

        const { error: balanceError } = await supabase
          .from('users')
          .update({
            balance: user.balance - amount,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)

        if (balanceError) throw balanceError
      }

      // Update transaction status
      const updates: any = {
        status,
        updated_at: new Date().toISOString()
      }

      if (failureReason) {
        updates.failure_reason = failureReason
      }

      const { error: transactionError } = await supabase
        .from('transactions')
        .update(updates)
        .eq('payment_reference', paymentReference)

      if (transactionError) throw transactionError

    } catch (error) {
      console.error('Error processing withdrawal:', error)
      throw error
    }
  }

  static async getTransactions(userId: string, limit: number = 50): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching transactions:', error)
      throw error
    }

    return data || []
  }

  // Daily bonus operations
  static async claimDailyBonus(userId: string, bonusDay: number, amount: number): Promise<DailyBonus> {
    const { data, error } = await supabase
      .from('daily_bonuses')
      .insert({
        user_id: userId,
        bonus_day: bonusDay,
        amount: amount
      })
      .select()
      .single()

    if (error) {
      console.error('Error claiming daily bonus:', error)
      throw error
    }

    // Add funds to wallet
    await this.addFundsToWallet(userId, amount)

    // Record transaction
    await this.createTransaction({
      user_id: userId,
      type: 'bonus',
      amount: amount,
      status: 'completed',
      method: `Daily Bonus Day ${bonusDay}`
    })

    return data
  }

  static async getDailyBonuses(userId: string): Promise<DailyBonus[]> {
    const { data, error } = await supabase
      .from('daily_bonuses')
      .select('*')
      .eq('user_id', userId)
      .order('claimed_at', { ascending: false })

    if (error) {
      console.error('Error fetching daily bonuses:', error)
      throw error
    }

    return data || []
  }

  static async getTodaysBonusClaim(userId: string, bonusDay: number): Promise<DailyBonus | null> {
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    
    const { data, error } = await supabase
      .from('daily_bonuses')
      .select('*')
      .eq('user_id', userId)
      .eq('bonus_day', bonusDay)
      .gte('claimed_at', today + 'T00:00:00.000Z')
      .lt('claimed_at', today + 'T23:59:59.999Z')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // No bonus claimed today
      }
      console.error('Error checking today bonus claim:', error)
      throw error
    }

    return data
  }

  // Referral operations
  static async createReferral(referrerUserId: string, referredUserId: string, referralCode: string): Promise<Referral> {
    const { data, error } = await supabase
      .from('referrals')
      .insert({
        referrer_user_id: referrerUserId,
        referred_user_id: referredUserId,
        referral_code: referralCode,
        bonus_amount: 25.00,
        status: 'completed'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating referral:', error)
      throw error
    }

    // Add bonus to referrer's wallet
    await this.addFundsToWallet(referrerUserId, 25.00)

    // Record transaction
    await this.createTransaction({
      user_id: referrerUserId,
      type: 'referral',
      amount: 25.00,
      status: 'completed',
      method: 'Referral Bonus'
    })

    return data
  }

  static async getReferrals(userId: string): Promise<Referral[]> {
    const { data, error } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching referrals:', error)
      throw error
    }

    return data || []
  }

  static async getUserByReferralCode(referralCode: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('referral_code', referralCode)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // User not found
      }
      console.error('Error fetching user by referral code:', error)
      throw error
    }

    return data
  }
}