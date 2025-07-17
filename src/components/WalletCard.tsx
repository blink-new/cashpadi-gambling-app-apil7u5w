import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Wallet, Plus, Minus, CreditCard, Smartphone, Building } from 'lucide-react'

interface WalletCardProps {
  balance: number // in kobo
  canWithdraw: boolean
  onDeposit: (amount: number, gateway: string) => void
  onWithdraw: (amount: number, gateway: string) => void
}

const PAYMENT_GATEWAYS = [
  { id: 'paystack', name: 'Paystack', icon: CreditCard, color: 'bg-blue-500' },
  { id: 'flutterwave', name: 'Flutterwave', icon: Smartphone, color: 'bg-orange-500' },
  { id: 'monnify', name: 'Monnify', icon: Building, color: 'bg-purple-500' }
]

const QUICK_AMOUNTS = [5000, 10000, 20000, 50000] // ₦50, ₦100, ₦200, ₦500 in kobo

export default function WalletCard({ balance, canWithdraw, onDeposit, onWithdraw }: WalletCardProps) {
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit')
  const [amount, setAmount] = useState('')
  const [selectedGateway, setSelectedGateway] = useState('paystack')

  const handleQuickAmount = (quickAmount: number) => {
    setAmount((quickAmount / 100).toString())
  }

  const handleSubmit = () => {
    const amountInKobo = Math.round(parseFloat(amount) * 100)
    if (amountInKobo < 5000) return // Minimum ₦50

    if (activeTab === 'deposit') {
      onDeposit(amountInKobo, selectedGateway)
    } else {
      onWithdraw(amountInKobo, selectedGateway)
    }
    setAmount('')
  }

  const isValidAmount = () => {
    const amountInKobo = Math.round(parseFloat(amount) * 100)
    if (activeTab === 'deposit') {
      return amountInKobo >= 5000 && amountInKobo <= 100000 // ₦50 - ₦1000
    } else {
      return amountInKobo >= 5000 && amountInKobo <= balance && canWithdraw
    }
  }

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
      <CardHeader className="text-center pb-4">
        <CardTitle className="flex items-center justify-center gap-2 text-primary">
          <Wallet className="w-6 h-6" />
          My Wallet
        </CardTitle>
        <div className="text-3xl font-bold text-primary">
          ₦{(balance / 100).toFixed(2)}
        </div>
        {!canWithdraw && (
          <Badge variant="outline" className="text-xs">
            Play one paid game to unlock withdrawals
          </Badge>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Tab Buttons */}
        <div className="flex bg-muted rounded-lg p-1">
          <Button
            variant={activeTab === 'deposit' ? 'default' : 'ghost'}
            size="sm"
            className="flex-1"
            onClick={() => setActiveTab('deposit')}
          >
            <Plus className="w-4 h-4 mr-1" />
            Deposit
          </Button>
          <Button
            variant={activeTab === 'withdraw' ? 'default' : 'ghost'}
            size="sm"
            className="flex-1"
            onClick={() => setActiveTab('withdraw')}
          >
            <Minus className="w-4 h-4 mr-1" />
            Withdraw
          </Button>
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Amount (₦)</label>
          <Input
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="50"
            max={activeTab === 'withdraw' ? (balance / 100).toString() : '1000'}
          />
        </div>

        {/* Quick Amount Buttons */}
        <div className="grid grid-cols-4 gap-2">
          {QUICK_AMOUNTS.map((quickAmount) => (
            <Button
              key={quickAmount}
              variant="outline"
              size="sm"
              onClick={() => handleQuickAmount(quickAmount)}
              className="text-xs"
            >
              ₦{quickAmount / 100}
            </Button>
          ))}
        </div>

        {/* Payment Gateway Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Payment Method</label>
          <Select value={selectedGateway} onValueChange={setSelectedGateway}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_GATEWAYS.map((gateway) => {
                const Icon = gateway.icon
                return (
                  <SelectItem key={gateway.id} value={gateway.id}>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded ${gateway.color} flex items-center justify-center`}>
                        <Icon className="w-3 h-3 text-white" />
                      </div>
                      {gateway.name}
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={!isValidAmount()}
          className="w-full"
          size="lg"
        >
          {activeTab === 'deposit' ? 'Add Money' : 'Withdraw Money'}
        </Button>

        {/* Limits Info */}
        <div className="text-xs text-muted-foreground text-center space-y-1">
          <p>
            {activeTab === 'deposit' 
              ? 'Deposit: ₦50 - ₦1,000 per transaction'
              : 'Withdraw: ₦50 minimum'
            }
          </p>
          <p>Instant processing • Secure & encrypted</p>
        </div>
      </CardContent>
    </Card>
  )
}