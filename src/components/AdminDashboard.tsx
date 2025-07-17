import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { Separator } from './ui/separator'
import { Switch } from './ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { AdminSettingsService, WithdrawalLimits } from '../services/adminSettings'
import { 
  Settings, 
  Save, 
  RotateCcw, 
  TrendingUp,
  Users,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Wallet,
  Shield
} from 'lucide-react'

interface WheelSegment {
  id: number
  multiplier: number
  probability: number
  color: string
  label: string
  isActive: boolean
}

interface AdminStats {
  totalUsers: number
  totalSpins: number
  totalWinnings: number
  totalRevenue: number
  activeUsers: number
}

export default function AdminDashboard() {
  const [wheelSegments, setWheelSegments] = useState<WheelSegment[]>([
    { id: 1, multiplier: 0, probability: 0.45, color: '#ef4444', label: '0x', isActive: true },
    { id: 2, multiplier: 0.5, probability: 0.25, color: '#f59e0b', label: '0.5x', isActive: true },
    { id: 3, multiplier: 1, probability: 0.15, color: '#10b981', label: '1x', isActive: true },
    { id: 4, multiplier: 2, probability: 0.08, color: '#3b82f6', label: '2x', isActive: true },
    { id: 5, multiplier: 5, probability: 0.04, color: '#8b5cf6', label: '5x', isActive: true },
    { id: 6, multiplier: 10, probability: 0.03, color: '#FFD700', label: '10x', isActive: true }
  ])

  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 1247,
    totalSpins: 8934,
    totalWinnings: 2456789,
    totalRevenue: 4567890,
    activeUsers: 89
  })

  const [withdrawalLimits, setWithdrawalLimits] = useState<WithdrawalLimits>({
    minWithdrawal: 100,
    maxWithdrawal: 50000,
    dailyLimit: 100000,
    monthlyLimit: 1000000,
    enabled: true
  })

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [limitsStatus, setLimitsStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  useEffect(() => {
    loadWithdrawalLimits()
  }, [])

  const loadWithdrawalLimits = async () => {
    try {
      const limits = await AdminSettingsService.getWithdrawalLimits()
      setWithdrawalLimits(limits)
    } catch (error) {
      console.error('Error loading withdrawal limits:', error)
    }
  }

  const totalProbability = wheelSegments.reduce((sum, segment) => sum + segment.probability, 0)
  const isValidProbability = Math.abs(totalProbability - 1.0) < 0.001

  const updateSegmentProbability = (id: number, probability: number) => {
    setWheelSegments(segments =>
      segments.map(segment =>
        segment.id === id ? { ...segment, probability: Math.max(0, Math.min(1, probability)) } : segment
      )
    )
  }

  const updateSegmentMultiplier = (id: number, multiplier: number) => {
    setWheelSegments(segments =>
      segments.map(segment =>
        segment.id === id ? { ...segment, multiplier: Math.max(0, multiplier) } : segment
      )
    )
  }

  const saveConfiguration = async () => {
    if (!isValidProbability) return

    setSaveStatus('saving')
    
    try {
      // In a real app, this would save to the database
      // await blink.db.wheelSegments.updateMany(wheelSegments)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (error) {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }

  const resetToDefaults = () => {
    setWheelSegments([
      { id: 1, multiplier: 0, probability: 0.45, color: '#ef4444', label: '0x', isActive: true },
      { id: 2, multiplier: 0.5, probability: 0.25, color: '#f59e0b', label: '0.5x', isActive: true },
      { id: 3, multiplier: 1, probability: 0.15, color: '#10b981', label: '1x', isActive: true },
      { id: 4, multiplier: 2, probability: 0.08, color: '#3b82f6', label: '2x', isActive: true },
      { id: 5, multiplier: 5, probability: 0.04, color: '#8b5cf6', label: '5x', isActive: true },
      { id: 6, multiplier: 10, probability: 0.03, color: '#FFD700', label: '10x', isActive: true }
    ])
  }

  const calculateExpectedReturn = () => {
    return wheelSegments.reduce((sum, segment) => sum + (segment.multiplier * segment.probability), 0)
  }

  const calculateHouseEdge = () => {
    const expectedReturn = calculateExpectedReturn()
    return ((1 - expectedReturn) * 100).toFixed(2)
  }

  const saveWithdrawalLimits = async () => {
    setLimitsStatus('saving')
    
    try {
      await AdminSettingsService.updateWithdrawalLimits(withdrawalLimits, 'admin')
      setLimitsStatus('saved')
      setTimeout(() => setLimitsStatus('idle'), 3000)
    } catch (error) {
      console.error('Error saving withdrawal limits:', error)
      setLimitsStatus('error')
      setTimeout(() => setLimitsStatus('idle'), 3000)
    }
  }

  const updateWithdrawalLimit = (field: keyof WithdrawalLimits, value: any) => {
    setWithdrawalLimits(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Admin Dashboard</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure Lucky Spin wheel odds and monitor game statistics
          </p>
        </CardHeader>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Users</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <RotateCcw className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.totalSpins.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Spins</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <TrendingUp className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">₦{(stats.totalWinnings / 100).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Winnings</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <DollarSign className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">₦{(stats.totalRevenue / 100).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Revenue</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-8 h-8 bg-green-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
              </div>
              <p className="text-2xl font-bold">{stats.activeUsers}</p>
              <p className="text-xs text-muted-foreground">Active Now</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Tabs */}
      <Tabs defaultValue="game" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="game" className="flex items-center space-x-2">
            <RotateCcw className="w-4 h-4" />
            <span>Game Settings</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center space-x-2">
            <Wallet className="w-4 h-4" />
            <span>Payment Limits</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4" />
            <span>Activity</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="game" className="space-y-6">

      {/* Wheel Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Wheel Segment Configuration</CardTitle>
          <p className="text-sm text-muted-foreground">
            Adjust multipliers and probabilities for each wheel segment
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Probability Validation */}
          <Alert className={isValidProbability ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
            {isValidProbability ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={isValidProbability ? "text-green-800" : "text-red-800"}>
              Total Probability: {(totalProbability * 100).toFixed(1)}%
              {isValidProbability ? " ✓ Valid" : " ✗ Must equal 100%"}
            </AlertDescription>
          </Alert>

          {/* Game Economics */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div className="text-center">
              <p className="text-lg font-bold text-primary">{(calculateExpectedReturn() * 100).toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">Expected Return</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-green-600">{calculateHouseEdge()}%</p>
              <p className="text-xs text-muted-foreground">House Edge</p>
            </div>
          </div>

          {/* Segment Configuration */}
          <div className="space-y-3">
            {wheelSegments.map((segment) => (
              <div key={segment.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                <div 
                  className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: segment.color }}
                ></div>
                
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor={`multiplier-${segment.id}`} className="text-xs">
                      Multiplier
                    </Label>
                    <Input
                      id={`multiplier-${segment.id}`}
                      type="number"
                      min="0"
                      step="0.1"
                      value={segment.multiplier}
                      onChange={(e) => updateSegmentMultiplier(segment.id, parseFloat(e.target.value) || 0)}
                      className="h-8"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`probability-${segment.id}`} className="text-xs">
                      Probability
                    </Label>
                    <Input
                      id={`probability-${segment.id}`}
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      value={segment.probability}
                      onChange={(e) => updateSegmentProbability(segment.id, parseFloat(e.target.value) || 0)}
                      className="h-8"
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <Badge variant="outline" className="text-xs">
                      {(segment.probability * 100).toFixed(1)}% chance
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              onClick={saveConfiguration}
              disabled={!isValidProbability || saveStatus === 'saving'}
              className="flex-1"
            >
              {saveStatus === 'saving' ? (
                <>
                  <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : saveStatus === 'saved' ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Configuration
                </>
              )}
            </Button>
            
            <Button
              onClick={resetToDefaults}
              variant="outline"
            >
              Reset to Defaults
            </Button>
          </div>

          {saveStatus === 'error' && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Failed to save configuration. Please try again.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          {/* Withdrawal Limits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wallet className="w-5 h-5" />
                <span>Withdrawal Limits</span>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure withdrawal limits and restrictions for users
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enable/Disable Withdrawals */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Enable Withdrawals</h3>
                  <p className="text-sm text-muted-foreground">
                    Allow users to withdraw their winnings
                  </p>
                </div>
                <Switch
                  checked={withdrawalLimits.enabled}
                  onCheckedChange={(checked) => updateWithdrawalLimit('enabled', checked)}
                />
              </div>

              {/* Withdrawal Amount Limits */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minWithdrawal">Minimum Withdrawal (₦)</Label>
                  <Input
                    id="minWithdrawal"
                    type="number"
                    min="1"
                    value={withdrawalLimits.minWithdrawal}
                    onChange={(e) => updateWithdrawalLimit('minWithdrawal', parseInt(e.target.value) || 0)}
                    placeholder="100"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Minimum amount users can withdraw per transaction
                  </p>
                </div>

                <div>
                  <Label htmlFor="maxWithdrawal">Maximum Withdrawal (₦)</Label>
                  <Input
                    id="maxWithdrawal"
                    type="number"
                    min="1"
                    value={withdrawalLimits.maxWithdrawal}
                    onChange={(e) => updateWithdrawalLimit('maxWithdrawal', parseInt(e.target.value) || 0)}
                    placeholder="50000"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximum amount users can withdraw per transaction
                  </p>
                </div>
              </div>

              {/* Daily and Monthly Limits */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dailyLimit">Daily Limit (₦)</Label>
                  <Input
                    id="dailyLimit"
                    type="number"
                    min="1"
                    value={withdrawalLimits.dailyLimit}
                    onChange={(e) => updateWithdrawalLimit('dailyLimit', parseInt(e.target.value) || 0)}
                    placeholder="100000"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximum amount users can withdraw per day
                  </p>
                </div>

                <div>
                  <Label htmlFor="monthlyLimit">Monthly Limit (₦)</Label>
                  <Input
                    id="monthlyLimit"
                    type="number"
                    min="1"
                    value={withdrawalLimits.monthlyLimit}
                    onChange={(e) => updateWithdrawalLimit('monthlyLimit', parseInt(e.target.value) || 0)}
                    placeholder="1000000"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximum amount users can withdraw per month
                  </p>
                </div>
              </div>

              {/* Current Settings Summary */}
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-3 flex items-center">
                  <Shield className="w-4 h-4 mr-2" />
                  Current Settings Summary
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={withdrawalLimits.enabled ? "default" : "secondary"} className="ml-2">
                      {withdrawalLimits.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Per Transaction:</span>
                    <span className="ml-2 font-medium">
                      ₦{withdrawalLimits.minWithdrawal.toLocaleString()} - ₦{withdrawalLimits.maxWithdrawal.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Daily Limit:</span>
                    <span className="ml-2 font-medium">₦{withdrawalLimits.dailyLimit.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Monthly Limit:</span>
                    <span className="ml-2 font-medium">₦{withdrawalLimits.monthlyLimit.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <Button
                onClick={saveWithdrawalLimits}
                disabled={limitsStatus === 'saving'}
                className="w-full"
              >
                {limitsStatus === 'saving' ? (
                  <>
                    <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : limitsStatus === 'saved' ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Withdrawal Limits
                  </>
                )}
              </Button>

              {limitsStatus === 'error' && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    Failed to save withdrawal limits. Please try again.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <p className="text-sm text-muted-foreground">
                Live feed of user activities and transactions
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { user: "user123", action: "Won ₦500", multiplier: "5x", time: "2 minutes ago", type: "win" },
                  { user: "user456", action: "Lost ₦100", multiplier: "0x", time: "5 minutes ago", type: "loss" },
                  { user: "user789", action: "Won ₦200", multiplier: "2x", time: "8 minutes ago", type: "win" },
                  { user: "user321", action: "Withdrew ₦1,500", multiplier: "Bank Transfer", time: "10 minutes ago", type: "withdrawal" },
                  { user: "user654", action: "Deposited ₦300", multiplier: "Paystack", time: "12 minutes ago", type: "deposit" },
                  { user: "user987", action: "Won ₦50", multiplier: "0.5x", time: "15 minutes ago", type: "win" },
                  { user: "user111", action: "Lost ₦200", multiplier: "0x", time: "18 minutes ago", type: "loss" }
                ].map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                        activity.type === 'win' ? 'bg-green-500' :
                        activity.type === 'loss' ? 'bg-red-500' :
                        activity.type === 'deposit' ? 'bg-blue-500' :
                        'bg-purple-500'
                      }`}>
                        {activity.user.slice(-2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{activity.user}</p>
                        <p className="text-xs text-muted-foreground">{activity.action}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={
                        activity.type === 'win' ? "default" : 
                        activity.type === 'deposit' ? "default" :
                        "secondary"
                      }>
                        {activity.multiplier}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}