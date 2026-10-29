import React, { useState, useMemo } from 'react';
import { 
  ClipboardList, 
  Search, 
  Filter, 
  Download, 
  Printer, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Video, 
  Calendar, 
  Eye, 
  Plus, 
  X, 
  Lock, 
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  SlidersHorizontal,
  Phone
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import { useAuthWorkspace } from '../context/AuthWorkspaceContext';
import { Appointment, SessionStatus, Client, formatModality, getProviderLabel, getClientLabel } from '../types/clinic';
import { getRelativeDate } from '../data/mockClinicData';
import { WhatsAppButton } from './common/WhatsAppButton';

interface AppointmentsLogViewProps {
  onOpenScheduleModal: () => void;
  onSelectAppointment: (appointment: Appointment) => void;
  onOpenClientDetailModal?: (client: Client) => void;
}

export const AppointmentsLogView: React.FC<AppointmentsLogViewProps> = ({
  onOpenScheduleModal,
  onSelectAppointment,
  onOpenClientDetailModal,
}) => {
  const { appointments, consultants, clients } = useClinic();
  const { currentWorkspace } = useAuthWorkspace();
  const todayStr = getRelativeDate(0);

  const providerPlural = getProviderLabel(currentWorkspace, true);
  const providerSingular = getProviderLabel(currentWorkspace, false);
  const clientSingular = getClientLabel(currentWorkspace, false);

  // Administrative Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | SessionStatus>('all');
  const [consultantFilter, setConsultantFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'upcoming' | 'past' | 'custom'>('all');
  const [customDate, setCustomDate] = useState<string>('');
  const [modalityFilter, setModalityFilter] = useState<'all' | 'In-person' | 'Online'>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'client-az' | 'consultant-az'>('date-desc');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(15);

  const isFilterActive = 
    searchQuery.trim() !== '' || 
    statusFilter !== 'all' || 
    consultantFilter !== 'all' || 
    dateFilter !== 'all' || 
    modalityFilter !== 'all';

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setConsultantFilter('all');
    setDateFilter('all');
    setCustomDate('');
    setModalityFilter('all');
    setCurrentPage(1);
  };

  // Filter and sort appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter(a => {
      // Search query across client name, consultant name, notes, or CPT code
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesClient = a.clientName.toLowerCase().includes(q);
        const matchesConsultant = a.consultantName.toLowerCase().includes(q);
        const matchesCPT = a.cptCode ? a.cptCode.toLowerCase().includes(q) : false;
        const matchesLocation = a.locationDetails ? a.locationDetails.toLowerCase().includes(q) : false;
        const matchesNotes = (a.clinicalNotes?.toLowerCase().includes(q) || a.coordinatorNotes?.toLowerCase().includes(q)) || false;
        if (!matchesClient && !matchesConsultant && !matchesCPT && !matchesLocation && !matchesNotes) {
          return false;
        }
      }

      // Status Filter
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;

      // Consultant Filter
      if (consultantFilter !== 'all' && a.consultantId !== consultantFilter) return false;

      // Modality Filter (In-person vs Online)
      if (modalityFilter !== 'all' && formatModality(a.modality) !== modalityFilter) return false;

      // Date Filter
      if (dateFilter === 'today' && a.date !== todayStr) return false;
      if (dateFilter === 'upcoming' && a.date < todayStr) return false;
      if (dateFilter === 'past' && a.date >= todayStr) return false;
      if (dateFilter === 'custom' && customDate && a.date !== customDate) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'date-desc') {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return a.time.localeCompare(b.time);
      }
      if (sortBy === 'date-asc') {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.time.localeCompare(b.time);
      }
      if (sortBy === 'client-az') {
        return a.clientName.localeCompare(b.clientName);
      }
      if (sortBy === 'consultant-az') {
        return a.consultantName.localeCompare(b.consultantName);
      }
      return 0;
    });
  }, [appointments, searchQuery, statusFilter, consultantFilter, dateFilter, customDate, modalityFilter, sortBy, todayStr]);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, consultantFilter, dateFilter, customDate, modalityFilter, sortBy, pageSize]);

  // Paginated dataset
  const totalItems = filteredAppointments.length;
  const effectivePageSize = pageSize === -1 ? totalItems || 1 : pageSize;
  const totalPages = Math.ceil(totalItems / effectivePageSize) || 1;
  const startIndex = (currentPage - 1) * effectivePageSize;
  const paginatedAppointments = pageSize === -1 
    ? filteredAppointments 
    : filteredAppointments.slice(startIndex, startIndex + effectivePageSize);

  // Export CSV handler
  const handleExportCSV = () => {
    const headers = ['ID', 'Date', 'Time', 'Client', 'Consultant', 'Session Type', 'Modality', 'Location', 'Status', 'Fee', 'Payment Status', 'CPT Code'];
    const rows = filteredAppointments.map(a => [
      a.id,
      a.date,
      a.time,
      `"${a.clientName}"`,
      `"${a.consultantName}"`,
      `"${a.sessionType}"`,
      a.modality,
      `"${a.locationDetails}"`,
      a.status,
      a.fee,
      a.paymentStatus,
      a.cptCode
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `mindwell-appointments-${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: SessionStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Completed
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 dark:text-sky-400">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            Confirmed
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Pending
          </span>
        );
      case 'no-show':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            No-Show
          </span>
        );
      case 'rejected':
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Cancelled
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Administrative Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Appointments Log
            </h1>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              ({totalItems} {totalItems === 1 ? 'record' : 'records'})
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Search, filter, and review clinical encounters across all {providerPlural.toLowerCase()}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Export filtered records as CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="no-print px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Print appointments view"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Print</span>
          </button>
          <button
            onClick={onOpenScheduleModal}
            className="px-3.5 py-1.5 text-xs font-bold rounded-xl btn-theme-primary transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Book appointment</span>
          </button>
        </div>
      </div>

      {/* Unified Search & Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        {/* Row 1: Search input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-slate-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by client name, consultant, CPT code, notes..."
            className="w-full text-xs font-medium pl-10 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 ring-theme transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Row 2: Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
          {/* Status Dropdown */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-2.5 py-1.5 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 ring-theme cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="no-show">No-Show</option>
              <option value="cancelled">Cancelled</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Date Filter Dropdown */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Date
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="w-full px-2.5 py-1.5 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 ring-theme cursor-pointer"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
              <option value="custom">Specific Date...</option>
            </select>
          </div>

          {/* Consultant Filter Dropdown */}
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Consultant
            </label>
            <select
              value={consultantFilter}
              onChange={(e) => setConsultantFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 ring-theme cursor-pointer"
            >
              <option value="all">All Consultants</option>
              {consultants.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.credentials})
                </option>
              ))}
            </select>
          </div>

          {/* Modality Filter Dropdown */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Modality
            </label>
            <select
              value={modalityFilter}
              onChange={(e) => setModalityFilter(e.target.value as any)}
              className="w-full px-2.5 py-1.5 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 ring-theme cursor-pointer"
            >
              <option value="all">All modalities</option>
              <option value="In-person">In-person</option>
              <option value="Online">Online</option>
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-2.5 py-1.5 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 ring-theme cursor-pointer"
            >
              <option value="date-desc">Date (Newest First)</option>
              <option value="date-asc">Date (Oldest First)</option>
              <option value="client-az">Client (A–Z)</option>
              <option value="consultant-az">Consultant (A–Z)</option>
            </select>
          </div>

          {/* Reset Filters / Clear Button */}
          <div className="flex items-end">
            {isFilterActive ? (
              <button
                type="button"
                onClick={handleResetFilters}
                className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800/60 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                title="Reset all search filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            ) : (
              <div className="text-[11px] text-slate-400 flex items-center h-8 px-1">
                Active: All records
              </div>
            )}
          </div>
        </div>

        {/* Custom Date Input (shown if dateFilter === 'custom') */}
        {dateFilter === 'custom' && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Filter by specific date:
            </span>
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="px-2.5 py-1 text-xs font-mono border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 ring-theme"
            />
          </div>
        )}
      </div>

      {/* Appointments Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Table Subheader with pagination stats */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
          <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <span>
              Showing {totalItems === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + effectivePageSize, totalItems)} of {totalItems} entries
            </span>
            {isFilterActive && (
              <span className="text-[11px] font-normal text-theme-primary">
                (filtered from {appointments.length} total)
              </span>
            )}
          </div>

          {/* Page size dropdown */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:ring-1 ring-theme"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={-1}>All ({totalItems})</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">{clientSingular}</th>
                <th className="py-3 px-4">{providerSingular}</th>
                <th className="py-3 px-4">Session Focus</th>
                <th className="py-3 px-4">Modality</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Billing</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedAppointments.length > 0 ? (
                paginatedAppointments.map(appt => {
                  const consultant = consultants.find(c => c.id === appt.consultantId);
                  const clientObj = clients.find(c => c.id === appt.clientId);
                  const isToday = appt.date === todayStr;

                  return (
                    <tr
                      key={appt.id}
                      onClick={() => onSelectAppointment(appt)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                    >
                      {/* Date & Time */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                          <span>{appt.date}</span>
                          {isToday && (
                            <span className="text-[10px] font-semibold text-theme-primary">
                              (Today)
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                          {appt.time} · {appt.durationMinutes}m
                        </div>
                      </td>

                      {/* Client */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {appt.clientName}
                        </div>
                        {clientObj && (
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                            {clientObj.phone}
                          </div>
                        )}
                      </td>

                      {/* Consultant */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: consultant?.colorHex || 'var(--theme-primary)' }}
                          />
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {appt.consultantName}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500">
                          {consultant?.credentials}
                        </div>
                      </td>

                      {/* Session Type */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {appt.sessionType}
                        </div>
                      </td>

                      {/* Modality */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {formatModality(appt.modality) === 'In-person' ? (
                          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                            <MapPin className="w-3.5 h-3.5 text-theme-primary" />
                            <span>In-person</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                            <Video className="w-3.5 h-3.5 text-theme-primary" />
                            <span>Online</span>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getStatusBadge(appt.status)}
                      </td>

                      {/* Fee & Payment */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono">
                        <div className="font-bold text-slate-900 dark:text-white">${appt.fee}</div>
                        <div className={`text-[10px] font-semibold ${
                          appt.paymentStatus === 'Paid' 
                            ? 'text-emerald-700 dark:text-emerald-400' 
                            : 'text-amber-700 dark:text-amber-400'
                        }`}>
                          {appt.paymentStatus}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 whitespace-nowrap text-right space-x-1.5">
                        {clientObj && (
                          <WhatsAppButton
                            phone={clientObj.phone}
                            clientName={appt.clientName}
                            consultantName={appt.consultantName}
                            date={appt.date}
                            time={appt.time}
                            sessionType={appt.sessionType}
                            template="reminder"
                            variant="badge"
                            label="WhatsApp"
                          />
                        )}

                        {clientObj && onOpenClientDetailModal && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenClientDetailModal(clientObj);
                            }}
                            className="px-2 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-md transition-colors inline-flex items-center gap-1 cursor-pointer"
                            title="Open client chart & notes"
                          >
                            <Lock className="w-3 h-3 text-slate-500" />
                            <span>Chart</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectAppointment(appt);
                          }}
                          className="px-2 py-1 text-[11px] font-semibold text-theme-primary bg-theme-subtle hover:opacity-85 border border-theme-primary/30 rounded-md transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <div className="space-y-2">
                      <Search className="w-7 h-7 mx-auto text-slate-300 dark:text-slate-600" />
                      <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">
                        No appointments found matching your filters
                      </p>
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="text-xs text-theme-primary hover:underline font-semibold cursor-pointer"
                      >
                        Reset filters to view all records
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-5 py-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <div className="text-slate-500 dark:text-slate-400">
              Page <span className="font-bold text-slate-900 dark:text-white">{currentPage}</span> of <span className="font-bold text-slate-900 dark:text-white">{totalPages}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>

              {/* Numbered page buttons (up to 5 buttons) */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((pageNum, idx, arr) => {
                  const showEllipsis = idx > 0 && pageNum - arr[idx - 1] > 1;
                  return (
                    <React.Fragment key={pageNum}>
                      {showEllipsis && <span className="text-slate-400 px-1">...</span>}
                      <button
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          currentPage === pageNum
                            ? 'btn-theme-primary shadow-2xs'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {pageNum}
                      </button>
                    </React.Fragment>
                  );
                })}

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
