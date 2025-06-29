import { useState, useEffect } from 'react';
import { dashboardApi, aiInsightsApi, AIInsight } from '../lib/database';
import { useAuthContext } from '../contexts/AuthContext';

export function useDashboard() {
  const { user, loading: authLoading } = useAuthContext();
  const [stats, setStats] = useState({
    activeClients: 0,
    pendingW9s: 0,
    unresolvedNotices: 0,
    upcomingDeadlines: 0,
    totalClients: 0,
    totalVendors: 0,
    totalNotices: 0,
    totalTasks: 0
  });
  const [recentInsights, setRecentInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchAttempts, setFetchAttempts] = useState(0);

  const fetchDashboardData = async () => {
    // Prevent infinite loops
    if (fetchAttempts >= 3) {
      console.error('❌ Dashboard: Too many fetch attempts, stopping');
      setError('Failed to load dashboard data after multiple attempts');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setFetchAttempts(prev => prev + 1);
      
      console.log('🔄 Dashboard: Starting data fetch... (attempt', fetchAttempts + 1, ')');
      console.log('🔄 Dashboard: User authenticated:', user?.email);
      
      const [statsData, insightsData] = await Promise.all([
        dashboardApi.getStats(),
        aiInsightsApi.getRecent(3)
      ]);
      
      console.log('✅ Dashboard: Data fetched successfully', {
        stats: statsData,
        insights: insightsData?.length
      });
      
      setStats(statsData);
      setRecentInsights(insightsData);
      
      // Reset fetch attempts on successful data fetch
      setFetchAttempts(0);
      
      console.log('✅ Dashboard: State updated successfully');
    } catch (err) {
      console.error('❌ Dashboard: Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
      console.log('✅ Dashboard: Loading set to false');
    }
  };

  useEffect(() => {
    console.log('🔍 Dashboard useEffect triggered:', { 
      authLoading, 
      user: user?.email, 
      hasUser: !!user,
      fetchAttempts,
      hasStats: !!stats.totalClients || !!stats.activeClients 
    });
    
    // Only fetch data when authentication is complete and user exists
    // and we don't already have data (unless explicitly refreshing)
    if (!authLoading && user && (fetchAttempts === 0 || (!stats.totalClients && !stats.activeClients))) {
      console.log('🔄 Dashboard: Auth complete, starting data fetch');
      fetchDashboardData();
    } else if (!authLoading && !user) {
      console.log('❌ Dashboard: No authenticated user');
      setError('Please sign in to view dashboard data');
      setLoading(false);
    } else {
      console.log('⏳ Dashboard: Waiting for authentication or already have data...', { 
        authLoading, 
        hasUser: !!user,
        hasData: !!(stats.totalClients || stats.activeClients)
      });
    }
  }, [authLoading, user?.id]); // Only depend on auth state and user ID

  const refreshDashboard = () => {
    setFetchAttempts(0); // Reset attempts when manually refreshing
    fetchDashboardData();
  };

  // Reset attempts when user changes (e.g., logout/login)
  useEffect(() => {
    if (user?.id) {
      setFetchAttempts(0);
    }
  }, [user?.id]);

  return {
    stats,
    recentInsights,
    loading,
    error,
    refreshDashboard
  };
}