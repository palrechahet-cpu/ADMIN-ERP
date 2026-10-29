import { Appointment, Client, Consultant } from '../types/clinic';

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  htmlLink?: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
}

const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

/**
 * Format local date and time string (YYYY-MM-DD and HH:MM) into an ISO string with local timezone offset
 */
export const formatToLocalISOString = (dateStr: string, timeStr: string, durationMinutes = 50) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const start = new Date(`${dateStr}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  return {
    startISO: start.toISOString(),
    endISO: end.toISOString(),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Los_Angeles',
  };
};

/**
 * Construct Google Calendar Event payload for a clinic appointment
 */
export const buildCalendarEventPayload = (
  appointment: Appointment,
  client?: Client,
  consultant?: Consultant
) => {
  const { startISO, endISO, timeZone } = formatToLocalISOString(
    appointment.date,
    appointment.time,
    appointment.durationMinutes
  );

  const summary = `MindWell: ${appointment.sessionType} - ${appointment.clientName}`;

  const descriptionLines = [
    `🗓️ MindWell Mental Health Clinical Session`,
    `----------------------------------------`,
    `Therapist: ${appointment.consultantName} ${consultant ? `(${consultant.credentials})` : ''}`,
    `Client: ${appointment.clientName} ${client ? `(${client.phone})` : ''}`,
    `Modality: ${appointment.modality}`,
    `Location / Room: ${appointment.locationDetails}`,
    `Service: ${appointment.sessionType} (CPT: ${appointment.cptCode})`,
    `Duration: ${appointment.durationMinutes} Minutes`,
    `Fee / Billing: $${appointment.fee} (${appointment.paymentStatus})`,
    appointment.coordinatorNotes ? `Coordinator Note: ${appointment.coordinatorNotes}` : '',
    `----------------------------------------`,
    `Automated calendar sync via MindWell Practice Management OS`,
  ].filter(Boolean);

  const attendees = [];
  if (client?.email) {
    attendees.push({
      email: client.email,
      displayName: client.name,
    });
  }
  if (consultant?.email) {
    attendees.push({
      email: consultant.email,
      displayName: consultant.name,
    });
  }

  return {
    summary,
    description: descriptionLines.join('\n'),
    location: appointment.locationDetails,
    start: {
      dateTime: startISO,
      timeZone,
    },
    end: {
      dateTime: endISO,
      timeZone,
    },
    attendees: attendees.length > 0 ? attendees : undefined,
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 1440 }, // 24 hours prior
        { method: 'popup', minutes: 30 },  // 30 mins prior
      ],
    },
    extendedProperties: {
      private: {
        mindwellAppointmentId: appointment.id,
        clientId: appointment.clientId,
        consultantId: appointment.consultantId,
        cptCode: appointment.cptCode,
      },
    },
  };
};

/**
 * List events from user's primary calendar within a time range
 */
export const listGoogleCalendarEvents = async (
  accessToken: string,
  timeMin?: string,
  timeMax?: string
): Promise<GoogleCalendarEvent[]> => {
  const params = new URLSearchParams({
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '100',
  });

  if (timeMin) params.set('timeMin', timeMin);
  if (timeMax) params.set('timeMax', timeMax);

  const response = await fetch(`${CALENDAR_API_BASE}?${params.toString()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to fetch Google Calendar events (${response.status})`);
  }

  const data = await response.json();
  return data.items || [];
};

/**
 * Insert a new appointment event into Google Calendar
 */
export const insertGoogleCalendarEvent = async (
  accessToken: string,
  appointment: Appointment,
  client?: Client,
  consultant?: Consultant
): Promise<GoogleCalendarEvent> => {
  const payload = buildCalendarEventPayload(appointment, client, consultant);

  const response = await fetch(CALENDAR_API_BASE, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to create Google Calendar event (${response.status})`);
  }

  return response.json();
};

/**
 * Update an existing appointment event on Google Calendar
 */
export const updateGoogleCalendarEvent = async (
  accessToken: string,
  eventId: string,
  appointment: Appointment,
  client?: Client,
  consultant?: Consultant
): Promise<GoogleCalendarEvent> => {
  const payload = buildCalendarEventPayload(appointment, client, consultant);

  const response = await fetch(`${CALENDAR_API_BASE}/${eventId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to update Google Calendar event (${response.status})`);
  }

  return response.json();
};

/**
 * Delete an appointment event from Google Calendar
 */
export const deleteGoogleCalendarEvent = async (
  accessToken: string,
  eventId: string
): Promise<void> => {
  const response = await fetch(`${CALENDAR_API_BASE}/${eventId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok && response.status !== 404 && response.status !== 410) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to delete Google Calendar event (${response.status})`);
  }
};
