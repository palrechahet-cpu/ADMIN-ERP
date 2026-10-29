import React from 'react';
import { X, Printer, ShieldCheck, HeartPulse } from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';
import { Appointment, PaymentRecord, formatModality } from '../../types/clinic';

interface SuperbillModalProps {
  appointment?: Appointment | null;
  invoice?: PaymentRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SuperbillModal: React.FC<SuperbillModalProps> = ({
  appointment,
  invoice,
  isOpen,
  onClose,
}) => {
  const { clients, consultants } = useClinic();

  if (!isOpen) return null;

  const clientId = appointment?.clientId || invoice?.clientId || '';
  const client = clients.find(c => c.id === clientId);
  const consultant = consultants.find(c => 
    c.id === appointment?.consultantId || c.name === invoice?.consultantName
  ) || consultants[0];

  const date = appointment?.date || invoice?.date || new Date().toISOString().split('T')[0];
  const fee = appointment?.fee || invoice?.amount || 180;
  const isPaid = (appointment?.paymentStatus === 'Paid') || (invoice?.status === 'Paid');
  const cpt = appointment?.cptCode || invoice?.cptCode || '90834';
  const invoiceNum = invoice?.invoiceNumber || `SB-${Math.floor(100000 + Math.random() * 900000)}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Top Control Bar (Hidden on print) */}
        <div className="no-print px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-theme-primary" />
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Mental Health Superbill & Official Receipt</h3>
              <p className="text-xs text-slate-300">HIPAA compliant statement for client reimbursement</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="btn-theme-primary px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Superbill Document Canvas */}
        <div className="p-8 text-slate-900 bg-white space-y-6 text-xs">
          
          {/* Header & Clinic Letterhead */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-6">
            <div>
              <div className="font-bold text-base text-slate-900">MindWell Practice Health LLC</div>
              <p className="text-slate-500 mt-0.5">Comprehensive Mental Health & Psychological Services</p>
              <p className="text-slate-500">100 Health Sciences Way, Suite 201</p>
              <p className="text-slate-500">Phone: (555) 234-8900 · Fax: (555) 234-8999</p>
              <p className="text-slate-500 font-mono text-[11px] mt-1">Tax ID (EIN): 84-2938102 · NPI: 1982736450</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-black tracking-tight text-slate-900">STATEMENT / SUPERBILL</div>
              <div className="font-mono text-slate-500 mt-1">Document #: {invoiceNum}</div>
              <div className="text-slate-500">Date Issued: {new Date().toLocaleDateString()}</div>
              <div className="mt-2">
                <span className={`inline-flex items-center gap-1.5 text-xs font-bold tracking-wide ${
                  isPaid ? 'text-emerald-700' : 'text-amber-700'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isPaid ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  {isPaid ? 'PAID IN FULL' : 'PAYMENT PENDING'}
                </span>
              </div>
            </div>
          </div>

          {/* Client & Rendering Provider Grid */}
          <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <div className="font-bold uppercase text-[10px] text-slate-400 tracking-wider">Patient Information</div>
              <div className="text-sm font-bold text-slate-900 mt-1">{client?.name || appointment?.clientName || 'Valued Patient'}</div>
              <p className="text-slate-600">DOB: {client?.dateOfBirth || '1985-04-12'}</p>
              <p className="text-slate-600">Insurance: {client?.insuranceProvider || 'Private Pay'}</p>
              <p className="text-slate-600">Contact: {client?.phone || '(555) 000-0000'}</p>
            </div>
            <div>
              <div className="font-bold uppercase text-[10px] text-slate-400 tracking-wider">Rendering Clinician</div>
              <div className="text-sm font-bold text-slate-900 mt-1">{consultant.name}, {consultant.credentials}</div>
              <p className="text-slate-600">{consultant.title}</p>
              <p className="text-slate-600">State Clinical License #: CA-PSY-{28000 + Math.floor(Math.random() * 5000)}</p>
              <p className="text-slate-600 font-mono text-[11px]">Individual NPI: 1092837461</p>
            </div>
          </div>

          {/* Diagnostic Coding */}
          <div className="border border-slate-200 rounded-xl p-3 bg-white">
            <div className="font-bold uppercase text-[10px] text-slate-400 tracking-wider mb-1">
              Diagnosis Coding (ICD-10-CM)
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded">
                {client?.diagnosticCode || 'F41.1'}
              </span>
              <span className="text-slate-700">
                {client?.primaryConcern || 'Generalized Anxiety Disorder & Associated Stress'}
              </span>
            </div>
          </div>

          {/* Service Line Item Table */}
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-300 text-slate-500 text-[11px]">
                <th className="py-2 text-left">Date of Service</th>
                <th className="py-2 text-left">CPT Code</th>
                <th className="py-2 text-left">Description</th>
                <th className="py-2 text-left">Modality</th>
                <th className="py-2 text-right">Fee</th>
                <th className="py-2 text-right">Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-3 font-mono">{date}</td>
                <td className="py-3 font-mono font-bold text-theme-primary">{cpt}</td>
                <td className="py-3 font-medium text-slate-800">
                  {appointment?.sessionType || 'Individual Psychotherapy (45-50 min)'}
                </td>
                <td className="py-3 text-slate-600">{formatModality(appointment?.modality)}</td>
                <td className="py-3 text-right font-mono">${fee}.00</td>
                <td className="py-3 text-right font-mono font-semibold text-emerald-700">
                  ${isPaid ? fee : 0}.00
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-300 font-bold text-slate-900">
                <td colSpan={4} className="py-3 text-right">Total Charges:</td>
                <td className="py-3 text-right font-mono">${fee}.00</td>
                <td className="py-3 text-right font-mono text-emerald-800">${isPaid ? fee : 0}.00</td>
              </tr>
              <tr className="text-slate-700 font-semibold">
                <td colSpan={5} className="py-1 text-right">Patient Balance Due:</td>
                <td className="py-1 text-right font-mono font-bold text-slate-900">
                  ${isPaid ? 0 : fee}.00
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Signature & Disclaimer */}
          <div className="pt-6 border-t border-slate-200 flex justify-between items-end">
            <div className="max-w-xs text-[10px] text-slate-400 leading-relaxed">
              This statement contains protected health information (PHI). It is issued for reimbursement purposes under HIPAA regulations. All services performed by state licensed behavioral health clinicians.
            </div>
            <div className="text-right">
              <div className="border-b border-slate-400 w-48 mb-1"></div>
              <div className="text-[11px] font-semibold text-slate-800">
                {consultant.name}, {consultant.credentials}
              </div>
              <div className="text-[10px] text-slate-500">Authorized Provider Signature</div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
