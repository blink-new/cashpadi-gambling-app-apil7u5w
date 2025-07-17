import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { 
  Trophy, 
  Crown, 
  Medal,
  TrendingUp,
  Users,
  Star,
  Zap
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

interface LeaderboardCardProps {
  user: User
}

interface LeaderboardEntry {
  id: string
  displayName: string
  totalWinnings: number
  totalSpins: number
  winRate: number
  rank: number
  isCurrentUser: boolean
}

export default function LeaderboardCard({ user }: LeaderboardCardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'all'>('weekly')
  const [userRank, setUserRank] = useState<number>(0)

  useEffect(() => {
    // Generate mock leaderboard data (in real app, this would come from API)
    const generateMockLeaderboard = () => {
      const mockUsers = [
        { id: '1', displayName: 'ChampionNaija', totalWinnings: 45000, totalSpins: 120, winRate: 65 },
        { id: '2', displayName: 'LagosLucky', totalWinnings: 38500, totalSpins: 95, winRate: 58 },
        { id: '3', displayName: 'AbujaBoss', totalWinnings: 32000, totalSpins: 110, winRate: 52 },
        { id: '4', displayName: 'KanoKing', totalWinnings: 28750, totalSpins: 88, winRate: 61 },
        { id: '5', displayName: 'PortHarcourt', totalWinnings: 25200, totalSpins: 102, winRate: 48 },
        { id: '6', displayName: 'IbadanWinner', totalWinnings: 22100, totalSpins: 76, winRate: 55 },
        { id: '7', displayName: 'EnuguEagle', totalWinnings: 19800, totalSpins: 91, winRate: 44 },
        { id: '8', displayName: 'CalabarChamp', totalWinnings: 17500, totalSpins: 68, winRate: 59 },
        { id: '9', displayName: 'JosJackpot', totalWinnings: 15300, totalSpins: 82, winRate: 41 },
        { id: '10', displayName: 'WarriWarrior', totalWinnings: 13600, totalSpins: 74, winRate: 47 }
      ]

      // Add current user to leaderboard
      const currentUserEntry = {
        id: user.id,
        displayName: user.displayName || 'You',
        totalWinnings: user.totalWinnings,
        totalSpins: user.totalSpins,
        winRate: user.totalSpins > 0 ? Math.round((user.totalWinnings / (user.totalSpins * 100)) * 100) : 0,
        rank: 0,
        isCurrentUser: true
      }

      // Combine and sort
      const allUsers = [...mockUsers, currentUserEntry]
        .sort((a, b) => b.totalWinnings - a.totalWinnings)
        .map((user, index) => ({
          ...user,
          rank: index + 1,
          isCurrentUser: user.id === currentUserEntry.id
        }))

      const currentUserRank = allUsers.find(u => u.isCurrentUser)?.rank || 0
      setUserRank(currentUserRank)
      
      // Show top 10 + current user if not in top 10
      const displayUsers = allUsers.slice(0, 10)
      if (currentUserRank > 10) {
        displayUsers.push(allUsers.find(u => u.isCurrentUser)!)
      }

      setLeaderboard(displayUsers)
    }

    generateMockLeaderboard()
  }, [user, timeframe])

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">#{rank}</span>
    }
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white'
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white'
    if (rank === 3) return 'bg-gradient-to-r from-amber-400 to-amber-600 text-white'
    if (rank <= 10) return 'bg-gradient-to-r from-blue-400 to-blue-600 text-white'
    return 'bg-secondary text-secondary-foreground'
  }

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200 overflow-hidden relative">
      {/* Animated background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-purple-400 to-indigo-400 animate-pulse"></div>
      </div>

      <CardHeader className="pb-4 relative z-10">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-purple-600 animate-pulse" />
            <span className="text-purple-900">Leaderboard</span>
          </div>
          <Badge className="bg-purple-100 text-purple-800">
            {timeframe === 'daily' ? 'Today' : timeframe === 'weekly' ? 'This Week' : 'All Time'}
          </Badge>
        </CardTitle>

        {/* Timeframe selector */}
        <div className="flex space-x-1 bg-white/50 rounded-lg p-1">
          {(['daily', 'weekly', 'all'] as const).map((period) => (
            <Button
              key={period}
              variant={timeframe === period ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTimeframe(period)}
              className={`flex-1 text-xs ${
                timeframe === period 
                  ? 'bg-purple-600 text-white shadow-md' 
                  : 'text-purple-700 hover:bg-purple-100'
              }`}
            >
              {period === 'daily' ? 'Daily' : period === 'weekly' ? 'Weekly' : 'All Time'}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 relative z-10">
        {/* Current user rank highlight */}
        {userRank > 0 && (
          <div className={`p-3 rounded-lg border-2 border-dashed transition-all duration-300 ${
            userRank <= 3 
              ? 'border-yellow-300 bg-gradient-to-r from-yellow-50 to-amber-50' 
              : userRank <= 10
              ? 'border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50'
              : 'border-gray-300 bg-gradient-to-r from-gray-50 to-slate-50'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getRankIcon(userRank)}
                <div>
                  <p className="font-bold text-sm">Your Rank</p>
                  <p className="text-xs text-muted-foreground">
                    {userRank <= 10 ? 'Top 10!' : `#${userRank} of all players`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-600">₦{user.totalWinnings.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{user.totalSpins} spins</p>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard list */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {leaderboard.map((entry, index) => (
            <div
              key={entry.id}
              className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200 hover:scale-[1.02] ${
                entry.isCurrentUser
                  ? 'bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300 shadow-md'
                  : 'bg-white/70 hover:bg-white/90 border border-purple-100'
              }`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getRankBadge(entry.rank)}`}>
                  {entry.rank <= 3 ? getRankIcon(entry.rank) : (
                    <span className="text-xs font-bold">#{entry.rank}</span>
                  )}
                </div>
                
                <div>
                  <div className="flex items-center space-x-2">
                    <p className={`font-bold text-sm ${entry.isCurrentUser ? 'text-green-800' : 'text-gray-800'}`}>
                      {entry.displayName}
                    </p>
                    {entry.isCurrentUser && (
                      <Badge className="bg-green-500 text-white text-xs px-2 py-0.5">
                        You
                      </Badge>
                    )}
                    {entry.rank === 1 && (
                      <Star className="w-4 h-4 text-yellow-500 animate-pulse" />
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <span>{entry.totalSpins} spins</span>
                    <span>•</span>
                    <span className={`font-medium ${
                      entry.winRate > 50 ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {entry.winRate}% win rate
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <p className="font-bold text-green-600">
                  ₦{entry.totalWinnings.toLocaleString()}
                </p>
                {entry.rank <= 3 && (
                  <div className="flex items-center justify-end space-x-1 mt-1">
                    <Zap className="w-3 h-3 text-yellow-500" />
                    <span className="text-xs text-yellow-600 font-medium">Hot streak!</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Motivational message */}
        <div className="text-center p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
          {userRank === 1 ? (
            <div>
              <Crown className="w-6 h-6 text-yellow-500 mx-auto mb-1 animate-bounce" />
              <p className="text-sm font-bold text-indigo-800">👑 You're the Champion!</p>
              <p className="text-xs text-indigo-600">Defend your throne!</p>
            </div>
          ) : userRank <= 3 ? (
            <div>
              <Trophy className="w-6 h-6 text-purple-600 mx-auto mb-1" />
              <p className="text-sm font-bold text-purple-800">🏆 Top 3 Player!</p>
              <p className="text-xs text-purple-600">You're among the elite!</p>
            </div>
          ) : userRank <= 10 ? (
            <div>
              <TrendingUp className="w-6 h-6 text-blue-600 mx-auto mb-1" />
              <p className="text-sm font-bold text-blue-800">📈 Top 10 Player!</p>
              <p className="text-xs text-blue-600">Keep climbing the ranks!</p>
            </div>
          ) : (
            <div>
              <Users className="w-6 h-6 text-gray-600 mx-auto mb-1" />
              <p className="text-sm font-bold text-gray-800">🎯 Keep Playing!</p>
              <p className="text-xs text-gray-600">Your big win is coming!</p>
            </div>
          )}
        </div>

        {/* Competition info */}
        <div className="text-center text-xs text-muted-foreground">
          <p>🏆 Weekly prizes for top 3 players</p>
          <p>💰 Bonus rewards every Sunday</p>
        </div>
      </CardContent>
    </Card>
  )
}