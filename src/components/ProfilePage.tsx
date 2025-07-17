import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { Separator } from './ui/separator'
import { Switch } from './ui/switch'
import ResponsibleGamingCard from './ResponsibleGamingCard'
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Shield, 
  Bell,
  Settings,
  LogOut,
  Edit,
  Save,
  X,
  Trophy,
  Target,
  Clock,
  AlertTriangle
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

interface ProfilePageProps {
  user: User
}

export default function ProfilePage({ user }: ProfilePageProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [displayName, setDisplayName] = useState(user.displayName || '')
  const [notifications, setNotifications] = useState(true)
  const [emailUpdates, setEmailUpdates] = useState(false)
  const [dailyLimit, setDailyLimit] = useState('1000')

  const handleSaveProfile = () => {
    // Here you would typically update the user profile
    console.log('Saving profile:', { displayName })
    setIsEditing(false)
  }

  const handleLogout = () => {
    if (confirm('Are you sure you want to log out?')) {
      // Handle logout
      window.location.reload()
    }
  }

  const winRate = user.totalSpins > 0 ? ((user.totalWinnings / (user.totalSpins * 100)) * 100).toFixed(1) : '0'
  const accountAge = '15 days' // Mock data
  const lastLogin = 'Today, 2:30 PM' // Mock data

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader className="text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="flex items-center justify-center space-x-2">
            {isEditing ? (
              <div className="flex items-center space-x-2">
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="text-center"
                  placeholder="Enter display name"
                />
                <Button size="sm" onClick={handleSaveProfile}>
                  <Save className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <>
                <span>{user.displayName || 'User'}</span>
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
                  <Edit className="w-4 h-4" />
                </Button>
              </>
            )}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <Badge variant="secondary" className="mx-auto">
            {user.hasPlayedPaidGame ? 'Verified Player' : 'New Player'}
          </Badge>
        </CardHeader>
      </Card>

      {/* Account Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Account Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors">
              <Trophy className="w-6 h-6 text-accent mx-auto mb-1" />
              <p className="text-lg font-bold">₦{user.totalWinnings.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Winnings</p>
            </div>
            <div className="text-center p-3 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors">
              <Target className="w-6 h-6 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold">{user.totalSpins}</p>
              <p className="text-xs text-muted-foreground">Total Spins</p>
            </div>
            <div className="text-center p-3 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors">
              <Calendar className="w-6 h-6 text-success mx-auto mb-1" />
              <p className="text-lg font-bold">{accountAge}</p>
              <p className="text-xs text-muted-foreground">Member Since</p>
            </div>
            <div className="text-center p-3 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors">
              <Clock className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
              <p className="text-lg font-bold">{winRate}%</p>
              <p className="text-xs text-muted-foreground">Win Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievement Badges */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-gradient-to-br from-accent/10 to-accent/5 rounded-lg border border-accent/20">
              <Trophy className="w-6 h-6 text-accent mx-auto mb-1" />
              <p className="text-xs font-medium">First Win</p>
              <p className="text-xs text-muted-foreground">Unlocked</p>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
              <Target className="w-6 h-6 text-primary mx-auto mb-1" />
              <p className="text-xs font-medium">Spin Master</p>
              <p className="text-xs text-muted-foreground">10+ Spins</p>
            </div>
            <div className="text-center p-3 bg-secondary rounded-lg opacity-50">
              <Shield className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
              <p className="text-xs font-medium">High Roller</p>
              <p className="text-xs text-muted-foreground">₦1000+ Win</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <Badge variant="outline" className="text-success border-success">
              Verified
            </Badge>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Referral Code</p>
                <p className="text-xs text-muted-foreground font-mono">{user.referralCode}</p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Last Login</p>
                <p className="text-xs text-muted-foreground">{lastLogin}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Responsible Gaming */}
      <ResponsibleGamingCard user={user} />

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <Bell className="w-5 h-5" />
            <span>Notifications</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Push Notifications</p>
              <p className="text-xs text-muted-foreground">Get notified about wins and promotions</p>
            </div>
            <Switch
              checked={notifications}
              onCheckedChange={setNotifications}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Email Updates</p>
              <p className="text-xs text-muted-foreground">Receive promotional emails</p>
            </div>
            <Switch
              checked={emailUpdates}
              onCheckedChange={setEmailUpdates}
            />
          </div>
        </CardContent>
      </Card>

      {/* Support & Help */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Support & Help</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start">
            <Settings className="w-4 h-4 mr-2" />
            Help Center
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <Mail className="w-4 h-4 mr-2" />
            Contact Support
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <Shield className="w-4 h-4 mr-2" />
            Privacy Policy
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <Settings className="w-4 h-4 mr-2" />
            Terms of Service
          </Button>
        </CardContent>
      </Card>

      {/* Logout */}
      <Card>
        <CardContent className="pt-6">
          <Button
            onClick={handleLogout}
            variant="destructive"
            className="w-full"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Log Out
          </Button>
        </CardContent>
      </Card>

      {/* App Version */}
      <div className="text-center text-xs text-muted-foreground">
        CashPadi v1.0.0 • Made with ❤️ in Nigeria
      </div>
    </div>
  )
}