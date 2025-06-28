import React, { useState, ReactElement } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { TopBar } from '../components/organisms/TopBar';
import { Input } from '../components/atoms/Input';
import { Button } from '../components/atoms/Button';
import { Badge } from '../components/atoms/Badge';
import { ChevronDown, User, Mail, Key, Bell, Save } from 'lucide-react';

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
      content: (
        <div className="space-y-6">
          {updateMessage && (
            <div className={`p-4 rounded-xl ${
              updateMessage.includes('successfully') 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {updateMessage}
            </div>
          )}
          
          <form onSubmit={handleProfileUpdate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input 
                label="First Name" 
                value={profileData.first_name}
                onChange={(e) => setProfileData(prev => ({ ...prev, first_name: e.target.value }))}
              />
              <Input 
                label="Last Name" 
                value={profileData.last_name}
                onChange={(e) => setProfileData(prev => ({ ...prev, last_name: e.target.value }))}
              />
            </div>
            <Input 
              label="Phone Number" 
              type="tel" 
              value={profileData.phone}
              onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
            />
            <Input 
              label="Company" 
              value={profileData.company}
              onChange={(e) => setProfileData(prev => ({ ...prev, company: e.target.value }))}
            />
            <div className="pt-4">
              <Button 
                type="submit" 
                icon={Save} 
                size="sm"
                disabled={isUpdating}
              >
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>
      ),
    },
    {
      id: 'email',
      title: 'Email Templates',
      icon: Mail,
      content: (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-3">
              W-9 Request Template
            </label>
            <textarea
              className="w-full h-40 px-4 py-3 bg-surface-elevated border border-border-subtle rounded-xl text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all duration-200"
              defaultValue="Dear [Vendor Name],

We need you to complete a W-9 form for our tax records. Please complete and return the attached form at your earliest convenience.

Thank you,
[Your Name]"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-3">
              IRS Notice Follow-up Template
            </label>
            <textarea
              className="w-full h-32 px-4 py-3 bg-surface-elevated border border-border-subtle rounded-xl text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all duration-200"
              defaultValue="Dear [Client Name],

We have received an IRS notice regarding your account. Please review the attached summary and let us know if you have any questions.

Best regards,
[Your Name]"
            />
          </div>
          <Button icon={Save} size="sm">
            Save Templates
          </Button>
        </div>
      ),
    },
    {
      id: 'api',
      title: 'API Configuration',
      icon: Key,
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
            <p className="text-amber-800 text-sm">
              <strong>Security Note:</strong> API keys are encrypted and stored securely. Never share your keys with unauthorized users.
            </p>
          </div>
          <Input
            label="OpenAI API Key"
            type="password"
            placeholder="sk-..."
            defaultValue="sk-1234567890abcdef"
          />
          <Input
            label="Document OCR Service"
            type="password"
            placeholder="API key for OCR service"
          />
          <div className="flex items-center justify-between p-4 bg-surface rounded-xl border border-border-subtle">
            <div>
              <h4 className="font-semibold text-text-primary">API Status</h4>
              <p className="text-sm text-text-tertiary">All services connected</p>
            </div>
            <Badge variant="success" size="sm">Active</Badge>
          </div>
          <Button icon={Save} size="sm">
            Save API Keys
          </Button>
        </div>
      ),
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: Bell,
      content: (
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-surface rounded-xl border border-border-subtle">
              <div>
                <h4 className="font-semibold text-text-primary">Email Notifications</h4>
                <p className="text-sm text-text-tertiary">Receive email updates about important events</p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="w-5 h-5 text-primary bg-surface-elevated border-border-subtle rounded focus:ring-primary focus:ring-2"
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-surface rounded-xl border border-border-subtle">
              <div>
                <h4 className="font-semibold text-text-primary">Deadline Reminders</h4>
                <p className="text-sm text-text-tertiary">Get reminded about upcoming tax deadlines</p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="w-5 h-5 text-primary bg-surface-elevated border-border-subtle rounded focus:ring-primary focus:ring-2"
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-surface rounded-xl border border-border-subtle">
              <div>
                <h4 className="font-semibold text-text-primary">AI Insights</h4>
                <p className="text-sm text-text-tertiary">Receive notifications when AI detects important patterns</p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="w-5 h-5 text-primary bg-surface-elevated border-border-subtle rounded focus:ring-primary focus:ring-2"
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-surface rounded-xl border border-border-subtle">
              <div>
                <h4 className="font-semibold text-text-primary">Client Updates</h4>
                <p className="text-sm text-text-tertiary">Get notified when clients upload documents</p>
              </div>
              <input
                type="checkbox"
                className="w-5 h-5 text-primary bg-surface-elevated border-border-subtle rounded focus:ring-primary focus:ring-2"
              />
            </div>
          </div>
          <Button icon={Save} size="sm">
            Save Preferences
          </Button>
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
          <div className="lg:col-span-1">
            <div className="bg-surface-elevated rounded-2xl border border-border-subtle p-6 shadow-soft sticky top-8">
              <h3 className="font-semibold text-text-primary mb-4">Settings</h3>
              <nav className="space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-left transition-all duration-200 ${
                      activeSection === section.id
                        ? 'bg-gradient-to-r from-primary to-primary-hover text-gray-900'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                    }`}
                  >
                    <section.icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{section.title}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-3">
            <div className="bg-surface-elevated rounded-2xl border border-border-subtle shadow-soft overflow-hidden">
              <div className="p-8">
                {sections.find(s => s.id === activeSection)?.content}
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
