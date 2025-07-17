import { useState, useEffect, useCallback } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import { Button } from './components/ui/button'
import { Separator } from './components/ui/separator'
import { Toaster } from './components/ui/toaster'
import { 
  Wallet, 
  Users, 
  User, 
  RotateCcw, 
  Trophy, 
  Shield,
  Smartphone,
  Zap,
  Gift,
  Settings
} from 'lucide-react'
import LuckySpinGame from './components/LuckySpinGame'
import EnhancedWalletPage from './components/EnhancedWalletPage'
import ProfilePage from './components/ProfilePage'
import ReferralsPage from './components/ReferralsPage'
import AdminDashboard from './components/AdminDashboard'
import blink from './blink/client'
import { DatabaseService } from './services/database'

interface User {
  id: string
  email: string
  displayName?: string
  balance: number
  freeSpinsUsed: number
  hasPlayedPaidGame: boolean
  referralCode: string
  totalWinnings: number
  totalSpins: number
  freeGameCredits: number
}

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('game')
  
  // Check if user is admin (in real app, this would be from database)
  const isAdmin = user?.email === 'admin@cashpadi.com' || user?.email?.includes('admin')

  const loadUserProfile = useCallback(async (userId: string, email: string): Promise<User> => {
    try {
      // Try to get existing user from database
      let dbUser = await DatabaseService.getUser(userId)
      
      // If user doesn't exist, create new user
      if (!dbUser) {
        dbUser = await DatabaseService.createOrUpdateUser({
          user_id: userId,
          email,
          display_name: email.split('@')[0]
        })
      }
      
      // Convert database user to app user format
      const user: User = {
        id: dbUser.user_id,
        email: dbUser.email,
        displayName: dbUser.display_name || email.split('@')[0],
        balance: dbUser.balance,
        freeSpinsUsed: dbUser.free_spins_used,
        hasPlayedPaidGame: dbUser.has_played_paid_game,
        referralCode: dbUser.referral_code,
        totalWinnings: dbUser.total_winnings,
        totalSpins: dbUser.total_spins,
        freeGameCredits: dbUser.free_game_credits
      }
      
      return user
    } catch (error) {
      console.error('Error loading user profile:', error)
      throw error
    }
  }, [])

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged(async (state) => {
      if (state.user) {
        try {
          // Load or create user profile
          const userProfile = await loadUserProfile(state.user.id, state.user.email)
          setUser(userProfile)
        } catch (error) {
          console.error('Error loading user profile:', error)
        }
      } else {
        setUser(null)
      }
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [loadUserProfile])

  const updateUserBalance = async (newBalance: number, winnings?: number) => {
    if (!user) return

    try {
      // Update database
      await DatabaseService.updateUserBalance(user.id, newBalance, winnings)
      
      // Update local state
      const updatedUser = {
        ...user,
        balance: newBalance,
        totalWinnings: winnings ? user.totalWinnings + winnings : user.totalWinnings,
        totalSpins: user.totalSpins + 1
      }
      setUser(updatedUser)
    } catch (error) {
      console.error('Error updating user balance:', error)
    }
  }

  const markPaidGamePlayed = async () => {
    if (!user || user.hasPlayedPaidGame) return

    try {
      // Update database
      await DatabaseService.markPaidGamePlayed(user.id)
      
      // Update local state
      const updatedUser = { ...user, hasPlayedPaidGame: true }
      setUser(updatedUser)
    } catch (error) {
      console.error('Error marking paid game played:', error)
    }
  }

  const updateFreeSpinsUsed = async () => {
    if (!user) return

    try {
      // Update database
      await DatabaseService.updateFreeSpinsUsed(user.id)
      
      // Update local state
      const updatedUser = { 
        ...user, 
        freeSpinsUsed: user.freeSpinsUsed + 1,
        freeGameCredits: Math.max(0, user.freeGameCredits - 1)
      }
      setUser(updatedUser)
    } catch (error) {
      console.error('Error updating free spins:', error)
    }
  }

  const addFundsToWallet = async (amount: number) => {
    if (!user) return

    try {
      // Update database
      await DatabaseService.addFundsToWallet(user.id, amount)
      
      // Update local state
      const updatedUser = { ...user, balance: user.balance + amount }
      setUser(updatedUser)
    } catch (error) {
      console.error('Error adding funds to wallet:', error)
    }
  }

  const saveGameSession = async (stake: number, winAmount: number, multiplier: number, isFreeSpins: boolean) => {
    if (!user) return

    try {
      await DatabaseService.createGameSession({
        user_id: user.id,
        stake_amount: stake,
        win_amount: winAmount,
        multiplier,
        is_free_spin: isFreeSpins
      })
    } catch (error) {
      console.error('Error saving game session:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <img src="/cashpadi-logo.svg" alt="CashPadi" className="w-24 h-24 mx-auto mb-4 animate-pulse" />
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2 animate-pulse">Loading CashPadi...</p>
          <div className="flex justify-center space-x-1 mt-4">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <img src="/cashpadi-logo.svg" alt="CashPadi" className="w-20 h-20 mx-auto mb-4" />
            <CardTitle className="text-2xl font-bold text-primary">Welcome to CashPadi</CardTitle>
            <p className="text-muted-foreground">Nigeria's #1 Mobile Gambling App</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="flex flex-col items-center p-3 bg-secondary rounded-lg">
                <Gift className="w-6 h-6 text-accent mb-1" />
                <span className="text-sm font-medium">Free Game</span>
                <span className="text-xs text-muted-foreground">On signup</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-secondary rounded-lg">
                <Zap className="w-6 h-6 text-primary mb-1" />
                <span className="text-sm font-medium">Instant Win</span>
                <span className="text-xs text-muted-foreground">Real cash</span>
              </div>
            </div>
            <Button 
              onClick={() => blink.auth.login()} 
              className="w-full bg-primary hover:bg-primary/90"
              size="lg"
            >
              Sign Up & Get Free Game
            </Button>
            <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground">
              <div className="flex items-center">
                <Shield className="w-4 h-4 mr-1" />
                Secure
              </div>
              <div className="flex items-center">
                <Smartphone className="w-4 h-4 mr-1" />
                Mobile First
              </div>
              <div className="flex items-center">
                <Trophy className="w-4 h-4 mr-1" />
                Fair Play
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-4 shadow-lg sticky top-0 z-50">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center space-x-3">
            <img src="/cashpadi-logo.svg" alt="CashPadi" className="w-8 h-8" />
            <div>
              <h1 className="font-bold text-lg">CashPadi</h1>
              <p className="text-xs opacity-90">Hello, {user.displayName}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-1">
              <span className="text-accent font-bold text-lg balance-update">₦{user.balance.toLocaleString()}</span>
            </div>
            <p className="text-xs opacity-90">Wallet Balance</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-md mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-5' : 'grid-cols-4'} bg-secondary m-2 rounded-lg`}>
            <TabsTrigger value="game" className="flex flex-col items-center py-2">
              <RotateCcw className="w-4 h-4 mb-1" />
              <span className="text-xs">Spin</span>
            </TabsTrigger>
            <TabsTrigger value="wallet" className="flex flex-col items-center py-2">
              <Wallet className="w-4 h-4 mb-1" />
              <span className="text-xs">Wallet</span>
            </TabsTrigger>
            <TabsTrigger value="referrals" className="flex flex-col items-center py-2">
              <Users className="w-4 h-4 mb-1" />
              <span className="text-xs">Refer</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex flex-col items-center py-2">
              <User className="w-4 h-4 mb-1" />
              <span className="text-xs">Profile</span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="admin" className="flex flex-col items-center py-2">
                <Settings className="w-4 h-4 mb-1" />
                <span className="text-xs">Admin</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="game" className="p-4">
            <LuckySpinGame 
              user={user}
              onBalanceUpdate={updateUserBalance}
              onPaidGamePlayed={markPaidGamePlayed}
              onFreeSpinUsed={updateFreeSpinsUsed}
              onGameSessionSave={saveGameSession}
            />
          </TabsContent>

          <TabsContent value="wallet" className="p-4">
            <EnhancedWalletPage 
              user={user} 
              onBalanceUpdate={(newBalance) => setUser(prev => prev ? { ...prev, balance: newBalance } : null)} 
            />
          </TabsContent>

          <TabsContent value="referrals" className="p-4">
            <ReferralsPage user={user} />
          </TabsContent>

          <TabsContent value="profile" className="p-4">
            <ProfilePage user={user} />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="admin" className="p-4">
              <AdminDashboard />
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Responsible Gaming Notice */}
      <div className="fixed bottom-0 left-0 right-0 bg-yellow-50 border-t border-yellow-200 p-2 z-40">
        <div className="max-w-md mx-auto">
          <p className="text-xs text-center text-yellow-800">
            <Shield className="w-3 h-3 inline mr-1" />
            Play Responsibly. 18+ Only. Gambling can be addictive.
          </p>
        </div>
      </div>

      <Toaster />
    </div>
  )
}

export default App