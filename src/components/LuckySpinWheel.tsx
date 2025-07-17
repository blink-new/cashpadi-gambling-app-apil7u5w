import React, { useState, useRef } from 'react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Badge } from './ui/badge'

interface SpinResult {
  multiplier: number
  winAmount: number
  isWinner: boolean
}

interface LuckySpinWheelProps {
  stakeAmount: number
  onSpinComplete: (result: SpinResult) => void
  isSpinning: boolean
  canSpin: boolean
}

const WHEEL_SEGMENTS = [
  { multiplier: 0, color: '#ef4444', label: 'Try Again' },
  { multiplier: 1.5, color: '#f59e0b', label: '1.5x' },
  { multiplier: 0, color: '#ef4444', label: 'Try Again' },
  { multiplier: 2, color: '#10b981', label: '2x' },
  { multiplier: 0, color: '#ef4444', label: 'Try Again' },
  { multiplier: 3, color: '#3b82f6', label: '3x' },
  { multiplier: 0, color: '#ef4444', label: 'Try Again' },
  { multiplier: 5, color: '#8b5cf6', label: '5x' },
  { multiplier: 0, color: '#ef4444', label: 'Try Again' },
  { multiplier: 10, color: '#FFD700', label: '10x' },
]

const WIN_PROBABILITIES = [0.4, 0.25, 0.4, 0.2, 0.4, 0.1, 0.4, 0.04, 0.4, 0.01]

export default function LuckySpinWheel({ stakeAmount, onSpinComplete, isSpinning, canSpin }: LuckySpinWheelProps) {
  const wheelRef = useRef<HTMLDivElement>(null)
  const [lastResult, setLastResult] = useState<SpinResult | null>(null)

  const getRandomResult = (): { segmentIndex: number; result: SpinResult } => {
    const random = Math.random()
    let cumulativeProbability = 0
    
    for (let i = 0; i < WIN_PROBABILITIES.length; i++) {
      cumulativeProbability += WIN_PROBABILITIES[i]
      if (random <= cumulativeProbability) {
        const segment = WHEEL_SEGMENTS[i]
        const winAmount = segment.multiplier * stakeAmount
        return {
          segmentIndex: i,
          result: {
            multiplier: segment.multiplier,
            winAmount,
            isWinner: segment.multiplier > 0
          }
        }
      }
    }
    
    // Fallback to first segment
    return {
      segmentIndex: 0,
      result: {
        multiplier: 0,
        winAmount: 0,
        isWinner: false
      }
    }
  }

  const handleSpin = () => {
    if (!canSpin || isSpinning) return

    const { segmentIndex, result } = getRandomResult()
    setLastResult(result)

    // Calculate rotation degrees
    const segmentAngle = 360 / WHEEL_SEGMENTS.length
    const targetAngle = segmentIndex * segmentAngle
    const spinDegrees = 1800 + (360 - targetAngle) // 5 full rotations + position

    if (wheelRef.current) {
      wheelRef.current.style.setProperty('--spin-degrees', `${spinDegrees}deg`)
      wheelRef.current.classList.add('spin-animation')
      
      setTimeout(() => {
        wheelRef.current?.classList.remove('spin-animation')
        onSpinComplete(result)
      }, 3000)
    }
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-green-50 to-yellow-50 border-2 border-primary/20">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-primary mb-2">Lucky Spin</h2>
        <p className="text-sm text-muted-foreground">Stake ₦{(stakeAmount / 100).toFixed(2)} to win up to ₦{((stakeAmount * 10) / 100).toFixed(2)}!</p>
      </div>

      {/* Spin Wheel */}
      <div className="relative mx-auto mb-6" style={{ width: '280px', height: '280px' }}>
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 z-10">
          <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-primary"></div>
        </div>
        
        {/* Wheel */}
        <div
          ref={wheelRef}
          className="w-full h-full rounded-full border-4 border-primary shadow-lg relative overflow-hidden"
          style={{ transformOrigin: 'center' }}
        >
          {WHEEL_SEGMENTS.map((segment, index) => {
            const angle = (360 / WHEEL_SEGMENTS.length) * index
            const nextAngle = (360 / WHEEL_SEGMENTS.length) * (index + 1)
            
            return (
              <div
                key={index}
                className="absolute w-full h-full"
                style={{
                  background: `conic-gradient(from ${angle}deg, ${segment.color} 0deg, ${segment.color} ${360 / WHEEL_SEGMENTS.length}deg, transparent ${360 / WHEEL_SEGMENTS.length}deg)`,
                  clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos((angle - 90) * Math.PI / 180)}% ${50 + 50 * Math.sin((angle - 90) * Math.PI / 180)}%, ${50 + 50 * Math.cos((nextAngle - 90) * Math.PI / 180)}% ${50 + 50 * Math.sin((nextAngle - 90) * Math.PI / 180)}%)`
                }}
              >
                <div
                  className="absolute text-white font-bold text-sm"
                  style={{
                    top: '20%',
                    left: '50%',
                    transform: `translate(-50%, -50%) rotate(${angle + (360 / WHEEL_SEGMENTS.length) / 2}deg)`,
                    transformOrigin: '50% 200%'
                  }}
                >
                  {segment.label}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Spin Button */}
      <div className="text-center mb-4">
        <Button
          onClick={handleSpin}
          disabled={!canSpin || isSpinning}
          size="lg"
          className="w-full max-w-xs bg-gradient-to-r from-primary to-green-600 hover:from-green-600 hover:to-primary text-white font-bold py-4 text-lg shadow-lg"
        >
          {isSpinning ? 'Spinning...' : 'SPIN NOW!'}
        </Button>
      </div>

      {/* Last Result */}
      {lastResult && (
        <div className="text-center">
          {lastResult.isWinner ? (
            <Badge className="bg-green-500 text-white px-4 py-2 text-lg">
              🎉 You Won ₦{(lastResult.winAmount / 100).toFixed(2)}!
            </Badge>
          ) : (
            <Badge variant="destructive" className="px-4 py-2 text-lg">
              😔 Try Again!
            </Badge>
          )}
        </div>
      )}

      {/* Trust Indicators */}
      <div className="flex justify-center gap-2 mt-4 flex-wrap">
        <span className="trust-badge">🔒 Secure</span>
        <span className="trust-badge">⚡ Instant</span>
        <span className="trust-badge">🇳🇬 Nigerian</span>
      </div>
    </Card>
  )
}