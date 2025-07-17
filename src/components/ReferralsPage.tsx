import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { Separator } from './ui/separator'
import { 
  Users, 
  Copy, 
  Share2, 
  Gift, 
  Trophy,
  CheckCircle,
  UserPlus,
  Coins,
  MessageCircle,
  Phone
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

interface ReferralsPageProps {
  user: User
}

const MOCK_REFERRALS = [
  { id: '1', name: 'John D.', email: 'john***@gmail.com', status: 'active', earnings: 50, joinDate: '2024-01-10' },
  { id: '2', name: 'Sarah M.', email: 'sarah***@yahoo.com', status: 'active', earnings: 25, joinDate: '2024-01-12' },
  { id: '3', name: 'Mike O.', email: 'mike***@gmail.com', status: 'pending', earnings: 0, joinDate: '2024-01-14' }
]

export default function ReferralsPage({ user }: ReferralsPageProps) {
  const [copied, setCopied] = useState(false)
  
  const referralLink = `https://cashpadi.com/ref/${user.referralCode}`
  const totalReferrals = MOCK_REFERRALS.length
  const activeReferrals = MOCK_REFERRALS.filter(r => r.status === 'active').length
  const totalEarnings = MOCK_REFERRALS.reduce((sum, r) => sum + r.earnings, 0)

  const copyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = referralLink
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const shareReferralLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join CashPadi - Win Real Cash!',
          text: 'Join me on CashPadi and get a free spin to win real cash! Use my referral code for bonus rewards.',
          url: referralLink
        })
      } catch (err) {
        console.log('Error sharing:', err)
      }
    } else {
      // Fallback to copying
      copyReferralLink()
    }
  }

  const shareViaWhatsApp = () => {
    const message = `🎰 Join me on CashPadi and win real cash! 💰\n\nUse my referral code: ${user.referralCode}\nGet a FREE spin when you sign up!\n\n${referralLink}`
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
  }

  const shareViaSMS = () => {
    const message = `Join CashPadi and win real cash! Use code: ${user.referralCode} for a free spin. ${referralLink}`
    window.open(`sms:?body=${encodeURIComponent(message)}`, '_blank')
  }

  return (
    <div className="space-y-6">
      {/* Referral Stats */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2">
            <Users className="w-5 h-5 text-primary" />
            <span>Referral Program</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Earn ₦25 for each friend who joins and plays!
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{totalReferrals}</p>
              <p className="text-xs text-muted-foreground">Total Referrals</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-success">{activeReferrals}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-accent">₦{totalEarnings}</p>
              <p className="text-xs text-muted-foreground">Earned</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referral Code */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Referral Code</CardTitle>
          <p className="text-sm text-muted-foreground">
            Share this code with friends to earn rewards
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Input
              value={user.referralCode}
              readOnly
              className="font-mono text-center text-lg font-bold"
            />
            <Button
              onClick={copyReferralLink}
              variant="outline"
              size="icon"
            >
              {copied ? (
                <CheckCircle className="w-4 h-4 text-success" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Button
              onClick={shareViaWhatsApp}
              className="flex flex-col items-center py-3 h-auto bg-green-600 hover:bg-green-700"
              size="sm"
            >
              <MessageCircle className="w-4 h-4 mb-1" />
              <span className="text-xs">WhatsApp</span>
            </Button>
            <Button
              onClick={shareViaSMS}
              variant="outline"
              className="flex flex-col items-center py-3 h-auto"
              size="sm"
            >
              <Phone className="w-4 h-4 mb-1" />
              <span className="text-xs">SMS</span>
            </Button>
            <Button
              onClick={shareReferralLink}
              variant="outline"
              className="flex flex-col items-center py-3 h-auto"
              size="sm"
            >
              <Share2 className="w-4 h-4 mb-1" />
              <span className="text-xs">More</span>
            </Button>
          </div>
          
          <Button
            onClick={copyReferralLink}
            variant="outline"
            className="w-full flex items-center justify-center space-x-2"
          >
            <Copy className="w-4 h-4" />
            <span>{copied ? 'Copied!' : 'Copy Link'}</span>
          </Button>
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Share2 className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h4 className="font-medium">1. Share Your Code</h4>
                <p className="text-sm text-muted-foreground">
                  Send your referral code to friends and family
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-success/10 rounded-full flex items-center justify-center flex-shrink-0">
                <UserPlus className="w-4 h-4 text-success" />
              </div>
              <div>
                <h4 className="font-medium">2. Friend Joins</h4>
                <p className="text-sm text-muted-foreground">
                  They sign up using your referral code
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Coins className="w-4 h-4 text-accent" />
              </div>
              <div>
                <h4 className="font-medium">3. Earn Rewards</h4>
                <p className="text-sm text-muted-foreground">
                  Get ₦25 when they play their first paid game
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referral Bonus */}
      <Alert className="border-accent/20 bg-accent/10">
        <Gift className="h-4 w-4 text-accent" />
        <AlertDescription className="text-accent-foreground">
          <strong>Bonus:</strong> Refer 10 friends and get an extra ₦100 bonus!
        </AlertDescription>
      </Alert>

      {/* Referral History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Referrals</CardTitle>
        </CardHeader>
        <CardContent>
          {MOCK_REFERRALS.length > 0 ? (
            <div className="space-y-3">
              {MOCK_REFERRALS.map((referral, index) => (
                <div key={referral.id}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{referral.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {referral.email} • Joined {referral.joinDate}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={referral.status === 'active' ? 'default' : 'secondary'}
                        className={referral.status === 'active' ? 'bg-success' : ''}
                      >
                        {referral.status}
                      </Badge>
                      {referral.earnings > 0 && (
                        <span className="text-sm font-medium text-success">
                          +₦{referral.earnings}
                        </span>
                      )}
                    </div>
                  </div>
                  {index < MOCK_REFERRALS.length - 1 && <Separator className="mt-3" />}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No referrals yet</p>
              <p className="text-sm text-muted-foreground">
                Start sharing your code to earn rewards!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Terms */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Terms & Conditions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>• Referral rewards are credited after your friend plays their first paid game</p>
            <p>• Maximum 50 referrals per user</p>
            <p>• Referral earnings can be withdrawn like regular winnings</p>
            <p>• CashPadi reserves the right to modify the referral program</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}