import { MoreHorizontal, Mail, Phone, Users } from 'lucide-react';
import { ClientWithDocuments } from '../../hooks/useClients';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';

interface ClientTableProps {
  clients: ClientWithDocuments[];
  onClientClick: (client: ClientWithDocuments) => void;
}

export function ClientTable({ clients, onClientClick }: ClientTableProps) {
  if (clients.length === 0) {
    return (
      <div className="bg-surface-elevated rounded-2xl border border-border-subtle p-8 sm:p-12 shadow-soft">
        <div className="text-center">
          <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
            <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-text-primary mb-2">No clients found</h3>
          <p className="text-text-tertiary text-sm sm:text-base">Try adjusting your search or add your first client to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Card Layout */}
      <div className="block lg:hidden space-y-4">
        {clients.map((client) => (
          <div
            key={client.id}
            className="bg-surface-elevated rounded-xl border border-border-subtle p-4 shadow-soft hover:shadow-medium transition-all duration-200 cursor-pointer"
            onClick={() => onClientClick(client)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-text-primary text-base mb-1 truncate">{client.name}</h3>
                <div className="flex items-center text-sm text-text-secondary mb-1">
                  <Mail className="w-3 h-3 mr-1 text-text-tertiary flex-shrink-0" />
                  <span className="truncate">{client.email}</span>
                </div>
                {client.phone && (
                  <div className="flex items-center text-sm text-text-secondary">
                    <Phone className="w-3 h-3 mr-1 text-text-tertiary flex-shrink-0" />
                    <span>{client.phone}</span>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                icon={MoreHorizontal}
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle menu actions
                }}
                aria-label="Client actions"
                className="flex-shrink-0 ml-2"
              >
                Actions
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Badge variant="neutral" size="sm">
                  {client.tax_year}
                </Badge>
                <div className="flex items-center space-x-1">
                  <span className="text-sm font-semibold text-text-primary">{client.documentsCount}</span>
                  <span className="text-xs text-text-tertiary">files</span>
                </div>
              </div>
              <Badge 
                variant={client.documentsCount > 5 ? 'success' : client.documentsCount > 0 ? 'warning' : 'neutral'} 
                size="sm"
              >
                {client.documentsCount > 5 ? 'Complete' : client.documentsCount > 0 ? 'In Progress' : 'New'}
              </Badge>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden lg:block bg-surface-elevated rounded-2xl border border-border-subtle overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface border-b border-border-subtle">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                  Client Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                  Contact Information
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                  Tax Year
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                  Documents
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {clients.map((client) => (
                <tr
                  key={client.id}
                  className="hover:bg-surface-hover cursor-pointer transition-all duration-200 group"
                  onClick={() => onClientClick(client)}
                >
                  <td className="px-6 py-4">
                    <div className="font-semibold text-text-primary group-hover:text-primary transition-colors duration-200">
                      {client.name}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-text-secondary">
                        <Mail className="w-4 h-4 mr-2 text-text-tertiary" />
                        {client.email}
                      </div>
                      {client.phone && (
                        <div className="flex items-center text-sm text-text-secondary">
                          <Phone className="w-4 h-4 mr-2 text-text-tertiary" />
                          {client.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="neutral" size="sm">
                      {client.tax_year}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-semibold text-text-primary">{client.documentsCount}</span>
                      <span className="text-xs text-text-tertiary">files</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge 
                      variant={client.documentsCount > 5 ? 'success' : client.documentsCount > 0 ? 'warning' : 'neutral'} 
                      size="sm"
                    >
                      {client.documentsCount > 5 ? 'Complete' : client.documentsCount > 0 ? 'In Progress' : 'New'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={MoreHorizontal}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle menu actions
                      }}
                      aria-label="Client actions"
                    >
                      Actions
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}