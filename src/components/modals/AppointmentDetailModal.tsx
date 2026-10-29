import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  Video, 
  DollarSign, 
  User, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  FileText, 
  Receipt, 
  Phone, 
  Mail,
  Edit3,
  Lock,
  ExternalLink,
  CalendarDays,
  CalendarCheck,
  Trash2,
  RefreshCw,
  MessageSquare
} from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';
import { useGoogleCalendar } from '../../context/GoogleCalendarContext';
import { Appointment, SessionStatus, PaymentStatus, Client, formatModality } from '../../types/clinic';
import { WhatsAppButton } from '../common/WhatsAppButton';
import { GoogleCalendarConfirmModal, CalendarConfirmationData } from './GoogleCalendarConfirmModal';
import { ClientCallModal } from './ClientCallModal';
import { ClientMessageModal } from './ClientMessageModal';

interface AppointmentDetailModalProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenPaymentModal?: (appointment: Appointment) => void;
  onOpenSuperbillModal?: (appointment: Appointment) => void;
  onOpenClientDetailModal?: (client: Client) => void;
}

export const AppointmentDetailModal: React.FC<AppointmentDetailModalProps> = ({
  appointment,
  isOpen,
  onClose,
  onOpenPaymentModal,
  onOpenSuperbillModal,
  onOpenClientDetailModal,
}) => {
  const { 
    consultants, 
    clients, 
    updateAppointmentStatus, 
    rescheduleAppointment 
  } = useClinic();

  const {
    isConnected,
    syncedRecords,
    syncAppointment,
    deleteSyncedAppointment,
  } = useGoogleCalendar();

  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [internalNotes, setInternalNotes] = useState('');

  // Confirmation modal state for Workspace policy compliance
  const [confirmData, setConfirmData] = useState<CalendarConfirmationData | null>(null);
  const [isConfirmProcessing, setIsConfirmProcessing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);

  if (!isOpen || !appointment) return null;

  const consultant = consultants.find(c => c.id === appointment.consultantId);
  const client = clients.find(c => c.id === appointment.clientId);

  const existingSync = appointment ? syncedRecords[appointment.id] : undefined;

  const handleSyncToGoogle = () => {
    if (!appointment) return;
    setConfirmData({
      type: existingSync ? 'update' : 'create',
      title: existingSync ? 'Update Google Calendar Event' : 'Add Session to Google Calendar',
      description: `Synchronize the therapy session for "${appointment.clientName}" with ${appointment.consultantName} scheduled on ${appointment.date} at ${appointment.time} to your Google Calendar.`,
      appointment,
      onConfirm: async () => {
        setIsConfirmProcessing(true);
        const res = await syncAppointment(appointment, client, consultant);
        setIsConfirmProcessing(false);
        if (res.success) {
          setFeedback('Session successfully synchronized with Google Calendar!');
          setTimeout(() => setFeedback(null), 4000);
        } else {
          setFeedback(res.error || 'Failed to sync to Google Calendar');
        }
      },
    });
  };

  const handleRemoveFromGoogle = () => {
    if (!appointment || !existingSync) return;
    setConfirmData({
      type: 'delete',
      title: 'Remove Session from Google Calendar',
      description: `Are you sure you want to delete this event from your Google Calendar? The MindWell clinical record will remain, but the calendar event will be deleted.`,
      appointment,
      onConfirm: async () => {
        setIsConfirmProcessing(true);
        const res = await deleteSyncedAppointment(appointment.id);
        setIsConfirmProcessing(false);
        if (res.success) {
          setFeedback('Event removed from Google Calendar.');
          setTimeout(() => setFeedback(null), 4000);
        } else {
          setFeedback(res.error || 'Failed to remove from Google Calendar');
        }
      },
    });
  };

  const handleStatusChange = (newStatus: SessionStatus) => {
    updateAppointmentStatus(appointment.id, newStatus, internalNotes);
  };

  const handleSaveReschedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDate && newTime) {
      rescheduleAppointment(appointment.id, newDate, newTime);
      setIsEditingSchedule(false);
    }
  };

  const getStatusBadge = (status: SessionStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Completed
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Confirmed
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Pending Approval
          </span>
        );
      case 'no-show':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-700">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            No-Show
          </span>
        );
      case 'rejected':
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Cancelled
          </span>
        );
    }
  };

  const getPaymentBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'Paid':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Paid (${appointment.fee})
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Pending (${appointment.fee})
          </span>
        );
      case 'Unpaid':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-700">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Unpaid (${appointment.fee})
          </span>
        );
      case 'Overdue':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            Overdue (${appointment.fee})
          </span>
        );
      default:
        return (
          <span className="text-xs font-medium text-slate-600 font-mono">
            ${appointment.fee}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header with Consultant Signature Bar */}
        <div 
          className="px-6 py-4 text-white flex items-center justify-between"
          style={{ backgroundColor: consultant?.colorHex || '#0f172a' }}
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-semibold opacity-90">
                Session Details
              </span>
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight mt-0.5">
              {appointment.sessionType}
            </h3>
          </div>
          
          <div className="flex items-center gap-2">
            {client && (
              <>
                <a
                  href={`tel:${client.phone.replace(/[^0-9+]/g, '')}`}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  title={`Call ${client.name} at ${client.phone}`}
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call client</span>
                </a>
                <button
                  type="button"
                  onClick={() => setIsMessageModalOpen(true)}
                  className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1 cursor-pointer shadow-2xs"
                  title="Send Purpose Text"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Text</span>
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-black/20 transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6">

          {/* Key Status & Modality Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Session Status:</div>
              {getStatusBadge(appointment.status)}
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Billing:</div>
              {getPaymentBadge(appointment.paymentStatus)}
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              {formatModality(appointment.modality) === 'In-person' ? (
                <>
                  <MapPin className="w-4 h-4 text-theme-primary" />
                  <span>In-person Consultation</span>
                </>
              ) : (
                <>
                  <Video className="w-4 h-4 text-theme-primary" />
                  <span>Online ({appointment.locationDetails ? (
                    <a 
                      href={appointment.locationDetails} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-theme-primary underline"
                    >
                      Join video room
                    </a>
                  ) : 'Telehealth session'})</span>
                </>
              )}
            </div>
          </div>

          {/* 2-Column: Client File & Assigned Consultant */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Client Card */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                Client Information
              </div>
              <div className="font-bold text-slate-900 dark:text-white text-sm">
                {appointment.clientName}
              </div>
              {client && (
                <div className="mt-2 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{client.email}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono font-medium text-slate-800 dark:text-slate-200">{client.phone}</span>
                    </div>
                    <a
                      href={`tel:${client.phone.replace(/[^0-9+]/g, '')}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold transition-colors cursor-pointer shadow-2xs"
                      title={`Call ${client.name} at ${client.phone}`}
                    >
                      <Phone className="w-3 h-3" />
                      <span>Call client</span>
                    </a>
                  </div>
                  
                  {/* Dedicated Message via WhatsApp Button in Client Card */}
                  <div className="pt-1">
                    <WhatsAppButton
                      phone={client.phone}
                      clientName={client.name}
                      consultantName={appointment.consultantName}
                      date={appointment.date}
                      time={appointment.time}
                      sessionType={appointment.sessionType}
                      template="reminder"
                      variant="button"
                      label="Message via WhatsApp"
                      showTemplatesMenu={true}
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 space-y-1">
                    <div>Primary Concern: <span className="font-medium text-slate-800 dark:text-slate-200">{client.primaryConcern}</span></div>
                    <div className="pt-1 flex items-center justify-between">
                      <span className="truncate">Emergency: <strong className="text-slate-700 dark:text-slate-300">{client.emergencyContact.name}</strong></span>
                      <WhatsAppButton
                        phone={client.emergencyContact.phone}
                        clientName={client.name}
                        template="emergency"
                        variant="icon"
                      />
                    </div>
                  </div>
                  {onOpenClientDetailModal && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenClientDetailModal(client);
                      }}
                      className="mt-3 w-full py-2 px-3 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 dark:hover:bg-teal-900/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
                      <span>View Client File & Notes</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Consultant Card */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                Assigned Consultant
              </div>
              <div className="flex items-center gap-2">
                <span 
                  className="w-3.5 h-3.5 rounded-full" 
                  style={{ backgroundColor: consultant?.colorHex || '#0d9488' }}
                />
                <div className="font-bold text-slate-900 text-sm">
                  {appointment.consultantName}
                </div>
              </div>
              {consultant && (
                <div className="mt-2 space-y-1.5 text-xs text-slate-600">
                  <div className="text-slate-700 font-medium">{consultant.title} ({consultant.credentials})</div>
                  <div className="text-slate-500">Standard Rate: ${consultant.hourlyRate} / 50-min hour</div>
                  <div className="text-slate-500">Direct Contact: {consultant.phone}</div>
                  <div className="pt-1.5 border-t border-slate-100">
                    <span className="text-[11px] text-slate-400">Specialties:</span>
                    <p className="text-slate-700 text-[11px] mt-0.5">{consultant.specialties.join(' · ')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Schedule & Time Slot Info */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Scheduled Time & Duration
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditingSchedule(!isEditingSchedule);
                  setNewDate(appointment.date);
                  setNewTime(appointment.time);
                }}
                className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" />
                {isEditingSchedule ? 'Cancel Reschedule' : 'Reschedule'}
              </button>
            </div>

            {!isEditingSchedule ? (
              <div className="flex flex-wrap items-center gap-6 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span className="font-bold text-slate-900">{appointment.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span className="font-bold text-slate-900">{appointment.time}</span>
                  <span className="text-slate-500">({appointment.durationMinutes} minutes)</span>
                </div>
                <div className="text-slate-500">
                  Fee: <span className="font-bold text-slate-900">${appointment.fee}</span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveReschedule} className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                  required
                />
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                  required
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
                >
                  Save New Time
                </button>
              </form>
            )}
          </div>

          {/* Google Calendar Integration Card */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-teal-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Google Calendar Integration
                </span>
              </div>
              {existingSync ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                  <CalendarCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Synced
                </span>
              ) : (
                <span className="text-[11px] text-slate-500 font-medium">
                  {isConnected ? 'Ready to sync' : 'Not connected'}
                </span>
              )}
            </div>

            {existingSync ? (
              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 text-xs">
                <div className="text-slate-600 text-xs">
                  <div>Synced to primary calendar. Event ID: <span className="font-mono text-[10px] text-slate-400">{existingSync.googleEventId.slice(0, 18)}...</span></div>
                  {existingSync.htmlLink && (
                    <a
                      href={existingSync.htmlLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-900 font-bold hover:underline mt-1"
                    >
                      <span>Open in Google Calendar Web</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSyncToGoogle}
                    className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Update Event</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveFromGoogle}
                    className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Remove event from Google Calendar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <p className="text-slate-500 text-xs">
                  {isConnected 
                    ? 'Sync this appointment to your Google Calendar so it appears on your schedule with therapist and client notes.' 
                    : 'Connect your Google account to sync this session directly to Google Calendar.'}
                </p>
                <button
                  type="button"
                  onClick={handleSyncToGoogle}
                  className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg transition-colors shadow-xs flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>Sync to Google Calendar</span>
                </button>
              </div>
            )}

            {feedback && (
              <div className="text-xs font-medium text-teal-800 bg-teal-50 border border-teal-200 p-2 rounded-lg">
                {feedback}
              </div>
            )}
          </div>

          {/* Notes & Coordination */}
          <div className="space-y-3">
            {appointment.clinicalNotes && (
              <div>
                <div className="text-xs font-bold text-slate-700 mb-1">Clinical Session Notes (Therapist):</div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
                  {appointment.clinicalNotes}
                </div>
              </div>
            )}

            {appointment.coordinatorNotes && (
              <div>
                <div className="text-xs font-bold text-slate-700 mb-1">Coordinator Handover & Intake Notes:</div>
                <div className="p-3 rounded-lg bg-teal-50/50 border border-teal-100 text-xs text-slate-700">
                  {appointment.coordinatorNotes}
                </div>
              </div>
            )}

            {appointment.rejectionReason && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
                <span className="font-bold">Cancellation / Decline Reason:</span> {appointment.rejectionReason}
              </div>
            )}
          </div>

          {/* Coordinator Action Controls */}
          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            
            {/* Quick Status Toggles */}
            <div className="flex flex-wrap items-center gap-1.5">
              {appointment.status !== 'completed' && (
                <button
                  onClick={() => handleStatusChange('completed')}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Mark Completed
                </button>
              )}

              {appointment.status !== 'confirmed' && appointment.status !== 'completed' && (
                <button
                  onClick={() => handleStatusChange('confirmed')}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Confirm Session
                </button>
              )}

              {appointment.status !== 'no-show' && appointment.status !== 'completed' && (
                <button
                  onClick={() => handleStatusChange('no-show')}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 transition-colors"
                >
                  Mark No-Show
                </button>
              )}

              {appointment.status !== 'cancelled' && appointment.status !== 'rejected' && (
                <button
                  onClick={() => handleStatusChange('cancelled')}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
                >
                  Cancel Session
                </button>
              )}
            </div>

            {/* Financial Document Shortcuts */}
            <div className="flex items-center gap-2">
              {onOpenPaymentModal && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenPaymentModal(appointment);
                  }}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  {appointment.paymentStatus === 'Paid' ? 'Payment Details' : 'Record Payment'}
                </button>
              )}
            </div>

          </div>

        </div>

        {/* Google Calendar Permission & Action Confirmation Modal */}
        <GoogleCalendarConfirmModal
          isOpen={!!confirmData}
          onClose={() => setConfirmData(null)}
          data={confirmData}
          isProcessing={isConfirmProcessing}
        />

        {/* Direct Client Phone Calling Modal */}
        <ClientCallModal
          client={client || null}
          appointment={appointment}
          isOpen={isCallModalOpen}
          onClose={() => setIsCallModalOpen(false)}
          onOpenMessageModal={() => {
            setIsCallModalOpen(false);
            setIsMessageModalOpen(true);
          }}
        />

        {/* Purpose-Driven Text Messaging Modal */}
        <ClientMessageModal
          client={client || null}
          appointment={appointment}
          isOpen={isMessageModalOpen}
          onClose={() => setIsMessageModalOpen(false)}
          onOpenCallModal={() => {
            setIsMessageModalOpen(false);
            setIsCallModalOpen(true);
          }}
        />
      </div>
    </div>
  );
};
