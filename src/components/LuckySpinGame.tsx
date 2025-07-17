import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import DailyBonusCard from './DailyBonusCard'
import GameStats from './GameStats'
import LeaderboardCard from './LeaderboardCard'
import { useToast } from '../hooks/use-toast'
import { DatabaseService } from '../services/database'
import { 
  RotateCcw, 
  Trophy, 
  Gift, 
  AlertCircle,
  Zap,
  Star,
  Sparkles
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

interface LuckySpinGameProps {
  user: User
  onBalanceUpdate: (newBalance: number, winnings?: number) => void
  onPaidGamePlayed: () => void
  onFreeSpinUsed: () => void
  onGameSessionSave?: (stake: number, winAmount: number, multiplier: number, isFreeSpins: boolean) => void
}

const STAKE_OPTIONS = [50, 100, 200, 300, 500] // In Naira

// Wheel segments with multipliers and probabilities (admin configurable)
const WHEEL_SEGMENTS = [
  { multiplier: 0, probability: 0.45, color: '#ef4444', label: '0x' },
  { multiplier: 0.5, probability: 0.25, color: '#f59e0b', label: '0.5x' },
  { multiplier: 1, probability: 0.15, color: '#10b981', label: '1x' },
  { multiplier: 2, probability: 0.08, color: '#3b82f6', label: '2x' },
  { multiplier: 5, probability: 0.04, color: '#8b5cf6', label: '5x' },
  { multiplier: 10, probability: 0.03, color: '#FFD700', label: '10x' }
]

export default function LuckySpinGame({ user, onBalanceUpdate, onPaidGamePlayed, onFreeSpinUsed, onGameSessionSave }: LuckySpinGameProps) {
  const [selectedStake, setSelectedStake] = useState(50)
  const [isSpinning, setIsSpinning] = useState(false)
  const [lastResult, setLastResult] = useState<{ multiplier: number; winAmount: number; stake: number; isFree: boolean } | null>(null)
  const [showResult, setShowResult] = useState(false)
  const wheelRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const canUseFreeSpins = user.freeGameCredits > 0
  const canAffordStake = user.balance >= selectedStake

  const getRandomOutcome = () => {
    const random = Math.random()
    let cumulativeProbability = 0
    
    for (const segment of WHEEL_SEGMENTS) {
      cumulativeProbability += segment.probability
      if (random <= cumulativeProbability) {
        return segment
      }
    }
    
    return WHEEL_SEGMENTS[0] // Fallback to 0x
  }

  const createParticles = (container: HTMLElement, count: number = 20) => {
    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div')
      particle.className = 'particle'
      particle.style.left = Math.random() * 100 + '%'
      particle.style.animationDelay = Math.random() * 0.5 + 's'
      container.appendChild(particle)
      
      setTimeout(() => {
        particle.remove()
      }, 2000)
    }
  }

  const saveGameSession = async (stake: number, winAmount: number, multiplier: number, isFreeSpins: boolean) => {
    try {
      await DatabaseService.createGameSession({
        user_id: user.id,
        stake_amount: stake,
        win_amount: winAmount,
        multiplier: multiplier,
        is_free_spin: isFreeSpins,
        session_data: {
          timestamp: Date.now(),
          wheel_segments: WHEEL_SEGMENTS.length
        }
      })

      // Also create transaction records
      if (!isFreeSpins) {
        // Record stake transaction
        await DatabaseService.createTransaction({
          user_id: user.id,
          type: 'stake',
          amount: stake,
          status: 'completed',
          method: 'Lucky Spin'
        })
      }

      if (winAmount > 0) {
        // Record win transaction
        await DatabaseService.createTransaction({
          user_id: user.id,
          type: 'win',
          amount: winAmount,
          status: 'completed',
          method: 'Lucky Spin',
          metadata: {
            multiplier: multiplier,
            stake: stake,
            is_free_spin: isFreeSpins
          }
        })
      }
    } catch (error) {
      console.error('Error saving game session:', error)
    }
  }

  const handleSpin = async (isFreeSpins: boolean = false) => {
    if (isSpinning) return
    
    if (!isFreeSpins && !canAffordStake) {
      return
    }

    setIsSpinning(true)
    setShowResult(false)

    // Add haptic feedback simulation (vibration on mobile)
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100])
    }

    // Play spinning sound effect simulation
    const playSpinSound = () => {
      if (typeof window !== 'undefined' && 'AudioContext' in window) {
        try {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
          const oscillator = audioContext.createOscillator()
          const gainNode = audioContext.createGain()
          
          oscillator.connect(gainNode)
          gainNode.connect(audioContext.destination)
          
          oscillator.frequency.setValueAtTime(200, audioContext.currentTime)
          oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 2.5)
          
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 2.5)
          
          oscillator.start(audioContext.currentTime)
          oscillator.stop(audioContext.currentTime + 2.5)
        } catch (error) {
          // Silently fail if audio context is not available
        }
      }
    }

    playSpinSound()

    // Get spin outcome
    const outcome = getRandomOutcome()
    const stake = isFreeSpins ? 0 : selectedStake
    const winAmount = Math.floor(outcome.multiplier * selectedStake)

    // Calculate segment index for animation
    const segmentIndex = WHEEL_SEGMENTS.findIndex(s => s.multiplier === outcome.multiplier && s.color === outcome.color)
    const segmentAngle = 360 / WHEEL_SEGMENTS.length
    const targetAngle = segmentIndex * segmentAngle
    const spinDegrees = 1800 + (360 - targetAngle) // 5 full rotations + position

    // Animate wheel
    if (wheelRef.current) {
      wheelRef.current.style.setProperty('--spin-degrees', `${spinDegrees}deg`)
      wheelRef.current.classList.add('spin-animation')
    }

    // Simulate spin animation delay
    setTimeout(async () => {
      // Calculate new balance
      let newBalance = user.balance
      if (!isFreeSpins) {
        newBalance -= selectedStake // Deduct stake
        onPaidGamePlayed() // Mark that user has played a paid game
      }
      
      if (winAmount > 0) {
        newBalance += winAmount // Add winnings
        
        // Victory vibration
        if (navigator.vibrate) {
          navigator.vibrate([200, 100, 200, 100, 200])
        }
        
        // Create particle effect for wins
        const wheelContainer = wheelRef.current?.parentElement
        if (wheelContainer) {
          const particleContainer = document.createElement('div')
          particleContainer.className = 'particles'
          wheelContainer.appendChild(particleContainer)
          createParticles(particleContainer, 30)
          
          setTimeout(() => {
            particleContainer.remove()
          }, 2500)
        }
        
        // Show win toast
        toast({
          title: "🎉 Congratulations!",
          description: `You won ₦${winAmount.toLocaleString()}! ${outcome.multiplier}x multiplier`,
          duration: 5000,
        })
        
        // Play win sound
        if (typeof window !== 'undefined' && 'AudioContext' in window) {
          try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
            const oscillator = audioContext.createOscillator()
            const gainNode = audioContext.createGain()
            
            oscillator.connect(gainNode)
            gainNode.connect(audioContext.destination)
            
            oscillator.frequency.setValueAtTime(523, audioContext.currentTime) // C5
            oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1) // E5
            oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.2) // G5
            
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime)
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
            
            oscillator.start(audioContext.currentTime)
            oscillator.stop(audioContext.currentTime + 0.5)
          } catch (error) {
            // Silently fail if audio context is not available
          }
        }
      } else {
        // Loss vibration
        if (navigator.vibrate) {
          navigator.vibrate([300])
        }
        
        // Show loss toast for paid games only
        if (!isFreeSpins) {
          toast({
            title: "Better luck next time!",
            description: "Try again with a different stake amount",
            duration: 3000,
          })
        }
      }

      // Update user balance
      await onBalanceUpdate(newBalance, winAmount)
      
      if (isFreeSpins) {
        await onFreeSpinUsed()
      }

      // Save game session for stats (localStorage)
      saveGameSession(selectedStake, winAmount, outcome.multiplier, isFreeSpins)
      
      // Save to database if callback provided
      if (onGameSessionSave) {
        onGameSessionSave(selectedStake, winAmount, outcome.multiplier, isFreeSpins)
      }

      setLastResult({ 
        multiplier: outcome.multiplier, 
        winAmount, 
        stake,
        isFree: isFreeSpins
      })
      setShowResult(true)
      setIsSpinning(false)

      // Remove spin animation class
      if (wheelRef.current) {
        wheelRef.current.classList.remove('spin-animation')
      }
    }, 3000)
  }

  const SpinWheel = () => {
    return (
      <div className="relative w-72 h-72 mx-auto mb-6 spin-wheel">
        {/* Outer decorative ring */}
        <div className="absolute inset-0 rounded-full border-4 border-gradient-to-r from-accent to-primary opacity-30 animate-pulse"></div>
        
        {/* Main wheel */}
        <div 
          ref={wheelRef}
          className={`w-full h-full rounded-full border-8 border-primary shadow-2xl transition-all duration-300 relative overflow-hidden ${
            isSpinning ? 'glow-effect' : ''
          } ${showResult && lastResult?.multiplier === 0 ? 'lose-animation' : ''}`}
          style={{
            background: `conic-gradient(${WHEEL_SEGMENTS.map((segment, index) => 
              `${segment.color} ${index * (360 / WHEEL_SEGMENTS.length)}deg ${(index + 1) * (360 / WHEEL_SEGMENTS.length)}deg`
            ).join(', ')})`,
            transformOrigin: 'center'
          }}
        >
          {/* Wheel segments with labels */}
          {WHEEL_SEGMENTS.map((segment, index) => {
            const angle = (index * (360 / WHEEL_SEGMENTS.length)) + (360 / WHEEL_SEGMENTS.length / 2)
            return (
              <div
                key={index}
                className="absolute text-white font-bold text-sm wheel-segment-text"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-100px)`,
                }}
              >
                <span 
                  className="wheel-label"
                  style={{ transform: `rotate(-${angle}deg)`, display: 'block' }}
                >
                  {segment.label}
                </span>
              </div>
            )
          })}
          
          {/* Inner decorative circles */}
          <div className="absolute inset-8 rounded-full border-2 border-white/20"></div>
          <div className="absolute inset-16 rounded-full border border-white/10"></div>
          
          {/* Center circle with enhanced design */}
          <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border-4 border-white shadow-lg flex items-center justify-center transition-all duration-300 ${
            isSpinning ? 'animate-pulse gradient-primary' : 'bg-primary'
          }`}>
            <RotateCcw className={`w-8 h-8 text-white transition-transform duration-300 ${
              isSpinning ? 'animate-spin' : ''
            }`} />
          </div>
        </div>
        
        {/* Enhanced pointer with shadow */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-10">
          <div className="w-0 h-0 border-l-6 border-r-6 border-b-12 border-l-transparent border-r-transparent border-b-primary drop-shadow-lg"></div>
          <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-primary rounded-full"></div>
        </div>
        
        {/* Spinning effects */}
        {isSpinning && (
          <>
            <div className="absolute inset-0 rounded-full border-4 border-accent/40 animate-ping"></div>
            <div className="absolute inset-2 rounded-full border-2 border-yellow-400/30 animate-pulse"></div>
          </>
        )}
        
        {/* Win celebration ring */}
        {showResult && lastResult?.winAmount > 0 && (
          <div className="absolute inset-0 rounded-full border-4 border-green-400 animate-pulse"></div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Daily Bonus Card */}
      <DailyBonusCard user={user} onBalanceUpdate={onBalanceUpdate} />

      {/* Game Title */}
      <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
        <CardHeader className="text-center pb-3">
          <CardTitle className="flex items-center justify-center space-x-2">
            <Star className="w-5 h-5 text-accent animate-pulse" />
            <span className="text-primary">Lucky Spin</span>
            <Star className="w-5 h-5 text-accent animate-pulse" />
          </CardTitle>
          <p className="text-sm text-muted-foreground">Spin to win money multipliers!</p>
          <div className="flex justify-center space-x-4 mt-2 text-xs">
            <span className="text-green-600 font-medium">Up to 10x multiplier</span>
            <span className="text-blue-600 font-medium">Instant payouts</span>
          </div>
        </CardHeader>
      </Card>

      {/* Spin Wheel */}
      <Card className="bg-gradient-to-br from-green-50 to-yellow-50 border-2 border-primary/20">
        <CardContent className="pt-6">
          <SpinWheel />
          
          {/* Result Display */}
          {showResult && lastResult && (
            <div className={`text-center p-6 rounded-xl mb-6 border-2 ${
              lastResult.winAmount > 0 
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
                : 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200'
            }`}>
              {lastResult.winAmount > 0 ? (
                <div className="win-animation">
                  <div className="flex justify-center mb-3">
                    <Trophy className="w-12 h-12 text-yellow-500 animate-bounce" />
                    <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse ml-2 mt-1" />
                  </div>
                  <p className="text-2xl font-bold text-green-600 mb-2">
                    🎉 You Won ₦{lastResult.winAmount.toLocaleString()}!
                  </p>
                  <p className="text-lg text-green-700 mb-1">
                    {lastResult.multiplier}x Multiplier
                  </p>
                  {lastResult.stake > 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Stake: ₦{lastResult.stake} → Win: ₦{lastResult.winAmount}
                    </p>
                  ) : (
                    <Badge className="bg-accent text-accent-foreground">
                      Free Spin Win!
                    </Badge>
                  )}
                </div>
              ) : (
                <div>
                  <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                  <p className="text-xl font-medium text-gray-600 mb-2">Better Luck Next Time!</p>
                  <p className="text-lg text-gray-700 mb-1">0x Multiplier</p>
                  {lastResult.stake > 0 && (
                    <p className="text-sm text-muted-foreground">Stake: ₦{lastResult.stake}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Free Game Credit Option */}
          {canUseFreeSpins && (
            <div className="mb-6">
              <Alert className="border-accent/30 bg-gradient-to-r from-accent/10 to-yellow-50">
                <Gift className="h-4 w-4 text-accent" />
                <AlertDescription className="text-accent-foreground font-medium">
                  🎁 You have {user.freeGameCredits} FREE GAME{user.freeGameCredits > 1 ? 'S' : ''} available! Try your luck without any cost.
                </AlertDescription>
              </Alert>
              <Button
                onClick={() => handleSpin(true)}
                disabled={isSpinning}
                className="w-full mt-4 bg-gradient-to-r from-accent to-yellow-500 hover:from-yellow-500 hover:to-accent text-white font-bold py-4 text-lg transform hover:scale-105 transition-all duration-200 active:scale-95 shadow-lg"
                size="lg"
              >
                {isSpinning ? (
                  <>
                    <RotateCcw className="w-5 h-5 mr-2 animate-spin" />
                    Spinning...
                  </>
                ) : (
                  <>
                    <Gift className="w-5 h-5 mr-2" />
                    🎯 Use Free Game ({user.freeGameCredits} left)
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Stake Selection */}
          {!canUseFreeSpins && (
            <div className="space-y-4">
              {/* No Balance Notice */}
              {user.balance === 0 && (
                <Alert className="border-blue-200 bg-blue-50">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    💰 Add funds to your wallet to continue playing! Go to the Wallet tab to deposit money.
                  </AlertDescription>
                </Alert>
              )}
              
              <div>
                <h3 className="text-sm font-medium mb-3 text-center">Select Your Stake Amount</h3>
                <div className="grid grid-cols-3 gap-3 stake-grid">
                  {STAKE_OPTIONS.map((stake) => (
                    <Button
                      key={stake}
                      variant={selectedStake === stake ? "default" : "outline"}
                      size="lg"
                      onClick={() => {
                        setSelectedStake(stake)
                        // Add haptic feedback for stake selection
                        if (navigator.vibrate) {
                          navigator.vibrate([50])
                        }
                      }}
                      className={`font-bold transition-all duration-200 ${
                        selectedStake === stake 
                          ? "bg-primary text-white shadow-lg transform scale-105 stake-selected" 
                          : "hover:scale-105 active:btn-press"
                      }`}
                    >
                      ₦{stake}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Win up to ₦{(selectedStake * 10).toLocaleString()} with 10x multiplier!
                </p>
              </div>

              {/* Balance Check */}
              {!canAffordStake && (
                <Alert className="border-destructive/20 bg-destructive/10">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <AlertDescription className="text-destructive-foreground">
                    Insufficient balance. You need ₦{selectedStake} to play. Please add funds to your wallet.
                  </AlertDescription>
                </Alert>
              )}

              {/* Spin Button */}
              <Button
                onClick={() => handleSpin(false)}
                disabled={isSpinning || !canAffordStake}
                className="w-full bg-gradient-to-r from-primary to-green-600 hover:from-green-600 hover:to-primary text-white font-bold py-4 text-lg transform hover:scale-105 transition-all duration-200 active:scale-95 disabled:transform-none shadow-lg"
                size="lg"
              >
                {isSpinning ? (
                  <>
                    <RotateCcw className="w-5 h-5 mr-2 animate-spin" />
                    Spinning...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    🎰 Spin for ₦{selectedStake}
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Multiplier Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Multiplier Chances</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {WHEEL_SEGMENTS.map((segment, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: segment.color + '20' }}>
                <span className="font-medium" style={{ color: segment.color }}>
                  {segment.label}
                </span>
                <span className="text-muted-foreground">
                  {(segment.probability * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Game Stats */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-600">₦{user.totalWinnings.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Winnings</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{user.totalSpins}</p>
              <p className="text-xs text-muted-foreground">Total Spins</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Withdrawal Eligibility Notice */}
      {user.balance > 0 && !user.hasPlayedPaidGame && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            🔒 Withdrawals are available after your first paid game. Try one more spin!
          </AlertDescription>
        </Alert>
      )}

      {/* Game Statistics */}
      <GameStats user={user} />

      {/* Leaderboard */}
      <LeaderboardCard user={user} />

      {/* Quick Tips */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="text-center">
            <h3 className="font-semibold text-blue-900 mb-2">💡 Pro Tips</h3>
            <div className="grid grid-cols-1 gap-2 text-sm text-blue-800">
              <p>• Higher stakes = Higher potential winnings</p>
              <p>• Check daily bonus for free coins</p>
              <p>• Refer friends to earn ₦25 each</p>
              <p>• Play responsibly and have fun!</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}