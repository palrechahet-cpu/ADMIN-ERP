import React, { useState } from 'react';
import { 
  Search, 
  UserPlus, 
  Calendar, 
  Phone, 
  Mail, 
  X, 
  ChevronRight,
  MessageSquare,
  PhoneCall,
  Clock,
  Plus
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import { useAuthWorkspace } from '../context/AuthWorkspaceContext';
import { Client, getClientLabel, getProviderLabel } from '../types/clinic';
import { ClientCallModal } from './modals/ClientCallModal';
import { ClientMessageModal } from './modals/ClientMessageModal';

interface ClientsViewProps {
  onOpenNewClientModal: () => void;
  onOpenScheduleModal: (defaultTime?: string, defaultConsultantId?: string, defaultDate?: string, defaultClientId?: string) => void;
  onOpenClientDetailModal?: (client: Client) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  onOpenNewClientModal,
  onOpenScheduleModal,
  onOpenClientDetailModal,
}) => {
  const { clients, consultants, appointments } = useClinic();
  const { currentWorkspace } = useAuthWorkspace();

  const clientPlural = getClientLabel(currentWorkspace, true);
  const clientSingular = getClientLabel(currentWorkspace, false);
  const providerPlural = getProviderLabel(currentWorkspace, true);
  const providerSingular = getProviderLabel(currentWorkspace, false);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [consultantFilter, setConsultantFilter] = useState<string>('all');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Modals for calling and purpose-driven messaging
  const [callingClient, setCallingClient] = useState<Client | null>(null);
  const [messagingClient, setMessagingClient] = useState<Client | null>(null);

  const filteredClients = clients.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (consultantFilter !== 'all' && c.assignedConsultantId !== consultantFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return c.name.toLowerCase().includes(q) ||
             c.email.toLowerCase().includes(q) ||
             c.phone.includes(q) ||
             c.primaryConcern.toLowerCase().includes(q);
    }
    return true;
  });

  const clientAppointments = selectedClient
    ? appointments.filter(a => a.clientId === selectedClient.id)
    : [];

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              {clientPlural} ({clients.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage {clientSingular.toLowerCase()} directory, direct phone calling, purpose-driven texts, and schedule booking
            </p>
          </div>

          <button
            onClick={onOpenNewClientModal}
            className="btn-theme-primary px-3.5 py-1.5 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add {clientSingular.toLowerCase()}</span>
          </button>
        </div>

        {/* Filter Controls (Insurance removed!) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder={`Search ${clientSingular.toLowerCase()} by name, phone, or email...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 ring-theme"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 ring-theme cursor-pointer"
          >
            <option value="all">All statuses</option>
            <option value="Active">Active</option>
            <option value="Intake Pending">Intake pending</option>
            <option value="On Leave">On leave</option>
            <option value="Discharged">Discharged</option>
          </select>

          <select
            value={consultantFilter}
            onChange={(e) => setConsultantFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 ring-theme cursor-pointer"
          >
            <option value="all">All {providerPlural.toLowerCase()}</option>
            {consultants.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.credentials})
              </option>
            ))}
          </select>

        </div>

      </div>

      {/* Main Grid: Client List on Left, Profile Drawer on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Clients Directory List */}
        <div className={`${selectedClient ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden`}>
          
          <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span className="font-bold text-slate-800 dark:text-slate-200">
              Showing {filteredClients.length} of {clients.length} {clientPlural.toLowerCase()}
            </span>
            <span className="text-slate-400">Click a record to open profile drawer</span>
          </div>

          <div className="overflow-x-auto max-h-[700px] overflow-y-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="sticky top-0 bg-slate-50/95 dark:bg-slate-800/95 backdrop-blur-xs z-10">
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">{clientSingular}</th>
                  <th className="py-3 px-4">Contact & Quick Actions</th>
                  <th className="py-3 px-4">{providerSingular}</th>
                  <th className="py-3 px-4">Primary Focus</th>
                  <th className="py-3 px-4 text-right">Sessions</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredClients.map(c => {
                  const consultant = consultants.find(con => con.id === c.assignedConsultantId);
                  const isSelected = selectedClient?.id === c.id;

                  return (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedClient(c)}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${
                        isSelected ? 'bg-theme-subtle' : ''
                      }`}
                    >
                      {/* Name */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900 dark:text-white">{c.name}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">{c.phone}</div>
                      </td>

                      {/* Direct Call & Purpose Text Action Buttons (User Request) */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setCallingClient(c)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 font-semibold text-xs border border-emerald-200 dark:border-emerald-800/60 transition-colors cursor-pointer"
                            title={`Call ${c.name}`}
                          >
                            <Phone className="w-3 h-3" />
                            <span>Call</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setMessagingClient(c)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 font-semibold text-xs border border-indigo-200 dark:border-indigo-800/60 transition-colors cursor-pointer"
                            title={`Send purpose text to ${c.name}`}
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>Text</span>
                          </button>
                        </div>
                      </td>

                      {/* Consultant */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: consultant?.colorHex || 'var(--theme-primary)' }}
                          />
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {consultant?.name || 'Unassigned'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {consultant?.credentials}
                        </div>
                      </td>

                      {/* Concern */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200 line-clamp-1 max-w-[200px]">
                          {c.primaryConcern}
                        </div>
                      </td>

                      {/* Sessions */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono font-bold text-right text-slate-800 dark:text-slate-200">
                        {c.totalSessionsAttended}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            c.status === 'Active' ? 'bg-emerald-500' :
                            c.status === 'Intake Pending' ? 'bg-amber-500' :
                            c.status === 'On Leave' ? 'bg-sky-500' :
                            'bg-slate-400'
                          }`} />
                          {c.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 whitespace-nowrap text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => onOpenScheduleModal(undefined, c.assignedConsultantId, undefined, c.id)}
                          className="p-1.5 text-slate-500 hover:text-theme-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer inline-flex items-center"
                          title={`Book session for ${c.name}`}
                        >
                          <Calendar className="w-3.5 h-3.5" />
                        </button>
                        <ChevronRight className={`w-4 h-4 inline-block text-slate-400 ${isSelected ? 'text-theme-primary' : ''}`} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>

        {/* Selected Client Profile Drawer */}
        {selectedClient && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md p-6 space-y-6 animate-in slide-in-from-right-4 duration-200">
            
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {clientSingular} Record · {selectedClient.id}
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  {selectedClient.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">DOB: {selectedClient.dateOfBirth} (Intake: {selectedClient.intakeDate})</p>
              </div>
              <button
                onClick={() => setSelectedClient(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Action Buttons: Direct Phone Call, Purpose Text, Book Appointment */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCallingClient(selectedClient)}
                className="py-2.5 px-3 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Phone className="w-4 h-4" />
                <span>Call Client</span>
              </button>

              <button
                type="button"
                onClick={() => setMessagingClient(selectedClient)}
                className="py-2.5 px-3 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Send Text</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenScheduleModal(undefined, selectedClient.assignedConsultantId, undefined, selectedClient.id)}
                className="col-span-2 btn-theme-primary py-2.5 px-3 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>Book Appointment</span>
              </button>
            </div>

            {/* Contact Information */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{selectedClient.email}</span>
              </div>
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono">{selectedClient.phone}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setCallingClient(selectedClient)}
                  className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline cursor-pointer"
                >
                  Dial
                </button>
              </div>

              {selectedClient.emergencyContact && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 space-y-1">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Emergency contact:</span>
                  <div>{selectedClient.emergencyContact.name} ({selectedClient.emergencyContact.relationship})</div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-slate-500 dark:text-slate-400">{selectedClient.emergencyContact.phone}</span>
                    <a
                      href={`tel:${selectedClient.emergencyContact.phone.replace(/[^0-9]/g, '')}`}
                      className="text-[11px] text-slate-700 dark:text-slate-300 hover:underline"
                    >
                      Call
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Consultation Focus & Notes */}
            <div className="space-y-3 text-xs">
              <div>
                <div className="font-bold text-slate-800 dark:text-slate-200 mb-1">Primary Concern & Focus</div>
                <div className="p-3 bg-theme-subtle border border-theme-primary/30 rounded-xl text-slate-800 dark:text-slate-200 font-medium">
                  {selectedClient.primaryConcern}
                </div>
              </div>

              {selectedClient.notes && (
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 mb-1">Consultation notes</div>
                  <p className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-300 leading-relaxed">
                    {selectedClient.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Client Appointment History */}
            <div>
              <div className="font-bold text-slate-800 dark:text-slate-200 text-xs mb-2">
                Appointment history ({clientAppointments.length})
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {clientAppointments.length > 0 ? (
                  clientAppointments.map(a => (
                    <div key={a.id} className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 text-xs flex justify-between items-center">
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-200">{a.date} · {a.time}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">{a.sessionType}</div>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 capitalize">
                        <span className={`w-1.5 h-1.5 rounded-full ${a.status === 'completed' ? 'bg-emerald-500' : 'bg-sky-500'}`} />
                        {a.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-400 dark:text-slate-500 p-2 text-center">
                    No appointments recorded yet for this {clientSingular.toLowerCase()}.
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Direct Phone Call Modal */}
      <ClientCallModal
        client={callingClient}
        isOpen={Boolean(callingClient)}
        onClose={() => setCallingClient(null)}
        onOpenMessageModal={(cl) => {
          setCallingClient(null);
          setMessagingClient(cl);
        }}
      />

      {/* Purpose-Driven Text Messaging Modal */}
      <ClientMessageModal
        client={messagingClient}
        isOpen={Boolean(messagingClient)}
        onClose={() => setMessagingClient(null)}
        onOpenCallModal={(cl) => {
          setMessagingClient(null);
          setCallingClient(cl);
        }}
      />

    </div>
  );
};
