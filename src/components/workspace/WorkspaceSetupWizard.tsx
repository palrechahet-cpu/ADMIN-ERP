import React, { useState } from 'react';
import { 
  Building2, 
  CheckCircle2, 
  ShieldCheck, 
  Sliders, 
  Users, 
  CalendarDays, 
  Mail, 
  Key, 
  ArrowRight, 
  ArrowLeft,
  Sparkles,
  Plus,
  X,
  Stethoscope,
  Tag,
  Check
} from 'lucide-react';
import { useAuthWorkspace } from '../../context/AuthWorkspaceContext';
import { WorkspaceFeatures } from '../../types/clinic';

interface WorkspaceSetupWizardProps {
  onCancel?: () => void;
}

const COMMON_SERVICE_PRESETS = [
  'Individual Psychotherapy',
  'Cognitive Behavioral Therapy (CBT)',
  'Intake & Clinical Assessment',
  'Couples & Family Counseling',
  'Trauma & EMDR Session',
  'Mindfulness & Stress Management',
  'Psychiatric Medication Management',
  'Adolescent & Child Counseling',
  'Group Therapy Session'
];

const COMMON_TAG_PRESETS = [
  'Anxiety & Stress',
  'Depression',
  'Trauma & PTSD',
  'Relationship & Family',
  'ADHD & Focus',
  'Grief & Bereavement',
  'Life Transitions',
  'Self-Esteem & Identity'
];

export const WorkspaceSetupWizard: React.FC<WorkspaceSetupWizardProps> = ({ onCancel }) => {
  const { createWorkspace, user } = useAuthWorkspace();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // STEP 1: Practice Identity & Terminology (Decided by the user)
  const [practiceName, setPracticeName] = useState('MindWell Center');
  const [practiceCategory, setPracticeCategory] = useState('Psychology & Psychotherapy');
  const [practiceType, setPracticeType] = useState<'solo' | 'group' | 'clinic' | 'coaching'>('clinic');
  const [providerRole, setProviderRole] = useState<'Psychologists' | 'Therapists' | 'Counselors' | 'Clinicians' | 'Psychiatrists' | 'Custom'>('Therapists');
  const [customProviderPlural, setCustomProviderPlural] = useState('');
  const [customProviderSingular, setCustomProviderSingular] = useState('');
  const [clientTerm, setClientTerm] = useState<'Clients' | 'Patients'>('Clients');

  // STEP 2: Services Offered & Specialty Tags (Decided by the user)
  const [servicesOffered, setServicesOffered] = useState<string[]>([
    'Individual Psychotherapy',
    'Cognitive Behavioral Therapy (CBT)',
    'Intake & Clinical Assessment',
    'Couples & Family Counseling'
  ]);
  const [newServiceInput, setNewServiceInput] = useState('');

  const [specialtyTags, setSpecialtyTags] = useState<string[]>([
    'Anxiety & Stress',
    'Depression',
    'Trauma & PTSD',
    'Relationship & Family'
  ]);
  const [newTagInput, setNewTagInput] = useState('');

  // STEP 3: Operational Features & Access (Room coordination removed!)
  const [features, setFeatures] = useState<WorkspaceFeatures>({
    requestsTriage: true,
    paymentsLedger: true,
    consultantsCaseload: true,
    googleCalendarSync: true,
  });

  const [emailInput, setEmailInput] = useState('');
  const [authorizedEmails, setAuthorizedEmails] = useState<string[]>([
    user?.email || 'palrechahet@gmail.com'
  ]);

  // Provider label calculations
  const resolvedProviderPlural = providerRole === 'Custom' 
    ? (customProviderPlural.trim() || 'Practitioners') 
    : providerRole;
    
  const resolvedProviderSingular = providerRole === 'Custom'
    ? (customProviderSingular.trim() || 'Practitioner')
    : providerRole === 'Psychologists' ? 'Psychologist'
    : providerRole === 'Therapists' ? 'Therapist'
    : providerRole === 'Counselors' ? 'Counselor'
    : providerRole === 'Psychiatrists' ? 'Psychiatrist'
    : 'Clinician';

  const resolvedClientPlural = clientTerm;
  const resolvedClientSingular = clientTerm === 'Patients' ? 'Patient' : 'Client';

  // Service toggling and addition
  const handleToggleService = (service: string) => {
    if (servicesOffered.includes(service)) {
      if (servicesOffered.length > 1) {
        setServicesOffered(servicesOffered.filter(s => s !== service));
      }
    } else {
      setServicesOffered([...servicesOffered, service]);
    }
  };

  const handleAddCustomService = () => {
    const trimmed = newServiceInput.trim();
    if (trimmed && !servicesOffered.includes(trimmed)) {
      setServicesOffered([...servicesOffered, trimmed]);
      setNewServiceInput('');
    }
  };

  // Tag toggling and addition
  const handleToggleTag = (tag: string) => {
    if (specialtyTags.includes(tag)) {
      if (specialtyTags.length > 1) {
        setSpecialtyTags(specialtyTags.filter(t => t !== tag));
      }
    } else {
      setSpecialtyTags([...specialtyTags, tag]);
    }
  };

  const handleAddCustomTag = () => {
    const trimmed = newTagInput.trim();
    if (trimmed && !specialtyTags.includes(trimmed)) {
      setSpecialtyTags([...specialtyTags, trimmed]);
      setNewTagInput('');
    }
  };

  // Email handling
  const handleAddEmail = () => {
    if (emailInput.trim()) {
      const email = emailInput.trim().toLowerCase();
      if (!authorizedEmails.includes(email)) {
        setAuthorizedEmails([...authorizedEmails, email]);
      }
      setEmailInput('');
    }
  };

  const handleRemoveEmail = (target: string) => {
    if (target.toLowerCase() === (user?.email || '').toLowerCase()) return;
    setAuthorizedEmails(authorizedEmails.filter(e => e !== target));
  };

  const handleToggleFeature = (key: keyof WorkspaceFeatures) => {
    setFeatures(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleFinish = async () => {
    await createWorkspace({
      name: practiceName.trim() || 'My Practice',
      practiceType,
      practiceCategory,
      servicesOffered,
      providerLabel: resolvedProviderPlural,
      providerLabelSingular: resolvedProviderSingular,
      clientLabel: resolvedClientPlural,
      clientLabelSingular: resolvedClientSingular,
      specialtyTags,
      enabledFeatures: features,
      authorizedEmails,
      clientCapacity: 100,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150 flex flex-col">
        
        {/* Wizard Header */}
        <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Create Practice Workspace
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Define your organization services, practitioner roles, and specialty tags
              </p>
            </div>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Wizard Progress Steps Indicator */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] ${
              step >= 1 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              1
            </span>
            <span className={`font-semibold ${step === 1 ? 'text-teal-700 dark:text-teal-400' : 'text-slate-500'}`}>
              Identity & Roles
            </span>
          </div>

          <div className="w-8 h-px bg-slate-200 dark:border-slate-800" />

          <div className="flex items-center gap-2">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] ${
              step >= 2 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              2
            </span>
            <span className={`font-semibold ${step === 2 ? 'text-teal-700 dark:text-teal-400' : 'text-slate-500'}`}>
              Services & Tags
            </span>
          </div>

          <div className="w-8 h-px bg-slate-200 dark:border-slate-800" />

          <div className="flex items-center gap-2">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] ${
              step >= 3 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              3
            </span>
            <span className={`font-semibold ${step === 3 ? 'text-teal-700 dark:text-teal-400' : 'text-slate-500'}`}>
              Modules & Access
            </span>
          </div>
        </div>

        {/* Wizard Body */}
        <div className="p-6 overflow-y-auto space-y-5 max-h-[70vh]">
          
          {/* STEP 1: PRACTICE IDENTITY & USER-DECIDED ROLES */}
          {step === 1 && (
            <div className="space-y-4.5 animate-in fade-in">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Practice / Clinic Name
                </label>
                <input
                  type="text"
                  value={practiceName}
                  onChange={(e) => setPracticeName(e.target.value)}
                  placeholder="e.g. MindWell Center for Mental Health"
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Practice Specialty Focus
                </label>
                <input
                  type="text"
                  value={practiceCategory}
                  onChange={(e) => setPracticeCategory(e.target.value)}
                  placeholder="e.g. Psychology & Psychotherapy, Psychiatry, Family Therapy"
                  className="w-full text-xs px-3.5 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* USER DECIDES PRACTITIONER TITLE */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Practitioner Terminology (Decided by you)
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                  What title should the application use for your care providers across schedules, filters, and cards?
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {(['Therapists', 'Psychologists', 'Counselors', 'Clinicians', 'Psychiatrists', 'Custom'] as const).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setProviderRole(role)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer font-medium ${
                        providerRole === role
                          ? 'border-teal-600 bg-teal-50/50 dark:bg-teal-950/30 text-teal-950 dark:text-teal-100 font-bold shadow-2xs'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>

                {providerRole === 'Custom' && (
                  <div className="mt-2.5 grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500">Plural (e.g. Psychotherapists)</span>
                      <input
                        type="text"
                        value={customProviderPlural}
                        onChange={(e) => setCustomProviderPlural(e.target.value)}
                        placeholder="e.g. Psychotherapists"
                        className="w-full text-xs px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white mt-0.5"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500">Singular (e.g. Psychotherapist)</span>
                      <input
                        type="text"
                        value={customProviderSingular}
                        onChange={(e) => setCustomProviderSingular(e.target.value)}
                        placeholder="e.g. Psychotherapist"
                        className="w-full text-xs px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white mt-0.5"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* USER DECIDES CLIENT VS PATIENT */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Recipient Terminology (Clients vs Patients)
                </label>
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setClientTerm('Clients')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      clientTerm === 'Clients'
                        ? 'border-teal-600 bg-teal-50/50 dark:bg-teal-950/30 text-teal-950 dark:text-teal-100 font-bold shadow-2xs'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="font-bold">Clients</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Standard for psychotherapy, counseling, and wellness practices
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setClientTerm('Patients')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      clientTerm === 'Patients'
                        ? 'border-teal-600 bg-teal-50/50 dark:bg-teal-950/30 text-teal-950 dark:text-teal-100 font-bold shadow-2xs'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="font-bold">Patients</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Standard for clinical medical, hospital, and psychiatric centers
                    </div>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* STEP 2: USER SELECTS & DEFINES SERVICES AND SPECIALTY TAGS */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in">
              
              {/* Services Offered Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold text-slate-900 dark:text-white">
                      Clinical Services Offered by Your Practice
                    </label>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Select which services your organization provides. These will populate appointment booking and billing.
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-teal-700 dark:text-teal-400">
                    {servicesOffered.length} selected
                  </span>
                </div>

                {/* Preset Service Pills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {COMMON_SERVICE_PRESETS.map((service) => {
                    const isSelected = servicesOffered.includes(service);
                    return (
                      <button
                        key={service}
                        type="button"
                        onClick={() => handleToggleService(service)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 text-teal-900 dark:text-teal-200 font-semibold'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-teal-600 dark:text-teal-400" />}
                        <span>{service}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Service Input */}
                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={newServiceInput}
                    onChange={(e) => setNewServiceInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomService())}
                    placeholder="Add custom service (e.g. Neurofeedback Assessment)..."
                    className="flex-1 text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomService}
                    className="px-3 py-2 text-xs font-bold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Service</span>
                  </button>
                </div>

                {/* User's active selected custom list with delete buttons */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {servicesOffered.map((svc) => (
                    <span
                      key={svc}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[11px] font-medium"
                    >
                      <span>{svc}</span>
                      <button
                        type="button"
                        onClick={() => handleToggleService(svc)}
                        className="text-slate-400 hover:text-rose-500 ml-0.5 cursor-pointer"
                        title="Remove service"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="h-px bg-slate-100 dark:bg-slate-800" />

              {/* Clinical Specialty & Focus Tags Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold text-slate-900 dark:text-white">
                      Practice Focus & Specialty Tags
                    </label>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Decide the tags used to categorize clinicians, match client requests, and filter caseloads.
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-teal-700 dark:text-teal-400">
                    {specialtyTags.length} tags
                  </span>
                </div>

                {/* Preset Tag Pills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {COMMON_TAG_PRESETS.map((tag) => {
                    const isSelected = specialtyTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleToggleTag(tag)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 text-teal-900 dark:text-teal-200 font-semibold'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-teal-600 dark:text-teal-400" />}
                        <span>{tag}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Tag Input */}
                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomTag())}
                    placeholder="Add custom tag (e.g. Sleep Disorders, Eating Concerns)..."
                    className="flex-1 text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomTag}
                    className="px-3 py-2 text-xs font-bold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Tag</span>
                  </button>
                </div>

                {/* Active tags badges */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {specialtyTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[11px] font-medium"
                    >
                      <Tag className="w-2.5 h-2.5 text-slate-400" />
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleToggleTag(tag)}
                        className="text-slate-400 hover:text-rose-500 ml-0.5 cursor-pointer"
                        title="Remove tag"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* STEP 3: WORKSPACE MODULES & ACCESS CONTROL (Room coordination removed!) */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in">
              
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-900 dark:text-white">
                  Practice Modules & Workflow Features
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Select which modules should be available in this workspace.
                </p>

                {/* Module 1: Triage */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      Intake Requests & Triage
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Process incoming intake inquiries, verify caseloads, and assign to {resolvedProviderPlural.toLowerCase()}.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleFeature('requestsTriage')}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      features.requestsTriage ? 'bg-teal-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                        features.requestsTriage ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Module 2: Client Communications */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      Direct Client Calling & Purpose-Driven Texting
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      One-click client telephone dialing, call outcome notes, and smart purpose-driven messaging (confirmations, reminders, running late, follow-ups).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleFeature('paymentsLedger')}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      features.paymentsLedger ? 'bg-teal-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                        features.paymentsLedger ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Module 3: Google Calendar Sync */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      Google Calendar Integration
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Two-way Google Calendar synchronization for therapy appointments.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleFeature('googleCalendarSync')}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      features.googleCalendarSync ? 'bg-teal-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                        features.googleCalendarSync ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Creator & Authorized Team */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold text-slate-900 dark:text-white">
                  Team Authorization & Access
                </label>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                  You are creating this workspace as <strong className="text-slate-900 dark:text-white">{user?.email}</strong>. As the creator, you retain full settings authority.
                </div>

                <div className="flex gap-2">
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddEmail())}
                    placeholder="Authorize colleague Google email..."
                    className="flex-1 text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddEmail}
                    className="px-3 py-2 text-xs font-bold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    + Authorize
                  </button>
                </div>

                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {authorizedEmails.map((email) => {
                    const isCreatorEmail = email.toLowerCase() === (user?.email || '').toLowerCase();
                    return (
                      <div
                        key={email}
                        className="flex items-center justify-between px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs"
                      >
                        <span className="font-mono text-slate-800 dark:text-slate-200">
                          {email} {isCreatorEmail && '(Creator)'}
                        </span>
                        {!isCreatorEmail && (
                          <button
                            type="button"
                            onClick={() => handleRemoveEmail(email)}
                            className="text-rose-600 hover:text-rose-800 text-xs cursor-pointer font-bold"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Wizard Footer Controls */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((step - 1) as any)}
              className="px-3.5 py-2 font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((step + 1) as any)}
              className="px-4 py-2 font-bold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="px-5 py-2.5 font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl flex items-center gap-2 shadow-xs cursor-pointer transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Launch Practice Workspace</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
