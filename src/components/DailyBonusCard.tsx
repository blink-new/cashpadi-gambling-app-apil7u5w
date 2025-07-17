import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { 
  Gift, 
  Calendar, 
  Clock,
  Coins
} from 'lucide-react'

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

interface DailyBonusCardProps {
  user: User
  onBalanceUpdate: (newBalance: number) => void
}

const DAILY_BONUSES = [
  { day: 1, amount: 50, type: 'coins' },
  { day: 2, amount: 75, type: 'coins' },
  { day: 3, amount: 100, type: 'coins' },
  { day: 4, amount: 1, type: 'free_spin' },
  { day: 5, amount: 150, type: 'coins' },
  { day: 6, amount: 200, type: 'coins' },
  { day: 7, amount: 300, type: 'coins' }
]

export default function DailyBonusCard({ user, onBalanceUpdate }: DailyBonusCardProps) {
  const [currentStreak, setCurrentStreak] = useState(0)
  const [canClaimToday, setCanClaimToday] = useState(true)
  const [timeUntilReset, setTimeUntilReset] = useState('')
  const [isClaiming, setIsClaiming] = useState(false)

  useEffect(() => {
    // Check if user has claimed today's bonus
    const lastClaimDate = localStorage.getItem(`dailyBonus_${user.id}`)
    const today = new Date().toDateString()
    
    if (lastClaimDate === today) {
      setCanClaimToday(false)
    }

    // Get current streak
    const streak = parseInt(localStorage.getItem(`dailyStreak_${user.id}`) || '0')
    setCurrentStreak(streak)

    // Calculate time until reset
    const updateTimeUntilReset = () => {
      const now = new Date()
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)
      
      const diff = tomorrow.getTime() - now.getTime()
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      
      setTimeUntilReset(`${hours}h ${minutes}m`)
    }

    updateTimeUntilReset()
    const interval = setInterval(updateTimeUntilReset, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [user.id])

  const handleClaimBonus = async () => {
    if (!canClaimToday || isClaiming) return

    setIsClaiming(true)

    // Add haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100])
    }

    const newStreak = (currentStreak % 7) + 1
    const bonus = DAILY_BONUSES[newStreak - 1]
    
    // Simulate claiming delay
    setTimeout(() => {
      if (bonus.type === 'coins') {
        const newBalance = user.balance + bonus.amount
        onBalanceUpdate(newBalance)
      }
      // For free spins, we'd need to update the free spins count
      // This would require additional props/callbacks

      // Update local storage
      const today = new Date().toDateString()
      localStorage.setItem(`dailyBonus_${user.id}`, today)
      localStorage.setItem(`dailyStreak_${user.id}`, newStreak.toString())
      
      setCurrentStreak(newStreak)
      setCanClaimToday(false)
      setIsClaiming(false)

      // Success vibration
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200])
      }
    }, 1500)
  }

  const todaysBonus = DAILY_BONUSES[(currentStreak % 7)]

  return (
    <Card className="bg-gradient-to-br from-accent/10 to-primary/10 border-accent/20 overflow-hidden relative">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-accent to-primary animate-pulse"></div>
      </div>
      
      <CardHeader className="pb-3 relative z-10">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className={`w-5 h-5 text-accent ${canClaimToday ? 'animate-pulse' : ''}`} />
            <span>Daily Bonus</span>
          </div>
          <Badge variant="secondary" className={`bg-accent/20 text-accent-foreground ${canClaimToday ? 'achievement-badge' : ''}`}>
            Day {(currentStreak % 7) + 1}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4 relative z-10">
        {/* Current Bonus with enhanced styling */}
        <div className={`text-center p-4 bg-white/50 rounded-lg border-2 transition-all duration-300 ${
          canClaimToday ? 'border-accent/30 shadow-lg' : 'border-transparent'
        }`}>
          {todaysBonus.type === 'coins' ? (
            <>
              <Coins className={`w-8 h-8 text-accent mx-auto mb-2 ${canClaimToday ? 'float' : ''}`} />
              <p className="text-lg font-bold text-accent">₦{todaysBonus.amount}</p>
              <p className="text-sm text-muted-foreground">Bonus Coins</p>
            </>
          ) : (
            <>
              <Gift className={`w-8 h-8 text-accent mx-auto mb-2 ${canClaimToday ? 'float' : ''}`} />
              <p className="text-lg font-bold text-accent">{todaysBonus.amount} Free Spin</p>
              <p className="text-sm text-muted-foreground">Bonus Spin</p>
            </>
          )}
        </div>

        {/* Enhanced Claim Button */}
        <Button
          onClick={handleClaimBonus}
          disabled={!canClaimToday || isClaiming}
          className={`w-full text-accent-foreground transition-all duration-300 ${
            canClaimToday 
              ? 'gradient-accent hover:shadow-lg hover:scale-105 active:scale-95' 
              : 'bg-secondary text-muted-foreground cursor-not-allowed'
          }`}
          size="lg"
        >
          {isClaiming ? (
            <>
              <Gift className="w-4 h-4 mr-2 animate-spin" />
              <span className="animate-pulse">Claiming...</span>
            </>
          ) : canClaimToday ? (
            <>
              <Gift className="w-4 h-4 mr-2 animate-bounce" />
              Claim Daily Bonus
            </>
          ) : (
            <>
              <Clock className="w-4 h-4 mr-2" />
              Next in {timeUntilReset}
            </>
          )}
        </Button>

        {/* Enhanced Streak Progress */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Streak Progress</span>
            <span className="text-accent font-bold">{currentStreak % 7}/7 days</span>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
            <div 
              className="h-full gradient-accent transition-all duration-500 ease-out"
              style={{ width: `${((currentStreak % 7) / 7) * 100}%` }}
            ></div>
          </div>
          
          {/* Day indicators */}
          <div className="grid grid-cols-7 gap-1">
            {DAILY_BONUSES.map((bonus, index) => {
              const dayNumber = index + 1
              const isCompleted = (currentStreak % 7) >= dayNumber
              const isCurrent = (currentStreak % 7) + 1 === dayNumber
              
              return (
                <div
                  key={dayNumber}
                  className={`h-10 rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-all duration-300 ${
                    isCompleted
                      ? 'bg-accent text-accent-foreground shadow-md transform scale-105'
                      : isCurrent
                      ? 'bg-accent/50 text-accent-foreground border-2 border-accent animate-pulse'
                      : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                  }`}
                >
                  <span className="text-xs">{dayNumber}</span>
                  {bonus.type === 'coins' ? (
                    <span className="text-[10px]">₦{bonus.amount}</span>
                  ) : (
                    <span className="text-[10px]">🎁</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Enhanced Next Rewards Preview */}
        <div className="text-center p-3 bg-gradient-to-r from-green-50 to-yellow-50 rounded-lg border border-green-200">
          <p className="text-sm font-medium text-green-800 mb-1">Keep your streak alive for bigger rewards!</p>
          <div className="flex items-center justify-center space-x-2">
            <span className="text-lg">🏆</span>
            <span className="text-sm font-bold text-green-700">Day 7 bonus: ₦300</span>
            <span className="text-lg">💰</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}