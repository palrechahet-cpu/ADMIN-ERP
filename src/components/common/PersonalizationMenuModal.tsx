import React from 'react';
import { 
  X, 
  Palette, 
  Sun, 
  Moon, 
  Check, 
  Sliders, 
  Sparkles, 
  Calendar, 
  Users, 
  Building2,
  Eye
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuthWorkspace } from '../../context/AuthWorkspaceContext';
import { useClinic } from '../../context/ClinicContext';
import { getProviderLabel, getClientLabel } from '../../types/clinic';

interface PersonalizationMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToSettings?: () => void;
}

export const PersonalizationMenuModal: React.FC<PersonalizationMenuModalProps> = ({
  isOpen,
  onClose,
  onNavigateToSettings,
}) => {
  const { theme, setTheme, themeOptions } = useTheme();
  const { currentWorkspace, isCreator } = useAuthWorkspace();
  const { setActiveTab } = useClinic();

  if (!isOpen) return null;

  const currentThemeObj = themeOptions.find(t => t.id === theme) || themeOptions[0];
  const providerPlural = getProviderLabel(currentWorkspace, true);
  const clientPlural = getClientLabel(currentWorkspace, true);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150 flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-theme-primary/20 border border-theme-primary/30 flex items-center justify-center text-white">
              <Palette className="w-5 h-5 text-theme-primary" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                UI & Personalization Settings
              </h3>
              <p className="text-xs text-slate-400">
                Calm color palettes, dark/light modes, and practice appearance
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

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          
          {/* Section 1: Calm Color Palettes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Palette className="w-4 h-4 text-theme-primary" />
                <span>Calm Clinical Color Palettes</span>
              </label>
              <span className="text-[11px] text-slate-400 font-medium">
                Active: <strong className="text-slate-800 dark:text-slate-200">{currentThemeObj.name}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {themeOptions.map((t) => {
                const isActive = theme === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTheme(t.id)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      isActive
                        ? 'border-theme-primary bg-theme-subtle shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-5 h-5 rounded-full shadow-2xs shrink-0 ring-2 ring-white dark:ring-slate-900"
                        style={{ backgroundColor: t.dotColor }}
                      />
                      <div>
                        <div className={`text-xs ${isActive ? 'font-bold text-slate-900 dark:text-white' : 'font-semibold text-slate-700 dark:text-slate-300'}`}>
                          {t.name}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-normal mt-0.5">
                          {t.isDark ? 'Serene Dark Mode' : 'Calm Light Theme'}
                        </div>
                      </div>
                    </div>
                    {isActive && <Check className="w-4 h-4 text-theme-primary shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Quick Theme Mode Switcher */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Light & Dark Environment
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Switch between soft day clarity and relaxed low-light evening mode
              </p>
            </div>
            <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setTheme('sage')}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                  !currentThemeObj.isDark ? 'bg-theme-primary text-white shadow-2xs' : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Light Mode (Calm Sage)"
              >
                <Sun className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                  currentThemeObj.isDark ? 'bg-theme-primary text-white shadow-2xs' : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Dark Mode (Obsidian Calm)"
              >
                <Moon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Section 3: Practice Identity & Terminology Overview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-500" />
                <span>Practice Organization & Terminology</span>
              </label>
              {isCreator && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onNavigateToSettings) onNavigateToSettings();
                    else setActiveTab('settings');
                  }}
                  className="text-xs text-theme-primary font-semibold hover:underline cursor-pointer"
                >
                  Configure in Settings →
                </button>
              )}
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  Practitioner Role
                </span>
                <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {providerPlural}
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  Care Recipient Term
                </span>
                <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {clientPlural}
                </div>
              </div>

              <div className="col-span-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  Practice Specialty Focus
                </span>
                <div className="font-medium text-slate-700 dark:text-slate-300 mt-0.5">
                  {currentWorkspace?.practiceCategory || 'Clinical Psychotherapy & Mental Health'}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400">
            Preferences auto-saved for this session
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 font-bold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
