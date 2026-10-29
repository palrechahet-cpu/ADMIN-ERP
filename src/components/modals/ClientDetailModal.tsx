import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Lock, 
  Save, 
  ShieldCheck, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Clock, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  HeartPulse,
  MessageSquare,
  Copy,
  Check,
  RotateCcw,
  ExternalLink
} from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';
import { useAuthWorkspace } from '../../context/AuthWorkspaceContext';
import { Client, formatModality } from '../../types/clinic';
import { WhatsAppButton, WhatsAppIcon } from '../common/WhatsAppButton';
import { cleanPhoneForWhatsApp } from '../../utils/whatsapp';

export const CLIENT_MESSAGE_PURPOSES = [
  {
    id: 'Appointment confirmation',
    label: 'Appointment confirmation',
    description: 'Confirm upcoming session date, time, clinician, and modality',
  },
  {
    id: 'Rescheduling',
    label: 'Rescheduling',
    description: 'Coordinate an alternative appointment time or date with the client',
  },
  {
    id: 'Intake follow-up',
    label: 'Intake follow-up',
    description: 'Check in on onboarding forms, questionnaire, and care preferences',
  },
  {
    id: 'General inquiry',
    label: 'General inquiry',
    description: 'Standard practice check-in and open clinical support channel',
  },
  {
    id: 'Session reminder',
    label: 'Session reminder',
    description: 'Friendly 24-hour reminder for upcoming scheduled session',
  },
] as const;

export type ClientMessagePurposeChoice = typeof CLIENT_MESSAGE_PURPOSES[number]['id'];

interface ClientDetailModalProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenScheduleModal?: (defaultTime?: string, defaultConsultantId?: string, defaultDate?: string, defaultClientId?: string) => void;
}

export const ClientDetailModal: React.FC<ClientDetailModalProps> = ({
  client,
  isOpen,
  onClose,
  onOpenScheduleModal,
}) => {
  const { consultants, appointments, updateClient } = useClinic();
  const { currentWorkspace } = useAuthWorkspace();

  const [privateNotes, setPrivateNotes] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  // Purpose-driven WhatsApp messaging state
  const [selectedPurpose, setSelectedPurpose] = useState<ClientMessagePurposeChoice>('Appointment confirmation');
  const [whatsappMessage, setWhatsappMessage] = useState<string>('');
  const [copiedMessage, setCopiedMessage] = useState<boolean>(false);

  // Load private notes from localStorage when client changes
  useEffect(() => {
    if (client) {
      const storageKey = `mindwell_client_private_notes_${client.id}`;
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored !== null) {
          setPrivateNotes(stored);
        } else {
          setPrivateNotes(client.notes || '');
        }
      } catch (e) {
        setPrivateNotes(client.notes || '');
      }
      setSaveStatus('idle');
      setLastSavedTime(null);
    }
  }, [client]);

  const consultant = consultants.find(c => c.id === client?.assignedConsultantId);
  const clientAppointments = useMemo(() => {
    if (!client) return [];
    return appointments.filter(a => a.clientId === client.id);
  }, [appointments, client?.id]);

  // Find next upcoming appointment if one exists
  const upcomingAppointment = useMemo(() => {
    if (!clientAppointments.length) return null;
    return clientAppointments
      .filter(a => a.status !== 'cancelled' && a.status !== 'completed')
      .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime())[0] || clientAppointments[0];
  }, [clientAppointments]);

  // Generate purpose-based template message
  const generateTemplateMessage = (purpose: ClientMessagePurposeChoice): string => {
    if (!client) return '';
    const firstName = client.name.split(' ')[0];
    const clinicianName = consultant?.name || 'your clinician';
    const practiceName = currentWorkspace?.name || 'MindWell Practice';
    const apptDate = upcomingAppointment?.date || 'your scheduled date';
    const apptTime = upcomingAppointment?.time || 'your scheduled time';
    const apptModality = upcomingAppointment ? ` (${formatModality(upcomingAppointment.modality)})` : '';

    switch (purpose) {
      case 'Appointment confirmation':
        return `Hello ${firstName}, your appointment with ${clinicianName} at ${practiceName} is confirmed for ${apptDate} at ${apptTime}${apptModality}. Please let us know if you need to make any adjustments. We look forward to seeing you!`;
      
      case 'Rescheduling':
        return `Hello ${firstName}, this is ${practiceName} regarding your upcoming appointment with ${clinicianName}. We would like to coordinate rescheduling your session. Please reply with alternative days and times that work best for you, or give us a quick call.`;
      
      case 'Intake follow-up':
        return `Hello ${firstName}, this is ${practiceName} following up on your initial intake paperwork and care preferences for your care with ${clinicianName}. Please let us know if you need any assistance completing the forms or have questions before your first visit!`;
      
      case 'General inquiry':
        return `Hello ${firstName}, this is MindWell Practice Coordination. How can we support you today with your care schedule or appointment questions?`;
      
      case 'Session reminder':
        return `Friendly reminder from ${practiceName}: Hello ${firstName}, you have an appointment scheduled with ${clinicianName} on ${apptDate} at ${apptTime}${apptModality}. Please reply to confirm your attendance.`;
      
      default:
        return `Hello ${firstName}, this is ${clinicianName} from ${practiceName}.`;
    }
  };

  // Automatically update the template message when purpose or client changes
  useEffect(() => {
    if (client) {
      setWhatsappMessage(generateTemplateMessage(selectedPurpose));
      setCopiedMessage(false);
    }
  }, [selectedPurpose, client?.id, upcomingAppointment?.id]);

  if (!isOpen || !client) return null;

  const cleanTelPhone = client.phone.replace(/[^0-9+]/g, '');

  const handlePurposeChange = (newPurpose: ClientMessagePurposeChoice) => {
    setSelectedPurpose(newPurpose);
    setWhatsappMessage(generateTemplateMessage(newPurpose));
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(whatsappMessage);
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2500);
    } catch (e) {
      // fallback
    }
  };

  const handleSaveNotes = () => {
    setSaveStatus('saving');
    const storageKey = `mindwell_client_private_notes_${client.id}`;
    
    try {
      localStorage.setItem(storageKey, privateNotes);
      updateClient(client.id, { notes: privateNotes });
      
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSavedTime(now);
      setSaveStatus('saved');
      
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    } catch (err) {
      console.error('Error saving to localStorage:', err);
      setSaveStatus('idle');
    }
  };

  const handleInsertTimestampEntry = () => {
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const doctorName = consultant ? consultant.name : 'Consultant';
    const entryHeader = `\n\n--- Progress Note (${today} · ${doctorName}) ---\n• Presentation & Mood:\n• Interventions & Clinical Feedback:\n• Plan & Homework:\n`;
    setPrivateNotes(prev => (prev ? prev + entryHeader : entryHeader.trimStart()));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        
        {/* Modal Top Header */}
        <div className="px-6 py-4 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-theme-subtle border border-theme-primary/40 flex items-center justify-center text-theme-primary font-bold">
              {client.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">{client.name}</h3>
                <span className="text-[11px] font-mono text-slate-400">
                  {client.id}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    client.status === 'Active' ? 'bg-emerald-400' :
                    client.status === 'Intake Pending' ? 'bg-amber-400' :
                    'bg-slate-400'
                  }`} />
                  {client.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Client Profile & Health Record
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2.5">
            {/* Call client action button using tel: protocol */}
            <a
              href={`tel:${cleanTelPhone}`}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              title={`Call ${client.name} at ${client.phone}`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call client</span>
            </a>

            {/* Prominent WhatsApp Action in Top Header */}
            <WhatsAppButton
              phone={client.phone}
              clientName={client.name}
              consultantName={consultant?.name}
              variant="button"
              label="WhatsApp"
              customMessage={whatsappMessage}
              showTemplatesMenu={true}
            />

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">

          {/* Quick Demographics & Clinician Assignment Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Assigned Clinician</div>
              <div className="flex items-center gap-2 mt-1">
                <span 
                  className="w-3 h-3 rounded-full shrink-0" 
                  style={{ backgroundColor: consultant?.colorHex || '#0d9488' }}
                />
                <span className="font-bold text-slate-900 dark:text-white">{consultant?.name || 'Unassigned'}</span>
              </div>
              <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">{consultant?.title} ({consultant?.credentials})</div>
            </div>

            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Contact & Telephony</div>
              <div className="flex items-center justify-between gap-2 mt-1">
                <span className="font-mono font-medium text-slate-800 dark:text-slate-200">{client.phone}</span>
                <a
                  href={`tel:${cleanTelPhone}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold transition-colors cursor-pointer shadow-2xs"
                  title={`Call ${client.name} at ${client.phone}`}
                >
                  <Phone className="w-3 h-3" />
                  <span>Call client</span>
                </a>
              </div>
              <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5 truncate">{client.email}</div>
            </div>

            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Care Summary</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {client.totalSessionsAttended} sessions attended
                </span>
              </div>
              <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">DOB: {client.dateOfBirth} · Intake: {client.intakeDate}</div>
            </div>
          </div>

          {/* WhatsApp Integration & Message Purpose Selection Flow */}
          <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl space-y-3 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <WhatsAppIcon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>WhatsApp Messaging Flow</span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 rounded">
                      Direct Integration
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Select a purpose to auto-generate and populate a template message for WhatsApp
                  </p>
                </div>
              </div>

              {/* Dropdown list of message purposes */}
              <div className="flex items-center gap-2 shrink-0">
                <label htmlFor="client-detail-message-purpose" className="text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
                  Purpose:
                </label>
                <select
                  id="client-detail-message-purpose"
                  value={selectedPurpose}
                  onChange={(e) => handlePurposeChange(e.target.value as ClientMessagePurposeChoice)}
                  className="text-xs font-semibold px-3 py-1.5 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-xl text-slate-900 dark:text-white shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  {CLIENT_MESSAGE_PURPOSES.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Template Message Preview & Live Editor */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                <span>
                  Auto-populated template for <strong className="text-slate-800 dark:text-slate-200 font-bold">{selectedPurpose}</strong>:
                </span>
                <span className="font-mono text-[10px] text-slate-500">
                  Recipient: {client.phone}
                </span>
              </div>
              <textarea
                value={whatsappMessage}
                onChange={(e) => setWhatsappMessage(e.target.value)}
                rows={3}
                className="w-full text-xs p-3 bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed shadow-2xs"
                placeholder="Message will automatically populate here based on selected purpose..."
              />
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setWhatsappMessage(generateTemplateMessage(selectedPurpose))}
                  className="px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Reset to default purpose template"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset template</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  {copiedMessage ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy text</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`https://wa.me/${cleanPhoneForWhatsApp(client.phone)}?text=${encodeURIComponent(whatsappMessage)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  title={`Launch WhatsApp with "${selectedPurpose}" message`}
                >
                  <WhatsAppIcon className="w-3.5 h-3.5" />
                  <span>Send via WhatsApp</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>
              </div>
            </div>
          </div>

          {/* Secure Private Clinical Notes */}
          <div className="border border-theme-primary/30 rounded-2xl bg-white dark:bg-slate-900 p-5 space-y-3 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-theme-subtle text-theme-primary border border-theme-primary/30">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Private Clinical Notes</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Session observations, progress tracking, and treatment goals. Stored securely.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleInsertTimestampEntry}
                  className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  title="Insert dated clinical progress note template"
                >
                  <Sparkles className="w-3.5 h-3.5 text-theme-primary" />
                  <span>+ Note Template</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveNotes}
                  disabled={saveStatus === 'saving'}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
                    saveStatus === 'saved'
                      ? 'bg-emerald-600 text-white'
                      : 'btn-theme-primary'
                  }`}
                >
                  {saveStatus === 'saved' ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Saved!</span>
                    </>
                  ) : saveStatus === 'saving' ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Notes</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Note Text Area */}
            <div className="relative">
              <textarea
                value={privateNotes}
                onChange={(e) => setPrivateNotes(e.target.value)}
                rows={7}
                placeholder="Type confidential therapist notes, treatment plan updates, clinical observations, or homework assignments for this client..."
                className="w-full text-xs font-mono p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 ring-theme leading-relaxed text-slate-800 dark:text-slate-200 placeholder:text-slate-400 placeholder:font-sans"
              />
            </div>

            {/* Save Status Bar */}
            <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>
                  Storage: <code className="font-mono text-slate-700 dark:text-slate-300 font-semibold bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">mindwell_client_private_notes_{client.id}</code>
                </span>
              </div>
              <div>
                {lastSavedTime ? (
                  <span className="text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Saved locally at {lastSavedTime}
                  </span>
                ) : (
                  <span>Click 'Save Notes' to persist changes locally</span>
                )}
              </div>
            </div>
          </div>

          {/* Clinical Focus & Emergency Contact Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="font-bold text-slate-900 dark:text-white">Primary Focus:</div>
              <p className="text-slate-700 dark:text-slate-300">{client.primaryConcern}</p>
              <div className="pt-2 text-[11px] text-slate-500 dark:text-slate-400">
                Intake Date: <span className="font-semibold text-slate-800 dark:text-slate-200">{client.intakeDate}</span> · Sessions: <span className="font-semibold text-slate-800 dark:text-slate-200">{client.totalSessionsAttended}</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="font-bold text-slate-900 dark:text-white">Emergency Contact:</div>
              <div className="text-slate-700 dark:text-slate-300">{client.emergencyContact.name} ({client.emergencyContact.relationship})</div>
              <div className="flex items-center justify-between pt-1">
                <span className="font-mono text-slate-600 dark:text-slate-400">{client.emergencyContact.phone}</span>
                <WhatsAppButton
                  phone={client.emergencyContact.phone}
                  clientName={client.name}
                  template="emergency"
                  variant="badge"
                  label="Emergency WhatsApp"
                />
              </div>
            </div>
          </div>

          {/* Encounter / Appointment History */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Scheduled Appointments ({clientAppointments.length})
              </h4>
              {onOpenScheduleModal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenScheduleModal(undefined, client.assignedConsultantId, undefined, client.id);
                  }}
                  className="text-xs font-bold text-theme-primary hover:underline cursor-pointer"
                >
                  + Schedule Session for {client.name.split(' ')[0]}
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-44 overflow-y-auto">
              {clientAppointments.length > 0 ? (
                clientAppointments.map(appt => (
                  <div key={appt.id} className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-xs flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {appt.date} · {appt.time} ({appt.consultantName})
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {appt.sessionType} · {formatModality(appt.modality)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 dark:text-slate-300 capitalize">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          appt.status === 'completed' ? 'bg-emerald-500' :
                          appt.status === 'confirmed' ? 'bg-sky-500' :
                          'bg-amber-500'
                        }`} />
                        {appt.status}
                      </span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">${appt.fee}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-slate-400 dark:text-slate-500 text-xs italic p-3 text-center bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                  No appointments logged yet for this client.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Modal Bottom Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs shrink-0">
          <div className="text-slate-500 dark:text-slate-400">
            Client ID: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{client.id}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSaveNotes}
              className="btn-theme-primary px-4 py-2 text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              Save Notes & Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
