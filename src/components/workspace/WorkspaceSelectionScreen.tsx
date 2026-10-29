import React, { useState } from 'react';
import { 
  Building2, 
  Key, 
  Plus, 
  LogOut, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  Lock
} from 'lucide-react';
import { useAuthWorkspace } from '../../context/AuthWorkspaceContext';
import { WorkspaceSetupWizard } from './WorkspaceSetupWizard';

export const WorkspaceSelectionScreen: React.FC = () => {
  const { 
    user, 
    signOut, 
    joinWorkspaceWithCode, 
    workspacesList, 
    switchWorkspace,
    isConfiguringNewWorkspace,
    setIsConfiguringNewWorkspace
  } = useAuthWorkspace();

  const [accessCode, setAccessCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);

  // Workspaces where current user is authorized or creator
  const userEmail = (user?.email || '').toLowerCase();
  const authorizedWorkspaces = workspacesList.filter(w => 
    w.creatorUid === user?.uid || 
    w.creatorEmail.toLowerCase() === userEmail ||
    w.authorizedEmails.some(e => e.toLowerCase() === userEmail)
  );

  const handleJoinCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCode.trim()) return;
    
    setIsSubmittingCode(true);
    setJoinError(null);
    const res = await joinWorkspaceWithCode(accessCode.trim());
    setIsSubmittingCode(false);

    if (!res.success) {
      setJoinError(res.error || 'Invalid Access Code');
    }
  };

  if (isConfiguringNewWorkspace) {
    return <WorkspaceSetupWizard onCancel={() => setIsConfiguringNewWorkspace(false)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      
      {/* Top Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-2xl bg-teal-600 dark:bg-teal-500 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-teal-600/20">
          <Building2 className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Select or Join a Practice Workspace
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Signed in as <span className="font-semibold text-slate-800 dark:text-slate-200">{user?.displayName}</span> ({user?.email})
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg space-y-6">

        {/* Existing Authorized Workspaces List */}
        {authorizedWorkspaces.length > 0 && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Your Authorized Workspaces ({authorizedWorkspaces.length})
            </div>
            
            <div className="space-y-2">
              {authorizedWorkspaces.map(ws => {
                const isCreator = ws.creatorUid === user?.uid || ws.creatorEmail.toLowerCase() === userEmail;
                return (
                  <button
                    key={ws.id}
                    onClick={() => switchWorkspace(ws.id)}
                    className="w-full text-left p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-teal-500 dark:hover:border-teal-500 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{ws.name}</span>
                        {isCreator ? (
                          <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
                            Creator & Admin
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                            Team Member
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Code: <span className="font-mono">{ws.accessCode}</span> · Practice: {ws.practiceType}
                      </div>
                    </div>
                    <span className="text-xs font-bold text-teal-600 dark:text-teal-400 group-hover:translate-x-1 transition-transform">
                      Enter →
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Join with Access Code Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Join Existing Workspace with Access Code
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Enter the 6-character access code provided by your organization's creator (e.g. MW-9428).
          </p>

          <form onSubmit={handleJoinCode} className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                placeholder="e.g. MW-9428"
                className="flex-1 text-sm font-mono tracking-wider font-bold uppercase px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button
                type="submit"
                disabled={isSubmittingCode || !accessCode.trim()}
                className="px-4 py-2.5 text-xs font-bold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmittingCode ? 'Checking...' : 'Join Workspace'}
              </button>
            </div>

            {joinError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{joinError}</span>
              </div>
            )}
          </form>
        </div>

        {/* Create New Practice Workspace Button */}
        <div className="bg-gradient-to-br from-teal-500/10 to-teal-500/5 dark:from-teal-950/40 dark:to-teal-950/20 p-6 rounded-3xl border border-teal-200 dark:border-teal-800/60 text-center space-y-3">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            Starting a New Practice or Department?
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
            Create an organization workspace, answer operational questions to tailor features, and invite your team.
          </p>
          <button
            type="button"
            onClick={() => setIsConfiguringNewWorkspace(true)}
            className="px-5 py-2.5 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-xs transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Workspace</span>
          </button>
        </div>

        {/* Sign Out Link */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={signOut}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out of Google Account</span>
          </button>
        </div>

      </div>

    </div>
  );
};
