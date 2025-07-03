import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSearch } from '../contexts/SearchContext';
import { TopBar } from '../components/organisms/TopBar';
import { supabase } from '../lib/supabase';
import { 
  MessageCircle, 
  Send, 
  Phone, 
  Video, 
  Mail, 
  Calendar,
  Search,
  Filter,
  MoreVertical,
  Clock,
  CheckCircle,
  AlertCircle,
  User
} from 'lucide-react';

interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: string;
  last_contact?: string;
}

interface Message {
  id: string;
  client_id: string;
  content: string;
  type: 'email' | 'sms' | 'call' | 'meeting';
  status: 'sent' | 'delivered' | 'read' | 'pending';
  created_at: string;
  client_name: string;
}

export function ClientCommunications() {
  const { user } = useAuth();
  const { searchQuery } = useSearch();
  const [clients, setClients] = useState<Client[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [messageType, setMessageType] = useState<'email' | 'sms'>('email');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'pending'>('all');

  useEffect(() => {
    if (user) {
      fetchClients();
      fetchMessages();
    }
  }, [user]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      // Since we don't have a messages table in the schema, we'll simulate some data
      // In a real implementation, you would fetch from a messages/communications table
      const mockMessages: Message[] = [
        {
          id: '1',
          client_id: 'client-1',
          content: 'Thank you for sending the tax documents. I have a question about the deduction for home office expenses.',
          type: 'email',
          status: 'read',
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          client_name: 'John Smith'
        },
        {
          id: '2',
          client_id: 'client-2',
          content: 'Can we schedule a meeting to discuss my quarterly tax payments?',
          type: 'email',
          status: 'pending',
          created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          client_name: 'Sarah Johnson'
        },
        {
          id: '3',
          client_id: 'client-1',
          content: 'Reminder: Your tax filing deadline is approaching.',
          type: 'sms',
          status: 'delivered',
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          client_name: 'John Smith'
        }
      ];
      
      setMessages(mockMessages);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!selectedClient || !newMessage.trim()) return;

    try {
      // In a real implementation, you would save to a messages table
      const newMsg: Message = {
        id: Date.now().toString(),
        client_id: selectedClient.id,
        content: newMessage,
        type: messageType,
        status: 'sent',
        created_at: new Date().toISOString(),
        client_name: selectedClient.name
      };

      setMessages(prev => [newMsg, ...prev]);
      setNewMessage('');
      
      // Here you would integrate with email/SMS services
      console.log(`Sending ${messageType} to ${selectedClient.name}: ${newMessage}`);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const filteredMessages = messages.filter(message => {
    const matchesSearch = searchQuery === '' || 
      message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.client_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filter === 'all' || 
      (filter === 'unread' && message.status === 'delivered') ||
      (filter === 'pending' && message.status === 'pending');
    
    return matchesSearch && matchesFilter;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'read':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="w-4 h-4 text-blue-500" />;
      case 'sms':
        return <MessageCircle className="w-4 h-4 text-green-500" />;
      case 'call':
        return <Phone className="w-4 h-4 text-purple-500" />;
      case 'meeting':
        return <Video className="w-4 h-4 text-orange-500" />;
      default:
        return <MessageCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopBar />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Client Communications</h1>
          <p className="mt-2 text-gray-600">Manage all client communications in one place</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Client List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Clients</h2>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {clients.map((client) => (
                  <div
                    key={client.id}
                    onClick={() => setSelectedClient(client)}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedClient?.id === client.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {client.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {client.email}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Messages and Compose */}
          <div className="lg:col-span-2 space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      filter === 'all' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilter('unread')}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      filter === 'unread' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Unread
                  </button>
                  <button
                    onClick={() => setFilter('pending')}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      filter === 'pending' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Pending
                  </button>
                </div>
              </div>
            </div>

            {/* Compose Message */}
            {selectedClient && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Send Message to {selectedClient.name}
                </h3>
                <div className="space-y-4">
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setMessageType('email')}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                        messageType === 'email'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Mail className="w-4 h-4" />
                      <span>Email</span>
                    </button>
                    <button
                      onClick={() => setMessageType('sms')}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                        messageType === 'sms'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>SMS</span>
                    </button>
                  </div>
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={`Type your ${messageType} message...`}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={4}
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="w-4 h-4" />
                      <span>Send {messageType === 'email' ? 'Email' : 'SMS'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Messages List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Recent Communications</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {filteredMessages.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No messages found</p>
                  </div>
                ) : (
                  filteredMessages.map((message) => (
                    <div key={message.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          {getTypeIcon(message.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium text-gray-900">
                              {message.client_name}
                            </p>
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(message.status)}
                              <span className="text-xs text-gray-500">
                                {new Date(message.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {message.content}
                          </p>
                          <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                            <span className="capitalize">{message.type}</span>
                            <span className="capitalize">{message.status}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}