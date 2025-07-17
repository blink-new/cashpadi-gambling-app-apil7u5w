import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { 
  CreditCard, 
  Smartphone, 
  Building2,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowRight,
  Shield,
  Zap
} from 'lucide-react'

interface NigerianPaymentGatewayProps {
  amount: number
  type: 'deposit' | 'withdrawal'
  onSuccess: (transactionId: string, method: string) => void
  onCancel: () => void
}

interface PaymentMethod {
  id: string
  name: string
  icon: React.ReactNode
  type: 'bank' | 'card' | 'mobile'
  processingTime: string
  fee: number
  popular?: boolean
}

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'paystack_card',
    name: 'Debit/Credit Card',
    icon: <CreditCard className="w-5 h-5" />,
    type: 'card',
    processingTime: 'Instant',
    fee: 0,
    popular: true
  },
  {
    id: 'bank_transfer',
    name: 'Bank Transfer',
    icon: <Building2 className="w-5 h-5" />,
    type: 'bank',
    processingTime: '5-10 minutes',
    fee: 0
  },
  {
    id: 'ussd',
    name: 'USSD (*737#)',
    icon: <Smartphone className="w-5 h-5" />,
    type: 'mobile',
    processingTime: 'Instant',
    fee: 0,
    popular: true
  }
]

const NIGERIAN_BANKS = [
  { code: '044', name: 'Access Bank' },
  { code: '014', name: 'Afribank' },
  { code: '023', name: 'Citibank' },
  { code: '050', name: 'Ecobank' },
  { code: '011', name: 'First Bank' },
  { code: '214', name: 'First City Monument Bank' },
  { code: '070', name: 'Fidelity Bank' },
  { code: '058', name: 'Guaranty Trust Bank' },
  { code: '030', name: 'Heritage Bank' },
  { code: '301', name: 'Jaiz Bank' },
  { code: '082', name: 'Keystone Bank' },
  { code: '526', name: 'Parallex Bank' },
  { code: '076', name: 'Polaris Bank' },
  { code: '101', name: 'Providus Bank' },
  { code: '221', name: 'Stanbic IBTC Bank' },
  { code: '068', name: 'Standard Chartered' },
  { code: '232', name: 'Sterling Bank' },
  { code: '100', name: 'Suntrust Bank' },
  { code: '032', name: 'Union Bank' },
  { code: '033', name: 'United Bank for Africa' },
  { code: '215', name: 'Unity Bank' },
  { code: '035', name: 'Wema Bank' },
  { code: '057', name: 'Zenith Bank' }
]

export default function NigerianPaymentGateway({ amount, type, onSuccess, onCancel }: NigerianPaymentGatewayProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [step, setStep] = useState<'select' | 'details' | 'processing' | 'success'>('select')
  const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvv: '', name: '' })
  const [bankDetails, setBankDetails] = useState({ accountNumber: '', bankCode: '', accountName: '' })
  const [isProcessing, setIsProcessing] = useState(false)
  const [transactionId, setTransactionId] = useState('')

  const handleMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method)
    setStep('details')
  }

  const simulatePayment = async () => {
    setIsProcessing(true)
    setStep('processing')
    
    // Simulate payment processing
    const processingTime = selectedMethod?.type === 'card' ? 2000 : 5000
    
    setTimeout(() => {
      const mockTransactionId = `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      setTransactionId(mockTransactionId)
      setStep('success')
      setIsProcessing(false)
      
      // Call success callback after a brief delay
      setTimeout(() => {
        onSuccess(mockTransactionId, selectedMethod?.name || 'Unknown')
      }, 1500)
    }, processingTime)
  }

  const formatAmount = (amount: number) => {
    return `₦${amount.toLocaleString()}`
  }

  const renderMethodSelection = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-primary mb-2">
          {type === 'deposit' ? 'Add Money' : 'Withdraw Money'}
        </h2>
        <div className="text-3xl font-bold text-green-600 mb-1">
          {formatAmount(amount)}
        </div>
        <p className="text-sm text-muted-foreground">
          {type === 'deposit' ? 'Choose your payment method' : 'Select withdrawal method'}
        </p>
      </div>

      <div className="space-y-3">
        {PAYMENT_METHODS.map((method) => (
          <div
            key={method.id}
            onClick={() => handleMethodSelect(method)}
            className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-primary cursor-pointer transition-all duration-200 hover:shadow-md"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                {method.icon}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <p className="font-medium">{method.name}</p>
                  {method.popular && (
                    <Badge className="bg-accent text-accent-foreground text-xs">
                      Popular
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {method.processingTime} • {method.fee === 0 ? 'No fees' : `₦${method.fee} fee`}
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground" />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center space-x-4 mt-6 text-xs text-muted-foreground">
        <div className="flex items-center space-x-1">
          <Shield className="w-4 h-4" />
          <span>256-bit SSL</span>
        </div>
        <div className="flex items-center space-x-1">
          <Zap className="w-4 h-4" />
          <span>Instant Processing</span>
        </div>
        <div className="flex items-center space-x-1">
          <CheckCircle className="w-4 h-4" />
          <span>PCI Compliant</span>
        </div>
      </div>
    </div>
  )

  const renderCardDetails = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Enter Card Details</h3>
        <p className="text-sm text-muted-foreground">
          Your card information is encrypted and secure
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Card Number</label>
          <Input
            placeholder="1234 5678 9012 3456"
            value={cardDetails.number}
            onChange={(e) => setCardDetails(prev => ({ ...prev, number: e.target.value }))}
            maxLength={19}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Expiry Date</label>
            <Input
              placeholder="MM/YY"
              value={cardDetails.expiry}
              onChange={(e) => setCardDetails(prev => ({ ...prev, expiry: e.target.value }))}
              maxLength={5}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">CVV</label>
            <Input
              placeholder="123"
              value={cardDetails.cvv}
              onChange={(e) => setCardDetails(prev => ({ ...prev, cvv: e.target.value }))}
              maxLength={4}
              type="password"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Cardholder Name</label>
          <Input
            placeholder="John Doe"
            value={cardDetails.name}
            onChange={(e) => setCardDetails(prev => ({ ...prev, name: e.target.value }))}
          />
        </div>
      </div>

      <Alert className="border-blue-200 bg-blue-50">
        <Shield className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          🔒 Your payment is secured by Paystack with 256-bit SSL encryption
        </AlertDescription>
      </Alert>
    </div>
  )

  const renderBankDetails = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">
          {type === 'deposit' ? 'Bank Transfer Details' : 'Withdrawal Account'}
        </h3>
        <p className="text-sm text-muted-foreground">
          {type === 'deposit' 
            ? 'Transfer money from your bank account' 
            : 'Enter your bank account details'
          }
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Bank</label>
          <select 
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            value={bankDetails.bankCode}
            onChange={(e) => setBankDetails(prev => ({ ...prev, bankCode: e.target.value }))}
          >
            <option value="">Select your bank</option>
            {NIGERIAN_BANKS.map((bank) => (
              <option key={bank.code} value={bank.code}>
                {bank.name}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Account Number</label>
          <Input
            placeholder="1234567890"
            value={bankDetails.accountNumber}
            onChange={(e) => setBankDetails(prev => ({ ...prev, accountNumber: e.target.value }))}
            maxLength={10}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Account Name</label>
          <Input
            placeholder="John Doe"
            value={bankDetails.accountName}
            onChange={(e) => setBankDetails(prev => ({ ...prev, accountName: e.target.value }))}
          />
        </div>
      </div>

      {type === 'deposit' && (
        <Alert className="border-orange-200 bg-orange-50">
          <Clock className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            ⏱️ Bank transfers typically take 5-10 minutes to reflect in your wallet
          </AlertDescription>
        </Alert>
      )}
    </div>
  )

  const renderUSSDDetails = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">USSD Payment</h3>
        <p className="text-sm text-muted-foreground">
          Pay instantly using your mobile phone
        </p>
      </div>

      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
        <div className="text-center">
          <Smartphone className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h4 className="font-bold text-green-800 mb-2">Follow these steps:</h4>
          <div className="space-y-2 text-sm text-green-700">
            <p>1. Dial <strong>*737*50*{amount}*4*{Math.random().toString().substring(2, 8)}#</strong></p>
            <p>2. Enter your 4-digit PIN</p>
            <p>3. Confirm the transaction</p>
            <p>4. You'll receive an SMS confirmation</p>
          </div>
        </div>
      </div>

      <Alert className="border-blue-200 bg-blue-50">
        <Zap className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          ⚡ USSD payments are processed instantly and work on all Nigerian networks
        </AlertDescription>
      </Alert>
    </div>
  )

  const renderProcessing = () => (
    <div className="text-center py-8">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <h3 className="text-lg font-semibold mb-2">Processing Payment...</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Please don't close this window. This may take a few moments.
      </p>
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800">
          🔒 Your transaction is being securely processed by {selectedMethod?.name}
        </p>
      </div>
    </div>
  )

  const renderSuccess = () => (
    <div className="text-center py-8">
      <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4 animate-bounce" />
      <h3 className="text-lg font-semibold text-green-800 mb-2">
        {type === 'deposit' ? 'Payment Successful!' : 'Withdrawal Initiated!'}
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        {type === 'deposit' 
          ? `₦${amount.toLocaleString()} has been added to your wallet`
          : `₦${amount.toLocaleString()} withdrawal is being processed`
        }
      </p>
      <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-4">
        <p className="text-sm text-green-800">
          <strong>Transaction ID:</strong> {transactionId}
        </p>
        <p className="text-xs text-green-600 mt-1">
          Keep this ID for your records
        </p>
      </div>
    </div>
  )

  const canProceed = () => {
    if (!selectedMethod) return false
    
    if (selectedMethod.type === 'card') {
      return cardDetails.number && cardDetails.expiry && cardDetails.cvv && cardDetails.name
    }
    
    if (selectedMethod.type === 'bank') {
      return bankDetails.accountNumber && bankDetails.bankCode && bankDetails.accountName
    }
    
    return true // USSD doesn't need additional details
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center space-x-2">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
            {type === 'deposit' ? (
              <ArrowRight className="w-4 h-4 text-primary rotate-90" />
            ) : (
              <ArrowRight className="w-4 h-4 text-primary -rotate-90" />
            )}
          </div>
          <span className="text-primary">
            {type === 'deposit' ? 'Deposit Funds' : 'Withdraw Funds'}
          </span>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {step === 'select' && renderMethodSelection()}
        {step === 'details' && selectedMethod?.type === 'card' && renderCardDetails()}
        {step === 'details' && selectedMethod?.type === 'bank' && renderBankDetails()}
        {step === 'details' && selectedMethod?.type === 'mobile' && renderUSSDDetails()}
        {step === 'processing' && renderProcessing()}
        {step === 'success' && renderSuccess()}
        
        {step !== 'processing' && step !== 'success' && (
          <div className="flex space-x-3 mt-6">
            <Button
              variant="outline"
              onClick={step === 'select' ? onCancel : () => setStep('select')}
              className="flex-1"
            >
              {step === 'select' ? 'Cancel' : 'Back'}
            </Button>
            
            {step === 'details' && (
              <Button
                onClick={simulatePayment}
                disabled={!canProceed() || isProcessing}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                {type === 'deposit' ? 'Pay Now' : 'Withdraw'}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}