import React from 'react';
import { Calendar, AlertCircle, Clock, User, Check, X, ShieldAlert, Sparkles } from 'lucide-react';
import { Appointment } from '../../types/clinic';

export interface CalendarConfirmationData {
  type: 'create' | 'update' | 'delete' | 'batch_sync';
  title: string;
  description: string;
  appointment?: Appointment;
  appointmentsList?: Appointment[];
  targetEventId?: string;
  onConfirm: () => Promise<void> | void;
}

interface GoogleCalendarConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: CalendarConfirmationData | null;
  isProcessing: boolean;
}

export const GoogleCalendarConfirmModal: React.FC<GoogleCalendarConfirmModalProps> = ({
  isOpen,
  onClose,
  data,
  isProcessing,
}) => {
  if (!isOpen || !data) return null;

  const isDestructive = data.type === 'delete';

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className={`px-6 py-4 flex items-center justify-between ${
          isDestructive ? 'bg-rose-700 text-white' : 'bg-slate-900 text-white'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight text-white">
                Google Calendar Permission Confirmation
              </h3>
              <p className="text-[11px] text-slate-300">
                Workspace Calendar Action Authorization
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          <div className="space-y-1">
            <h4 className="text-base font-bold text-slate-900">
              {data.title}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {data.description}
            </p>
          </div>

          {/* Details Card if single appointment */}
          {data.appointment && (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Session:</span>
                <span className="font-bold text-slate-900">{data.appointment.sessionType}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Client:</span>
                <span className="font-semibold text-slate-800">{data.appointment.clientName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Therapist:</span>
                <span className="font-semibold text-teal-800">{data.appointment.consultantName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Date & Time:</span>
                <span className="font-mono font-bold text-slate-900">
                  {data.appointment.date} at {data.appointment.time} ({data.appointment.durationMinutes}m)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Modality / Location:</span>
                <span className="text-slate-700">{data.appointment.modality} · {data.appointment.locationDetails}</span>
              </div>
            </div>
          )}

          {/* Batch list summary if multiple appointments */}
          {data.appointmentsList && data.appointmentsList.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-700">
                Sessions to be synchronized ({data.appointmentsList.length}):
              </div>
              <div className="max-h-44 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl bg-slate-50/50">
                {data.appointmentsList.map((appt) => (
                  <div key={appt.id} className="p-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{appt.clientName}</div>
                      <div className="text-[11px] text-slate-500">{appt.consultantName} · {appt.sessionType}</div>
                    </div>
                    <div className="text-right font-mono font-semibold text-slate-700 text-[11px]">
                      {appt.time}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Safety Notice */}
          <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-snug text-[11px]">
              This operation will communicate with the connected Google Calendar account. Client and therapist names and scheduled times will appear on your Google Calendar.
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={async () => {
              await data.onConfirm();
              onClose();
            }}
            disabled={isProcessing}
            className={`px-4 py-2 text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 text-white ${
              isDestructive 
                ? 'bg-rose-600 hover:bg-rose-700' 
                : 'bg-teal-700 hover:bg-teal-800'
            }`}
          >
            {isProcessing ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Authorizing...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>{isDestructive ? 'Confirm & Remove from Calendar' : 'Confirm & Sync to Google Calendar'}</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
