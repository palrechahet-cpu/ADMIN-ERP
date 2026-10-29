import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, ChevronDown, Check, Send } from 'lucide-react';
import { 
  getWhatsAppUrl, 
  cleanPhoneForWhatsApp, 
  WhatsAppTemplateType, 
  WhatsAppContext 
} from '../../utils/whatsapp';

// Official WhatsApp vector icon
export const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg
    viewBox="0 0 24 24"
    width="100%"
    height="100%"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.634.073-1.054-.055-.382-.116-.845-.27-1.464-.537-1.572-.68-2.616-2.261-2.694-2.366-.079-.105-.636-.846-.636-1.613 0-.766.401-1.144.544-1.299.144-.155.312-.194.417-.194.104 0 .209.002.299.006.096.005.225-.037.351.266.13.312.443 1.077.482 1.156.039.078.065.17.013.274-.052.105-.078.169-.156.26-.079.091-.165.204-.236.274-.079.078-.161.162-.069.32.091.157.406.669.87 1.082.597.532 1.101.697 1.258.775.157.078.249.066.341-.039.092-.105.393-.457.498-.614.105-.157.209-.131.353-.078.144.052.914.431 1.071.509.157.078.261.117.299.183.039.065.039.379-.105.784z" />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.66 1.436 5.178L2 22l4.982-1.306A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.2c-1.65 0-3.18-.468-4.48-1.28l-.322-.202-2.96.776.79-2.884-.218-.348A8.156 8.156 0 013.8 12c0-4.522 3.678-8.2 8.2-8.2 4.522 0 8.2 3.678 8.2 8.2 0 4.522-3.678 8.2-8.2 8.2z"
    />
  </svg>
);

interface WhatsAppButtonProps {
  phone: string;
  clientName?: string;
  consultantName?: string;
  date?: string;
  time?: string;
  sessionType?: string;
  variant?: 'icon' | 'badge' | 'button' | 'inline' | 'dropdown';
  label?: string;
  template?: WhatsAppTemplateType;
  customMessage?: string;
  showTemplatesMenu?: boolean;
}

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
  phone,
  clientName,
  consultantName,
  date,
  time,
  sessionType,
  variant = 'badge',
  label = 'WhatsApp',
  template = 'direct',
  customMessage,
  showTemplatesMenu = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const cleanNumber = cleanPhoneForWhatsApp(phone);

  const context: WhatsAppContext = {
    phone,
    clientName,
    consultantName,
    date,
    time,
    sessionType,
    template,
    customMessage,
  };

  const directUrl = getWhatsAppUrl(context);

  const templates: { id: WhatsAppTemplateType; name: string; description: string }[] = [
    { 
      id: 'appointment_confirmation', 
      name: 'Appointment confirmation', 
      description: `Confirm scheduled session with ${consultantName || 'clinician'}` 
    },
    { 
      id: 'rescheduling', 
      name: 'Rescheduling', 
      description: 'Propose alternative session date or time' 
    },
    { 
      id: 'intake_followup', 
      name: 'Intake follow-up', 
      description: 'Check in on onboarding forms and preferences' 
    },
    { 
      id: 'general_inquiry', 
      name: 'General inquiry', 
      description: 'Open clinical support and care schedule check-in' 
    },
    { 
      id: 'reminder', 
      name: 'Session Reminder', 
      description: `Friendly reminder for upcoming appointment` 
    },
  ];

  // Stop click propagation so clicking inside table rows doesn't trigger parent row selection
  const handleAnchorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  if (variant === 'icon') {
    return (
      <a
        href={directUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleAnchorClick}
        title={`Chat with ${clientName || 'client'} on WhatsApp (${phone})`}
        className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white border border-emerald-200 transition-colors shadow-2xs"
      >
        <WhatsAppIcon className="w-3.5 h-3.5" />
      </a>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
        <span className="font-mono text-slate-700">{phone}</span>
        <a
          href={directUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={`Message ${clientName || 'client'} on WhatsApp`}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 transition-all shrink-0 cursor-pointer"
        >
          <WhatsAppIcon className="w-3 h-3" />
          <span>Chat</span>
        </a>
      </div>
    );
  }

  if (variant === 'button') {
    return (
      <div className="relative inline-block" ref={dropdownRef} onClick={(e) => e.stopPropagation()}>
        <div className="inline-flex rounded-lg shadow-xs overflow-hidden border border-emerald-600">
          <a
            href={directUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={`Message ${clientName || 'client'} on WhatsApp`}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            <WhatsAppIcon className="w-4 h-4" />
            <span>{label}</span>
          </a>

          {showTemplatesMenu && (
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="px-1.5 bg-emerald-700 hover:bg-emerald-800 text-white border-l border-emerald-500 flex items-center justify-center transition-colors cursor-pointer"
              title="Select message template"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {isOpen && (
          <div className="absolute right-0 mt-1 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
            <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Quick WhatsApp Templates
            </div>
            {templates.map(t => {
              const url = getWhatsAppUrl({ ...context, template: t.id });
              return (
                <a
                  key={t.id}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 hover:bg-emerald-50 transition-colors group"
                >
                  <div className="font-bold text-slate-900 group-hover:text-emerald-800 flex items-center justify-between">
                    <span>{t.name}</span>
                    <Send className="w-3 h-3 opacity-0 group-hover:opacity-100 text-emerald-600" />
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                    {t.description}
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Default: badge
  return (
    <a
      href={directUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleAnchorClick}
      title={`Open WhatsApp chat with ${clientName || 'client'} (${phone})`}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 hover:border-emerald-600 transition-all cursor-pointer whitespace-nowrap shadow-2xs"
    >
      <WhatsAppIcon className="w-3.5 h-3.5" />
      <span>{label}</span>
    </a>
  );
};
