import React, { useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar, 
  MapPin, 
  Video, 
  Search,
  CheckCheck,
  Phone,
  MessageSquare
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import { useAuthWorkspace } from '../context/AuthWorkspaceContext';
import { Appointment, formatModality, getProviderLabel, getClientLabel, Client } from '../types/clinic';
import { ClientCallModal } from './modals/ClientCallModal';
import { ClientMessageModal } from './modals/ClientMessageModal';

interface RequestsViewProps {
  onOpenAcceptRejectModal: (appointment: Appointment, mode: 'accept' | 'reject') => void;
  onSelectAppointment: (appointment: Appointment) => void;
}

export const RequestsView: React.FC<RequestsViewProps> = ({
  onOpenAcceptRejectModal,
  onSelectAppointment,
}) => {
  const { 
    appointments, 
    consultants, 
    clients, 
    acceptAppointmentRequest 
  } = useClinic();
  const { currentWorkspace } = useAuthWorkspace();

  const providerPlural = getProviderLabel(currentWorkspace, true);
  const providerSingular = getProviderLabel(currentWorkspace, false);
  const clientSingular = getClientLabel(currentWorkspace, false);

  const [activeTab, setActiveTab] = useState<'pending' | 'rejected' | 'all'>('pending');
  const [selectedConsultantFilter, setSelectedConsultantFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [callingClient, setCallingClient] = useState<Client | null>(null);
  const [messagingClient, setMessagingClient] = useState<{ client: Client; defaultPurpose?: any } | null>(null);

  const pendingRequests = appointments.filter(a => a.status === 'pending');
  const rejectedRequests = appointments.filter(a => a.status === 'rejected');

  const displayedRequests = appointments.filter(a => {
    if (activeTab === 'pending' && a.status !== 'pending') return false;
    if (activeTab === 'rejected' && a.status !== 'rejected') return false;
    if (activeTab === 'all' && a.status !== 'pending' && a.status !== 'rejected') return false;

    if (selectedConsultantFilter !== 'all' && a.consultantId !== selectedConsultantFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return a.clientName.toLowerCase().includes(q) || 
             a.consultantName.toLowerCase().includes(q) ||
             a.sessionType.toLowerCase().includes(q);
    }
    return true;
  });

  const handleQuickAcceptAll = () => {
    if (window.confirm(`Accept all ${pendingRequests.length} pending appointment requests?`)) {
      pendingRequests.forEach(req => {
        acceptAppointmentRequest(req.id);
      });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Requests
              </h2>
              {pendingRequests.length > 0 && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  {pendingRequests.length} pending
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Review pending intake requests, verify {providerSingular.toLowerCase()} caseload, and accept or decline
            </p>
          </div>

          {/* Quick Actions */}
          {pendingRequests.length > 0 && (
            <button
              onClick={handleQuickAcceptAll}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Accept all ({pendingRequests.length})</span>
            </button>
          )}
        </div>

        {/* Tab Selection & Filter */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                activeTab === 'pending'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Pending ({pendingRequests.length})
            </button>
            <button
              onClick={() => setActiveTab('rejected')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                activeTab === 'rejected'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Declined ({rejectedRequests.length})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All history
            </button>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedConsultantFilter}
              onChange={(e) => setSelectedConsultantFilter(e.target.value)}
              className="text-xs px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">All {providerPlural.toLowerCase()}</option>
              {consultants.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.activeCaseload}/{c.maxCaseload})
                </option>
              ))}
            </select>

            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2 text-slate-400" />
              <input
                type="text"
                placeholder="Search requests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

        </div>

      </div>

      {/* Requests Card List */}
      <div className="space-y-3">
        {displayedRequests.length > 0 ? (
          displayedRequests.map((request) => {
            const consultant = consultants.find(c => c.id === request.consultantId);
            const client = clients.find(c => c.id === request.clientId);
            const isPending = request.status === 'pending';
            const isRejected = request.status === 'rejected';

            const isConsultantFull = consultant ? consultant.activeCaseload >= consultant.maxCaseload : false;

            return (
              <div
                key={request.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  
                  {/* Client & Session Info */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-slate-900 dark:text-white">
                        {request.clientName}
                      </span>
                      {isPending && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Pending
                        </span>
                      )}
                      {isRejected && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 dark:text-rose-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          Declined
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                      {request.sessionType}
                    </div>

                    {client && (
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400 pt-1">
                        <span>DOB: <strong className="text-slate-700 dark:text-slate-300">{client.dateOfBirth}</strong></span>
                        <span className="flex items-center gap-1.5">
                          Phone: <strong className="text-slate-700 dark:text-slate-300 font-mono">{client.phone}</strong>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCallingClient(client);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer"
                          >
                            <Phone className="w-3 h-3" />
                            <span>Call</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMessagingClient({ client, defaultPurpose: 'intake_welcome' });
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[11px] font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors cursor-pointer"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>Text</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Requested Time & Consultant */}
                  <div className="flex md:flex-col md:items-end gap-3 text-xs">
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span className="font-bold text-slate-800 dark:text-slate-200">{request.date}</span>
                      <Clock className="w-3.5 h-3.5 text-slate-500 ml-1" />
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{request.time}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: consultant?.colorHex || '#0d9488' }}
                      />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        Requested: {request.consultantName}
                      </span>
                      {isConsultantFull && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          At capacity
                        </span>
                      )}
                    </div>
                  </div>

                </div>

                {/* Intake Reason / Notes */}
                {request.coordinatorNotes && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300">
                    <span className="font-bold text-slate-800 dark:text-slate-200">Intake note:</span> {request.coordinatorNotes}
                  </div>
                )}

                {/* Rejection / Decline Context */}
                {request.rejectionReason && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-300">
                    <span className="font-bold">Reason for decline:</span> {request.rejectionReason}
                  </div>
                )}

                {/* Footer Controls */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    {formatModality(request.modality) === 'In-person' ? (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-theme-primary" />
                        In-person
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Video className="w-3.5 h-3.5 text-theme-primary" />
                        Online
                      </span>
                    )}
                    <span>·</span>
                    <span className="font-mono">Rate: ${request.fee}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {isPending ? (
                      <>
                        <button
                          onClick={() => onOpenAcceptRejectModal(request, 'reject')}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-800 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Decline request</span>
                        </button>

                        <button
                          onClick={() => onOpenAcceptRejectModal(request, 'accept')}
                          className="px-4 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Accept request</span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => onSelectAppointment(request)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                      >
                        View appointment
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 border border-slate-200 dark:border-slate-800 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {activeTab === 'pending' ? 'All requests reviewed' : 'No requests found'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              There are no pending client appointment requests in the triage queue.
            </p>
          </div>
        )}
      </div>

      {/* Client Call Modal */}
      <ClientCallModal
        isOpen={Boolean(callingClient)}
        onClose={() => setCallingClient(null)}
        client={callingClient}
        onOpenMessageModal={(c) => {
          setCallingClient(null);
          setMessagingClient({ client: c, defaultPurpose: 'running_late' });
        }}
      />

      {/* Purpose-of-Text Message Modal */}
      <ClientMessageModal
        isOpen={Boolean(messagingClient)}
        onClose={() => setMessagingClient(null)}
        client={messagingClient?.client || null}
        defaultPurpose={messagingClient?.defaultPurpose}
      />

    </div>
  );
};
