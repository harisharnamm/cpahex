import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClients } from '../hooks/useClients';
import { TopBar } from '../components/organisms/TopBar';
import { ClientTable } from '../components/organisms/ClientTable';
import { ClientDialog } from '../components/ui/client-dialog';
import { Input } from '../components/atoms/Input';
import { Button } from '../components/atoms/Button';
import { Search, Filter, Users as UsersIcon, Plus } from 'lucide-react';
import { ClientWithDocuments } from '../hooks/useClients';

export function Clients() {
  const navigate = useNavigate();
  const { clients, loading, error, addClient } = useClients();
  const [searchQuery, setSearchQuery] = useState('');
  const [showClientDialog, setShowClientDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleClientClick = (client: ClientWithDocuments) => {
    navigate(`/clients/${client.id}`);
  };

  const handleCreateClient = async (clientData: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    taxYear: number;
    entityType: string;
    requiredDocuments: string[];
  }) => {
    setIsCreating(true);
    try {
      await addClient({
        name: clientData.name,
        email: clientData.email,
        phone: clientData.phone,
        taxYear: clientData.taxYear
      });
    } catch (error) {
      console.error('Failed to create client:', error);
      throw error; // Re-throw to let the dialog handle the error
    } finally {
      setIsCreating(false);
    }
  };
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface to-surface-elevated">
      <TopBar title="Clients" />
      
      <div className="max-w-content mx-auto px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Client Management</h1>
            <p className="text-text-secondary mt-1">Manage your client database and tax information</p>
          </div>
          <Button 
            icon={Plus}
            onClick={() => setShowClientDialog(true)}
            className="bg-primary text-gray-900 hover:bg-primary-hover shadow-medium"
          >
            Add New Client
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-700">Error: {error}</p>
          </div>
        )}

        <div className="bg-surface-elevated rounded-2xl border border-border-subtle p-6 mb-8 shadow-soft">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <Input
                placeholder="Search clients by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12"
              />
            </div>
            <Button variant="secondary" icon={Filter} className="shrink-0">
              Filter
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-surface-elevated rounded-xl border border-border-subtle p-6 shadow-soft">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-xl">
                <UsersIcon className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-tertiary">Total Clients</p>
                <p className="text-2xl font-semibold text-text-primary">{loading ? '...' : clients.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-surface-elevated rounded-xl border border-border-subtle p-6 shadow-soft">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl">
                <UsersIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-tertiary">Active This Year</p>
                <p className="text-2xl font-semibold text-text-primary">
                  {loading ? '...' : clients.filter(c => c.tax_year === 2025).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-surface-elevated rounded-xl border border-border-subtle p-6 shadow-soft">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-amber-100 to-amber-50 rounded-xl">
                <UsersIcon className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-tertiary">Avg Documents</p>
                <p className="text-2xl font-semibold text-text-primary">
                  {loading ? '...' : Math.round(clients.reduce((acc, c) => acc + c.documentsCount, 0) / clients.length) || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-surface-elevated rounded-2xl border border-border-subtle p-12 shadow-soft">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-text-secondary">Loading clients...</p>
            </div>
          </div>
        ) : (
          <ClientTable clients={filteredClients} onClientClick={handleClientClick} />
        )}

        {/* Client Creation Dialog */}
        <ClientDialog
          isOpen={showClientDialog}
          onClose={() => setShowClientDialog(false)}
          onSubmit={handleCreateClient}
          loading={isCreating}
        />
      </div>
    </div>
  );
}
