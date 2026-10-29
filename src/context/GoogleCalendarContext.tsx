import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { 
  initAuth, 
  googleSignIn, 
  logout as authLogout, 
  getAccessToken, 
  setCachedAccessToken 
} from '../utils/googleAuth';
import { 
  GoogleCalendarEvent, 
  listGoogleCalendarEvents, 
  insertGoogleCalendarEvent, 
  updateGoogleCalendarEvent, 
  deleteGoogleCalendarEvent,
  formatToLocalISOString
} from '../utils/googleCalendar';
import { Appointment, Client, Consultant } from '../types/clinic';

export interface SyncedEventRecord {
  appointmentId: string;
  googleEventId: string;
  htmlLink?: string;
  syncedAt: string;
}

interface GoogleCalendarContextType {
  user: User | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  googleEvents: GoogleCalendarEvent[];
  syncedRecords: Record<string, SyncedEventRecord>;
  lastSyncTime: string | null;
  isSyncing: boolean;
  
  // Auth operations
  connectGoogleCalendar: () => Promise<boolean>;
  disconnectGoogleCalendar: () => Promise<void>;
  
  // Calendar operations
  syncAppointment: (
    appointment: Appointment, 
    client?: Client, 
    consultant?: Consultant
  ) => Promise<{ success: boolean; eventId?: string; htmlLink?: string; error?: string }>;
  
  deleteSyncedAppointment: (appointmentId: string) => Promise<{ success: boolean; error?: string }>;
  
  batchSyncAppointments: (
    appointments: Appointment[], 
    clients: Client[], 
    consultants: Consultant[]
  ) => Promise<{ syncedCount: number; errors: string[] }>;
  
  fetchDayEvents: (dateStr: string) => Promise<GoogleCalendarEvent[]>;
  clearError: () => void;
}

const STORAGE_KEY_SYNCED_RECORDS = 'mindwell_gcal_synced_records_v1';
const STORAGE_KEY_LAST_SYNC = 'mindwell_gcal_last_sync_v1';

const GoogleCalendarContext = createContext<GoogleCalendarContextType | undefined>(undefined);

export const GoogleCalendarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEvent[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY_LAST_SYNC);
  });

  // Synced mappings stored persistently so links remain accessible
  const [syncedRecords, setSyncedRecords] = useState<Record<string, SyncedEventRecord>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SYNCED_RECORDS);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Persist synced records
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SYNCED_RECORDS, JSON.stringify(syncedRecords));
    } catch (e) {
      console.error('Failed to persist synced records:', e);
    }
  }, [syncedRecords]);

  // Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, currentToken) => {
        setUser(currentUser);
        if (currentToken) {
          setToken(currentToken);
        }
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );

    return () => unsubscribe();
  }, []);

  const connectGoogleCalendar = async (): Promise<boolean> => {
    setIsConnecting(true);
    setError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Google Calendar authorization failed:', err);
      setError(err.message || 'Failed to authenticate with Google Calendar');
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectGoogleCalendar = async () => {
    try {
      await authLogout();
      setUser(null);
      setToken(null);
      setGoogleEvents([]);
    } catch (err: any) {
      console.error('Error signing out:', err);
    }
  };

  // Helper to ensure a valid access token exists
  const getValidToken = async (): Promise<string> => {
    let activeToken = token;
    if (!activeToken) {
      activeToken = await getAccessToken();
    }
    if (!activeToken) {
      // Prompt user to connect if token is absent
      const success = await connectGoogleCalendar();
      if (!success) {
        throw new Error('Please connect your Google Calendar account first.');
      }
      activeToken = await getAccessToken();
    }
    if (!activeToken) {
      throw new Error('Unable to retrieve Google Calendar access token.');
    }
    return activeToken;
  };

  // Fetch events for a given day
  const fetchDayEvents = useCallback(async (dateStr: string): Promise<GoogleCalendarEvent[]> => {
    try {
      const activeToken = await getAccessToken();
      if (!activeToken) return [];

      const start = new Date(`${dateStr}T00:00:00Z`).toISOString();
      const end = new Date(`${dateStr}T23:59:59Z`).toISOString();

      const events = await listGoogleCalendarEvents(activeToken, start, end);
      setGoogleEvents(events);
      return events;
    } catch (err: any) {
      console.warn('Could not fetch Google Calendar events for day:', err.message);
      return [];
    }
  }, []);

  // Sync a single appointment
  const syncAppointment = async (
    appointment: Appointment,
    client?: Client,
    consultant?: Consultant
  ): Promise<{ success: boolean; eventId?: string; htmlLink?: string; error?: string }> => {
    setIsSyncing(true);
    setError(null);
    try {
      const activeToken = await getValidToken();
      const existingSync = syncedRecords[appointment.id];

      let resultEvent: GoogleCalendarEvent;

      if (existingSync?.googleEventId) {
        try {
          resultEvent = await updateGoogleCalendarEvent(
            activeToken,
            existingSync.googleEventId,
            appointment,
            client,
            consultant
          );
        } catch {
          // If update failed (e.g. event was deleted directly in Google Calendar), re-insert
          resultEvent = await insertGoogleCalendarEvent(activeToken, appointment, client, consultant);
        }
      } else {
        resultEvent = await insertGoogleCalendarEvent(activeToken, appointment, client, consultant);
      }

      const newRecord: SyncedEventRecord = {
        appointmentId: appointment.id,
        googleEventId: resultEvent.id,
        htmlLink: resultEvent.htmlLink,
        syncedAt: new Date().toISOString(),
      };

      setSyncedRecords(prev => ({
        ...prev,
        [appointment.id]: newRecord,
      }));

      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSyncTime(nowStr);
      localStorage.setItem(STORAGE_KEY_LAST_SYNC, nowStr);

      return {
        success: true,
        eventId: resultEvent.id,
        htmlLink: resultEvent.htmlLink,
      };
    } catch (err: any) {
      const msg = err.message || 'Failed to sync appointment with Google Calendar';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsSyncing(false);
    }
  };

  // Delete synced appointment from Google Calendar
  const deleteSyncedAppointment = async (
    appointmentId: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsSyncing(true);
    setError(null);
    try {
      const existingSync = syncedRecords[appointmentId];
      if (!existingSync?.googleEventId) {
        return { success: true };
      }

      const activeToken = await getValidToken();
      await deleteGoogleCalendarEvent(activeToken, existingSync.googleEventId);

      setSyncedRecords(prev => {
        const updated = { ...prev };
        delete updated[appointmentId];
        return updated;
      });

      return { success: true };
    } catch (err: any) {
      const msg = err.message || 'Failed to delete appointment from Google Calendar';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsSyncing(false);
    }
  };

  // Batch sync multiple appointments (e.g., all of today's appointments)
  const batchSyncAppointments = async (
    appointments: Appointment[],
    clients: Client[],
    consultants: Consultant[]
  ): Promise<{ syncedCount: number; errors: string[] }> => {
    setIsSyncing(true);
    setError(null);
    let syncedCount = 0;
    const errors: string[] = [];

    try {
      const activeToken = await getValidToken();

      for (const appt of appointments) {
        try {
          const client = clients.find(c => c.id === appt.clientId);
          const consultant = consultants.find(c => c.id === appt.consultantId);
          const existingSync = syncedRecords[appt.id];

          let resultEvent: GoogleCalendarEvent;
          if (existingSync?.googleEventId) {
            try {
              resultEvent = await updateGoogleCalendarEvent(activeToken, existingSync.googleEventId, appt, client, consultant);
            } catch {
              resultEvent = await insertGoogleCalendarEvent(activeToken, appt, client, consultant);
            }
          } else {
            resultEvent = await insertGoogleCalendarEvent(activeToken, appt, client, consultant);
          }

          setSyncedRecords(prev => ({
            ...prev,
            [appt.id]: {
              appointmentId: appt.id,
              googleEventId: resultEvent.id,
              htmlLink: resultEvent.htmlLink,
              syncedAt: new Date().toISOString(),
            },
          }));

          syncedCount++;
        } catch (singleErr: any) {
          errors.push(`${appt.clientName} (${appt.time}): ${singleErr.message}`);
        }
      }

      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSyncTime(nowStr);
      localStorage.setItem(STORAGE_KEY_LAST_SYNC, nowStr);

      return { syncedCount, errors };
    } catch (err: any) {
      setError(err.message || 'Batch calendar sync encountered an error');
      return { syncedCount, errors: [err.message] };
    } finally {
      setIsSyncing(false);
    }
  };

  const isConnected = !!user && !!token;

  return (
    <GoogleCalendarContext.Provider
      value={{
        user,
        isConnected,
        isConnecting,
        error,
        googleEvents,
        syncedRecords,
        lastSyncTime,
        isSyncing,
        connectGoogleCalendar,
        disconnectGoogleCalendar,
        syncAppointment,
        deleteSyncedAppointment,
        batchSyncAppointments,
        fetchDayEvents,
        clearError: () => setError(null),
      }}
    >
      {children}
    </GoogleCalendarContext.Provider>
  );
};

export const useGoogleCalendar = () => {
  const context = useContext(GoogleCalendarContext);
  if (!context) {
    throw new Error('useGoogleCalendar must be used within a GoogleCalendarProvider');
  }
  return context;
};
