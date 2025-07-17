import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { 
  TrendingUp, 
  Target, 
  Zap,
  Trophy,
  Clock,
  Percent
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

interface GameStatsProps {
  user: User
}

interface GameSession {
  id: string
  timestamp: number
  stake: number
  winAmount: number
  multiplier: number
  isFreeSpins: boolean
}

export default function GameStats({ user }: GameStatsProps) {
  const [recentSessions, setRecentSessions] = useState<GameSession[]>([])
  const [winRate, setWinRate] = useState(0)
  const [biggestWin, setBiggestWin] = useState(0)
  const [currentStreak, setCurrentStreak] = useState(0)

  useEffect(() => {
    // Load recent game sessions from localStorage
    const sessions = JSON.parse(localStorage.getItem(`gameSessions_${user.id}`) || '[]')
    setRecentSessions(sessions.slice(-10)) // Last 10 sessions

    // Calculate statistics
    if (sessions.length > 0) {
      const wins = sessions.filter((s: GameSession) => s.winAmount > 0)
      const rate = (wins.length / sessions.length) * 100
      setWinRate(rate)

      const biggest = Math.max(...sessions.map((s: GameSession) => s.winAmount))
      setBiggestWin(biggest)

      // Calculate current winning/losing streak
      let streak = 0
      for (let i = sessions.length - 1; i >= 0; i--) {
        const session = sessions[i]
        if (i === sessions.length - 1) {
          streak = session.winAmount > 0 ? 1 : -1
        } else {
          const isWin = session.winAmount > 0
          const streakIsWinning = streak > 0
          if (isWin === streakIsWinning) {
            streak += isWin ? 1 : -1
          } else {
            break
          }
        }
      }
      setCurrentStreak(streak)
    }
  }, [user.id])

  const formatTime = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return new Date(timestamp).toLocaleDateString()
  }

  const getMultiplierColor = (multiplier: number) => {
    if (multiplier === 0) return 'text-gray-500'
    if (multiplier < 2) return 'text-green-600'
    if (multiplier < 5) return 'text-blue-600'
    return 'text-purple-600'
  }

  const getStreakDisplay = () => {
    if (currentStreak === 0) return { text: 'No streak', color: 'text-gray-500' }
    if (currentStreak > 0) return { 
      text: `${currentStreak} win${currentStreak > 1 ? 's' : ''}`, 
      color: 'text-green-600' 
    }
    return { 
      text: `${Math.abs(currentStreak)} loss${Math.abs(currentStreak) > 1 ? 'es' : ''}`, 
      color: 'text-red-600' 
    }
  }

  const streak = getStreakDisplay()

  return (
    <div className="space-y-4">
      {/* Quick Stats Grid with enhanced animations */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:shadow-lg transition-all duration-300 hover:scale-105">
          <CardContent className="p-4 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-green-100/50 to-emerald-100/50 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-center mb-2">
                <Percent className={`w-5 h-5 text-green-600 ${winRate > 50 ? 'animate-pulse' : ''}`} />
              </div>
              <p className="text-2xl font-bold text-green-600 balance-update">{winRate.toFixed(1)}%</p>
              <p className="text-xs text-green-700 font-medium">Win Rate</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200 hover:shadow-lg transition-all duration-300 hover:scale-105">
          <CardContent className="p-4 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-100/50 to-violet-100/50 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-center mb-2">
                <Trophy className={`w-5 h-5 text-purple-600 ${biggestWin > 0 ? 'float' : ''}`} />
              </div>
              <p className="text-2xl font-bold text-purple-600">₦{biggestWin.toLocaleString()}</p>
              <p className="text-xs text-purple-700 font-medium">Biggest Win</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 hover:shadow-lg transition-all duration-300 hover:scale-105">
          <CardContent className="p-4 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-100/50 to-cyan-100/50 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-center mb-2">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-600">{user.totalSpins}</p>
              <p className="text-xs text-blue-700 font-medium">Total Spins</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 hover:shadow-lg transition-all duration-300 hover:scale-105">
          <CardContent className="p-4 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-100/50 to-amber-100/50 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className={`w-5 h-5 text-orange-600 ${currentStreak > 0 ? 'animate-bounce' : ''}`} />
              </div>
              <p className={`text-lg font-bold ${streak.color} ${currentStreak > 3 ? 'animate-pulse' : ''}`}>{streak.text}</p>
              <p className="text-xs text-orange-700 font-medium">Current Streak</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Recent Sessions */}
      {recentSessions.length > 0 && (
        <Card className="hover:shadow-md transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <Clock className="w-5 h-5 text-primary" />
              <span>Recent Spins</span>
              <Badge variant="secondary" className="ml-auto">
                {recentSessions.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {recentSessions.slice().reverse().map((session, index) => (
                <div 
                  key={session.id} 
                  className="flex items-center justify-between p-3 bg-secondary rounded-lg hover:bg-secondary/80 transition-all duration-200 hover:scale-[1.02] hover:shadow-sm"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      session.winAmount > 0 
                        ? 'bg-green-500 shadow-lg shadow-green-500/30' 
                        : 'bg-gray-400'
                    }`}></div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`font-bold text-sm ${getMultiplierColor(session.multiplier)}`}>
                          {session.multiplier}x
                        </span>
                        {session.isFreeSpins && (
                          <Badge variant="secondary" className="text-xs bg-accent/20 text-accent-foreground animate-pulse">
                            🎁 Free
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(session.timestamp)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-sm transition-colors duration-200 ${
                      session.winAmount > 0 ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {session.winAmount > 0 ? '+' : ''}₦{session.winAmount.toLocaleString()}
                    </p>
                    {!session.isFreeSpins && (
                      <p className="text-xs text-muted-foreground">
                        Stake: ₦{session.stake}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Performance Insights */}
      <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200 hover:shadow-lg transition-all duration-300 overflow-hidden relative">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-100/30 to-blue-100/30 opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
        
        <CardContent className="pt-6 relative z-10">
          <div className="text-center">
            <div className="relative inline-block mb-3">
              <Zap className="w-8 h-8 text-indigo-600 mx-auto animate-pulse" />
              <div className="absolute inset-0 bg-indigo-400 rounded-full opacity-20 animate-ping"></div>
            </div>
            
            <h3 className="font-bold text-indigo-900 mb-4 text-lg">Performance Insights</h3>
            
            <div className="grid grid-cols-1 gap-3 text-sm">
              {winRate > 50 ? (
                <div className="bg-gradient-to-r from-red-50 to-orange-50 p-3 rounded-lg border border-red-200">
                  <p className="text-red-700 font-medium">🔥 You're on fire! Win rate above 50%</p>
                </div>
              ) : winRate > 30 ? (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border border-green-200">
                  <p className="text-green-700 font-medium">📈 Good performance! Keep it up</p>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-200">
                  <p className="text-blue-700 font-medium">💪 Stay strong! Luck will turn around</p>
                </div>
              )}
              
              {currentStreak > 3 && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded-lg border border-purple-200 animate-pulse">
                  <p className="text-purple-700 font-bold">⚡ Amazing {currentStreak}-win streak!</p>
                </div>
              )}
              
              {user.totalSpins > 50 && (
                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-3 rounded-lg border border-yellow-200">
                  <p className="text-yellow-700 font-medium">🎯 Experienced player with {user.totalSpins} spins</p>
                </div>
              )}
              
              {biggestWin > 1000 && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-3 rounded-lg border border-emerald-200">
                  <p className="text-emerald-700 font-bold">💎 High roller! Biggest win: ₦{biggestWin.toLocaleString()}</p>
                </div>
              )}
              
              {recentSessions.length === 0 && (
                <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-3 rounded-lg border border-gray-200">
                  <p className="text-gray-600 font-medium">🎲 Ready to start your winning journey?</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}