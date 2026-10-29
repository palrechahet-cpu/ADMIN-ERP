import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Video, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Filter, 
  Search, 
  Columns, 
  List, 
  Grid,
  CheckCircle,
  Eye,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  CalendarCheck,
  CalendarDays,
  Sparkles
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import { useGoogleCalendar } from '../context/GoogleCalendarContext';
import { useAuthWorkspace } from '../context/AuthWorkspaceContext';
import { Appointment, Consultant, Modality, formatModality, getProviderLabel } from '../types/clinic';
import { getRelativeDate } from '../data/mockClinicData';
import { WhatsAppButton } from './common/WhatsAppButton';
import { GoogleSignInButton } from './common/GoogleSignInButton';
import { GoogleCalendarConfirmModal, CalendarConfirmationData } from './modals/GoogleCalendarConfirmModal';

interface CalendarViewProps {
  onOpenScheduleModal: (defaultTime?: string, defaultConsultantId?: string, defaultDate?: string) => void;
  onSelectAppointment: (appointment: Appointment) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  onOpenScheduleModal,
  onSelectAppointment,
}) => {
  const { 
    consultants, 
    clients,
    appointments, 
    selectedDate, 
    setSelectedDate,
    selectedConsultantId,
    setSelectedConsultantId,
    updateAppointmentStatus
  } = useClinic();

  const {
    user,
    isConnected,
    isConnecting,
    isSyncing,
    connectGoogleCalendar,
    syncedRecords,
    lastSyncTime,
    syncAppointment,
    batchSyncAppointments,
    googleEvents,
    fetchDayEvents
  } = useGoogleCalendar();

  const { currentWorkspace } = useAuthWorkspace();
  const providerPlural = getProviderLabel(currentWorkspace, true);
  const providerSingular = getProviderLabel(currentWorkspace, false);

  const todayStr = getRelativeDate(0);
  const [calendarSubMode, setCalendarSubMode] = useState<'timeline' | 'lanes' | 'week' | 'month'>('timeline');
  const [modalityFilter, setModalityFilter] = useState<'all' | 'In-person' | 'Online'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Google Calendar integration UI states
  const [confirmData, setConfirmData] = useState<CalendarConfirmationData | null>(null);
  const [isConfirmProcessing, setIsConfirmProcessing] = useState(false);
  const [showGCalOverlay, setShowGCalOverlay] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Automatically refresh day events if connected and overlay requested
  useEffect(() => {
    if (isConnected && showGCalOverlay) {
      fetchDayEvents(selectedDate);
    }
  }, [isConnected, showGCalOverlay, selectedDate, fetchDayEvents]);

  // Navigate date
  const changeDateBy = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const isToday = selectedDate === todayStr;

  // Filter appointments for the selected date
  const dayAppointments = appointments.filter(a => {
    if (a.date !== selectedDate) return false;
    if (a.status === 'cancelled' || a.status === 'rejected') return false;
    if (selectedConsultantId !== 'all' && a.consultantId !== selectedConsultantId) return false;
    if (modalityFilter !== 'all' && formatModality(a.modality) !== modalityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return a.clientName.toLowerCase().includes(q) || 
             a.consultantName.toLowerCase().includes(q) ||
             a.sessionType.toLowerCase().includes(q);
    }
    return true;
  });

  // Calculate day stats
  const totalDaySessions = dayAppointments.length;
  const completedSessions = dayAppointments.filter(a => a.status === 'completed').length;
  const inPersonCount = dayAppointments.filter(a => formatModality(a.modality) === 'In-person').length;
  const onlineCount = dayAppointments.filter(a => formatModality(a.modality) === 'Online').length;
  const estimatedDayRevenue = dayAppointments.reduce((acc, curr) => acc + curr.fee, 0);

  // Time grid hours: 8:00 to 18:00
  const HOURS = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30', '18:00'
  ];

  // Helper to format date header
  const formattedSelectedDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Handler for single session sync with mandatory confirmation
  const handleTriggerSingleSync = (session: Appointment) => {
    const isAlreadySynced = !!syncedRecords[session.id];
    setConfirmData({
      type: isAlreadySynced ? 'update' : 'create',
      title: isAlreadySynced ? 'Update Google Calendar Event' : 'Add Session to Google Calendar',
      description: `Synchronize the therapy session for "${session.clientName}" with ${session.consultantName} scheduled on ${session.date} at ${session.time} to your Google Calendar.`,
      appointment: session,
      onConfirm: async () => {
        setIsConfirmProcessing(true);
        const client = clients.find(c => c.id === session.clientId);
        const consultant = consultants.find(c => c.id === session.consultantId);
        const res = await syncAppointment(session, client, consultant);
        setIsConfirmProcessing(false);
        if (res.success) {
          setSyncFeedback({ type: 'success', message: `Synced session for ${session.clientName} to Google Calendar!` });
          setTimeout(() => setSyncFeedback(null), 4000);
        } else {
          setSyncFeedback({ type: 'error', message: res.error || 'Failed to sync to Google Calendar.' });
        }
      },
    });
  };

  // Handler for batch syncing day appointments
  const handleTriggerBatchSync = () => {
    if (dayAppointments.length === 0) return;
    setConfirmData({
      type: 'batch_sync',
      title: `Sync All ${dayAppointments.length} Sessions to Google Calendar`,
      description: `Synchronize all ${dayAppointments.length} sessions for ${formattedSelectedDate} to your Google Calendar so therapists and practice coordinators can view client appointments with automated reminders.`,
      appointmentsList: dayAppointments,
      onConfirm: async () => {
        setIsConfirmProcessing(true);
        const res = await batchSyncAppointments(dayAppointments, clients, consultants);
        setIsConfirmProcessing(false);
        if (res.errors.length > 0) {
          setSyncFeedback({
            type: 'error',
            message: `Synced ${res.syncedCount} of ${dayAppointments.length} sessions. Notice: ${res.errors[0]}`,
          });
        } else {
          setSyncFeedback({
            type: 'success',
            message: `Successfully synchronized ${res.syncedCount} sessions to Google Calendar!`,
          });
          setTimeout(() => setSyncFeedback(null), 4000);
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Control Zone */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Date Selector & Navigation */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => changeDateBy(-1)}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-750 transition-colors cursor-pointer"
                title="Previous day"
                aria-label="Previous day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate(todayStr)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  isToday 
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold' 
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-750'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => changeDateBy(1)}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-750 transition-colors cursor-pointer"
                title="Next day"
                aria-label="Next day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  {formattedSelectedDate}
                </h2>
                {isToday && (
                  <span className="text-xs font-semibold text-teal-700 dark:text-teal-400">
                    · Today
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Daily clinical schedule and appointments
              </p>
            </div>
          </div>

          {/* Sub-view Switcher & Action */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setCalendarSubMode('timeline')}
                className={`px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  calendarSubMode === 'timeline'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Timeline</span>
              </button>
              <button
                type="button"
                onClick={() => setCalendarSubMode('lanes')}
                className={`px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  calendarSubMode === 'lanes'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Clinician lanes</span>
              </button>
              <button
                type="button"
                onClick={() => setCalendarSubMode('week')}
                className={`px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  calendarSubMode === 'week'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Week</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => onOpenScheduleModal(undefined, undefined, selectedDate)}
              className="btn-theme-primary px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Book appointment</span>
            </button>
          </div>

        </div>

        {/* Day Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-wider">Scheduled</div>
            <div className="text-base font-bold text-slate-900 dark:text-white font-mono mt-0.5">{totalDaySessions} sessions</div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-wider">Completed</div>
            <div className="text-base font-bold text-emerald-700 dark:text-emerald-400 font-mono mt-0.5">{completedSessions} of {totalDaySessions}</div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-wider">In-person</div>
            <div className="text-base font-bold text-slate-800 dark:text-slate-200 font-mono mt-0.5">{inPersonCount}</div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-wider">Online</div>
            <div className="text-base font-bold text-slate-800 dark:text-slate-200 font-mono mt-0.5">{onlineCount}</div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-wider">Day revenue</div>
            <div className="text-base font-bold text-slate-900 dark:text-white font-mono mt-0.5">${estimatedDayRevenue}</div>
          </div>
        </div>

        {/* Clinicians Filter */}
        <div className="pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 dark:text-white">
                {providerPlural}
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                · Filter schedule by assigned {providerSingular.toLowerCase()}
              </span>
            </div>
            {selectedConsultantId !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedConsultantId('all')}
                className="text-xs text-teal-700 dark:text-teal-400 hover:text-teal-900 font-semibold underline cursor-pointer"
              >
                Show all clinicians
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedConsultantId('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                selectedConsultantId === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 shadow-xs font-bold'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              All Clinicians ({consultants.length})
            </button>

            {consultants.map(c => {
              const isSelected = selectedConsultantId === c.id;
              const countToday = appointments.filter(
                a => a.date === selectedDate && a.consultantId === c.id && a.status !== 'cancelled'
              ).length;

              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedConsultantId(isSelected ? 'all' : c.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer border shadow-2xs ${
                    isSelected
                      ? 'text-white shadow-xs ring-2 ring-offset-1 font-bold'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                  style={{
                    backgroundColor: isSelected ? c.colorHex : undefined,
                    borderColor: isSelected ? c.colorHex : undefined,
                  }}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: c.colorHex }}
                  />
                  <span>{c.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    isSelected 
                      ? 'bg-black/25 text-white' 
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                    {countToday}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search today by client or clinician..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Modality:</span>
            <button
              type="button"
              onClick={() => setModalityFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                modalityFilter === 'all' 
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-bold' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setModalityFilter('In-person')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                modalityFilter === 'In-person' 
                  ? 'border-theme-active bg-theme-subtle text-theme-primary font-bold shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <MapPin className="w-3 h-3" />
              In-person
            </button>
            <button
              type="button"
              onClick={() => setModalityFilter('Online')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                modalityFilter === 'Online' 
                  ? 'border-theme-active bg-theme-subtle text-theme-primary font-bold shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Video className="w-3 h-3" />
              Online
            </button>
          </div>
        </div>

        {/* Google Calendar Integration Toolbar */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
          {isConnected ? (
            <div className="bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 rounded-xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <CalendarDays className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">Google Calendar connected</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[11px] text-teal-800 dark:text-teal-300 font-medium">({user?.email})</span>
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                    {Object.keys(syncedRecords).length} sessions synced · {lastSyncTime ? `Last sync: ${lastSyncTime}` : 'Ready to sync'}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowGCalOverlay(!showGCalOverlay)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    showGCalOverlay 
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white' 
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <CalendarIcon className="w-3.5 h-3.5" />
                  <span>{showGCalOverlay ? 'Hide calendar events' : `Calendar events (${googleEvents.length})`}</span>
                </button>

                <button
                  type="button"
                  onClick={handleTriggerBatchSync}
                  disabled={isSyncing || dayAppointments.length === 0}
                  className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>Sync day to Google Calendar</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-xs">
                  <CalendarDays className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Connect Google Calendar</div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Synchronize sessions with clinician assignments and locations to your Google Calendar.
                  </div>
                </div>
              </div>

              <GoogleSignInButton
                onClick={connectGoogleCalendar}
                isLoading={isConnecting}
                size="sm"
                label="Connect Google Calendar"
              />
            </div>
          )}

          {/* Sync Feedback Alert */}
          {syncFeedback && (
            <div className={`mt-2.5 p-2.5 rounded-lg text-xs flex items-center justify-between ${
              syncFeedback.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span className="font-semibold">{syncFeedback.message}</span>
              </div>
              <button
                onClick={() => setSyncFeedback(null)}
                className="text-xs font-bold hover:underline"
              >
                ✕
              </button>
            </div>
          )}

          {/* External Google Calendar Overlay Card */}
          {isConnected && showGCalOverlay && (
            <div className="mt-3 p-3.5 bg-white border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4 text-teal-600" />
                  <span>Google Calendar Events for {formattedSelectedDate}</span>
                </div>
                <button
                  onClick={() => fetchDayEvents(selectedDate)}
                  className="text-teal-700 hover:text-teal-900 font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Refresh</span>
                </button>
              </div>

              {googleEvents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                  {googleEvents.map((gev) => {
                    const startLocal = gev.start.dateTime 
                      ? new Date(gev.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : gev.start.date || 'All Day';
                    const endLocal = gev.end.dateTime
                      ? new Date(gev.end.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '';

                    return (
                      <div key={gev.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                        <div className="font-bold text-slate-900 truncate">{gev.summary || '(Untitled Event)'}</div>
                        <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                          {startLocal} {endLocal && `– ${endLocal}`}
                        </div>
                        {gev.location && (
                          <div className="text-[10px] text-slate-400 truncate mt-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{gev.location}</span>
                          </div>
                        )}
                        {gev.htmlLink && (
                          <a
                            href={gev.htmlLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-teal-700 hover:underline font-semibold"
                          >
                            <span>Open in Google Calendar</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-xs text-slate-400 py-2 italic text-center">
                  No other external events found on your primary Google Calendar for this date.
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Main Calendar Content Based on Sub-Mode */}
      {calendarSubMode === 'timeline' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          
          <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>Hours (8:00 AM – 6:00 PM)</span>
            <span>{dayAppointments.length} {dayAppointments.length === 1 ? 'session' : 'sessions'} scheduled for {formattedSelectedDate}</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {HOURS.map((hour) => {
              // Find all sessions starting within this 30-min window
              const matchingSessions = dayAppointments.filter(a => {
                return a.time === hour || (a.time.startsWith(hour.slice(0, 2)) && Math.abs(parseInt(a.time.slice(3, 5)) - parseInt(hour.slice(3, 5))) < 20);
              });

              return (
                <div key={hour} className="group hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors flex items-start min-h-[64px]">
                  
                  {/* Left Hour Column */}
                  <div className="w-20 shrink-0 py-3 px-4 text-xs font-mono font-medium text-slate-500 dark:text-slate-400 border-r border-slate-100 dark:border-slate-800">
                    {hour}
                  </div>

                  {/* Right Content / Sessions Area */}
                  <div className="flex-1 p-2 flex flex-wrap gap-2.5 items-center">
                    {matchingSessions.length > 0 ? (
                      matchingSessions.map(session => {
                        const consultant = consultants.find(c => c.id === session.consultantId);
                        const clientObj = clients.find(c => c.id === session.clientId);
                        const isCompleted = session.status === 'completed';

                        return (
                          <div
                            key={session.id}
                            onClick={() => onSelectAppointment(session)}
                            className="flex-1 min-w-[280px] max-w-xl p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 border-l-4 transition-all cursor-pointer hover:shadow-md relative overflow-hidden group/card dark:bg-slate-900"
                            style={{
                              borderLeftColor: consultant?.colorHex || '#0d9488',
                              backgroundColor: `${consultant?.colorHex || '#0d9488'}0c`,
                            }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span
                                    className="px-2 py-0.5 rounded-md text-[11px] font-bold text-white shadow-2xs"
                                    style={{ backgroundColor: consultant?.colorHex || '#0d9488' }}
                                  >
                                    {session.consultantName}
                                  </span>
                                  <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">
                                    {session.time} ({session.durationMinutes}m)
                                  </span>
                                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                                    · {formatModality(session.modality)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                    {session.clientName}
                                  </h4>
                                  {clientObj && (
                                    <WhatsAppButton
                                      phone={clientObj.phone}
                                      clientName={session.clientName}
                                      consultantName={session.consultantName}
                                      date={session.date}
                                      time={session.time}
                                      sessionType={session.sessionType}
                                      template="reminder"
                                      variant="icon"
                                    />
                                  )}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                                  {session.sessionType}
                                </div>
                              </div>

                              <div className="flex flex-col items-end gap-1.5 shrink-0">
                                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 capitalize">
                                  <span className={`w-1.5 h-1.5 rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-sky-500'}`} />
                                  {session.status}
                                </span>
                                <span className="text-[11px] font-mono font-medium text-slate-600">
                                  ${session.fee} · {session.paymentStatus}
                                </span>
                              </div>
                            </div>

                            {/* Location Pill & Notes Preview */}
                            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                              <div className="flex items-center gap-1.5">
                                {formatModality(session.modality) === 'In-person' ? (
                                  <>
                                    <MapPin className="w-3.5 h-3.5 text-theme-primary" />
                                    <span>{session.locationDetails || 'In-person'}</span>
                                  </>
                                ) : (
                                  <>
                                    <Video className="w-3.5 h-3.5 text-theme-primary" />
                                    <span className="text-theme-primary font-medium">Online session</span>
                                  </>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                {/* Google Calendar Sync Badge / Trigger */}
                                {syncedRecords[session.id] ? (
                                  <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                    <CalendarCheck className="w-3 h-3 text-emerald-600" />
                                    <span>G-Cal</span>
                                    {syncedRecords[session.id].htmlLink && (
                                      <a
                                        href={syncedRecords[session.id].htmlLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        title="Open event in Google Calendar"
                                        className="text-emerald-700 hover:text-emerald-950 ml-0.5"
                                      >
                                        <ExternalLink className="w-2.5 h-2.5" />
                                      </a>
                                    )}
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleTriggerSingleSync(session);
                                    }}
                                    title="Sync session to Google Calendar"
                                    className="text-[10px] font-bold text-slate-600 hover:text-teal-800 bg-slate-100 hover:bg-teal-50 px-2 py-0.5 rounded-md border border-slate-200 hover:border-teal-300 transition-colors flex items-center gap-1 cursor-pointer"
                                  >
                                    <CalendarDays className="w-3 h-3 text-teal-600" />
                                    <span>+ G-Cal</span>
                                  </button>
                                )}

                                {clientObj && (
                                  <WhatsAppButton
                                    phone={clientObj.phone}
                                    clientName={session.clientName}
                                    consultantName={session.consultantName}
                                    date={session.date}
                                    time={session.time}
                                    sessionType={session.sessionType}
                                    template="reminder"
                                    variant="badge"
                                    label="WhatsApp"
                                  />
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectAppointment(session);
                                  }}
                                  className="text-teal-700 hover:text-teal-900 font-bold"
                                >
                                  View →
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <button
                        onClick={() => onOpenScheduleModal(hour, selectedConsultantId !== 'all' ? selectedConsultantId : undefined, selectedDate)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-slate-400 hover:text-teal-700 font-medium py-1 px-3 rounded-lg hover:bg-teal-50 border border-transparent hover:border-teal-200 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Schedule session at {hour}</span>
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* Side-by-Side Consultant Lanes Mode */}
      {calendarSubMode === 'lanes' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-4 overflow-x-auto">
          <div className="min-w-[900px] grid grid-cols-5 gap-4">
            {consultants.map(c => {
              const consultantSessions = appointments.filter(
                a => a.date === selectedDate && a.consultantId === c.id && a.status !== 'cancelled'
              ).sort((a, b) => a.time.localeCompare(b.time));

              return (
                <div key={c.id} className="flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 overflow-hidden">
                  
                  {/* Consultant Column Header */}
                  <div 
                    className="p-3 text-white border-b border-black/10"
                    style={{ backgroundColor: c.colorHex }}
                  >
                    <div className="font-bold text-sm tracking-tight truncate">{c.name}</div>
                    <div className="text-[11px] opacity-90 truncate">{c.credentials}</div>
                    <div className="mt-1 flex items-center justify-between text-[10px] font-bold">
                      <span>{consultantSessions.length} {consultantSessions.length === 1 ? 'session' : 'sessions'}</span>
                      <button
                        onClick={() => onOpenScheduleModal('10:00', c.id, selectedDate)}
                        className="p-1 rounded bg-black/20 hover:bg-black/30 transition-colors cursor-pointer"
                        title="Book appointment for this clinician"
                      >
                        <Plus className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  </div>

                  {/* Sessions Lane Body */}
                  <div className="p-2 space-y-2.5 flex-1 min-h-[350px]">
                    {consultantSessions.length > 0 ? (
                      consultantSessions.map(session => {
                        const clientObj = clients.find(c => c.id === session.clientId);

                        return (
                          <div
                            key={session.id}
                            onClick={() => onSelectAppointment(session)}
                            className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 border-l-4 shadow-xs hover:shadow-md transition-all cursor-pointer bg-white dark:bg-slate-900"
                            style={{
                              borderLeftColor: c.colorHex,
                            }}
                          >
                            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 mb-1">
                              <span className="font-bold text-slate-900 dark:text-white">{session.time}</span>
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 capitalize">
                                <span className={`w-1.5 h-1.5 rounded-full ${session.status === 'completed' ? 'bg-emerald-500' : 'bg-sky-500'}`} />
                                {session.status}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                                {session.clientName}
                              </span>
                              {clientObj && (
                                <WhatsAppButton
                                  phone={clientObj.phone}
                                  clientName={session.clientName}
                                  consultantName={session.consultantName}
                                  date={session.date}
                                  time={session.time}
                                  sessionType={session.sessionType}
                                  template="reminder"
                                  variant="icon"
                                />
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                              {session.sessionType}
                            </div>
                            <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                              <div className="flex items-center gap-1">
                                <span>{formatModality(session.modality)}</span>
                                {syncedRecords[session.id] ? (
                                  <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800" title="Synced to Google Calendar">
                                    Google Cal
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleTriggerSingleSync(session);
                                    }}
                                    title="Sync to Google Calendar"
                                    className="text-[9px] font-bold text-slate-500 hover:text-teal-700 dark:hover:text-teal-400 underline cursor-pointer"
                                  >
                                    +Sync
                                  </button>
                                )}
                              </div>
                              <span className="font-mono font-semibold text-slate-900 dark:text-slate-200">${session.fee}</span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400 dark:text-slate-500 text-xs">
                        <CalendarIcon className="w-6 h-6 mb-1 text-slate-300 dark:text-slate-600" />
                        <div>No appointments today</div>
                        <button
                          onClick={() => onOpenScheduleModal('10:00', c.id, selectedDate)}
                          className="mt-2 text-teal-700 dark:text-teal-400 font-bold hover:underline cursor-pointer"
                        >
                          + Book appointment
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week View Mode */}
      {calendarSubMode === 'week' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-4">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
            7-day schedule across clinicians
          </div>
          <div className="grid grid-cols-7 gap-3 text-xs">
            {[-3, -2, -1, 0, 1, 2, 3].map(offset => {
              const dStr = getRelativeDate(offset);
              const dateObj = new Date(dStr + 'T00:00:00');
              const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
              const dayNum = dateObj.getDate();
              const isSelected = dStr === selectedDate;
              const isCurrentDay = dStr === todayStr;

              const sessionsOnDay = appointments.filter(a => a.date === dStr && a.status !== 'cancelled');

              return (
                <div
                  key={dStr}
                  onClick={() => setSelectedDate(dStr)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'border-slate-900 dark:border-slate-100 bg-slate-50 dark:bg-slate-800/80 ring-2 ring-slate-900 dark:ring-slate-100 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-700 dark:text-slate-300">{dayName}</span>
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                      isCurrentDay ? 'bg-teal-600 text-white' : 'text-slate-900 dark:text-white'
                    }`}>
                      {dayNum}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-2">
                    {sessionsOnDay.length} {sessionsOnDay.length === 1 ? 'appointment' : 'appointments'}
                  </div>
                  
                  {/* Color-Coordinated Consultant Event Strips */}
                  <div className="space-y-1.5 mt-2">
                    {sessionsOnDay.slice(0, 5).map(s => {
                      const c = consultants.find(con => con.id === s.consultantId);
                      return (
                        <div
                          key={s.id}
                          className="w-full px-2 py-1 rounded-md border-l-3 text-[10px] font-medium truncate flex items-center justify-between gap-1 shadow-2xs"
                          style={{
                            borderLeftColor: c?.colorHex || '#0d9488',
                            backgroundColor: `${c?.colorHex || '#0d9488'}15`,
                            color: c?.colorHex || '#0d9488',
                          }}
                          title={`${s.consultantName}: ${s.clientName} (${s.time})`}
                        >
                          <span className="font-bold truncate text-slate-800 dark:text-slate-200">
                            {s.clientName}
                          </span>
                          <span className="font-mono text-[9px] font-semibold opacity-90 shrink-0">
                            {s.time}
                          </span>
                        </div>
                      );
                    })}
                    {sessionsOnDay.length > 5 && (
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold text-center">
                        +{sessionsOnDay.length - 5} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Google Calendar Permission & Action Confirmation Modal */}
      <GoogleCalendarConfirmModal
        isOpen={!!confirmData}
        onClose={() => setConfirmData(null)}
        data={confirmData}
        isProcessing={isConfirmProcessing}
      />

    </div>
  );
};
