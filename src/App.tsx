/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthWorkspaceProvider, useAuthWorkspace } from './context/AuthWorkspaceContext';
import { ClinicProvider, useClinic } from './context/ClinicContext';
import { GoogleCalendarProvider } from './context/GoogleCalendarContext';

import { GoogleSignInGate } from './components/auth/GoogleSignInGate';
import { WorkspaceSelectionScreen } from './components/workspace/WorkspaceSelectionScreen';
import { WorkspaceSettingsView } from './components/workspace/WorkspaceSettingsView';

import { Header } from './components/Header';
import { CalendarView } from './components/CalendarView';
import { RequestsView } from './components/RequestsView';
import { AppointmentsLogView } from './components/AppointmentsLogView';
import { ClientsView } from './components/ClientsView';
import { ConsultantsView } from './components/ConsultantsView';

import { ScheduleModal } from './components/modals/ScheduleModal';
import { AppointmentDetailModal } from './components/modals/AppointmentDetailModal';
import { AcceptRejectModal } from './components/modals/AcceptRejectModal';
import { NewClientModal } from './components/modals/NewClientModal';
import { ClientDetailModal } from './components/modals/ClientDetailModal';

import { Appointment, Client } from './types/clinic';

function MainClinicApp() {
  const { activeTab, setActiveTab } = useClinic();
  const { currentWorkspace, isCreator } = useAuthWorkspace();

  // Modal states
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [scheduleDefaultTime, setScheduleDefaultTime] = useState<string | undefined>();
  const [scheduleDefaultConsultantId, setScheduleDefaultConsultantId] = useState<string | undefined>();
  const [scheduleDefaultDate, setScheduleDefaultDate] = useState<string | undefined>();
  const [scheduleDefaultClientId, setScheduleDefaultClientId] = useState<string | undefined>();

  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [triageAppointment, setTriageAppointment] = useState<Appointment | null>(null);
  const [triageMode, setTriageMode] = useState<'accept' | 'reject'>('accept');
  const [isAcceptRejectOpen, setIsAcceptRejectOpen] = useState(false);

  const [isNewClientOpen, setIsNewClientOpen] = useState(false);

  const [selectedClientForModal, setSelectedClientForModal] = useState<Client | null>(null);
  const [isClientDetailModalOpen, setIsClientDetailModalOpen] = useState(false);

  const enabled = currentWorkspace?.enabledFeatures || {
    requestsTriage: true,
    paymentsLedger: true,
    consultantsCaseload: true,
    googleCalendarSync: true,
  };

  // Modal openers
  const handleOpenClientDetailModal = (client: Client) => {
    setSelectedClientForModal(client);
    setIsClientDetailModalOpen(true);
  };

  const handleOpenScheduleModal = (
    defaultTime?: string,
    defaultConsultantId?: string,
    defaultDate?: string,
    defaultClientId?: string
  ) => {
    setScheduleDefaultTime(defaultTime);
    setScheduleDefaultConsultantId(defaultConsultantId);
    setScheduleDefaultDate(defaultDate);
    setScheduleDefaultClientId(defaultClientId);
    setIsScheduleOpen(true);
  };

  const handleSelectAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDetailOpen(true);
  };

  const handleOpenAcceptRejectModal = (appointment: Appointment, mode: 'accept' | 'reject') => {
    setTriageAppointment(appointment);
    setTriageMode(mode);
    setIsAcceptRejectOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans antialiased selection:bg-slate-200 dark:selection:bg-slate-800 transition-colors duration-200">
      
      {/* Top Header & Navigation with Workspace Info and Theme Toggle */}
      <Header onOpenScheduleModal={() => handleOpenScheduleModal()} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Creator Settings View */}
        {activeTab === 'settings' && isCreator && (
          <WorkspaceSettingsView />
        )}

        {/* Calendar View (Always Core) */}
        {activeTab === 'calendar' && (
          <CalendarView
            onOpenScheduleModal={handleOpenScheduleModal}
            onSelectAppointment={handleSelectAppointment}
          />
        )}

        {/* Requests & Triage Queue (If enabled) */}
        {activeTab === 'requests' && enabled.requestsTriage && (
          <RequestsView
            onOpenAcceptRejectModal={handleOpenAcceptRejectModal}
            onSelectAppointment={handleSelectAppointment}
          />
        )}

        {/* Appointments Log (Always Core) */}
        {activeTab === 'appointments' && (
          <AppointmentsLogView
            onOpenScheduleModal={() => handleOpenScheduleModal()}
            onSelectAppointment={handleSelectAppointment}
            onOpenClientDetailModal={handleOpenClientDetailModal}
          />
        )}

        {/* Clients Directory (Always Core) */}
        {activeTab === 'clients' && (
          <ClientsView
            onOpenNewClientModal={() => setIsNewClientOpen(true)}
            onOpenScheduleModal={handleOpenScheduleModal}
            onOpenClientDetailModal={handleOpenClientDetailModal}
          />
        )}

        {/* Clinical Team / Consultants Caseload (If enabled) */}
        {activeTab === 'consultants' && enabled.consultantsCaseload && (
          <ConsultantsView
            onOpenScheduleModal={handleOpenScheduleModal}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="no-print bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-4 text-xs text-slate-500 dark:text-slate-400 text-center transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            {currentWorkspace?.name} · Practice management
          </div>
          <div className="text-slate-400 dark:text-slate-500">
            Confidential clinical records · Workspace code: <span className="font-mono">{currentWorkspace?.accessCode}</span>
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      <ScheduleModal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        defaultTime={scheduleDefaultTime}
        defaultConsultantId={scheduleDefaultConsultantId}
        defaultDate={scheduleDefaultDate}
        defaultClientId={scheduleDefaultClientId}
      />

      <AppointmentDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        appointment={selectedAppointment}
        onOpenClientDetailModal={handleOpenClientDetailModal}
      />

      <ClientDetailModal
        client={selectedClientForModal}
        isOpen={isClientDetailModalOpen}
        onClose={() => setIsClientDetailModalOpen(false)}
        onOpenScheduleModal={handleOpenScheduleModal}
      />

      <AcceptRejectModal
        isOpen={isAcceptRejectOpen}
        onClose={() => setIsAcceptRejectOpen(false)}
        appointment={triageAppointment}
        defaultMode={triageMode}
      />

      <NewClientModal
        isOpen={isNewClientOpen}
        onClose={() => setIsNewClientOpen(false)}
      />

    </div>
  );
}

function AppShell() {
  const { user, currentWorkspace, userRole, isConfiguringNewWorkspace, isLoadingAuth } = useAuthWorkspace();

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500 text-xs">
          <div className="w-8 h-8 border-2 border-theme-primary border-t-transparent rounded-full animate-spin" />
          <span>Authenticating clinical session...</span>
        </div>
      </div>
    );
  }

  // 1. COMPULSORY GOOGLE SIGN-IN GATEWAY
  if (!user) {
    return <GoogleSignInGate />;
  }

  // 2. WORKSPACE SELECTION / CREATION / JOINING GATEWAY
  if (!currentWorkspace || userRole === null || isConfiguringNewWorkspace) {
    return <WorkspaceSelectionScreen />;
  }

  // 3. MAIN PRACTICE OS
  return <MainClinicApp />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthWorkspaceProvider>
        <ClinicProvider>
          <GoogleCalendarProvider>
            <AppShell />
          </GoogleCalendarProvider>
        </ClinicProvider>
      </AuthWorkspaceProvider>
    </ThemeProvider>
  );
}
