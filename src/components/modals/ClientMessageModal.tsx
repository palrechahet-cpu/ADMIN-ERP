import React, { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  Copy, 
  Check, 
  MessageSquare, 
  Phone, 
  Calendar, 
  Clock, 
  Sparkles, 
  ExternalLink,
  MapPin,
  Video
} from 'lucide-react';
import { Client, Appointment, ClientMessagePurpose, MESSAGE_PURPOSES, formatModality } from '../../types/clinic';
import { useAuthWorkspace } from '../../context/AuthWorkspaceContext';
import { useClinic } from '../../context/ClinicContext';

interface ClientMessageModalProps {
  client: Client | null;
  appointment?: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
  defaultPurpose?: ClientMessagePurpose;
  onOpenCallModal?: (client: Client) => void;
}

export const ClientMessageModal: React.FC<ClientMessageModalProps> = ({
  client,
  appointment,
  isOpen,
  onClose,
  defaultPurpose = 'confirmation',
  onOpenCallModal,
}) => {
  const { currentWorkspace } = useAuthWorkspace();
  const { consultants } = useClinic();

  const [selectedPurpose, setSelectedPurpose] = useState<ClientMessagePurpose>(defaultPurpose);
  const [messageBody, setMessageBody] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Determine practitioner and session details
  const matchedConsultant = appointment
    ? consultants.find(c => c.id === appointment.consultantId)
    : client
    ? consultants.find(c => c.id === client.assignedConsultantId)
    : undefined;

  const clinicianName = appointment?.consultantName || matchedConsultant?.name || 'Your Clinician';
  const practiceName = currentWorkspace?.name || 'MindWell Practice';
  const dateStr = appointment?.date || 'your scheduled date';
  const timeStr = appointment?.time || 'your scheduled time';
  const modality = appointment ? formatModality(appointment.modality) : 'In-person';

  // Generate purpose-based message text
  const generateMessage = (purpose: ClientMessagePurpose): string => {
    if (!client) return '';
    const firstName = client.name.split(' ')[0];

    switch (purpose) {
      case 'confirmation':
        return `Hello ${firstName}, your appointment with ${clinicianName} at ${practiceName} is confirmed for ${dateStr} at ${timeStr} (${modality}). Please let us know if you need to make any adjustments. We look forward to seeing you!`;
      
      case 'reminder':
        return `Friendly reminder from ${practiceName}: ${firstName}, you have an appointment with ${clinicianName} tomorrow on ${dateStr} at ${timeStr} (${modality}). Please reply YES to confirm your attendance.`;
      
      case 'reschedule':
        return `Hello ${firstName}, this is ${practiceName}. We are reaching out regarding your appointment with ${clinicianName} on ${dateStr} at ${timeStr}. Would you be open to considering an alternative time slot this week? Please reply with your availability, or give us a quick call.`;
      
      case 'running_late':
        return `Hi ${firstName}, ${clinicianName} is running approximately 5–10 minutes behind schedule today. Thank you so much for your patience, and we will begin your session as soon as possible!`;
      
      case 'follow_up':
        return `Hi ${firstName}, checking in after our session. We hope you are having a restful week. Please reach out if you have any questions or reflections before our next scheduled appointment. Take care!`;
      
      case 'intake_welcome':
        return `Welcome to ${practiceName}, ${firstName}! We are excited to support you on your care journey. Your initial consultation with ${clinicianName} is scheduled for ${dateStr} at ${timeStr} (${modality}). Please arrive a few minutes early. Feel free to reply with any questions!`;
      
      case 'general_inquiry':
        return `Hello ${firstName}, this is MindWell Practice Coordination. How can we support you today with your care schedule or appointment questions?`;

      case 'custom':
      default:
        return `Hello ${firstName}, this is ${clinicianName} from ${practiceName}.`;
    }
  };

  // Sync purpose change to message text
  useEffect(() => {
    if (isOpen && client) {
      setMessageBody(generateMessage(selectedPurpose));
      setCopied(false);
    }
  }, [selectedPurpose, isOpen, client?.id, appointment?.id]);

  if (!isOpen || !client) return null;

  const cleanPhone = client.phone.replace(/[^0-9]/g, '');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageBody);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      // fallback
    }
  };

  const handleSendWhatsApp = () => {
    const encoded = encodeURIComponent(messageBody);
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank', 'noopener,noreferrer');
  };

  const handleSendSMS = () => {
    const encoded = encodeURIComponent(messageBody);
    window.location.href = `sms:${cleanPhone}?body=${encoded}`;
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150 flex flex-col">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Send Text Message to Client
              </h3>
              <p className="text-xs text-slate-300">
                {client.name} · <span className="font-mono text-teal-300">{client.phone}</span>
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
        <div className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
          
          {/* Quick Info Strip */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <span className="font-semibold text-slate-900 dark:text-white">{client.name}</span>
              <span className="text-slate-400">·</span>
              <span>{clinicianName}</span>
            </div>
            
            {/* Quick Call Action button */}
            <div className="flex items-center gap-1.5">
              <a
                href={`tel:${cleanPhone}`}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 font-semibold border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
                title={`Call ${client.name}`}
              >
                <Phone className="w-3 h-3" />
                <span>Call Phone</span>
              </a>
            </div>
          </div>

          {/* Appointment Context (if available) */}
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

          {/* Select Purpose of Text */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Select Purpose of Text
              </label>
              <span className="text-[11px] text-slate-400">
                Picks smart message template
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {MESSAGE_PURPOSES.map((purpose) => {
                const isSelected = selectedPurpose === purpose.id;
                return (
                  <button
                    key={purpose.id}
                    type="button"
                    onClick={() => setSelectedPurpose(purpose.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-theme-primary bg-theme-subtle text-slate-900 dark:text-white font-bold shadow-2xs'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/40 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 w-full">
                      <span className="text-xs font-semibold leading-tight truncate">
                        {purpose.title}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-theme-primary shrink-0" />}
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal mt-1 line-clamp-1">
                      {purpose.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Editable Text Area */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Message Preview & Customization
              </label>
              <span className="text-[11px] text-slate-400">
                {messageBody.length} characters
              </span>
            </div>
            
            <textarea
              rows={5}
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              className="w-full text-xs p-3.5 border border-slate-300 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 leading-relaxed font-sans"
              placeholder="Type your message to the client..."
            />
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          
          <button
            type="button"
            onClick={handleCopy}
            className="px-3.5 py-2 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600 font-bold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy Text</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSendSMS}
              className="px-3.5 py-2 font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
              <span>Send SMS Text</span>
            </button>

            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="px-4 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send via WhatsApp</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
