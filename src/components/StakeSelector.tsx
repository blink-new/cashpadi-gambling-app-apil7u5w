import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Slider } from './ui/slider'
import { Target, TrendingUp } from 'lucide-react'

interface StakeSelectorProps {
  stakeAmount: number
  onStakeChange: (amount: number) => void
  walletBalance: number
  freeSpinsLeft: number
}

const STAKE_OPTIONS = [
  { amount: 5000, label: '₦50', popular: false },
  { amount: 10000, label: '₦100', popular: true },
  { amount: 20000, label: '₦200', popular: false },
  { amount: 30000, label: '₦300', popular: false },
  { amount: 50000, label: '₦500', popular: false },
]

export default function StakeSelector({ stakeAmount, onStakeChange, walletBalance, freeSpinsLeft }: StakeSelectorProps) {
  const maxWin = stakeAmount * 10 // 10x multiplier
  const canAfford = (amount: number) => amount <= walletBalance || freeSpinsLeft > 0

  return (
    <Card className="bg-gradient-to-br from-accent/10 to-primary/10 border-accent/30">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-primary">
          <Target className="w-5 h-5" />
          Select Your Stake
        </CardTitle>
        {freeSpinsLeft > 0 && (
          <Badge className="bg-accent text-accent-foreground w-fit">
            🎁 {freeSpinsLeft} Free Spin{freeSpinsLeft > 1 ? 's' : ''} Available
          </Badge>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quick Stake Buttons */}
        <div className="grid grid-cols-2 gap-2">
          {STAKE_OPTIONS.map((option) => (
            <Button
              key={option.amount}
              variant={stakeAmount === option.amount ? 'default' : 'outline'}
              size="sm"
              onClick={() => onStakeChange(option.amount)}
              disabled={!canAfford(option.amount) && freeSpinsLeft === 0}
              className="relative"
            >
              {option.label}
              {option.popular && (
                <Badge className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-xs px-1">
                  Popular
                </Badge>
              )}
            </Button>
          ))}
        </div>

        {/* Custom Stake Slider */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Custom Amount</label>
          <Slider
            value={[stakeAmount]}
            onValueChange={(value) => onStakeChange(value[0])}
            min={5000}
            max={50000}
            step={1000}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>₦50</span>
            <span className="font-medium">₦{(stakeAmount / 100).toFixed(0)}</span>
            <span>₦500</span>
          </div>
        </div>

        {/* Win Potential */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">Win Potential</span>
          </div>
          <div className="text-lg font-bold text-green-700">
            Up to ₦{(maxWin / 100).toFixed(2)}
          </div>
          <div className="text-xs text-green-600">
            10x multiplier on lucky spins!
          </div>
        </div>

        {/* Balance Check */}
        {walletBalance < stakeAmount && freeSpinsLeft === 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
            <p className="text-sm text-red-600">
              Insufficient balance. Add money to your wallet to play.
            </p>
          </div>
        )}

        {/* Game Rules */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Minimum stake: ₦50 • Maximum stake: ₦500</p>
          <p>• Win multipliers: 1.5x, 2x, 3x, 5x, 10x</p>
          <p>• Fair play guaranteed with provable randomness</p>
        </div>
      </CardContent>
    </Card>
  )
}