import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { 
  Shield, 
  Clock, 
  AlertTriangle,
  Heart,
  TrendingDown,
  Settings,
  Info,
  CheckCircle
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

interface ResponsibleGamingCardProps {
  user: User
}

interface GamingSession {
  date: string
  duration: number
  spins: number
  amountSpent: number
  amountWon: number
}

export default function ResponsibleGamingCard({ user }: ResponsibleGamingCardProps) {
  const [dailyLimit, setDailyLimit] = useState<number>(1000) // ₦10 default
  const [sessionTime, setSessionTime] = useState<number>(0)
  const [todaySpent, setTodaySpent] = useState<number>(0)
  const [showLimitWarning, setShowLimitWarning] = useState<boolean>(false)
  const [gamingSessions, setGamingSessions] = useState<GamingSession[]>([])
  const [isBreakTime, setIsBreakTime] = useState<boolean>(false)

  useEffect(() => {
    // Load user's responsible gaming settings
    const savedLimit = localStorage.getItem(`dailyLimit_${user.id}`)
    if (savedLimit) {
      setDailyLimit(parseInt(savedLimit))
    }

    // Calculate today's spending
    const today = new Date().toDateString()
    const todaySessions = JSON.parse(localStorage.getItem(`gamingSessions_${user.id}`) || '[]')
      .filter((session: any) => new Date(session.timestamp).toDateString() === today)
    
    const spent = todaySessions.reduce((total: number, session: any) => total + (session.stake || 0), 0)
    setTodaySpent(spent)

    // Check if approaching limit
    if (spent >= dailyLimit * 0.8) {
      setShowLimitWarning(true)
    }

    // Session timer
    const startTime = Date.now()
    const timer = setInterval(() => {
      setSessionTime(Math.floor((Date.now() - startTime) / 1000 / 60)) // minutes
    }, 60000)

    return () => clearInterval(timer)
  }, [user.id, dailyLimit])

  const updateDailyLimit = (newLimit: number) => {
    setDailyLimit(newLimit)
    localStorage.setItem(`dailyLimit_${user.id}`, newLimit.toString())
  }

  const takeBreak = () => {
    setIsBreakTime(true)
    // Set break for 15 minutes
    setTimeout(() => {
      setIsBreakTime(false)
    }, 15 * 60 * 1000)
  }

  const getLimitStatus = () => {
    const percentage = (todaySpent / dailyLimit) * 100
    if (percentage >= 100) return { color: 'text-red-600', status: 'Limit Reached', bg: 'bg-red-100' }
    if (percentage >= 80) return { color: 'text-orange-600', status: 'Near Limit', bg: 'bg-orange-100' }
    if (percentage >= 50) return { color: 'text-yellow-600', status: 'Moderate', bg: 'bg-yellow-100' }
    return { color: 'text-green-600', status: 'Safe', bg: 'bg-green-100' }
  }

  const getSessionTimeStatus = () => {
    if (sessionTime >= 120) return { color: 'text-red-600', message: 'Long session - consider a break' }
    if (sessionTime >= 60) return { color: 'text-orange-600', message: 'Extended session - stay mindful' }
    if (sessionTime >= 30) return { color: 'text-yellow-600', message: 'Good session length' }
    return { color: 'text-green-600', message: 'Fresh start' }
  }

  const limitStatus = getLimitStatus()
  const sessionStatus = getSessionTimeStatus()

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 overflow-hidden relative">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-400 to-cyan-400"></div>
      </div>

      <CardHeader className="pb-4 relative z-10">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <span className="text-blue-900">Responsible Gaming</span>
          </div>
          <Badge className="bg-blue-100 text-blue-800">
            <Heart className="w-3 h-3 mr-1" />
            Safe Play
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 relative z-10">
        {/* Break time notice */}
        {isBreakTime && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              🌱 Taking a healthy break. Come back refreshed in a few minutes!
            </AlertDescription>
          </Alert>
        )}

        {/* Daily spending tracker */}
        <div className={`p-4 rounded-lg border-2 ${limitStatus.bg} border-opacity-50`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm">Daily Spending</h3>
            <Badge className={`${limitStatus.color} bg-white/70`}>
              {limitStatus.status}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Today: ₦{todaySpent.toLocaleString()}</span>
              <span>Limit: ₦{dailyLimit.toLocaleString()}</span>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-white/50 rounded-full h-2">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  todaySpent >= dailyLimit 
                    ? 'bg-red-500' 
                    : todaySpent >= dailyLimit * 0.8 
                    ? 'bg-orange-500' 
                    : 'bg-green-500'
                }`}
                style={{ width: `${Math.min((todaySpent / dailyLimit) * 100, 100)}%` }}
              ></div>
            </div>
            
            <p className="text-xs text-muted-foreground">
              ₦{Math.max(0, dailyLimit - todaySpent).toLocaleString()} remaining today
            </p>
          </div>
        </div>

        {/* Session time tracker */}
        <div className="p-4 bg-white/50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-sm">Session Time</span>
            </div>
            <span className="text-lg font-bold text-blue-700">{sessionTime}m</span>
          </div>
          
          <p className={`text-xs ${sessionStatus.color} font-medium`}>
            {sessionStatus.message}
          </p>
          
          {sessionTime >= 60 && (
            <Button
              onClick={takeBreak}
              size="sm"
              className="w-full mt-2 bg-green-500 hover:bg-green-600 text-white"
            >
              <Heart className="w-4 h-4 mr-2" />
              Take a 15-min Break
            </Button>
          )}
        </div>

        {/* Limit warning */}
        {showLimitWarning && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              ⚠️ You're approaching your daily spending limit. Consider taking a break or adjusting your limit.
            </AlertDescription>
          </Alert>
        )}

        {/* Quick limit adjustment */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Daily Limit Settings</span>
          </h3>
          
          <div className="grid grid-cols-3 gap-2">
            {[500, 1000, 2000].map((limit) => (
              <Button
                key={limit}
                variant={dailyLimit === limit ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateDailyLimit(limit)}
                className="text-xs"
              >
                ₦{limit}
              </Button>
            ))}
          </div>
          
          <p className="text-xs text-muted-foreground">
            💡 Set a comfortable daily limit to maintain healthy gaming habits
          </p>
        </div>

        {/* Helpful tips */}
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-3 rounded-lg border border-indigo-200">
          <div className="flex items-center space-x-2 mb-2">
            <Info className="w-4 h-4 text-indigo-600" />
            <span className="font-semibold text-sm text-indigo-800">Healthy Gaming Tips</span>
          </div>
          
          <div className="space-y-1 text-xs text-indigo-700">
            <p>• Set time and money limits before playing</p>
            <p>• Take regular breaks every 30-60 minutes</p>
            <p>• Never chase losses with bigger bets</p>
            <p>• Play for entertainment, not to make money</p>
            <p>• Stop if you feel frustrated or stressed</p>
          </div>
        </div>

        {/* Support resources */}
        <div className="text-center p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
          <h3 className="font-semibold text-sm text-purple-800 mb-2">Need Support?</h3>
          <div className="space-y-1 text-xs text-purple-700">
            <p>🇳🇬 National Centre for Technology Management</p>
            <p>📞 Gambling Helpline: 0800-GAMBLE</p>
            <p>💬 24/7 Support Chat Available</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="mt-2 text-purple-700 border-purple-300 hover:bg-purple-100"
          >
            Get Help
          </Button>
        </div>

        {/* Gaming statistics insight */}
        <div className="bg-white/70 p-3 rounded-lg border border-gray-200">
          <h3 className="font-semibold text-sm mb-2">Your Gaming Pattern</h3>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-muted-foreground">Average session</p>
              <p className="font-bold">45 minutes</p>
            </div>
            <div>
              <p className="text-muted-foreground">Win rate</p>
              <p className="font-bold text-green-600">
                {user.totalSpins > 0 ? Math.round((user.totalWinnings / (user.totalSpins * 100)) * 100) : 0}%
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Days played</p>
              <p className="font-bold">12 days</p>
            </div>
            <div>
              <p className="text-muted-foreground">Longest break</p>
              <p className="font-bold text-blue-600">3 days</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}