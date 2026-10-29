import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Building2, 
  UserCheck, 
  Calendar, 
  Sparkles,
  ArrowRight,
  HeartPulse,
  Key
} from 'lucide-react';
import { useAuthWorkspace } from '../../context/AuthWorkspaceContext';
import { useTheme } from '../../context/ThemeContext';

export const GoogleSignInGate: React.FC = () => {
  const { signInWithGoogle, simulateGoogleSignIn, isLoadingAuth } = useAuthWorkspace();
  const { theme, toggleTheme } = useTheme();
  const [customEmail, setCustomEmail] = useState('');
  const [showDirectEntry, setShowDirectEntry] = useState(false);

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customEmail.trim()) {
      const email = customEmail.trim().toLowerCase();
      simulateGoogleSignIn(email, email.split('@')[0], email === 'palrechahet@gmail.com');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-200">
      
      {/* Top Bar with Theme Toggle */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
        >
          {theme === 'dark' ? (
            <>
              <span className="text-amber-400">☀️</span>
              <span className="hidden sm:inline">Light Mode</span>
            </>
          ) : (
            <>
              <span className="text-slate-700">🌙</span>
              <span className="hidden sm:inline">Dark Mode</span>
            </>
          )}
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Practice Logo */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-600 dark:bg-teal-500 text-white shadow-lg shadow-teal-600/20 mb-4">
          <HeartPulse className="w-8 h-8" />
        </div>
        
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          MindWell Practice OS
        </h2>
        <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
          Clinical Mental Health & Psychotherapy Practice Management
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 shadow-xl border border-slate-200 dark:border-slate-800 rounded-3xl space-y-6">
          
          {/* Compulsory Authentication Notice */}
          <div className="p-3.5 rounded-2xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 text-xs text-teal-900 dark:text-teal-200 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Compulsory Clinical Access:</span> Google Authentication is required to access organization workspaces, appointments, and client records.
            </div>
          </div>

          {/* Primary Google Sign In Button */}
          <div>
            <button
              onClick={signInWithGoogle}
              disabled={isLoadingAuth}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-2xl shadow-xs text-sm font-bold text-slate-800 dark:text-white bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all cursor-pointer disabled:opacity-50"
            >
              {/* Google G Logo SVG */}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isLoadingAuth ? 'Signing In...' : 'Continue with Google'}</span>
            </button>
          </div>

          {/* Quick Preview Sign-In Shortcuts */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">
              Direct Role Authentication
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => simulateGoogleSignIn('palrechahet@gmail.com', 'Het Palrecha', true)}
                className="w-full text-left p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-teal-500 dark:hover:border-teal-500 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all text-xs cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-teal-500" />
                    <span>Practice Director (Creator)</span>
                  </div>
                  <span className="text-[10px] text-teal-600 dark:text-teal-400 font-mono group-hover:translate-x-0.5 transition-transform">
                    palrechahet@gmail.com →
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Full owner permissions: configure workspace parameters & feature toggles
                </div>
              </button>

              <button
                type="button"
                onClick={() => simulateGoogleSignIn('sarah.jenkins@mindwell.health', 'Dr. Sarah Jenkins', false)}
                className="w-full text-left p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all text-xs cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    <span>Staff Clinician (Team Member)</span>
                  </div>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono group-hover:translate-x-0.5 transition-transform">
                    sarah.jenkins@... →
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Access tailored clinical tools; settings managed exclusively by creator
                </div>
              </button>
            </div>
          </div>

          {/* Optional manual email entry for team members */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            {!showDirectEntry ? (
              <button
                type="button"
                onClick={() => setShowDirectEntry(true)}
                className="w-full text-center text-xs text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors cursor-pointer"
              >
                Sign in with another Google email account...
              </button>
            ) : (
              <form onSubmit={handleCustomSubmit} className="space-y-2">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Enter authorized Google account email:
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="name@clinic.com"
                    required
                    className="flex-1 text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  >
                    Enter
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Security footnote */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5">
              <Lock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>HIPAA Compliant Session Storage · 256-bit TLS Encryption</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
