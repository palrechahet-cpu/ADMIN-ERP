import React, { useState } from 'react';
import { X, Calendar, Clock, MapPin, Video, AlertTriangle, CheckCircle2, CalendarDays } from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';
import { useGoogleCalendar } from '../../context/GoogleCalendarContext';
import { useAuthWorkspace } from '../../context/AuthWorkspaceContext';
import { Modality, SessionStatus, PaymentStatus, getProviderLabel, getClientLabel } from '../../types/clinic';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: string;
  defaultTime?: string;
  defaultConsultantId?: string;
  defaultClientId?: string;
}

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  isOpen,
  onClose,
  defaultDate,
  defaultTime,
  defaultConsultantId,
  defaultClientId,
}) => {
  const { clients, consultants, appointments, addAppointment } = useClinic();
  const { isConnected, syncAppointment } = useGoogleCalendar();
  const { currentWorkspace } = useAuthWorkspace();

  const providerSingular = getProviderLabel(currentWorkspace, false);
  const clientSingular = getClientLabel(currentWorkspace, false);

  const availableServices = currentWorkspace?.servicesOffered && currentWorkspace.servicesOffered.length > 0
    ? currentWorkspace.servicesOffered
    : [
        'Individual Psychotherapy',
        'Cognitive Behavioral Therapy (CBT)',
        'Intake & Clinical Assessment',
        'Couples & Family Counseling'
      ];

  const [clientId, setClientId] = useState(defaultClientId || (clients[0]?.id || ''));
  const [consultantId, setConsultantId] = useState(defaultConsultantId || (consultants[0]?.id || ''));
  const [date, setDate] = useState(defaultDate || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(defaultTime || '10:00');
  const [durationMinutes, setDurationMinutes] = useState(50);
  const [modality, setModality] = useState<Modality>('In-person');
  const [sessionType, setSessionType] = useState<string>(availableServices[0] || 'Individual Psychotherapy');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Pending');
  const [coordinatorNotes, setCoordinatorNotes] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [syncToGoogle, setSyncToGoogle] = useState(isConnected);

  if (!isOpen) return null;

  const selectedConsultant = consultants.find(c => c.id === consultantId) || consultants[0];
  const selectedClient = clients.find(c => c.id === clientId) || clients[0];

  const getCptCode = (type: string) => {
    switch (type) {
      case 'Intake & Clinical Assessment': return '90791';
      case 'Couples & Family Counseling': return '90847';
      case 'Psychiatric Medication Management':
      case 'Psychiatric Medication Review': return '99214';
      case 'Trauma & EMDR Session': return '90837';
      default: return '90834';
    }
  };

  const hasConflict = appointments.some(
    a => a.consultantId === consultantId && 
         a.date === date && 
         a.time === time && 
         a.status !== 'cancelled' && 
         a.status !== 'rejected'
  );

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.email.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.phone.includes(clientSearch)
  ).slice(0, 15);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !selectedConsultant) return;

    const locationDetails = modality === 'In-person' 
      ? 'In-person Consultation'
      : `Online Secure Video (${selectedConsultant.name.split(' ')[0]})`;

    const newAppointment = addAppointment({
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      consultantId: selectedConsultant.id,
      consultantName: selectedConsultant.name,
      date,
      time,
      durationMinutes,
      modality,
      locationDetails,
      sessionType,
      status: 'confirmed',
      fee: selectedConsultant.hourlyRate,
      paymentStatus,
      cptCode: getCptCode(sessionType),
      coordinatorNotes,
    });

    if (syncToGoogle && isConnected) {
      syncAppointment(newAppointment, selectedClient, selectedConsultant).catch((err) => {
        console.warn('Auto-sync to Google Calendar failed:', err);
      });
    }

    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="schedule-modal-title"
    >
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
          <div>
            <h3 id="schedule-modal-title" className="text-base font-bold text-white tracking-tight">Book Appointment</h3>
            <p className="text-xs text-slate-300">Schedule session with {clientSingular.toLowerCase()} and {providerSingular.toLowerCase()}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* Client Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select {clientSingular}
            </label>
            <div className="space-y-2">
              <input
                type="text"
                placeholder={`Search ${clientSingular.toLowerCase()}s by name, phone, or email...`}
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {filteredClients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone})
                  </option>
                ))}
              </select>
            </div>
            {selectedClient && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Primary focus: <span className="font-medium text-slate-700 dark:text-slate-300">{selectedClient.primaryConcern}</span>
              </p>
            )}
          </div>

          {/* Consultant Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select {providerSingular}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {consultants.map(c => {
                const isSelected = c.id === consultantId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setConsultantId(c.id)}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected 
                        ? 'border-slate-900 dark:border-teal-500 bg-slate-50 dark:bg-slate-800 shadow-xs' 
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <span 
                      className="w-3.5 h-3.5 rounded-full shrink-0 mt-0.5" 
                      style={{ backgroundColor: c.colorHex }}
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{c.name}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{c.credentials} · ${c.hourlyRate}/hr</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Time Picker */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Start time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Duration
              </label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value={45}>45 minutes</option>
                <option value={50}>50 minutes</option>
                <option value={60}>60 minutes</option>
                <option value={90}>90 minutes</option>
              </select>
            </div>
          </div>

          {/* Conflict Warning */}
          {hasConflict && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-2.5 text-amber-800 dark:text-amber-300 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Schedule conflict:</span> This {providerSingular.toLowerCase()} already has an appointment scheduled at that time.
              </div>
            </div>
          )}

          {/* Session Type & Modality (In-person / Online) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Clinical Service / Session Type
              </label>
              <select
                value={sessionType}
                onChange={(e) => setSessionType(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {availableServices.map((service) => (
                  <option key={service} value={service}>
                    {service}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Modality
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setModality('In-person')}
                  className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    modality === 'In-person'
                      ? 'border-theme-active bg-theme-subtle text-theme-primary font-bold shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  In-person
                </button>
                <button
                  type="button"
                  onClick={() => setModality('Online')}
                  className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    modality === 'Online'
                      ? 'border-theme-active bg-theme-subtle text-theme-primary font-bold shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  Online
                </button>
              </div>
            </div>
          </div>

          {/* Payment Status & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Payment Status
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="Pending">Pending (Collect at session)</option>
                <option value="Paid">Paid / Card on file</option>
                <option value="Unpaid">Unpaid / Invoice pending</option>
              </select>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Standard Session Fee: ${selectedConsultant?.hourlyRate || 180}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Clinical Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="Session notes or treatment plan focus..."
                value={coordinatorNotes}
                onChange={(e) => setCoordinatorNotes(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Google Calendar Sync Option */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Sync to Google Calendar
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isConnected 
                    ? 'Create event on Google Calendar automatically' 
                    : 'Connect Google Calendar in the header to enable automatic sync'}
                </div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={syncToGoogle && isConnected}
                disabled={!isConnected}
                onChange={(e) => setSyncToGoogle(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer disabled:opacity-40"
              />
            </label>
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer btn-theme-primary"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Book Appointment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
