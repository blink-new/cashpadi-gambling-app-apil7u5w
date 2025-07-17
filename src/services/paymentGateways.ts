// Payment Gateway Integration Service
// This service handles integration with Nigerian payment processors

export interface PaymentGateway {
  id: string
  name: string
  supportedMethods: string[]
  minAmount: number
  maxAmount: number
  processingTime: string
}

export interface DepositRequest {
  amount: number
  email: string
  userId: string
  gateway: string
  method: 'card' | 'bank_transfer' | 'ussd'
  callback_url?: string
}

export interface WithdrawalRequest {
  amount: number
  userId: string
  gateway: string
  bankCode: string
  accountNumber: string
  accountName: string
  narration?: string
}

export interface PaymentResponse {
  success: boolean
  reference: string
  authorization_url?: string
  ussd_code?: string
  bank_transfer_details?: {
    account_number: string
    bank_name: string
    amount: number
    reference: string
  }
  message: string
  status: 'pending' | 'success' | 'failed'
}

export interface WithdrawalResponse {
  success: boolean
  reference: string
  status: 'processing' | 'success' | 'failed'
  message: string
  transfer_code?: string
  estimated_time?: string
}

// Nigerian Banks
export const NIGERIAN_BANKS = [
  { code: '044', name: 'Access Bank' },
  { code: '014', name: 'Afribank' },
  { code: '023', name: 'Citibank' },
  { code: '050', name: 'Ecobank' },
  { code: '040', name: 'Equitorial Trust Bank' },
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
  { code: '068', name: 'Standard Chartered Bank' },
  { code: '232', name: 'Sterling Bank' },
  { code: '100', name: 'Suntrust Bank' },
  { code: '032', name: 'Union Bank' },
  { code: '033', name: 'United Bank for Africa' },
  { code: '215', name: 'Unity Bank' },
  { code: '035', name: 'Wema Bank' },
  { code: '057', name: 'Zenith Bank' }
]

// Payment Gateway Configurations
export const PAYMENT_GATEWAYS: PaymentGateway[] = [
  {
    id: 'paystack',
    name: 'Paystack',
    supportedMethods: ['card', 'bank_transfer', 'ussd'],
    minAmount: 50,
    maxAmount: 1000000,
    processingTime: 'Instant'
  },
  {
    id: 'flutterwave',
    name: 'Flutterwave',
    supportedMethods: ['card', 'bank_transfer', 'ussd'],
    minAmount: 50,
    maxAmount: 1000000,
    processingTime: 'Instant'
  },
  {
    id: 'monnify',
    name: 'Monnify',
    supportedMethods: ['card', 'bank_transfer'],
    minAmount: 100,
    maxAmount: 1000000,
    processingTime: '1-2 minutes'
  }
]

export class PaymentGatewayService {
  private static baseUrl = '/api/payments'

  // Deposit Methods
  static async initiateDeposit(request: DepositRequest): Promise<PaymentResponse> {
    try {
      // In production, this would call the actual payment gateway APIs
      // For demo purposes, we'll simulate the response
      
      const reference = `CP_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      
      // Simulate different payment methods
      switch (request.method) {
        case 'card':
          return {
            success: true,
            reference,
            authorization_url: `https://${request.gateway}.com/pay/${reference}`,
            message: 'Redirecting to payment page...',
            status: 'pending'
          }
          
        case 'bank_transfer':
          return {
            success: true,
            reference,
            bank_transfer_details: {
              account_number: '1234567890',
              bank_name: 'Wema Bank',
              amount: request.amount,
              reference
            },
            message: 'Transfer to the account details provided',
            status: 'pending'
          }
          
        case 'ussd': {
          const ussdCode = this.generateUSSDCode(request.gateway, request.amount, reference)
          return {
            success: true,
            reference,
            ussd_code: ussdCode,
            message: 'Dial the USSD code to complete payment',
            status: 'pending'
          }
        }
          
        default:
          throw new Error('Unsupported payment method')
      }
    } catch (error) {
      console.error('Deposit initiation error:', error)
      return {
        success: false,
        reference: '',
        message: 'Failed to initiate payment. Please try again.',
        status: 'failed'
      }
    }
  }

  // Withdrawal Methods
  static async initiateWithdrawal(request: WithdrawalRequest): Promise<WithdrawalResponse> {
    try {
      // Validate bank details
      const bank = NIGERIAN_BANKS.find(b => b.code === request.bankCode)
      if (!bank) {
        throw new Error('Invalid bank code')
      }

      // Validate account number (basic validation)
      if (!/^\d{10}$/.test(request.accountNumber)) {
        throw new Error('Account number must be 10 digits')
      }

      const reference = `CW_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      
      // Simulate withdrawal processing
      // In production, this would call the actual payout APIs
      return {
        success: true,
        reference,
        status: 'processing',
        message: `Withdrawal of ₦${request.amount.toLocaleString()} initiated to ${bank.name}`,
        transfer_code: reference,
        estimated_time: '5-10 seconds'
      }
    } catch (error) {
      console.error('Withdrawal initiation error:', error)
      return {
        success: false,
        reference: '',
        status: 'failed',
        message: error instanceof Error ? error.message : 'Withdrawal failed. Please try again.'
      }
    }
  }

  // Verify payment status
  static async verifyPayment(reference: string, gateway: string): Promise<PaymentResponse> {
    try {
      // In production, this would verify with the actual gateway
      // For demo, we'll simulate successful verification after a delay
      
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Simulate 90% success rate
      const isSuccess = Math.random() > 0.1
      
      return {
        success: isSuccess,
        reference,
        message: isSuccess ? 'Payment verified successfully' : 'Payment verification failed',
        status: isSuccess ? 'success' : 'failed'
      }
    } catch (error) {
      console.error('Payment verification error:', error)
      return {
        success: false,
        reference,
        message: 'Payment verification failed',
        status: 'failed'
      }
    }
  }

  // Check withdrawal status
  static async checkWithdrawalStatus(reference: string, gateway: string): Promise<WithdrawalResponse> {
    try {
      // In production, this would check with the actual gateway
      // For demo, we'll simulate status updates
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Simulate 95% success rate for withdrawals
      const isSuccess = Math.random() > 0.05
      
      return {
        success: isSuccess,
        reference,
        status: isSuccess ? 'success' : 'failed',
        message: isSuccess 
          ? 'Withdrawal completed successfully' 
          : 'Withdrawal failed. Please contact support.',
        transfer_code: reference
      }
    } catch (error) {
      console.error('Withdrawal status check error:', error)
      return {
        success: false,
        reference,
        status: 'failed',
        message: 'Failed to check withdrawal status'
      }
    }
  }

  // Resolve bank account details
  static async resolveBankAccount(accountNumber: string, bankCode: string): Promise<{
    success: boolean
    account_name?: string
    account_number?: string
    bank_name?: string
    message: string
  }> {
    try {
      // Validate inputs
      if (!/^\d{10}$/.test(accountNumber)) {
        throw new Error('Account number must be 10 digits')
      }

      const bank = NIGERIAN_BANKS.find(b => b.code === bankCode)
      if (!bank) {
        throw new Error('Invalid bank code')
      }

      // In production, this would call the bank verification API
      // For demo, we'll simulate account resolution
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Generate a mock account name
      const mockNames = [
        'JOHN ADEBAYO SMITH',
        'MARY CHIOMA OKAFOR',
        'IBRAHIM MOHAMMED ALI',
        'GRACE FUNMI WILLIAMS',
        'DAVID EMEKA NWANKWO'
      ]
      
      const accountName = mockNames[Math.floor(Math.random() * mockNames.length)]
      
      return {
        success: true,
        account_name: accountName,
        account_number: accountNumber,
        bank_name: bank.name,
        message: 'Account details resolved successfully'
      }
    } catch (error) {
      console.error('Bank account resolution error:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to resolve account details'
      }
    }
  }

  // Helper method to generate USSD codes
  private static generateUSSDCode(gateway: string, amount: number, reference: string): string {
    switch (gateway) {
      case 'paystack':
        return `*737*000*${amount}*${reference.slice(-6)}#`
      case 'flutterwave':
        return `*894*${amount}*${reference.slice(-6)}#`
      default:
        return `*737*000*${amount}*${reference.slice(-6)}#`
    }
  }

  // Get supported payment methods for a gateway
  static getPaymentMethods(gatewayId: string): string[] {
    const gateway = PAYMENT_GATEWAYS.find(g => g.id === gatewayId)
    return gateway?.supportedMethods || []
  }

  // Get gateway limits
  static getGatewayLimits(gatewayId: string): { min: number; max: number } {
    const gateway = PAYMENT_GATEWAYS.find(g => g.id === gatewayId)
    return {
      min: gateway?.minAmount || 50,
      max: gateway?.maxAmount || 1000000
    }
  }
}