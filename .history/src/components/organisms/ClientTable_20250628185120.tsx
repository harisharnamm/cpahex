import React from 'react';
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
      <div className="bg-surface-elevated rounded-2xl border border-border-subtle p-12 shadow-soft">
        <div className="text-center">
          <div className="p-4 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">No clients found</h3>
          <p className="text-text-tertiary">Try adjusting your search or add your first client to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-elevated rounded-2xl border border-border-subtle overflow-hidden shadow-soft">
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
                   <div className="font-semibold text-text-primary group-hover:text-blue-600 transition-colors duration-200">
                    {client.name}
                   </div>
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
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}