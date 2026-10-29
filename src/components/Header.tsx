import React, { useState, useRef, useEffect } from 'react';
import { 
  Calendar, 
  Inbox, 
  ClipboardList, 
  Users, 
  UserCheck, 
  Building2, 
  PlusCircle, 
  RotateCcw,
  HeartPulse,
  Palette,
  Sliders,
  LogOut,
  Key,
  ChevronDown
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import { useGoogleCalendar } from '../context/GoogleCalendarContext';
import { useAuthWorkspace } from '../context/AuthWorkspaceContext';
import { useTheme } from '../context/ThemeContext';
import { GoogleSignInButton } from './common/GoogleSignInButton';
import { PersonalizationMenuModal } from './common/PersonalizationMenuModal';
import { ViewTab, getProviderLabel, getClientLabel } from '../types/clinic';

interface HeaderProps {
  onOpenScheduleModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenScheduleModal }) => {
  const { 
    activeTab, 
    setActiveTab, 
    pendingRequestsCount, 
    todaySessionsCount,
    resetAllData 
  } = useClinic();

  const {
    user: gcalUser,
    isConnected,
    isConnecting,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
  } = useGoogleCalendar();

  const {
    user,
    currentWorkspace,
    isCreator,
    signOut,
    leaveWorkspace,
    setIsConfiguringNewWorkspace,
  } = useAuthWorkspace();

  const { theme, themeOptions } = useTheme();

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isPersonalizationOpen, setIsPersonalizationOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileMenuOpen]);

  // Dynamic feature filtering based on workspace settings
  const enabled = currentWorkspace?.enabledFeatures || {
    requestsTriage: true,
    consultantsCaseload: true,
    googleCalendarSync: true,
  };

  const providerPlural = getProviderLabel(currentWorkspace, true);
  const clientPlural = getClientLabel(currentWorkspace, true);

  const navItems: { id: ViewTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }[] = [
    { id: 'calendar', label: 'Schedule', icon: Calendar, badge: todaySessionsCount },
    ...(enabled.requestsTriage 
      ? [{ id: 'requests' as ViewTab, label: 'Requests', icon: Inbox, badge: pendingRequestsCount }] 
      : []),
    { id: 'appointments', label: 'Appointments', icon: ClipboardList },
    { id: 'clients', label: clientPlural, icon: Users },
    ...(enabled.consultantsCaseload 
      ? [{ id: 'consultants' as ViewTab, label: providerPlural, icon: UserCheck }] 
      : []),
    // ONLY CREATOR SEES WORKSPACE SETTINGS TAB
    ...(isCreator 
      ? [{ id: 'settings' as ViewTab, label: 'Practice Settings', icon: Sliders }] 
      : []),
  ];

  const currentThemeObj = themeOptions.find(t => t.id === theme) || themeOptions[0];

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs transition-colors duration-200">
      {/* Top Banner Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3 sm:gap-6">
          
          {/* Brand Identity & Left-Corner UI Personalization Trigger */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-theme-primary text-white flex items-center justify-center shadow-xs">
              <HeartPulse className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight truncate max-w-[180px] sm:max-w-xs">
                  {currentWorkspace?.name || 'MindWell Practice'}
                </span>
                <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 hidden md:inline">
                  {currentWorkspace?.accessCode}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                {currentWorkspace?.practiceCategory || 'Clinical Practice Management'}
              </p>
            </div>

            {/* User Request: UI features and personalization menu in the left corner */}
            <button
              type="button"
              onClick={() => setIsPersonalizationOpen(true)}
              className="ml-1 sm:ml-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer text-xs font-semibold shadow-2xs"
              title="UI Personalization & Themes Menu (Left Corner)"
              aria-label="UI Features and Personalization Menu"
            >
              <span
                className="w-2.5 h-2.5 rounded-full ring-1 ring-slate-300 dark:ring-slate-700 shrink-0"
                style={{ backgroundColor: currentThemeObj.dotColor }}
              />
              <Palette className="w-3.5 h-3.5 text-theme-primary" />
              <span className="hidden md:inline text-xs font-medium">UI Themes</span>
            </button>
          </div>

          {/* Practice Status Indicators */}
          <div className="hidden xl:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Practice active
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span>{providerPlural} on duty</span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="font-medium text-theme-primary">{todaySessionsCount} appointments today</span>
          </div>

          {/* Right Controls Container */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">

            {/* Google Calendar Connection Widget */}
            {enabled.googleCalendarSync && (
              <>
                {isConnected ? (
                  <div className="hidden md:flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-1.5 rounded-lg text-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                      <span className="font-semibold text-emerald-900 dark:text-emerald-200 hidden lg:inline">Google Cal</span>
                      <span className="text-slate-400 dark:text-slate-500 text-[10px] hidden xl:inline truncate max-w-[100px]">
                        {gcalUser?.email}
                      </span>
                    </div>
                    <button
                      onClick={disconnectGoogleCalendar}
                      title="Disconnect Google Calendar"
                      className="ml-1 text-[10px] text-slate-500 hover:text-rose-700 dark:hover:text-rose-400 font-medium hover:underline cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="hidden sm:block">
                    <GoogleSignInButton
                      onClick={connectGoogleCalendar}
                      isLoading={isConnecting}
                      size="sm"
                      label="Connect Google Cal"
                    />
                  </div>
                )}
              </>
            )}

            {/* Reset Sample Data Button */}
            <button
              onClick={() => {
                if (window.confirm('Reset schedule and client data to default samples?')) {
                  resetAllData();
                }
              }}
              title="Reset sample schedule data"
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Primary Booking Action Button */}
            <button
              onClick={onOpenScheduleModal}
              className="inline-flex items-center gap-1.5 sm:gap-2 btn-theme-primary px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors whitespace-nowrap cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Book appointment</span>
              <span className="sm:hidden">Book</span>
            </button>

            {/* User Profile & Workspace Dropdown Menu with Personalization Inside */}
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-theme-primary text-white font-bold text-xs flex items-center justify-center">
                  {(user?.displayName || user?.email || 'U')[0].toUpperCase()}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[120px]">
                    {user?.displayName || 'User'}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    {isCreator ? 'Workspace Creator' : 'Team Member'}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Profile Menu Dropdown */}
              {isProfileMenuOpen && (
                <div 
                  className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100"
                >
                  <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                    <div className="font-bold text-slate-900 dark:text-white truncate">
                      {user?.displayName || 'Signed-in User'}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                      {user?.email}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${isCreator ? 'bg-teal-500' : 'bg-indigo-500'}`} />
                      <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                        {isCreator ? 'Practice Creator & Admin' : 'Authorized Team Member'}
                      </span>
                    </div>
                  </div>

                  {/* User Request: UI features and personalization features also in profile settings */}
                  <div className="p-1 border-b border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        setIsPersonalizationOpen(true);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 cursor-pointer font-medium"
                    >
                      <Palette className="w-4 h-4 text-theme-primary" />
                      <div>
                        <div className="font-semibold text-xs">UI Themes & Personalization</div>
                        <div className="text-[10px] text-slate-400">Calm color palettes, dark/light mode</div>
                      </div>
                    </button>
                  </div>

                  {/* Navigation & Administration Options */}
                  <div className="p-1">
                    {/* ONLY CREATOR HAS PRACTICE SETTINGS & CONFIGURATION */}
                    {isCreator && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('settings');
                          setIsProfileMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 cursor-pointer font-medium"
                      >
                        <Sliders className="w-4 h-4 text-theme-primary" />
                        <div>
                          <div className="font-semibold text-xs">Practice Configuration & Services</div>
                          <div className="text-[10px] text-slate-400">Manage services, roles & tags</div>
                        </div>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setIsConfiguringNewWorkspace(true);
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 cursor-pointer font-medium"
                    >
                      <Building2 className="w-4 h-4 text-slate-500" />
                      <span>Create New Practice Workspace</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        leaveWorkspace();
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 cursor-pointer font-medium"
                    >
                      <Key className="w-4 h-4 text-slate-500" />
                      <span>Switch / Join Workspace</span>
                    </button>
                  </div>

                  {/* Sign Out Action */}
                  <div className="p-1 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        signOut();
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2.5 cursor-pointer font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>

                </div>
              )}
            </div>

          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav className="flex space-x-1 overflow-x-auto py-2 -mb-px border-t border-slate-100 dark:border-slate-800 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white dark:text-slate-900' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive
                        ? item.id === 'requests' ? 'bg-amber-400 text-slate-950' : 'bg-slate-700 text-white dark:bg-slate-200 dark:text-slate-900'
                        : item.id === 'requests' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Global Personalization Menu Modal (accessible from left corner or profile menu) */}
      <PersonalizationMenuModal
        isOpen={isPersonalizationOpen}
        onClose={() => setIsPersonalizationOpen(false)}
        onNavigateToSettings={() => {
          setIsPersonalizationOpen(false);
          setActiveTab('settings');
        }}
      />
    </header>
  );
};
