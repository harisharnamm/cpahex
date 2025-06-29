import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboard } from '../hooks/useDashboard';
import { useTasks } from '../hooks/useTasks';
import { TopBar } from '../components/organisms/TopBar';
import { StatCard } from '../components/atoms/StatCard';
import { Input } from '../components/atoms/Input';
import { Button } from '../components/atoms/Button';
import { Badge } from '../components/atoms/Badge';
import { Users, FileText, AlertTriangle, Calendar, Search, Plus, Clock, TrendingUp, CheckCircle, RotateCcw } from 'lucide-react';

export function Dashboard() {
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState('2024');
  const [animatingCards, setAnimatingCards] = useState<string[]>([]);
  const { stats, recentInsights, loading, error, refreshDashboard } = useDashboard();
  const { tasks, updateTaskStatus, getUpcomingTasks, refreshTasks } = useTasks();

  // Get upcoming tasks from the tasks hook instead of dashboard
  const upcomingTasks = getUpcomingTasks(5);

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

  // Quick action handlers
  const handleAddNewClient = () => {
    navigate('/clients');
    // Small delay to allow navigation, then trigger the add client dialog
    setTimeout(() => {
      // Dispatch a custom event that the Clients page can listen for
      window.dispatchEvent(new CustomEvent('dashboard:add-client'));
    }, 100);
  };

  const handleSendW9Request = () => {
    navigate('/1099-hub');
  };

  const handleUploadIRSNotice = () => {
    navigate('/irs-notices?action=upload');
  };

  const handleMarkTaskComplete = async (taskId: string) => {
    console.log('🔄 Marking task as complete:', taskId);
    const result = await updateTaskStatus(taskId, 'completed');
    if (result.success) {
      console.log('✅ Task marked as complete successfully');
      // Refresh dashboard to update stats
      refreshDashboard();
      // Also refresh tasks to ensure we have the latest data
      refreshTasks();
    } else {
      console.error('Failed to mark task as complete:', result.error);
    }
  };

  const handleMarkTaskPending = async (taskId: string) => {
    console.log('🔄 Marking task as pending:', taskId);
    const result = await updateTaskStatus(taskId, 'pending');
    if (result.success) {
      console.log('✅ Task marked as pending successfully');
      // Refresh dashboard to update stats
      refreshDashboard();
      // Also refresh tasks to ensure we have the latest data
      refreshTasks();
    } else {
      console.error('Failed to mark task as pending:', result.error);
    }
  };

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

  // Create custom action for the TopBar to show the search and year selection UI
  const customAction = {
    label: "", // Empty label as we'll use custom rendering
    onClick: () => {}, // Empty handler as we'll use the component directly
    customRender: () => (
      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mt-2 sm:mt-0">
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
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <Input
            placeholder="Quick search..."
            className="pl-12 bg-surface-elevated shadow-soft border-border-subtle"
          />
        </div>
      </div>
    )
  };

  return (
    <div>
      <TopBar 
        title="Dashboard" 
        customAction={customAction} 
      />
      
      <div className="max-w-content mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8">
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
                  <h2 className="text-xl font-semibold text-text-primary">Recent Tasks</h2>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    console.log('🔄 Refreshing tasks manually');
                    refreshTasks();
                  }}
                >
                  Refresh
                </Button>
              </div>
              <div className="space-y-4">
                {upcomingTasks.length > 0 ? upcomingTasks.map((task) => (
                  <div key={task.id} className={`group p-4 bg-surface rounded-xl border border-border-subtle hover:shadow-medium hover:border-border-light transition-all duration-200 ${
                    task.status === 'completed' ? 'opacity-60' : ''
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className={`font-semibold group-hover:text-text-hover transition-colors duration-200 ${
                            task.status === 'completed' ? 'line-through text-text-tertiary' : 'text-text-primary'
                          }`}>
                            {task.title}
                          </h3>
                          {task.status === 'completed' && (
                            <Badge variant="success" size="sm">Completed</Badge>
                          )}
                          {/* Show "NEW" badge for tasks created in the last 24 hours */}
                          {new Date().getTime() - new Date(task.created_at).getTime() < 24 * 60 * 60 * 1000 && (
                            <Badge variant="warning" size="sm">NEW</Badge>
                          )}
                        </div>
                        <p className="text-sm text-text-tertiary mt-1">
                          {task.client_id ? 'Client task' : 'General task'} • 
                          {task.due_date ? ` Due ${new Date(task.due_date).toLocaleDateString()}` : ' No due date'} •
                          {' Created ' + new Date(task.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getPriorityBadge(task.priority)}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-1">
                          {task.status === 'completed' ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              icon={RotateCcw}
                              onClick={() => handleMarkTaskPending(task.id)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              title="Mark as pending"
                            />
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              icon={CheckCircle}
                              onClick={() => handleMarkTaskComplete(task.id)}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              title="Mark as complete"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-text-primary mb-2">No upcoming tasks</h3>
                    <p className="text-text-tertiary">Create tasks from IRS notices or add them manually</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity Timeline */}
            <div className="bg-surface-elevated rounded-2xl border border-border-subtle p-8 shadow-soft animate-fade-in">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-xl">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <h2 className="text-xl font-semibold text-text-primary">Recent Activity</h2>
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
                <Button 
                  className="w-full justify-start bg-primary text-gray-900 hover:bg-primary-hover shadow-medium" 
                  icon={Plus}
                  onClick={handleAddNewClient}
                >
                  Add New Client
                </Button>
                <Button 
                  variant="secondary" 
                  className="w-full justify-start hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200" 
                  icon={FileText}
                  onClick={handleSendW9Request}
                >
                  Send W-9 Request
                </Button>
                <Button 
                  variant="secondary" 
                  className="w-full justify-start hover:bg-red-50 hover:text-red-600 hover:border-red-200" 
                  icon={AlertTriangle}
                  onClick={handleUploadIRSNotice}
                >
                  Upload IRS Notice
                </Button>
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