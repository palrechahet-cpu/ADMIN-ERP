import React, { useState } from 'react';
import { 
  CreditCard, 
  Receipt, 
  Plus, 
  Search, 
  Download
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import { PaymentRecord, PaymentStatus } from '../types/clinic';
import { getRelativeDate } from '../data/mockClinicData';

interface PaymentsViewProps {
  onOpenRecordPaymentModal: (invoice?: PaymentRecord) => void;
  onOpenSuperbillModal: (invoice: PaymentRecord) => void;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  onOpenRecordPaymentModal,
  onOpenSuperbillModal,
}) => {
  const { payments } = useClinic();
  const todayStr = getRelativeDate(0);

  const [statusFilter, setStatusFilter] = useState<'all' | PaymentStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Financial KPIs
  const todayPaid = payments
    .filter(p => p.date === todayStr && p.status === 'Paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalOutstanding = payments
    .filter(p => p.status === 'Pending' || p.status === 'Unpaid')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalOverdue = payments
    .filter(p => p.status === 'Overdue')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalRevenueMonth = payments
    .filter(p => p.status === 'Paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const filteredPayments = payments.filter(p => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return p.clientName.toLowerCase().includes(q) ||
             p.consultantName.toLowerCase().includes(q) ||
             p.invoiceNumber.toLowerCase().includes(q) ||
             p.method.toLowerCase().includes(q);
    }
    return true;
  });

  const handleExportBillingCSV = () => {
    const headers = ['Invoice #', 'Date', 'Client', 'Clinician', 'CPT', 'Amount', 'Payment Method', 'Status', 'Paid At', 'Notes'];
    const rows = filteredPayments.map(p => [
      p.invoiceNumber,
      p.date,
      `"${p.clientName}"`,
      `"${p.consultantName}"`,
      p.cptCode,
      p.amount,
      p.method,
      p.status,
      p.paidAt || 'N/A',
      `"${p.notes || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `mindwell-payments-${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'Paid':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Paid
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Pending
          </span>
        );
      case 'Unpaid':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Unpaid
          </span>
        );
      case 'Overdue':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-700 dark:text-rose-400">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Overdue
          </span>
        );
      case 'Refunded':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-700 dark:text-purple-400">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            Refunded
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Actions */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Payments
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Track invoices, record client payments, and generate superbills
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExportBillingCSV}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => onOpenRecordPaymentModal()}
              className="btn-theme-primary px-3.5 py-1.5 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Record payment</span>
            </button>
          </div>
        </div>

        {/* Financial KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          
          <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
            <div className="text-emerald-700 dark:text-emerald-400 font-semibold text-[10px] uppercase tracking-wider">
              Today
            </div>
            <div className="text-xl font-extrabold text-emerald-900 dark:text-emerald-300 font-mono mt-0.5">
              ${todayPaid.toFixed(2)}
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-500 mt-1">Processed today</div>
          </div>

          <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-100 dark:border-amber-900/40">
            <div className="text-amber-700 dark:text-amber-400 font-semibold text-[10px] uppercase tracking-wider">
              Unpaid balances
            </div>
            <div className="text-xl font-extrabold text-amber-900 dark:text-amber-300 font-mono mt-0.5">
              ${totalOutstanding.toFixed(2)}
            </div>
            <div className="text-[11px] text-amber-600 dark:text-amber-500 mt-1">Awaiting checkout</div>
          </div>

          <div className="p-3 bg-rose-50/50 dark:bg-rose-950/20 rounded-xl border border-rose-100 dark:border-rose-900/40">
            <div className="text-rose-700 dark:text-rose-400 font-semibold text-[10px] uppercase tracking-wider">
              Overdue
            </div>
            <div className="text-xl font-extrabold text-rose-900 dark:text-rose-300 font-mono mt-0.5">
              ${totalOverdue.toFixed(2)}
            </div>
            <div className="text-[11px] text-rose-600 dark:text-rose-500 mt-1">Past due invoices</div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="text-slate-500 dark:text-slate-400 font-semibold text-[10px] uppercase tracking-wider">
              This month
            </div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
              ${totalRevenueMonth.toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Settled payments</div>
          </div>

        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
            {(['all', 'Paid', 'Pending', 'Overdue'] as const).map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer capitalize ${
                  statusFilter === st
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {st === 'all' ? 'All' : st}
              </button>
            ))}
          </div>

          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search invoice, client, or clinician..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 ring-theme"
            />
          </div>

        </div>

      </div>

      {/* Ledger Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
          <span className="font-bold text-slate-800 dark:text-slate-200">
            Invoices ({filteredPayments.length})
          </span>
          <span className="text-slate-400">Superbills formatted for client insurance claims</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Clinician</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPayments.length > 0 ? (
                filteredPayments.map(p => {
                  const isPaid = p.status === 'Paid';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      {/* Invoice # */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono font-bold text-theme-primary">
                        {p.invoiceNumber}
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-600 dark:text-slate-400">
                        {p.date}
                      </td>

                      {/* Client */}
                      <td className="py-3 px-4 whitespace-nowrap font-bold text-slate-900 dark:text-white">
                        {p.clientName}
                      </td>

                      {/* Clinician */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-700 dark:text-slate-300">
                        {p.consultantName}
                      </td>

                      {/* Method */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                          <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                          <span>{p.method}</span>
                        </span>
                      </td>

                      {/* Amount - right aligned */}
                      <td className="py-3 px-4 whitespace-nowrap text-right font-mono font-bold text-slate-900 dark:text-white">
                        ${p.amount.toFixed(2)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getStatusBadge(p.status)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 whitespace-nowrap text-right space-x-1.5">
                        {!isPaid && (
                          <button
                            onClick={() => onOpenRecordPaymentModal(p)}
                            className="btn-theme-primary px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors cursor-pointer"
                          >
                            Record payment
                          </button>
                        )}

                        <button
                          onClick={() => onOpenSuperbillModal(p)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Receipt className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                          <span>Superbill</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    No transactions match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
