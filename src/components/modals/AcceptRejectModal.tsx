import React, { useState } from 'react';
import { X, CheckCircle, XCircle, ArrowRightLeft } from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';
import { Appointment, formatModality } from '../../types/clinic';

interface AcceptRejectModalProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'accept' | 'reject';
}

export const AcceptRejectModal: React.FC<AcceptRejectModalProps> = ({
  appointment,
  isOpen,
  onClose,
  defaultMode = 'accept',
}) => {
  const { 
    consultants, 
    clients, 
    acceptAppointmentRequest, 
    rejectAppointmentRequest 
  } = useClinic();

  const [mode, setMode] = useState<'accept' | 'reject'>(defaultMode);
  const [assignedLocation, setAssignedLocation] = useState('');
  const [coordinatorNote, setCoordinatorNote] = useState('');
  const [rejectionReasonPreset, setRejectionReasonPreset] = useState('Clinician caseload is at capacity');
  const [customReason, setCustomReason] = useState('');
  const [reassignToPeerId, setReassignToPeerId] = useState<string>('');

  if (!isOpen || !appointment) return null;

  const consultant = consultants.find(c => c.id === appointment.consultantId);
  const client = clients.find(c => c.id === appointment.clientId);

  const availablePeerConsultants = consultants.filter(c => c.id !== appointment.consultantId);

  const handleConfirmAction = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'accept') {
      const finalLocation = assignedLocation || appointment.locationDetails || (appointment.modality === 'Online' ? 'https://meet.mindwell.health/session' : 'In-person clinic');
      acceptAppointmentRequest(appointment.id, coordinatorNote, finalLocation);
    } else {
      const finalReason = customReason.trim() ? customReason : rejectionReasonPreset;
      rejectAppointmentRequest(appointment.id, finalReason, reassignToPeerId || undefined);
    }

    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="accept-reject-title"
    >
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
          <div>
            <h3 id="accept-reject-title" className="text-base font-bold text-white tracking-tight">Review request</h3>
            <p className="text-xs text-slate-300">Accept or decline incoming client appointment request</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Request Summary Card */}
        <div className="p-6 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-theme-primary">
                Intake request
              </span>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1">{appointment.clientName}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">{appointment.sessionType}</p>
            </div>
            <div className="text-right text-xs">
              <div className="font-bold text-slate-900 dark:text-white">{appointment.date}</div>
              <div className="text-slate-500 dark:text-slate-400">{appointment.time} ({appointment.durationMinutes}m)</div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
            <div>
              Clinician: <span className="font-semibold text-slate-800 dark:text-slate-100">{appointment.consultantName}</span>
            </div>
            <div>
              Modality: <span className="font-semibold text-slate-800 dark:text-slate-100">{formatModality(appointment.modality)}</span>
            </div>
            {client && (
              <>
                <div>Phone: <span className="font-semibold text-slate-800 dark:text-slate-100 font-mono">{client.phone}</span></div>
                <div>Concern: <span className="font-semibold text-slate-800 dark:text-slate-100">{client.primaryConcern}</span></div>
              </>
            )}
          </div>

          {appointment.coordinatorNotes && (
            <div className="mt-2 text-xs bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
              <span className="font-semibold text-slate-900 dark:text-white">Client note:</span> {appointment.coordinatorNotes}
            </div>
          )}
        </div>

        {/* Decision Toggle */}
        <div className="px-6 pt-4 pb-2">
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setMode('accept')}
              className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'accept'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              Accept request
            </button>
            <button
              type="button"
              onClick={() => setMode('reject')}
              className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'reject'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <XCircle className="w-4 h-4" />
              Decline request
            </button>
          </div>
        </div>

        {/* Conditional Form Body */}
        <form onSubmit={handleConfirmAction} className="p-6 pt-2 space-y-4">
          
          {mode === 'accept' ? (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Location or telehealth video link
                </label>
                <input
                  type="text"
                  placeholder={(appointment.modality === 'In-person' || appointment.modality === 'In-Person') ? 'In-person clinic' : 'https://meet.mindwell.health/...'}
                  value={assignedLocation}
                  onChange={(e) => setAssignedLocation(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Confirmation note
                </label>
                <textarea
                  rows={3}
                  placeholder="Optional confirmation note..."
                  value={coordinatorNote}
                  onChange={(e) => setCoordinatorNote(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl text-xs text-emerald-800 dark:text-emerald-300">
                Accepting confirms this appointment on {appointment.consultantName}'s calendar.
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for decline
                </label>
                <select
                  value={rejectionReasonPreset}
                  onChange={(e) => setRejectionReasonPreset(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="Clinician caseload is at capacity">Clinician caseload is at capacity</option>
                  <option value="Schedule conflict at requested time">Schedule conflict at requested time</option>
                  <option value="Clinical specialty mismatch — referral recommended">Specialty mismatch — referral recommended</option>
                  <option value="Requested modality unavailable">Requested modality unavailable</option>
                  <option value="Out of network and self-pay declined">Out of network and self-pay declined</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Additional details
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional context..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Peer Reassignment Helper */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-theme-primary" />
                  <span>Reassign to another clinician (optional)</span>
                </div>
                <select
                  value={reassignToPeerId}
                  onChange={(e) => setReassignToPeerId(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 ring-theme"
                >
                  <option value="">No reassignment</option>
                  {availablePeerConsultants.map(peer => (
                    <option key={peer.id} value={peer.id}>
                      {peer.name} ({peer.credentials} · {peer.activeCaseload}/{peer.maxCaseload})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Action Buttons */}
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
              className={`px-5 py-2 text-xs font-bold text-white rounded-lg shadow-xs transition-colors cursor-pointer ${
                mode === 'accept'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : reassignToPeerId
                  ? 'btn-theme-primary'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {mode === 'accept'
                ? 'Accept request'
                : reassignToPeerId
                ? 'Reassign clinician'
                : 'Decline request'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
