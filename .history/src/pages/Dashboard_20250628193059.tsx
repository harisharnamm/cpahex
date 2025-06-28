import { useState, useEffect } from 'react';
import { useDashboard } from '../hooks/useDashboard';
import { TopBar } from '../components/organisms/TopBar';
import { StatCard } from '../components/atoms/StatCard';
import { Input } from '../components/atoms/Input';
import { Button } from '../components/atoms/Button';
import { Badge } from '../components/atoms/Badge';
import { Users, FileText, AlertTriangle, Calendar, Search, Plus, Clock, TrendingUp } from 'lucide-react';

export function Dashboard() {
  const [selectedYear, setSelectedYear] = useState('2024');
  const [animatingCards, setAnimatingCards] = useState<string[]>([]);
  const { stats, upcomingTasks, recentInsights, loading, error } = useDashboard();

  // Simulate real-time updates - must be called before any conditional returns
  useEffect(() => {
    const cardIds = ['clients', 'w9s', 'notices', 'deadlines'];
    const interval = setInterval(() => {
      const randomCard = cardIds[Math.floor(Math.random() * cardIds.length)];
      setAnimatingCards([randomCard]);
      setTimeout(() => setAnimatingCards([]), 2000);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const kpiData = [
    {
      id: 'clients',
      title: 'Active Clients',
      value: stats.activeClients,
      change: '+2 this month',
      icon: Users,
      trend: 'up' as const,
      tooltip: 'Engagements this fiscal year',
    },
    {
      id: 'w9s',
      title: 'Pending W-9s',
      value: stats.pendingW9s,
      change: '-3 from last week',
      icon: FileText,
      trend: 'down' as const,
      tooltip: 'Vendors still missing forms',
    },
    {
      id: 'notices',
      title: 'Unresolved IRS Notices',
      value: stats.unresolvedNotices,
      change: 'Needs attention',
      icon: AlertTriangle,
      trend: 'warning' as const,
      tooltip: 'Letters awaiting action',
    },
    {
      id: 'deadlines',
      title: 'Deadlines < 30 days',
      value: stats.upcomingDeadlines,
      change: '2 critical',
      icon: Calendar,
      trend: 'warning' as const,
      tooltip: 'Key filing / payment dates',
    },
  ];



  const timelineEvents = [
    {
      id: '1',
      event: 'AI detected potential deduction for Tech Solutions Inc',
      time: '2 hours ago',
      type: 'ai',
    },
    {
      id: '2',
      event: 'W-9 request sent to 3 vendors for Acme LLC',
      time: '4 hours ago',
      type: 'action',
    },
    {
      id: '3',
      event: 'Q4 tax documents uploaded for Manufacturing Co',
      time: '6 hours ago',
      type: 'document',
    },
    {
      id: '4',
      event: 'IRS Notice CP2000 resolved for Retail Partners',
      time: '1 day ago',
      type: 'update',
    },
    {
      id: '5',
      event: 'New client onboarding completed: StartupXYZ',
      time: '2 days ago',
      type: 'update',
    },
  ];

  if (loading) {
    return (
      <div>
        <TopBar title="Dashboard" />
        <div className="max-w-content mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8">
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <TopBar title="Dashboard" />
        <div className="max-w-content mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <p className="text-red-700">Error loading dashboard: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'ai':
        return '🤖';
      case 'action':
        return '📧';
      case 'update':
        return '✅';
      case 'document':
        return '📄';
      default:
        return '•';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="error" size="sm">High Priority</Badge>;
      case 'medium':
        return <Badge variant="warning" size="sm">Medium Priority</Badge>;
      default:
        return <Badge variant="neutral" size="sm">Low Priority</Badge>;
    }
  };

  const { openSidebar } = useSidebar();

  return (
    <div>
      <TopBar title="Dashboard" />
      <div className="bg-surface-elevated/80 backdrop-blur-sm border-b border-border-subtle sticky top-0 z-30">
        <div className="max-w-content mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <div>
                <h1 className="text-3xl font-bold text-text-primary tracking-tight">Dashboard</h1>
                <p className="text-text-tertiary font-medium mt-1">Welcome back, John</p>
              </div>
              <div className="flex items-center space-x-3 bg-surface-elevated rounded-xl border border-border-subtle px-4 py-2 shadow-soft">
                <Calendar className="w-4 h-4 text-text-secondary" />
                <select 
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="bg-transparent border-none text-sm font-medium text-text-primary focus:outline-none"
                >
                  <option value="2024">Fiscal Year 2024</option>
                  <option value="2023">Fiscal Year 2023</option>
                </select>
              </div>
            </div>
            <div className="w-96">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <Input
                  placeholder="Quick search clients, documents..."
                  className="pl-12 bg-surface-elevated shadow-soft border-border-subtle"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-content mx-auto px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {kpiData.map((stat, index) => (
            <div key={stat.id} className="animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
              <StatCard 
                title={stat.title}
                value={stat.value}
                change={stat.change}
                icon={stat.icon}
                trend={stat.trend}
                isAnimating={animatingCards.includes(stat.id)}
              />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="col-span-8 space-y-8">
            {/* Upcoming Tasks */}
            <div className="bg-surface-elevated rounded-2xl border border-border-subtle p-8 shadow-soft animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold text-text-primary">Upcoming Tasks</h2>
                </div>
                <Button variant="ghost" size="sm">View All</Button>
              </div>
              <div className="space-y-4">
                {upcomingTasks.map((task) => (
                  <div key={task.id} className="group p-4 bg-surface rounded-xl border border-border-subtle hover:shadow-medium hover:border-border-light transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-text-primary group-hover:text-primary transition-colors duration-200">{task.title}</h3>
                        <p className="text-sm text-text-tertiary mt-1">
                          {task.client_id ? 'Client task' : 'General task'} • 
                          {task.due_date ? ` Due ${new Date(task.due_date).toLocaleDateString()}` : ' No due date'}
                        </p>
                      </div>
                      {getPriorityBadge(task.priority)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity Timeline */}
            <div className="bg-surface-elevated rounded-2xl border border-border-subtle p-8 shadow-soft animate-fade-in">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-xl">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <h2 className="text-xl font-semibold text-text-primary">Recent Activity</h2>
              </div>
              <div className="space-y-4">
                {timelineEvents.map((event) => (
                  <div key={event.id} className="flex items-start space-x-4 p-3 rounded-xl hover:bg-surface transition-colors duration-200">
                    <div className="text-lg">{getEventIcon(event.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary">{event.event}</p>
                      <p className="text-xs text-text-tertiary mt-1">{event.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="col-span-4 space-y-6">
            {/* Quick Actions */}
            <div className="bg-surface-elevated rounded-2xl border border-border-subtle p-6 shadow-soft animate-fade-in">
              <h3 className="font-semibold text-text-primary mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button className="w-full justify-start" icon={Plus}>Add New Client</Button>
                <Button variant="secondary" className="w-full justify-start" icon={FileText}>Send W-9 Request</Button>
                <Button variant="secondary" className="w-full justify-start" icon={AlertTriangle}>Upload IRS Notice</Button>
              </div>
            </div>

            {/* AI Insights */}
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl border border-primary/20 p-6 shadow-soft animate-fade-in">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <h3 className="font-semibold text-text-primary">AI Insights</h3>
              </div>
              <div className="space-y-3">
                {recentInsights.length > 0 ? (
                  recentInsights.map((insight) => (
                    <div key={insight.id} className="p-3 bg-surface-elevated/80 rounded-xl border border-border-subtle">
                      <p className="text-sm text-text-primary font-medium">{insight.title}</p>
                      <p className="text-xs text-text-tertiary mt-1">{insight.description}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-3 bg-surface-elevated/80 rounded-xl border border-border-subtle">
                    <p className="text-sm text-text-secondary">No recent AI insights</p>
                    <p className="text-xs text-text-tertiary mt-1">Upload documents to generate insights</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}