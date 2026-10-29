import React, { useState } from 'react';
import { 
  X, 
  Phone, 
  PhoneCall, 
  PhoneForwarded, 
  MessageSquare, 
  User, 
  Clock, 
  CheckCircle2, 
  ShieldAlert,
  Calendar
} from 'lucide-react';
import { Client, Appointment, formatModality } from '../../types/clinic';
import { useAuthWorkspace } from '../../context/AuthWorkspaceContext';
import { useClinic } from '../../context/ClinicContext';

interface ClientCallModalProps {
  client: Client | null;
  appointment?: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenMessageModal?: (client: Client, appointment?: Appointment | null) => void;
}

export const ClientCallModal: React.FC<ClientCallModalProps> = ({
  client,
  appointment,
  isOpen,
  onClose,
  onOpenMessageModal,
}) => {
  const { currentWorkspace } = useAuthWorkspace();
  const { consultants } = useClinic();

  const [callOutcome, setCallOutcome] = useState<'connected' | 'voicemail' | 'no_answer' | 'busy' | 'scheduled' | ''>('');
  const [callNotes, setCallNotes] = useState('');
  const [isLogged, setIsLogged] = useState(false);

  if (!isOpen || !client) return null;

  const cleanPhone = client.phone.replace(/[^0-9]/g, '');
  const cleanEmergencyPhone = client.emergencyContact?.phone?.replace(/[^0-9]/g, '');

  const matchedConsultant = appointment
    ? consultants.find(c => c.id === appointment.consultantId)
    : consultants.find(c => c.id === client.assignedConsultantId);

  const handleRecordCallNote = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLogged(true);
    setTimeout(() => {
      setIsLogged(false);
      onClose();
    }, 1800);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150 flex flex-col">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Call Client
              </h3>
              <p className="text-xs text-slate-300">
                Direct telephonic contact & call logging
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          
          {/* Main Dial Card */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Primary Client Phone
              </span>
              <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                {client.phone}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {client.name} · Assigned to {matchedConsultant?.name || 'Practitioner'}
              </div>
            </div>

            <a
              href={`tel:${cleanPhone}`}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-transform active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <Phone className="w-4 h-4 animate-bounce" />
              <span>Dial Phone Now</span>
            </a>
          </div>

          {/* Appointment Context if applicable */}
          {appointment && (
            <div className="p-3 bg-teal-50/50 dark:bg-teal-950/30 rounded-xl border border-teal-100 dark:border-teal-900/40 flex items-center justify-between text-xs text-teal-900 dark:text-teal-200">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>{appointment.date} at {appointment.time}</span>
                <span className="text-slate-400">·</span>
                <span className="font-semibold">{appointment.sessionType}</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/50 text-[10px] font-bold">
                {formatModality(appointment.modality)}
              </span>
            </div>
          )}

          {/* Unanswered / Switch to Text shortcut */}
          <div className="p-3 bg-indigo-50/40 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <span className="font-bold text-indigo-950 dark:text-indigo-200">
                Client didn't answer?
              </span>
              <p className="text-[11px] text-indigo-800/80 dark:text-indigo-300">
                Send an immediate purpose-driven text or reminder via WhatsApp or SMS.
              </p>
            </div>
            {onOpenMessageModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenMessageModal(client, appointment);
                }}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Send Text</span>
              </button>
            )}
          </div>

          {/* Optional Emergency Contact */}
          {client.emergencyContact && client.emergencyContact.phone && (
            <div className="p-3 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Emergency Contact
                </span>
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  {client.emergencyContact.name} ({client.emergencyContact.relationship})
                </div>
                <div className="font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                  {client.emergencyContact.phone}
                </div>
              </div>
              <a
                href={`tel:${cleanEmergencyPhone}`}
                className="px-2.5 py-1 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 flex items-center gap-1 cursor-pointer"
              >
                <Phone className="w-3 h-3" />
                <span>Call Emergency</span>
              </a>
            </div>
          )}

          {/* Call Outcome Logging Form */}
          <form onSubmit={handleRecordCallNote} className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              Log Call Outcome
            </label>

            <div className="grid grid-cols-3 gap-2 text-xs">
              {[
                { id: 'connected', label: 'Spoke with Client' },
                { id: 'voicemail', label: 'Left Voicemail' },
                { id: 'no_answer', label: 'No Answer' },
                { id: 'busy', label: 'Line Busy' },
                { id: 'scheduled', label: 'Confirmed / Booked' },
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setCallOutcome(opt.id as any)}
                  className={`py-1.5 px-2 rounded-lg border text-center transition-colors cursor-pointer text-xs font-medium ${
                    callOutcome === opt.id
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold border-slate-900 dark:border-white shadow-2xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <textarea
              rows={2}
              value={callNotes}
              onChange={(e) => setCallNotes(e.target.value)}
              placeholder="Optional call notes (e.g. client requested Monday morning sessions)..."
              className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
            />

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                Close
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                {isLogged ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <span>Save Call Note</span>
                )}
              </button>
            </div>
          </form>

        </div>

      </div>
    </div>
  );
};
