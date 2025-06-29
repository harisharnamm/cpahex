import React, { useState, ReactElement } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { TopBar } from '../components/organisms/TopBar';
import { Input } from '../components/atoms/Input';
import { Button } from '../components/atoms/Button';
import { 
  User, 
  Mail, 
  Key, 
  Bell, 
  Save, 
  Shield, 
  CreditCard, 
  Globe, 
  CheckCircle, 
  Smartphone, 
  Lock, 
  Zap,
  Clock
} from 'lucide-react';

export function Settings(): ReactElement {
  const { profile, updateProfile } = useAuthContext();
  const [activeSection, setActiveSection] = useState('profile');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  
  const [profileData, setProfileData] = useState({
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    company: profile?.company || '',
    phone: profile?.phone || '',
  });
  
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setUpdateMessage(null);
    
    try {
      const { error } = await updateProfile(profileData);
      
      if (error) {
        setUpdateMessage('Error updating profile');
      } else {
        setUpdateMessage('Profile updated successfully');
      }
    } catch (err) {
      setUpdateMessage('An unexpected error occurred');
    } finally {
      setIsUpdating(false);
    }
  };

  const sections = [
    {
      id: 'profile',
      title: 'Profile Settings',
      icon: User,
      description: 'Manage your personal information',
      content: (
        <div className="space-y-8">
          {updateMessage && (
            <div className={`p-4 rounded-xl animate-fade-in ${
              updateMessage.includes('successfully') 
                ? 'bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 border border-emerald-200' 
                : 'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200'
            }`}>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span>{updateMessage}</span>
              </div>
            </div>
          )}
          
          <div className="bg-gradient-to-br from-surface-elevated to-surface p-6 rounded-2xl border border-border-subtle shadow-soft mb-8">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center shadow-soft">
                <span className="text-xl font-bold text-gray-900">
                  {profile?.first_name?.[0] || ''}{profile?.last_name?.[0] || ''}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary">
                  {profile?.first_name || ''} {profile?.last_name || ''}
                </h3>
                <p className="text-text-tertiary">{profile?.company || 'CPA Firm'}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-surface rounded-xl p-4 border border-border-subtle">
                <div className="flex items-center space-x-2 text-text-tertiary mb-1">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">Email</span>
                </div>
                <p className="text-text-primary font-medium">user@example.com</p>
              </div>
              
              <div className="bg-surface rounded-xl p-4 border border-border-subtle">
                <div className="flex items-center space-x-2 text-text-tertiary mb-1">
                  <Shield className="w-4 h-4" />
                  <span className="text-sm">Account Status</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-emerald-100 text-emerald-700 text-xs font-medium">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Active
                  </span>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-text-primary">First Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                    <Input 
                      value={profileData.first_name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, first_name: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-text-primary">Last Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                    <Input 
                      value={profileData.last_name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, last_name: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-text-primary">Phone Number</label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                  <Input 
                    type="tel" 
                    value={profileData.phone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-text-primary">Company</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                  <Input 
                    value={profileData.company}
                    onChange={(e) => setProfileData(prev => ({ ...prev, company: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="pt-4">
                <Button 
                  type="submit" 
                  icon={Save} 
                  disabled={isUpdating}
                  className="bg-primary text-gray-900 hover:bg-primary-hover shadow-medium"
                >
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ),
    },
    {
      id: 'email',
      title: 'Email Templates',
      icon: Mail,
      description: 'Customize your email communications',
      content: (
        <div className="space-y-8">
          <div className="bg-gradient-to-br from-surface-elevated to-surface p-6 rounded-2xl border border-border-subtle shadow-soft">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">Email Templates</h3>
                <p className="text-text-tertiary text-sm">Customize your client communications</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-semibold text-text-primary">
                    W-9 Request Template
                  </label>
                  <div className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Active
                  </div>
                </div>
                <textarea
                  className="w-full h-40 px-4 py-3 bg-surface border border-border-subtle rounded-xl text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all duration-200"
                  defaultValue="Dear [Vendor Name],

We need you to complete a W-9 form for our tax records. Please complete and return the attached form at your earliest convenience.

Thank you,
[Your Name]"
                />
                <div className="flex items-center space-x-2 mt-2">
                  <span className="text-xs text-text-tertiary">Available variables:</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-surface-elevated text-text-secondary text-xs font-mono">
                    [Vendor Name]
                  </span>
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-surface-elevated text-text-secondary text-xs font-mono">
                    [Your Name]
                  </span>
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-semibold text-text-primary">
                    IRS Notice Follow-up Template
                  </label>
                  <div className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Active
                  </div>
                </div>
                <textarea
                  className="w-full h-32 px-4 py-3 bg-surface border border-border-subtle rounded-xl text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all duration-200"
                  defaultValue="Dear [Client Name],

We have received an IRS notice regarding your account. Please review the attached summary and let us know if you have any questions.

Best regards,
[Your Name]"
                />
                <div className="flex items-center space-x-2 mt-2">
                  <span className="text-xs text-text-tertiary">Available variables:</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-surface-elevated text-text-secondary text-xs font-mono">
                    [Client Name]
                  </span>
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-surface-elevated text-text-secondary text-xs font-mono">
                    [Your Name]
                  </span>
                </div>
              </div>
              
              <Button icon={Save} className="bg-primary text-gray-900 hover:bg-primary-hover shadow-medium">
                Save Templates
              </Button>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'api',
      title: 'API Configuration',
      icon: Key,
      description: 'Manage API keys and integrations',
      content: (
        <div className="space-y-8">
          <div className="bg-gradient-to-br from-surface-elevated to-surface p-6 rounded-2xl border border-border-subtle shadow-soft">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Key className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">API Keys</h3>
                <p className="text-text-tertiary text-sm">Manage your integration keys</p>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mb-6">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-amber-800 text-sm font-medium mb-1">Security Note</p>
                  <p className="text-amber-700 text-sm">
                    API keys are encrypted and stored securely. Never share your keys with unauthorized users or include them in client-side code.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-text-primary">OpenAI API Key</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                  <Input
                    type="password"
                    placeholder="sk-..."
                    defaultValue="sk-1234567890abcdef"
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center mt-1">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
                  <span className="text-xs text-emerald-600">Connected and working</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-text-primary">Document OCR Service</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                  <Input
                    type="password"
                    placeholder="API key for OCR service"
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-text-primary">Stripe API Key</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                  <Input
                    type="password"
                    placeholder="sk_test_..."
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="bg-surface rounded-xl p-4 border border-border-subtle">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-text-primary">API Status</h4>
                    <p className="text-sm text-text-tertiary">All services connected</p>
                  </div>
                  <div className="inline-flex items-center px-2 py-1 rounded-md bg-emerald-100 text-emerald-700 text-xs font-medium">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Active
                  </div>
                </div>
              </div>
              
              <Button icon={Save} className="bg-primary text-gray-900 hover:bg-primary-hover shadow-medium">
                Save API Keys
              </Button>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: Bell,
      description: 'Configure your notification preferences',
      content: (
        <div className="space-y-8">
          <div className="bg-gradient-to-br from-surface-elevated to-surface p-6 rounded-2xl border border-border-subtle shadow-soft">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-amber-100 rounded-xl">
                <Bell className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">Notification Preferences</h3>
                <p className="text-text-tertiary text-sm">Choose how you want to be notified</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="bg-surface rounded-xl border border-border-subtle overflow-hidden">
                <div className="p-5 border-b border-border-subtle">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-text-primary">Email Notifications</h4>
                      <p className="text-sm text-text-tertiary mt-1">Receive email updates about important events</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-surface-hover peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
                
                <div className="p-5 border-b border-border-subtle bg-surface-elevated">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-amber-50 rounded-lg">
                        <Clock className="w-4 h-4 text-amber-600" />
                      </div>
                      <div>
                        <h5 className="font-medium text-text-primary">Deadline Reminders</h5>
                        <p className="text-xs text-text-tertiary mt-1">Get reminded about upcoming tax deadlines</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-surface-hover peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
                
                <div className="p-5 border-b border-border-subtle">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <Zap className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <h5 className="font-medium text-text-primary">AI Insights</h5>
                        <p className="text-xs text-text-tertiary mt-1">Receive notifications when AI detects important patterns</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-surface-hover peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
                
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-emerald-50 rounded-lg">
                        <User className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <h5 className="font-medium text-text-primary">Client Updates</h5>
                        <p className="text-xs text-text-tertiary mt-1">Get notified when clients upload documents</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-surface-hover peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="bg-surface rounded-xl border border-border-subtle p-5">
                <h4 className="font-semibold text-text-primary mb-3">Notification Channels</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Mail className="w-4 h-4 text-text-tertiary" />
                      <span className="text-text-primary">Email</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-surface-hover peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Smartphone className="w-4 h-4 text-text-tertiary" />
                      <span className="text-text-primary">Mobile Push</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-surface-hover peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
              </div>
              
              <Button icon={Save} className="bg-primary text-gray-900 hover:bg-primary-hover shadow-medium">
                Save Preferences
              </Button>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'security',
      title: 'Security',
      icon: Lock,
      description: 'Manage your account security',
      content: (
        <div className="space-y-8">
          <div className="bg-gradient-to-br from-surface-elevated to-surface p-6 rounded-2xl border border-border-subtle shadow-soft">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-emerald-100 rounded-xl">
                <Lock className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">Account Security</h3>
                <p className="text-text-tertiary text-sm">Manage your password and security settings</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-surface rounded-xl border border-border-subtle p-5">
                <h4 className="font-semibold text-text-primary mb-4">Change Password</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-text-primary">Current Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                      <Input 
                        type="password"
                        placeholder="Enter your current password"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-text-primary">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                      <Input 
                        type="password"
                        placeholder="Enter new password"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-text-primary">Confirm New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                      <Input 
                        type="password"
                        placeholder="Confirm new password"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <Button className="bg-primary text-gray-900 hover:bg-primary-hover shadow-medium">
                    Update Password
                  </Button>
                </div>
              </div>
              
              <div className="bg-surface rounded-xl border border-border-subtle p-5">
                <h4 className="font-semibold text-text-primary mb-4">Two-Factor Authentication</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-text-primary">Enhance your account security with 2FA</p>
                    <p className="text-sm text-text-tertiary mt-1">Protect your account with an additional layer of security</p>
                  </div>
                  <Button variant="secondary">Enable 2FA</Button>
                </div>
              </div>
              
              <div className="bg-surface rounded-xl border border-border-subtle p-5">
                <h4 className="font-semibold text-text-primary mb-4">Login Sessions</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-surface-elevated rounded-lg border border-border-subtle">
                    <div>
                      <p className="text-text-primary font-medium">Current Session</p>
                      <p className="text-xs text-text-tertiary mt-1">Chrome on Windows • IP: 192.168.1.1</p>
                    </div>
                    <div className="inline-flex items-center px-2 py-1 rounded-md bg-emerald-100 text-emerald-700 text-xs font-medium">
                      Active Now
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-surface-elevated rounded-lg border border-border-subtle">
                    <div>
                      <p className="text-text-primary font-medium">Mobile App</p>
                      <p className="text-xs text-text-tertiary mt-1">iPhone • Last active: 2 hours ago</p>
                    </div>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                      Revoke
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface to-surface-elevated">
      <TopBar title="Settings" />
      
      <div className="max-w-content mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Settings Navigation */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-gradient-to-br from-surface-elevated to-surface rounded-2xl border border-border-subtle p-6 shadow-soft sticky top-8">
              <h3 className="font-semibold text-text-primary mb-6">Settings</h3>
              <nav className="space-y-3">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                      activeSection === section.id
                        ? 'bg-gradient-to-r from-primary to-primary-hover text-gray-900 shadow-soft'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover border border-transparent hover:border-border-subtle'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${
                      activeSection === section.id
                        ? 'bg-white/20'
                        : 'bg-surface'
                    }`}>
                      <section.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium block">{section.title}</span>
                      {section.description && (
                        <span className="text-xs opacity-80 truncate block">{section.description}</span>
                      )}
                    </div>
                  </button>
                ))}
              </nav>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl border border-blue-200 p-6 shadow-soft hidden lg:block sticky top-[calc(8rem+1.5rem)] z-10">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-blue-200 rounded-lg">
                  <Zap className="w-4 h-4 text-blue-700" />
                </div>
                <h4 className="font-semibold text-blue-800">Need Help?</h4>
              </div>
              <p className="text-sm text-blue-700 mb-4">
                Our support team is available to help you with any questions about your account settings.
              </p>
              <Button variant="secondary" className="w-full border-blue-300 bg-blue-100/50 hover:bg-blue-200/50 text-blue-700">
                Contact Support
              </Button>
            </div>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-3">
            <div className="bg-gradient-to-br from-surface-elevated to-surface rounded-2xl border border-border-subtle shadow-soft overflow-hidden">
              <div className="p-6 border-b border-border-subtle bg-surface-elevated">
                <h2 className="text-xl font-bold text-text-primary">
                  {sections.find(s => s.id === activeSection)?.title}
                </h2>
                <p className="text-text-tertiary">
                  {sections.find(s => s.id === activeSection)?.description}
                </p>
              </div>
              <div className="p-6">
                <div className="animate-fade-in">
                  {sections.find(s => s.id === activeSection)?.content}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add default export for compatibility
export default Settings;