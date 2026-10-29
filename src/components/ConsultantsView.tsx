import React from 'react';
import { 
  Clock, 
  MapPin, 
  Mail, 
  Plus
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import { useAuthWorkspace } from '../context/AuthWorkspaceContext';
import { getRelativeDate } from '../data/mockClinicData';
import { formatModality, getProviderLabel, getClientLabel } from '../types/clinic';

interface ConsultantsViewProps {
  onOpenScheduleModal: (defaultTime?: string, defaultConsultantId?: string) => void;
}

export const ConsultantsView: React.FC<ConsultantsViewProps> = ({ onOpenScheduleModal }) => {
  const { consultants, appointments } = useClinic();
  const { currentWorkspace } = useAuthWorkspace();
  const todayStr = getRelativeDate(0);

  const providerPlural = getProviderLabel(currentWorkspace, true);
  const providerSingular = getProviderLabel(currentWorkspace, false);
  const clientPlural = getClientLabel(currentWorkspace, true);

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                {providerPlural} ({consultants.length})
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {providerSingular} credentials, clinical focus areas, caseload capacity, and schedule availability
            </p>
          </div>

          <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
            Practice capacity: <strong className="text-slate-900 dark:text-white">106 / 122 {clientPlural.toLowerCase()}</strong> (86%)
          </div>
        </div>
      </div>

      {/* Consultants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {consultants.map(c => {
          const todaySessions = appointments.filter(
            a => a.date === todayStr && a.consultantId === c.id && a.status !== 'cancelled'
          );

          const caseloadPercent = Math.round((c.activeCaseload / c.maxCaseload) * 100);
          const isFull = caseloadPercent >= 95;

          return (
            <div
              key={c.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all p-5"
            >
              <div>
                <div className="space-y-4">
                  {/* Consultant Title Block */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-2.5 h-2.5 rounded-full shrink-0" 
                          style={{ backgroundColor: c.colorHex }}
                        />
                        <h3 className="font-bold text-base text-slate-900 dark:text-white tracking-tight">
                          {c.name}
                        </h3>
                      </div>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5">
                        {c.title} ({c.credentials})
                      </p>
                    </div>

                    <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                      ${c.hourlyRate}/hr
                    </span>
                  </div>

                  {/* Bio */}
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {c.bio}
                  </p>

                  <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Available: {c.availabilityDays.join(', ')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{c.email}</span>
                    </div>
                  </div>

                  {/* Specialties Text */}
                  <div className="pt-2">
                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">
                      Specialties
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      {c.specialties.join(' · ')}
                    </p>
                  </div>

                  {/* Caseload Bar */}
                  <div className="pt-2">
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Caseload</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {c.activeCaseload} / {c.maxCaseload} {clientPlural.toLowerCase()} ({caseloadPercent}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isFull ? 'bg-amber-500' : 'bg-theme-primary'
                        }`}
                        style={{ width: `${caseloadPercent}%` }}
                      />
                    </div>
                    {isFull && (
                      <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium mt-1">
                        At full capacity. Refer new intakes to colleagues.
                      </p>
                    )}
                  </div>

                  {/* Today's Schedule Overview */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="font-bold text-slate-700 dark:text-slate-300">Today</span>
                      <span className="text-theme-primary font-mono font-bold">{todaySessions.length} {todaySessions.length === 1 ? 'appointment' : 'appointments'}</span>
                    </div>
                    <div className="space-y-1">
                      {todaySessions.length > 0 ? (
                        todaySessions.map(s => (
                          <div key={s.id} className="text-[11px] p-1.5 rounded bg-slate-50 dark:bg-slate-800/60 flex justify-between items-center text-slate-700 dark:text-slate-300">
                            <span className="font-mono font-bold">{s.time}</span>
                            <span className="font-medium truncate max-w-[130px]">{s.clientName}</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">{formatModality(s.modality)}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-[11px] text-slate-400 italic">No appointments booked today</div>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              {/* Bottom Schedule Action */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between mt-4">
                <span className={`text-[11px] font-medium flex items-center gap-1.5 ${
                  c.acceptingNewClients ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${c.acceptingNewClients ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  {c.acceptingNewClients ? `Accepting new ${clientPlural.toLowerCase()}` : 'Caseload full'}
                </span>

                <button
                  onClick={() => onOpenScheduleModal('10:00', c.id)}
                  className="btn-theme-primary px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Book appointment</span>
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
