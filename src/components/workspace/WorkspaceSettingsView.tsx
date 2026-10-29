import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Key, 
  Mail, 
  RefreshCw, 
  Trash2, 
  CheckCircle2, 
  Sliders, 
  Building2, 
  Save, 
  Plus,
  Users,
  Calendar,
  CreditCard,
  Inbox,
  Tag,
  Stethoscope,
  X
} from 'lucide-react';
import { useAuthWorkspace } from '../../context/AuthWorkspaceContext';
import { WorkspaceFeatures } from '../../types/clinic';

export const WorkspaceSettingsView: React.FC = () => {
  const { 
    currentWorkspace, 
    isCreator, 
    user, 
    updateWorkspaceSettings, 
    regenerateAccessCode, 
    addAuthorizedEmail, 
    removeAuthorizedEmail 
  } = useAuthWorkspace();

  if (!currentWorkspace) return null;

  // STRICT CREATOR PERMISSION ENFORCEMENT
  if (!isCreator) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 border border-slate-200 dark:border-slate-800 shadow-xs text-center space-y-4 max-w-xl mx-auto my-12">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          Workspace Configuration Restricted to Creator
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          You are currently signed in as a Team Member (<span className="font-semibold text-slate-700 dark:text-slate-300">{user?.email}</span>). Clinical services, practitioner terminology, tags, and access security are managed by the practice creator:
        </p>
        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 inline-block">
          {currentWorkspace.creatorName} ({currentWorkspace.creatorEmail})
        </div>
      </div>
    );
  }

  // Editable practice settings
  const [practiceName, setPracticeName] = useState(currentWorkspace.name);
  const [practiceCategory, setPracticeCategory] = useState(currentWorkspace.practiceCategory || 'Psychology & Psychotherapy');
  const [providerLabel, setProviderLabel] = useState(currentWorkspace.providerLabel || 'Therapists');
  const [providerLabelSingular, setProviderLabelSingular] = useState(currentWorkspace.providerLabelSingular || 'Therapist');
  const [clientLabel, setClientLabel] = useState(currentWorkspace.clientLabel || 'Clients');
  const [clientLabelSingular, setClientLabelSingular] = useState(currentWorkspace.clientLabelSingular || 'Client');

  // Services offered list
  const [services, setServices] = useState<string[]>(currentWorkspace.servicesOffered || [
    'Individual Psychotherapy',
    'Cognitive Behavioral Therapy (CBT)',
    'Intake & Clinical Assessment',
    'Couples & Family Counseling'
  ]);
  const [newServiceInput, setNewServiceInput] = useState('');

  // Specialty tags list
  const [tags, setTags] = useState<string[]>(currentWorkspace.specialtyTags || [
    'Anxiety & Stress',
    'Depression',
    'Trauma & PTSD',
    'Relationship & Family'
  ]);
  const [newTagInput, setNewTagInput] = useState('');

  // Modules toggles (room coordination removed)
  const [features, setFeatures] = useState<WorkspaceFeatures>(() => {
    return currentWorkspace.enabledFeatures || {
      requestsTriage: true,
      paymentsLedger: true,
      consultantsCaseload: true,
      googleCalendarSync: true,
    };
  });

  const [newEmail, setNewEmail] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [regenStatus, setRegenStatus] = useState<string | null>(null);

  const handleToggle = (key: keyof WorkspaceFeatures) => {
    setFeatures(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleAddService = () => {
    const trimmed = newServiceInput.trim();
    if (trimmed && !services.includes(trimmed)) {
      setServices([...services, trimmed]);
      setNewServiceInput('');
    }
  };

  const handleRemoveService = (serviceToRemove: string) => {
    if (services.length > 1) {
      setServices(services.filter(s => s !== serviceToRemove));
    }
  };

  const handleAddTag = () => {
    const trimmed = newTagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (tags.length > 1) {
      setTags(tags.filter(t => t !== tagToRemove));
    }
  };

  const handleSaveAll = async () => {
    setSaveStatus('saving');
    await updateWorkspaceSettings(features, {
      name: practiceName.trim() || currentWorkspace.name,
      practiceCategory: practiceCategory.trim() || currentWorkspace.practiceCategory,
      providerLabel: providerLabel.trim() || 'Therapists',
      providerLabelSingular: providerLabelSingular.trim() || 'Therapist',
      clientLabel: clientLabel.trim() || 'Clients',
      clientLabelSingular: clientLabelSingular.trim() || 'Client',
      servicesOffered: services,
      specialtyTags: tags,
    });
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2500);
  };

  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newEmail.trim()) {
      await addAuthorizedEmail(newEmail.trim().toLowerCase());
      setNewEmail('');
    }
  };

  const handleRegenerateCode = async () => {
    if (window.confirm('Regenerate Workspace Access Code? Team members using the old code will need the new one.')) {
      const newCode = await regenerateAccessCode();
      setRegenStatus(`Generated new code: ${newCode}`);
      setTimeout(() => setRegenStatus(null), 4000);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in">
      
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Practice Configuration & Services
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Modify clinical services, practitioner terminology, specialty focus tags, and team access for <strong className="text-slate-800 dark:text-slate-200">{currentWorkspace.name}</strong>
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveAll}
          disabled={saveStatus === 'saving'}
          className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-xs cursor-pointer ${
            saveStatus === 'saved'
              ? 'bg-emerald-600 text-white'
              : 'bg-teal-600 hover:bg-teal-700 text-white'
          }`}
        >
          {saveStatus === 'saved' ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Configuration Saved!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Practice Changes</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Main Settings Column (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section 1: Practice Terminology & Roles */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-theme-primary" />
                  <span>Practice Identity & Terminology</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Decide the wording and titles used across your practice schedules and views.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Practice Name
                </label>
                <input
                  type="text"
                  value={practiceName}
                  onChange={(e) => setPracticeName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Practice Domain / Category
                </label>
                <input
                  type="text"
                  value={practiceCategory}
                  onChange={(e) => setPracticeCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="font-bold text-slate-900 dark:text-white block">
                  Practitioner Role Labels
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500">Plural (e.g. Psychologists)</span>
                    <input
                      type="text"
                      value={providerLabel}
                      onChange={(e) => setProviderLabel(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs mt-0.5"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">Singular (e.g. Psychologist)</span>
                    <input
                      type="text"
                      value={providerLabelSingular}
                      onChange={(e) => setProviderLabelSingular(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs mt-0.5"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="font-bold text-slate-900 dark:text-white block">
                  Care Recipient Labels
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500">Plural (e.g. Clients / Patients)</span>
                    <input
                      type="text"
                      value={clientLabel}
                      onChange={(e) => setClientLabel(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs mt-0.5"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">Singular (e.g. Client / Patient)</span>
                    <input
                      type="text"
                      value={clientLabelSingular}
                      onChange={(e) => setClientLabelSingular(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs mt-0.5"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Clinical Services Offered */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-theme-primary" />
                  <span>Clinical Services Offered</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  The clinical appointment and session types provided by your organization.
                </p>
              </div>
              <span className="text-xs font-semibold text-teal-700 dark:text-teal-400">
                {services.length} active services
              </span>
            </div>

            {/* Add service form */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newServiceInput}
                onChange={(e) => setNewServiceInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddService())}
                placeholder="Enter a new service (e.g. Biofeedback Therapy)..."
                className="flex-1 text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button
                type="button"
                onClick={handleAddService}
                className="px-3.5 py-2 text-xs font-bold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Service</span>
              </button>
            </div>

            {/* Services list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {services.map((service) => (
                <div
                  key={service}
                  className="flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-xs"
                >
                  <span className="font-medium text-slate-800 dark:text-slate-200 truncate pr-2">
                    {service}
                  </span>
                  {services.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveService(service)}
                      className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-0.5 cursor-pointer font-bold text-sm"
                      title="Remove service"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Specialty & Focus Tags */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Tag className="w-4 h-4 text-theme-primary" />
                  <span>Practice Focus & Specialty Tags</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Tags used to classify clinician competencies and match incoming client requests.
                </p>
              </div>
              <span className="text-xs font-semibold text-teal-700 dark:text-teal-400">
                {tags.length} active tags
              </span>
            </div>

            {/* Add tag form */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Enter a new specialty tag (e.g. Chronic Pain, Sleep Disorders)..."
                className="flex-1 text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3.5 py-2 text-xs font-bold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Tag</span>
              </button>
            </div>

            {/* Tags badges */}
            <div className="flex flex-wrap gap-2 pt-1">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium border border-slate-200 dark:border-slate-700"
                >
                  <Tag className="w-3 h-3 text-slate-400" />
                  <span>{tag}</span>
                  {tags.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 ml-1 cursor-pointer font-bold"
                      title="Remove tag"
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
            </div>
          </div>

          {/* Section 4: Module Toggles */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-theme-primary" />
                <span>Workspace Modules</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Enable or disable operational modules to streamline practice navigation.
              </p>
            </div>

            {/* Triage */}
            <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <span className="font-bold text-xs text-slate-900 dark:text-white">
                  Intake Requests & Triage Queue
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Reviews incoming client session submissions with accept/decline actions and caseload assignment.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('requestsTriage')}
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

            {/* Client Communications */}
            <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <span className="font-bold text-xs text-slate-900 dark:text-white">
                  Direct Client Calling & Purpose-Driven Texting
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Direct telephonic calling, call outcome logging, emergency dials, and purposeful text message templates.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('paymentsLedger')}
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

            {/* Google Calendar */}
            <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <span className="font-bold text-xs text-slate-900 dark:text-white">
                  Google Calendar Integration
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Allow practitioners to connect their primary Google Calendars and sync sessions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('googleCalendarSync')}
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

        </div>

        {/* Security & Access Code Column (1/3 width) */}
        <div className="space-y-4">
          
          {/* Workspace Access Code Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Workspace Access Code
              </h4>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Share this code with authorized team members so they can connect upon Google Sign-In:
            </p>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <span className="font-mono text-base font-extrabold text-teal-800 dark:text-teal-300 tracking-wider">
                {currentWorkspace.accessCode}
              </span>
              <button
                type="button"
                onClick={handleRegenerateCode}
                className="p-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                title="Regenerate access code"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {regenStatus && (
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                {regenStatus}
              </div>
            )}
          </div>

          {/* Authorized Staff Emails Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Authorized Team Accounts
              </h4>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Colleagues signing in with these Google accounts gain instant access:
            </p>

            <form onSubmit={handleAddEmail} className="flex gap-2">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="colleague@domain.com"
                required
                className="flex-1 text-xs px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-bold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Add
              </button>
            </form>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pt-1">
              {currentWorkspace.authorizedEmails.map(email => {
                const isCreatorEmail = email.toLowerCase() === currentWorkspace.creatorEmail.toLowerCase();
                return (
                  <div
                    key={email}
                    className="flex items-center justify-between p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs"
                  >
                    <span className="font-mono text-slate-800 dark:text-slate-200 truncate pr-2">
                      {email} {isCreatorEmail && '⭐ (Creator)'}
                    </span>
                    {!isCreatorEmail && (
                      <button
                        type="button"
                        onClick={() => removeAuthorizedEmail(email)}
                        className="text-rose-600 hover:text-rose-800 dark:text-rose-400 p-1 cursor-pointer"
                        title="Revoke access"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
