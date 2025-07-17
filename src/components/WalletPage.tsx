import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { Separator } from './ui/separator'
import { DatabaseService } from '../services/database'
import { Transaction } from '../lib/supabase'
import { 
  Wallet, 
  Plus, 
  Minus, 
  CreditCard, 
  Building2, 
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownLeft
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

interface WalletPageProps {
  user: User
  onAddFunds: (amount: number) => void
}

const PAYMENT_METHODS = [
  { id: 'paystack', name: 'Paystack', icon: CreditCard, color: 'bg-blue-500', description: 'Cards, Bank Transfer, USSD' },
  { id: 'flutterwave', name: 'Flutterwave', icon: CreditCard, color: 'bg-orange-500', description: 'Cards, Bank Transfer, Mobile Money' },
  { id: 'monnify', name: 'Monnify', icon: Building2, color: 'bg-green-500', description: 'Bank Transfer, Cards' }
]

const NIGERIAN_BANKS = [
  'Access Bank', 'GTBank', 'First Bank', 'UBA', 'Zenith Bank', 
  'Fidelity Bank', 'Union Bank', 'Sterling Bank', 'Stanbic IBTC', 'Wema Bank'
]

const MOCK_TRANSACTIONS = [
  { id: '1', type: 'deposit', amount: 1000, status: 'completed', date: '2024-01-15', method: 'Paystack' },
  { id: '2', type: 'withdrawal', amount: 500, status: 'pending', date: '2024-01-14', method: 'Bank Transfer' },
  { id: '3', type: 'win', amount: 200, status: 'completed', date: '2024-01-14', method: 'Lucky Spin' },
  { id: '4', type: 'stake', amount: 100, status: 'completed', date: '2024-01-14', method: 'Lucky Spin' }
]

export default function WalletPage({ user, onAddFunds }: WalletPageProps) {
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit')
  const [amount, setAmount] = useState('')
  const [selectedMethod, setSelectedMethod] = useState(PAYMENT_METHODS[0].id)
  const [isProcessing, setIsProcessing] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loadingTransactions, setLoadingTransactions] = useState(true)

  const canWithdraw = user.hasPlayedPaidGame && user.balance > 0
  const minWithdrawal = 100
  const maxWithdrawal = 50000

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        setLoadingTransactions(true)
        const userTransactions = await DatabaseService.getTransactions(user.id, 20)
        setTransactions(userTransactions)
      } catch (error) {
        console.error('Error loading transactions:', error)
        // Fallback to mock data if database fails
        setTransactions(MOCK_TRANSACTIONS)
      } finally {
        setLoadingTransactions(false)
      }
    }

    loadTransactions()
  }, [user.id])

  const handleDeposit = async () => {
    const depositAmount = parseFloat(amount)
    if (!depositAmount || depositAmount < 50) return

    setIsProcessing(true)
    
    // Simulate payment processing
    setTimeout(() => {
      // For demo purposes, instantly add funds to wallet
      onAddFunds(depositAmount)
      alert(`₦${depositAmount.toLocaleString()} has been added to your wallet! You can now play paid games.`)
      setAmount('')
      setIsProcessing(false)
    }, 2000)
  }

  const handleWithdraw = async () => {
    const withdrawAmount = parseFloat(amount)
    if (!withdrawAmount || withdrawAmount < minWithdrawal || withdrawAmount > user.balance) return

    setIsProcessing(true)
    
    // Simulate withdrawal processing
    setTimeout(() => {
      alert(`Withdrawal of ₦${withdrawAmount.toLocaleString()} initiated. Funds will be sent to your bank account.`)
      setAmount('')
      setIsProcessing(false)
    }, 2000)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-success" />
      case 'pending':
        return <Clock className="w-4 h-4 text-warning" />
      default:
        return <AlertCircle className="w-4 h-4 text-destructive" />
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'win':
        return <ArrowDownLeft className="w-4 h-4 text-success" />
      case 'withdrawal':
      case 'stake':
        return <ArrowUpRight className="w-4 h-4 text-destructive" />
      default:
        return <Wallet className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Wallet Balance */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2">
            <Wallet className="w-5 h-5 text-primary" />
            <span>Wallet Balance</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className="text-4xl font-bold text-primary mb-2 balance-update">
            ₦{user.balance.toLocaleString()}
          </div>
          <p className="text-sm text-muted-foreground">Available for withdrawal</p>
        </CardContent>
      </Card>

      {/* Deposit/Withdraw Tabs */}
      <Card>
        <CardHeader>
          <div className="flex space-x-1 bg-secondary rounded-lg p-1">
            <Button
              variant={activeTab === 'deposit' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('deposit')}
              className="flex-1"
            >
              <Plus className="w-4 h-4 mr-1" />
              Deposit
            </Button>
            <Button
              variant={activeTab === 'withdraw' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('withdraw')}
              className="flex-1"
            >
              <Minus className="w-4 h-4 mr-1" />
              Withdraw
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeTab === 'deposit' ? (
            <>
              <div>
                <label className="text-sm font-medium mb-2 block">Amount (₦)</label>
                <Input
                  type="number"
                  placeholder="Enter amount (min ₦50)"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="50"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Payment Method</label>
                <div className="grid gap-2">
                  {PAYMENT_METHODS.map((method) => (
                    <Button
                      key={method.id}
                      variant={selectedMethod === method.id ? 'default' : 'outline'}
                      onClick={() => setSelectedMethod(method.id)}
                      className="justify-start h-auto py-3"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded ${method.color}`}></div>
                        <method.icon className="w-4 h-4" />
                        <div className="text-left">
                          <p className="font-medium">{method.name}</p>
                          <p className="text-xs text-muted-foreground">{method.description}</p>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleDeposit}
                disabled={isProcessing || !amount || parseFloat(amount) < 50}
                className="w-full bg-success hover:bg-success/90"
                size="lg"
              >
                {isProcessing ? 'Processing...' : `Deposit ₦${amount || '0'}`}
              </Button>
            </>
          ) : (
            <>
              {!canWithdraw && (
                <Alert className="border-warning/20 bg-warning/10">
                  <AlertCircle className="h-4 w-4 text-warning" />
                  <AlertDescription className="text-warning-foreground">
                    {!user.hasPlayedPaidGame 
                      ? 'Withdrawals are available after your first paid game. Try one more spin!'
                      : 'Insufficient balance for withdrawal.'
                    }
                  </AlertDescription>
                </Alert>
              )}

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Amount (₦{minWithdrawal} - ₦{maxWithdrawal.toLocaleString()})
                </label>
                <Input
                  type="number"
                  placeholder={`Enter amount (min ₦${minWithdrawal})`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min={minWithdrawal}
                  max={Math.min(user.balance, maxWithdrawal)}
                  disabled={!canWithdraw}
                />
              </div>

              <div className="bg-secondary p-3 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  Funds will be sent to your registered Nigerian bank account within 24 hours.
                </p>
                <p className="text-xs text-muted-foreground">
                  Supported banks: {NIGERIAN_BANKS.slice(0, 3).join(', ')} and {NIGERIAN_BANKS.length - 3} more
                </p>
              </div>

              <Button
                onClick={handleWithdraw}
                disabled={
                  isProcessing || 
                  !canWithdraw || 
                  !amount || 
                  parseFloat(amount) < minWithdrawal || 
                  parseFloat(amount) > user.balance
                }
                className="w-full bg-primary hover:bg-primary/90"
                size="lg"
              >
                {isProcessing ? 'Processing...' : `Withdraw ₦${amount || '0'}`}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setActiveTab('deposit')
                setAmount('100')
              }}
              className="flex flex-col items-center py-4 h-auto"
            >
              <Plus className="w-5 h-5 mb-1" />
              <span className="text-xs">Add ₦100</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setActiveTab('deposit')
                setAmount('500')
              }}
              className="flex flex-col items-center py-4 h-auto"
            >
              <Plus className="w-5 h-5 mb-1" />
              <span className="text-xs">Add ₦500</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingTransactions ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between animate-pulse">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-gray-300 rounded"></div>
                    <div>
                      <div className="w-20 h-4 bg-gray-300 rounded mb-1"></div>
                      <div className="w-32 h-3 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                  <div className="w-16 h-4 bg-gray-300 rounded"></div>
                </div>
              ))}
            </div>
          ) : transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((transaction, index) => (
                <div key={transaction.id}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getTransactionIcon(transaction.type)}
                      <div>
                        <p className="text-sm font-medium capitalize">
                          {transaction.type === 'win' ? 'Spin Win' : 
                           transaction.type === 'stake' ? 'Spin Stake' : 
                           transaction.type === 'bonus' ? 'Daily Bonus' :
                           transaction.type === 'referral' ? 'Referral Bonus' :
                           transaction.type}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {transaction.method} • {new Date(transaction.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-medium ${
                        transaction.type === 'deposit' || transaction.type === 'win' || transaction.type === 'bonus' || transaction.type === 'referral'
                          ? 'text-success' 
                          : 'text-destructive'
                      }`}>
                        {transaction.type === 'deposit' || transaction.type === 'win' || transaction.type === 'bonus' || transaction.type === 'referral' ? '+' : '-'}
                        ₦{transaction.amount.toLocaleString()}
                      </span>
                      {getStatusIcon(transaction.status)}
                    </div>
                  </div>
                  {index < transactions.length - 1 && <Separator className="mt-3" />}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No transactions yet</p>
              <p className="text-sm">Your transaction history will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}