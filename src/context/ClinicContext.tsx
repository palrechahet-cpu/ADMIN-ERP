import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Consultant, 
  Client, 
  Appointment, 
  PaymentRecord, 
  ViewTab,
  SessionStatus,
  PaymentStatus,
  Modality 
} from '../types/clinic';
import { 
  INITIAL_CONSULTANTS, 
  INITIAL_CLIENTS, 
  createInitialAppointments, 
  createInitialPayments, 
  getRelativeDate 
} from '../data/mockClinicData';

interface ClinicContextType {
  consultants: Consultant[];
  clients: Client[];
  appointments: Appointment[];
  payments: PaymentRecord[];
  activeTab: ViewTab;
  setActiveTab: (tab: ViewTab) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  selectedConsultantId: string | 'all';
  setSelectedConsultantId: (id: string | 'all') => void;
  
  // Appointment actions
  addAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt'>) => Appointment;
  updateAppointmentStatus: (id: string, status: SessionStatus, notes?: string, rejectionReason?: string) => void;
  rescheduleAppointment: (id: string, newDate: string, newTime: string, newModality?: Modality, newLocation?: string) => void;
  acceptAppointmentRequest: (id: string, coordinatorNotes?: string, assignedRoomOrLink?: string) => void;
  rejectAppointmentRequest: (id: string, reason: string, reassignedConsultantId?: string) => void;
  
  // Payment actions
  recordPayment: (payment: Omit<PaymentRecord, 'id'>) => void;
  markInvoicePaid: (invoiceId: string, method?: PaymentRecord['method'], notes?: string) => void;
  
  // Client actions
  addClient: (client: Omit<Client, 'id' | 'totalSessionsAttended'>) => Client;
  updateClient: (id: string, updates: Partial<Client>) => void;
  
  // State reset
  resetAllData: () => void;
  
  // Counts & Quick Helpers
  pendingRequestsCount: number;
  todaySessionsCount: number;
}

const STORAGE_KEYS = {
  CONSULTANTS: 'mindwell_consultants_v1',
  CLIENTS: 'mindwell_clients_v1',
  APPOINTMENTS: 'mindwell_appointments_v1',
  PAYMENTS: 'mindwell_payments_v1',
};

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

export const ClinicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const todayStr = getRelativeDate(0);

  // Initialize state from localStorage or fallbacks
  const [consultants, setConsultants] = useState<Consultant[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CONSULTANTS);
      return saved ? JSON.parse(saved) : INITIAL_CONSULTANTS;
    } catch {
      return INITIAL_CONSULTANTS;
    }
  });

  const [clients, setClients] = useState<Client[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CLIENTS);
      return saved ? JSON.parse(saved) : INITIAL_CLIENTS;
    } catch {
      return INITIAL_CLIENTS;
    }
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
      return saved ? JSON.parse(saved) : createInitialAppointments();
    } catch {
      return createInitialAppointments();
    }
  });

  const [payments, setPayments] = useState<PaymentRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
      return saved ? JSON.parse(saved) : createInitialPayments();
    } catch {
      return createInitialPayments();
    }
  });

  const [activeTab, setActiveTab] = useState<ViewTab>('calendar');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedConsultantId, setSelectedConsultantId] = useState<string | 'all'>('all');

  // Persistence effects
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CONSULTANTS, JSON.stringify(consultants));
    } catch (e) {
      console.error(e);
    }
  }, [consultants]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
    } catch (e) {
      console.error(e);
    }
  }, [clients]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
    } catch (e) {
      console.error(e);
    }
  }, [appointments]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
    } catch (e) {
      console.error(e);
    }
  }, [payments]);

  // Appointment actions
  const addAppointment = (apptData: Omit<Appointment, 'id' | 'createdAt'>): Appointment => {
    const newId = `apt-${Date.now()}`;
    const newAppt: Appointment = {
      ...apptData,
      id: newId,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setAppointments(prev => [newAppt, ...prev]);

    // Automatically create a corresponding billing record
    const invoiceNum = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newPayment: PaymentRecord = {
      id: `pay-${Date.now()}`,
      invoiceNumber: invoiceNum,
      appointmentId: newId,
      clientId: apptData.clientId,
      clientName: apptData.clientName,
      consultantName: apptData.consultantName,
      date: apptData.date,
      amount: apptData.fee,
      method: 'Credit Card',
      status: apptData.paymentStatus,
      cptCode: apptData.cptCode,
      notes: `Generated on booking for ${apptData.sessionType}`,
      paidAt: apptData.paymentStatus === 'Paid' ? `${apptData.date} ${apptData.time}` : undefined,
    };
    setPayments(prev => [newPayment, ...prev]);

    // Increment client attended sessions count if already completed, or keep track
    setClients(prev => prev.map(c => {
      if (c.id === apptData.clientId && apptData.status === 'completed') {
        return { ...c, totalSessionsAttended: c.totalSessionsAttended + 1 };
      }
      return c;
    }));

    return newAppt;
  };

  const updateAppointmentStatus = (id: string, status: SessionStatus, notes?: string, rejectionReason?: string) => {
    setAppointments(prev => prev.map(a => {
      if (a.id === id) {
        return {
          ...a,
          status,
          coordinatorNotes: notes || a.coordinatorNotes,
          rejectionReason: rejectionReason || a.rejectionReason,
        };
      }
      return a;
    }));

    // If marked completed, update client session count
    if (status === 'completed') {
      const appt = appointments.find(a => a.id === id);
      if (appt) {
        setClients(prev => prev.map(c => {
          if (c.id === appt.clientId) {
            return { ...c, totalSessionsAttended: c.totalSessionsAttended + 1 };
          }
          return c;
        }));
      }
    }
  };

  const rescheduleAppointment = (id: string, newDate: string, newTime: string, newModality?: Modality, newLocation?: string) => {
    setAppointments(prev => prev.map(a => {
      if (a.id === id) {
        return {
          ...a,
          date: newDate,
          time: newTime,
          modality: newModality || a.modality,
          locationDetails: newLocation || a.locationDetails,
          coordinatorNotes: (a.coordinatorNotes ? a.coordinatorNotes + ' | ' : '') + `Rescheduled to ${newDate} at ${newTime}`,
        };
      }
      return a;
    }));
  };

  const acceptAppointmentRequest = (id: string, coordinatorNotes?: string, assignedRoomOrLink?: string) => {
    setAppointments(prev => prev.map(a => {
      if (a.id === id) {
        return {
          ...a,
          status: 'confirmed',
          coordinatorNotes: coordinatorNotes || 'Accepted by clinic coordinator. Notification sent to client and consultant.',
          locationDetails: assignedRoomOrLink || a.locationDetails,
        };
      }
      return a;
    }));
  };

  const rejectAppointmentRequest = (id: string, reason: string, reassignedConsultantId?: string) => {
    if (reassignedConsultantId) {
      const peer = consultants.find(c => c.id === reassignedConsultantId);
      if (peer) {
        setAppointments(prev => prev.map(a => {
          if (a.id === id) {
            return {
              ...a,
              status: 'confirmed',
              consultantId: peer.id,
              consultantName: peer.name,
              locationDetails: peer.room,
              coordinatorNotes: `Reassigned from original therapist to ${peer.name}. Reason: ${reason}`,
            };
          }
          return a;
        }));
        return;
      }
    }

    setAppointments(prev => prev.map(a => {
      if (a.id === id) {
        return {
          ...a,
          status: 'rejected',
          rejectionReason: reason,
          coordinatorNotes: `Declined on ${new Date().toLocaleDateString()}. Reason: ${reason}`,
        };
      }
      return a;
    }));
  };

  const recordPayment = (payData: Omit<PaymentRecord, 'id'>) => {
    const newRecord: PaymentRecord = {
      ...payData,
      id: `pay-${Date.now()}`,
      paidAt: payData.status === 'Paid' ? new Date().toISOString().replace('T', ' ').slice(0, 16) : undefined,
    };
    setPayments(prev => [newRecord, ...prev]);

    // Update appointment paymentStatus if matched
    if (payData.appointmentId) {
      setAppointments(prev => prev.map(a => {
        if (a.id === payData.appointmentId) {
          return { ...a, paymentStatus: payData.status };
        }
        return a;
      }));
    }
  };

  const markInvoicePaid = (invoiceId: string, method?: PaymentRecord['method'], notes?: string) => {
    setPayments(prev => prev.map(p => {
      if (p.id === invoiceId) {
        const updatedStatus: PaymentStatus = 'Paid';
        const paidAt = new Date().toISOString().replace('T', ' ').slice(0, 16);
        return {
          ...p,
          status: updatedStatus,
          method: method || p.method,
          notes: notes || p.notes,
          paidAt,
        };
      }
      return p;
    }));

    // Find and update related appointment
    const target = payments.find(p => p.id === invoiceId);
    if (target && target.appointmentId) {
      setAppointments(prev => prev.map(a => {
        if (a.id === target.appointmentId) {
          return { ...a, paymentStatus: 'Paid' };
        }
        return a;
      }));
    }
  };

  const addClient = (clientData: Omit<Client, 'id' | 'totalSessionsAttended'>): Client => {
    const newClient: Client = {
      ...clientData,
      id: `cl-${Date.now()}`,
      totalSessionsAttended: 0,
    };
    setClients(prev => [newClient, ...prev]);

    // Update consultant active caseload
    setConsultants(prev => prev.map(c => {
      if (c.id === clientData.assignedConsultantId) {
        return { ...c, activeCaseload: c.activeCaseload + 1 };
      }
      return c;
    }));

    return newClient;
  };

  const updateClient = (id: string, updates: Partial<Client>) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const resetAllData = () => {
    localStorage.removeItem(STORAGE_KEYS.CONSULTANTS);
    localStorage.removeItem(STORAGE_KEYS.CLIENTS);
    localStorage.removeItem(STORAGE_KEYS.APPOINTMENTS);
    localStorage.removeItem(STORAGE_KEYS.PAYMENTS);

    setConsultants(INITIAL_CONSULTANTS);
    setClients(INITIAL_CLIENTS);
    setAppointments(createInitialAppointments());
    setPayments(createInitialPayments());
  };

  const pendingRequestsCount = appointments.filter(a => a.status === 'pending').length;
  const todaySessionsCount = appointments.filter(a => a.date === todayStr && a.status !== 'cancelled' && a.status !== 'rejected').length;

  return (
    <ClinicContext.Provider
      value={{
        consultants,
        clients,
        appointments,
        payments,
        activeTab,
        setActiveTab,
        selectedDate,
        setSelectedDate,
        selectedConsultantId,
        setSelectedConsultantId,
        addAppointment,
        updateAppointmentStatus,
        rescheduleAppointment,
        acceptAppointmentRequest,
        rejectAppointmentRequest,
        recordPayment,
        markInvoicePaid,
        addClient,
        updateClient,
        resetAllData,
        pendingRequestsCount,
        todaySessionsCount,
      }}
    >
      {children}
    </ClinicContext.Provider>
  );
};

export const useClinic = () => {
  const context = useContext(ClinicContext);
  if (!context) {
    throw new Error('useClinic must be used within a ClinicProvider');
  }
  return context;
};
