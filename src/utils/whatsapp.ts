/**
 * Helper utilities for WhatsApp deep linking & message templates
 */

export function cleanPhoneForWhatsApp(phone: string): string {
  // Strip all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // If 10 digits (standard US/North America without leading 1), prepend 1
  if (digits.length === 10) {
    return `1${digits}`;
  }
  
  // If 11 digits starting with 1, or international format, return as is
  return digits;
}

export type WhatsAppTemplateType = 
  | 'direct' 
  | 'reminder' 
  | 'intake' 
  | 'billing' 
  | 'emergency'
  | 'appointment_confirmation'
  | 'rescheduling'
  | 'intake_followup'
  | 'general_inquiry';

export interface WhatsAppContext {
  phone: string;
  clientName?: string;
  consultantName?: string;
  date?: string;
  time?: string;
  sessionType?: string;
  modality?: string;
  template?: WhatsAppTemplateType;
  customMessage?: string;
}

export function generateWhatsAppMessage(context: WhatsAppContext): string {
  if (context.customMessage) {
    return context.customMessage;
  }

  const client = context.clientName ? context.clientName : 'Client';
  const consultant = context.consultantName || 'your therapist';
  const date = context.date || 'your scheduled date';
  const time = context.time || 'your scheduled time';
  const modalityStr = context.modality ? ` (${context.modality})` : '';

  switch (context.template) {
    case 'appointment_confirmation':
      return `Hello ${client}, your appointment with ${consultant} is confirmed for ${date} at ${time}${modalityStr}. Please reply to confirm or let us know if you have any questions. We look forward to seeing you!`;

    case 'rescheduling':
      return `Hello ${client}, this is MindWell Practice regarding your session with ${consultant} on ${date} at ${time}. Would you be open to considering an alternative time slot this week? Please reply with your availability, or call us.`;

    case 'intake_followup':
      return `Hello ${client}, this is MindWell Practice following up on your initial intake and care preferences for your care with ${consultant}. Please let us know if you need any assistance completing your intake forms or have questions before your session.`;

    case 'general_inquiry':
      return `Hello ${client}, this is MindWell Practice Coordination. How can we support you today with your care schedule or appointment questions?`;

    case 'reminder':
      return `Hello ${client}, this is MindWell Practice reminding you of your mental health session with ${consultant} on ${date} at ${time}${modalityStr}. Please reply to confirm or let us know if you need assistance.`;

    case 'intake':
      return `Hello ${client}, welcome to MindWell Practice. We are coordinating your appointment with ${consultant}. Please let us know if you need assistance with your intake forms or have any questions.`;

    case 'emergency':
      return `Hello, this is MindWell Practice Coordination attempting to reach you regarding urgent care coordination for ${client}.`;

    case 'direct':
    default:
      return `Hello ${client}, this is MindWell Practice Coordination. How can we support you today?`;
  }
}

export function getWhatsAppUrl(context: WhatsAppContext): string {
  const cleanNumber = cleanPhoneForWhatsApp(context.phone);
  const message = generateWhatsAppMessage(context);
  
  if (!message || message.trim() === '') {
    return `https://wa.me/${cleanNumber}`;
  }

  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}
