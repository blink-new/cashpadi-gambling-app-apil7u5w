import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { Separator } from './ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { DatabaseService } from '../services/database'
import { PaymentGatewayService, PAYMENT_GATEWAYS, NIGERIAN_BANKS } from '../services/paymentGateways'
import { AdminSettingsService } from '../services/adminSettings'
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
  ArrowDownLeft,
  Smartphone,
  Copy,
  ExternalLink,
  RefreshCw,
  Shield,
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

interface EnhancedWalletPageProps {
  user: User
  onBalanceUpdate: (newBalance: number) => void
}

interface PaymentModalState {
  isOpen: boolean
  type: 'deposit' | 'withdraw'
  step: 'amount' | 'method' | 'details' | 'processing' | 'success' | 'failed'
  amount: number
  gateway: string
  method: string
  paymentData?: any
  error?: string
}

export default function EnhancedWalletPage({ user, onBalanceUpdate }: EnhancedWalletPageProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loadingTransactions, setLoadingTransactions] = useState(true)
  const [withdrawalLimits, setWithdrawalLimits] = useState({
    minWithdrawal: 100,
    maxWithdrawal: 50000,
    dailyLimit: 100000,
    enabled: true
  })
  const [dailyWithdrawalUsed, setDailyWithdrawalUsed] = useState(0)
  const [paymentModal, setPaymentModal] = useState<PaymentModalState>({
    isOpen: false,
    type: 'deposit',
    step: 'amount',
    amount: 0,
    gateway: 'paystack',
    method: 'card'
  })
  const [bankDetails, setBankDetails] = useState({
    bankCode: '',
    accountNumber: '',
    accountName: '',
    resolving: false
  })

  const canWithdraw = user.hasPlayedPaidGame && user.balance > 0 && withdrawalLimits.enabled

  useEffect(() => {
    loadData()
  }, [user.id, loadData])

  const loadData = useCallback(async () => {
    try {
      setLoadingTransactions(true)
      
      // Load transactions
      const userTransactions = await DatabaseService.getTransactions(user.id, 20)
      setTransactions(userTransactions)
      
      // Load withdrawal limits
      const limits = await AdminSettingsService.getWithdrawalLimits()
      setWithdrawalLimits(limits)
      
      // Check daily withdrawal usage
      const dailyCheck = await AdminSettingsService.checkDailyWithdrawalLimit(user.id, 0)
      setDailyWithdrawalUsed(dailyCheck.currentTotal)
      
    } catch (error) {
      console.error('Error loading wallet data:', error)
    } finally {
      setLoadingTransactions(false)
    }
  }, [user.id])

  const openPaymentModal = (type: 'deposit' | 'withdraw') => {
    setPaymentModal({
      isOpen: true,
      type,
      step: 'amount',
      amount: 0,
      gateway: 'paystack',
      method: 'card'
    })
    setBankDetails({ bankCode: '', accountNumber: '', accountName: '', resolving: false })
  }

  const closePaymentModal = () => {
    setPaymentModal(prev => ({ ...prev, isOpen: false }))
  }

  const handleAmountNext = () => {
    if (paymentModal.amount < 50) return
    
    if (paymentModal.type === 'withdraw') {
      // Check withdrawal limits
      if (paymentModal.amount < withdrawalLimits.minWithdrawal) {
        setPaymentModal(prev => ({ 
          ...prev, 
          error: `Minimum withdrawal is ₦${withdrawalLimits.minWithdrawal}` 
        }))
        return
      }
      
      if (paymentModal.amount > withdrawalLimits.maxWithdrawal) {
        setPaymentModal(prev => ({ 
          ...prev, 
          error: `Maximum withdrawal is ₦${withdrawalLimits.maxWithdrawal.toLocaleString()}` 
        }))
        return
      }
      
      if (paymentModal.amount > user.balance) {
        setPaymentModal(prev => ({ 
          ...prev, 
          error: 'Insufficient balance' 
        }))
        return
      }
      
      if (dailyWithdrawalUsed + paymentModal.amount > withdrawalLimits.dailyLimit) {
        setPaymentModal(prev => ({ 
          ...prev, 
          error: `Daily limit exceeded. Remaining: ₦${(withdrawalLimits.dailyLimit - dailyWithdrawalUsed).toLocaleString()}` 
        }))
        return
      }
    }
    
    setPaymentModal(prev => ({ ...prev, step: 'method', error: undefined }))
  }

  const handleMethodNext = () => {
    if (paymentModal.type === 'withdraw') {
      setPaymentModal(prev => ({ ...prev, step: 'details' }))
    } else {
      processPayment()
    }
  }

  const resolveBankAccount = async () => {
    if (!bankDetails.accountNumber || !bankDetails.bankCode) return
    
    setBankDetails(prev => ({ ...prev, resolving: true }))
    
    try {
      const result = await PaymentGatewayService.resolveBankAccount(
        bankDetails.accountNumber,
        bankDetails.bankCode
      )
      
      if (result.success) {
        setBankDetails(prev => ({ 
          ...prev, 
          accountName: result.account_name || '',
          resolving: false 
        }))
      } else {
        setPaymentModal(prev => ({ ...prev, error: result.message }))
        setBankDetails(prev => ({ ...prev, resolving: false }))
      }
    } catch (error) {
      setPaymentModal(prev => ({ ...prev, error: 'Failed to resolve account details' }))
      setBankDetails(prev => ({ ...prev, resolving: false }))
    }
  }

  const processPayment = async () => {
    setPaymentModal(prev => ({ ...prev, step: 'processing', error: undefined }))
    
    try {
      if (paymentModal.type === 'deposit') {
        // Create pending transaction
        const transaction = await DatabaseService.createTransaction({
          user_id: user.id,
          type: 'deposit',
          amount: paymentModal.amount,
          status: 'pending',
          payment_gateway: paymentModal.gateway,
          payment_method: paymentModal.method,
          method: `${paymentModal.gateway} ${paymentModal.method}`
        })
        
        // Initiate deposit
        const result = await PaymentGatewayService.initiateDeposit({
          amount: paymentModal.amount,
          email: user.email,
          userId: user.id,
          gateway: paymentModal.gateway,
          method: paymentModal.method as 'card' | 'bank_transfer' | 'ussd'
        })
        
        if (result.success) {
          // Update transaction with payment reference
          await DatabaseService.updateTransactionStatus(
            transaction.id,
            'pending',
            undefined,
            undefined
          )
          
          setPaymentModal(prev => ({ 
            ...prev, 
            step: 'success',
            paymentData: result
          }))
          
          // For demo purposes, auto-complete after 3 seconds
          setTimeout(async () => {
            await DatabaseService.processDeposit(
              user.id,
              paymentModal.amount,
              result.reference,
              paymentModal.gateway,
              paymentModal.method
            )
            onBalanceUpdate(user.balance + paymentModal.amount)
            loadData()
          }, 3000)
          
        } else {
          setPaymentModal(prev => ({ 
            ...prev, 
            step: 'failed',
            error: result.message
          }))
        }
        
      } else {
        // Withdrawal
        if (!bankDetails.accountName) {
          setPaymentModal(prev => ({ ...prev, error: 'Please resolve bank account details first' }))
          return
        }
        
        // Create pending withdrawal transaction
        const transaction = await DatabaseService.createTransaction({
          user_id: user.id,
          type: 'withdrawal',
          amount: paymentModal.amount,
          status: 'pending',
          payment_gateway: paymentModal.gateway,
          bank_code: bankDetails.bankCode,
          account_number: bankDetails.accountNumber,
          account_name: bankDetails.accountName,
          method: `Bank Transfer - ${NIGERIAN_BANKS.find(b => b.code === bankDetails.bankCode)?.name}`
        })
        
        // Initiate withdrawal
        const result = await PaymentGatewayService.initiateWithdrawal({
          amount: paymentModal.amount,
          userId: user.id,
          gateway: paymentModal.gateway,
          bankCode: bankDetails.bankCode,
          accountNumber: bankDetails.accountNumber,
          accountName: bankDetails.accountName,
          narration: 'CashPadi Withdrawal'
        })
        
        if (result.success) {
          setPaymentModal(prev => ({ 
            ...prev, 
            step: 'success',
            paymentData: result
          }))
          
          // For demo purposes, auto-complete after 8 seconds
          setTimeout(async () => {
            await DatabaseService.processWithdrawal(
              user.id,
              paymentModal.amount,
              result.reference,
              'completed'
            )
            onBalanceUpdate(user.balance - paymentModal.amount)
            loadData()
          }, 8000)
          
        } else {
          setPaymentModal(prev => ({ 
            ...prev, 
            step: 'failed',
            error: result.message
          }))
        }
      }
      
    } catch (error) {
      console.error('Payment processing error:', error)
      setPaymentModal(prev => ({ 
        ...prev, 
        step: 'failed',
        error: 'Payment processing failed. Please try again.'
      }))
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />
      default:
        return <AlertCircle className="w-4 h-4 text-red-500" />
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'win':
      case 'bonus':
      case 'referral':
        return <ArrowDownLeft className="w-4 h-4 text-green-500" />
      case 'withdrawal':
      case 'stake':
        return <ArrowUpRight className="w-4 h-4 text-red-500" />
      default:
        return <Wallet className="w-4 h-4" />
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="space-y-6">
      {/* Wallet Balance */}
      <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2">
            <Wallet className="w-6 h-6 text-primary" />
            <span>Wallet Balance</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="text-4xl font-bold text-primary mb-2">
            ₦{user.balance.toLocaleString()}
          </div>
          <p className="text-sm text-muted-foreground">Available for withdrawal</p>
          
          {/* Action Buttons */}
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => openPaymentModal('deposit')}
              className="bg-green-600 hover:bg-green-700 text-white"
              size="lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Money
            </Button>
            <Button
              onClick={() => openPaymentModal('withdraw')}
              disabled={!canWithdraw}
              variant="outline"
              size="lg"
            >
              <Minus className="w-4 h-4 mr-2" />
              Withdraw
            </Button>
          </div>
          
          {!canWithdraw && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                {!user.hasPlayedPaidGame 
                  ? 'Play one paid game to unlock withdrawals'
                  : !withdrawalLimits.enabled
                  ? 'Withdrawals are temporarily disabled'
                  : 'Insufficient balance for withdrawal'
                }
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              ₦{dailyWithdrawalUsed.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Used Today</p>
            <p className="text-xs text-muted-foreground">
              Limit: ₦{withdrawalLimits.dailyLimit.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">
              ₦{user.totalWinnings.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Total Winnings</p>
            <p className="text-xs text-muted-foreground">
              {user.totalSpins} spins
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Transactions</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadData}
            disabled={loadingTransactions}
          >
            <RefreshCw className={`w-4 h-4 ${loadingTransactions ? 'animate-spin' : ''}`} />
          </Button>
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
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <span>{transaction.method}</span>
                          <span>•</span>
                          <span>{new Date(transaction.created_at).toLocaleDateString()}</span>
                          {transaction.payment_reference && (
                            <>
                              <span>•</span>
                              <span className="font-mono">{transaction.payment_reference}</span>
                            </>
                          )}
                        </div>
                        {transaction.failure_reason && (
                          <p className="text-xs text-red-500 mt-1">{transaction.failure_reason}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-medium ${
                        transaction.type === 'deposit' || transaction.type === 'win' || 
                        transaction.type === 'bonus' || transaction.type === 'referral'
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {transaction.type === 'deposit' || transaction.type === 'win' || 
                         transaction.type === 'bonus' || transaction.type === 'referral' ? '+' : '-'}
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

      {/* Payment Modal */}
      <Dialog open={paymentModal.isOpen} onOpenChange={closePaymentModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {paymentModal.type === 'deposit' ? (
                <Plus className="w-5 h-5 text-green-600" />
              ) : (
                <Minus className="w-5 h-5 text-blue-600" />
              )}
              <span>
                {paymentModal.type === 'deposit' ? 'Add Money' : 'Withdraw Money'}
              </span>
            </DialogTitle>
          </DialogHeader>

          {paymentModal.step === 'amount' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Amount (₦)
                </label>
                <Input
                  type="number"
                  placeholder={paymentModal.type === 'deposit' ? 'Min ₦50' : `Min ₦${withdrawalLimits.minWithdrawal}`}
                  value={paymentModal.amount || ''}
                  onChange={(e) => setPaymentModal(prev => ({ 
                    ...prev, 
                    amount: parseFloat(e.target.value) || 0,
                    error: undefined
                  }))}
                  min={paymentModal.type === 'deposit' ? 50 : withdrawalLimits.minWithdrawal}
                  max={paymentModal.type === 'deposit' ? 1000000 : Math.min(user.balance, withdrawalLimits.maxWithdrawal)}
                />
                {paymentModal.type === 'withdraw' && (
                  <div className="mt-2 text-xs text-muted-foreground space-y-1">
                    <p>Available: ₦{user.balance.toLocaleString()}</p>
                    <p>Daily remaining: ₦{(withdrawalLimits.dailyLimit - dailyWithdrawalUsed).toLocaleString()}</p>
                  </div>
                )}
              </div>

              {/* Quick amounts */}
              <div className="grid grid-cols-4 gap-2">
                {[100, 500, 1000, 2000].map(amount => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => setPaymentModal(prev => ({ 
                      ...prev, 
                      amount,
                      error: undefined
                    }))}
                    className="text-xs"
                  >
                    ₦{amount}
                  </Button>
                ))}
              </div>

              {paymentModal.error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    {paymentModal.error}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleAmountNext}
                disabled={!paymentModal.amount || paymentModal.amount < 50}
                className="w-full"
              >
                Continue
              </Button>
            </div>
          )}

          {paymentModal.step === 'method' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Payment Gateway</label>
                <Select
                  value={paymentModal.gateway}
                  onValueChange={(value) => setPaymentModal(prev => ({ ...prev, gateway: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_GATEWAYS.map(gateway => (
                      <SelectItem key={gateway.id} value={gateway.id}>
                        <div className="flex items-center space-x-2">
                          <span>{gateway.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {gateway.processingTime}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {paymentModal.type === 'deposit' && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Payment Method</label>
                  <div className="space-y-2">
                    {['card', 'bank_transfer', 'ussd'].map(method => (
                      <Button
                        key={method}
                        variant={paymentModal.method === method ? 'default' : 'outline'}
                        onClick={() => setPaymentModal(prev => ({ ...prev, method }))}
                        className="w-full justify-start"
                      >
                        {method === 'card' && <CreditCard className="w-4 h-4 mr-2" />}
                        {method === 'bank_transfer' && <Building2 className="w-4 h-4 mr-2" />}
                        {method === 'ussd' && <Smartphone className="w-4 h-4 mr-2" />}
                        {method === 'card' ? 'Debit Card' : 
                         method === 'bank_transfer' ? 'Bank Transfer' : 'USSD'}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setPaymentModal(prev => ({ ...prev, step: 'amount' }))}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleMethodNext}
                  className="flex-1"
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {paymentModal.step === 'details' && paymentModal.type === 'withdraw' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Bank</label>
                <Select
                  value={bankDetails.bankCode}
                  onValueChange={(value) => setBankDetails(prev => ({ 
                    ...prev, 
                    bankCode: value,
                    accountName: ''
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your bank" />
                  </SelectTrigger>
                  <SelectContent>
                    {NIGERIAN_BANKS.map(bank => (
                      <SelectItem key={bank.code} value={bank.code}>
                        {bank.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Account Number</label>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Enter 10-digit account number"
                    value={bankDetails.accountNumber}
                    onChange={(e) => setBankDetails(prev => ({ 
                      ...prev, 
                      accountNumber: e.target.value.replace(/\D/g, '').slice(0, 10),
                      accountName: ''
                    }))}
                    maxLength={10}
                  />
                  <Button
                    onClick={resolveBankAccount}
                    disabled={!bankDetails.accountNumber || !bankDetails.bankCode || bankDetails.resolving}
                    size="sm"
                  >
                    {bankDetails.resolving ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      'Verify'
                    )}
                  </Button>
                </div>
              </div>

              {bankDetails.accountName && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>{bankDetails.accountName}</strong>
                    <br />
                    {NIGERIAN_BANKS.find(b => b.code === bankDetails.bankCode)?.name}
                  </AlertDescription>
                </Alert>
              )}

              {paymentModal.error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    {paymentModal.error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setPaymentModal(prev => ({ ...prev, step: 'method' }))}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={processPayment}
                  disabled={!bankDetails.accountName}
                  className="flex-1"
                >
                  Withdraw ₦{paymentModal.amount.toLocaleString()}
                </Button>
              </div>
            </div>
          )}

          {paymentModal.step === 'processing' && (
            <div className="text-center py-8 space-y-4">
              <RefreshCw className="w-12 h-12 mx-auto animate-spin text-primary" />
              <div>
                <h3 className="font-medium">Processing {paymentModal.type}...</h3>
                <p className="text-sm text-muted-foreground">
                  Please wait while we process your {paymentModal.type}
                </p>
              </div>
            </div>
          )}

          {paymentModal.step === 'success' && (
            <div className="text-center py-8 space-y-4">
              <CheckCircle className="w-12 h-12 mx-auto text-green-500" />
              <div>
                <h3 className="font-medium text-green-700">
                  {paymentModal.type === 'deposit' ? 'Payment Initiated' : 'Withdrawal Initiated'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {paymentModal.paymentData?.message}
                </p>
              </div>

              {paymentModal.paymentData?.authorization_url && (
                <Button
                  onClick={() => window.open(paymentModal.paymentData.authorization_url, '_blank')}
                  className="w-full"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Complete Payment
                </Button>
              )}

              {paymentModal.paymentData?.ussd_code && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium mb-2">Dial this USSD code:</p>
                  <div className="flex items-center justify-between bg-white p-2 rounded border">
                    <code className="font-mono">{paymentModal.paymentData.ussd_code}</code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(paymentModal.paymentData.ussd_code)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {paymentModal.paymentData?.bank_transfer_details && (
                <div className="bg-gray-50 p-4 rounded-lg text-left">
                  <p className="text-sm font-medium mb-2">Transfer to:</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Bank:</span>
                      <span className="font-medium">{paymentModal.paymentData.bank_transfer_details.bank_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Account:</span>
                      <span className="font-mono">{paymentModal.paymentData.bank_transfer_details.account_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Amount:</span>
                      <span className="font-medium">₦{paymentModal.paymentData.bank_transfer_details.amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Reference:</span>
                      <span className="font-mono text-xs">{paymentModal.paymentData.bank_transfer_details.reference}</span>
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={closePaymentModal}
                variant="outline"
                className="w-full"
              >
                Done
              </Button>
            </div>
          )}

          {paymentModal.step === 'failed' && (
            <div className="text-center py-8 space-y-4">
              <AlertCircle className="w-12 h-12 mx-auto text-red-500" />
              <div>
                <h3 className="font-medium text-red-700">
                  {paymentModal.type === 'deposit' ? 'Payment Failed' : 'Withdrawal Failed'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {paymentModal.error}
                </p>
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={() => setPaymentModal(prev => ({ ...prev, step: 'amount', error: undefined }))}
                  variant="outline"
                  className="flex-1"
                >
                  Try Again
                </Button>
                <Button
                  onClick={closePaymentModal}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}