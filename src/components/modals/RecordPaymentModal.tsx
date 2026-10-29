import React, { useState } from 'react';
import { X, DollarSign, CheckCircle2 } from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';
import { Appointment, PaymentRecord, PaymentStatus } from '../../types/clinic';

interface RecordPaymentModalProps {
  appointment?: Appointment | null;
  invoice?: PaymentRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  appointment,
  invoice,
  isOpen,
  onClose,
}) => {
  const { recordPayment, markInvoicePaid } = useClinic();

  const clientName = appointment?.clientName || invoice?.clientName || '';
  const consultantName = appointment?.consultantName || invoice?.consultantName || '';
  const defaultAmount = appointment?.fee || invoice?.amount || 180;

  const [amount, setAmount] = useState(defaultAmount);
  const [method, setMethod] = useState<PaymentRecord['method']>('Credit Card');
  const [status, setStatus] = useState<PaymentStatus>('Paid');
  const [notes, setNotes] = useState('Payment collected at reception');
  const [transactionRef, setTransactionRef] = useState(`TXN-${Math.floor(100000 + Math.random() * 900000)}`);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (invoice) {
      markInvoicePaid(invoice.id, method, `${notes} | Ref: ${transactionRef}`);
    } else if (appointment) {
      const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      recordPayment({
        invoiceNumber,
        appointmentId: appointment.id,
        clientId: appointment.clientId,
        clientName: appointment.clientName,
        consultantName: appointment.consultantName,
        date: appointment.date,
        amount: Number(amount),
        method,
        status,
        notes: `${notes} | Ref: ${transactionRef}`,
        cptCode: appointment.cptCode,
      });
    }

    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="record-payment-title"
    >
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-theme-primary" />
            <div>
              <h3 id="record-payment-title" className="text-base font-bold text-white tracking-tight">Record payment</h3>
              <p className="text-xs text-slate-300">Save payment details, method, and reference</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Client:</span>
              <span className="font-bold text-slate-900 dark:text-white">{clientName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Clinician:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{consultantName}</span>
            </div>
            {appointment && (
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">CPT code:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{appointment.cptCode} ({appointment.sessionType})</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Amount ($)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-400 text-xs font-bold">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full text-xs pl-7 pr-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg font-mono font-bold focus:outline-none focus:ring-2 ring-theme"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Payment method
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {(['Credit Card', 'HSA/FSA Card', 'Insurance Co-Pay', 'ACH Transfer', 'Cash'] as const).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`py-2 px-3 rounded-lg border text-left font-medium transition-all cursor-pointer ${
                    method === m 
                      ? 'border-theme-active bg-theme-subtle text-theme-primary font-bold' 
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PaymentStatus)}
                className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 ring-theme"
              >
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Reference / Auth
              </label>
              <input
                type="text"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg font-mono focus:outline-none focus:ring-2 ring-theme"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Note
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 ring-theme"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-theme-primary px-5 py-2 text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Record payment</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
