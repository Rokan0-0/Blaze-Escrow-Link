import React, { useState, useEffect } from 'react';
import { EscrowTransaction, Dispute } from '@/lib/mock/types';
import { mockStore } from '@/lib/mock/store';
import { AlertTriangle, CheckCircle2, Truck, ShieldAlert, Upload, Check, Info, AlertCircle, X, ChevronDown, ChevronUp } from 'lucide-react';

interface SellerDisputeBannerProps {
  tx: EscrowTransaction;
  onUpdate?: () => void;
}

export function SellerDisputeBanner({ tx, onUpdate }: SellerDisputeBannerProps) {
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedOption, setSelectedOption] = useState<'NO_RETURN' | 'RETURN_REQUIRED' | 'CONTESTED'>('RETURN_REQUIRED');
  const [responseText, setResponseText] = useState('');
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Return Confirm Modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmCondition, setConfirmCondition] = useState<'ACCEPTABLE' | 'DAMAGED'>('ACCEPTABLE');
  const [damageNote, setDamageNote] = useState('');
  const [damageUrls, setDamageUrls] = useState<string[]>([]);
  const [isUploadingDamage, setIsUploadingDamage] = useState(false);
  const [isSubmittingConfirm, setIsSubmittingConfirm] = useState(false);

  // Toast notification state & auto-dismiss timer
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchDispute = async () => {
    try {
      const res = await fetch(`/api/dispute/${tx.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.dispute) {
          setDispute((prev) => {
            if (prev?.seller_acceptance && !data.dispute.seller_acceptance) {
              return { ...data.dispute, ...prev };
            }
            return data.dispute;
          });
          mockStore.saveDispute(data.dispute);
        }
      } else {
        const d = mockStore.getDisputeByTxId(tx.id);
        if (d) setDispute(d);
      }
    } catch {
      const d = mockStore.getDisputeByTxId(tx.id);
      if (d) setDispute(d);
    }
  };

  useEffect(() => {
    fetchDispute();
  }, [tx.id, tx.state]);

  if (!dispute) return null;

  const hoursLeft = Math.max(
    0,
    Math.round(48 - (Date.now() - new Date(dispute.created_at).getTime()) / 3600000)
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', files[0]);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) setEvidenceUrls((prev) => [...prev, data.url]);
    } catch {
      setEvidenceUrls((prev) => [...prev, 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80']);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDamageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingDamage(true);
    try {
      const formData = new FormData();
      formData.append('file', files[0]);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) setDamageUrls((prev) => [...prev, data.url]);
    } catch {
      setDamageUrls((prev) => [...prev, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80']);
    } finally {
      setIsUploadingDamage(false);
    }
  };

  const handleSellerRespondSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!responseText.trim()) {
      setToast({ msg: 'Please enter your response statement.', type: 'error' });
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/dispute/seller-respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dispute_id: dispute.id,
          transaction_id: tx.id,
          seller_id: tx.seller_id,
          acceptance: selectedOption,
          response_text: responseText,
          evidence_urls: evidenceUrls,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.dispute) {
          setDispute(data.dispute);
          mockStore.saveDispute(data.dispute);
        }
        if (data.transaction) {
          mockStore.saveTransaction(data.transaction);
        }
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('blaze_data_updated'));
        }
        setToast({
          msg: selectedOption === 'CONTESTED' ? 'Counter-appeal statement & evidence submitted!' : 'Dispute response submitted successfully.',
          type: 'success',
        });
        if (onUpdate) onUpdate();
      } else {
        const err = await res.json();
        setToast({ msg: err.error || 'Failed to submit response', type: 'error' });
      }
    } catch (e: any) {
      setToast({ msg: e.message || 'Error submitting response', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturnConfirmSubmit = async () => {
    if (confirmCondition === 'DAMAGED' && (damageUrls.length === 0 || !damageNote.trim())) {
      setToast({ msg: 'Damage claim requires a description and at least 1 photo evidence file.', type: 'error' });
      return;
    }

    setIsSubmittingConfirm(true);
    try {
      const res = await fetch('/api/dispute/return-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_id: tx.id,
          seller_id: tx.seller_id,
          condition: confirmCondition,
          damage_note: damageNote,
          damage_claim_urls: damageUrls,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.dispute) {
          setDispute(data.dispute);
          mockStore.saveDispute(data.dispute);
        }
        if (data.transaction) {
          mockStore.saveTransaction(data.transaction);
        }
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('blaze_data_updated'));
        }
        setShowConfirmModal(false);
        setToast({ msg: 'Return package receipt confirmed!', type: 'success' });
        if (onUpdate) onUpdate();
      } else {
        const err = await res.json();
        setToast({ msg: err.error || 'Failed to confirm return receipt', type: 'error' });
      }
    } catch (e: any) {
      setToast({ msg: e.message || 'Error confirming return', type: 'error' });
    } finally {
      setIsSubmittingConfirm(false);
    }
  };

  const isResolved =
    dispute.status === 'RESOLVED_BUYER' ||
    dispute.status === 'RESOLVED_SELLER' ||
    ['REFUNDED', 'RELEASED', 'PARTIAL_REFUND'].includes(tx.state);
  const hasResponded = !!dispute.seller_acceptance || isResolved;

  return (
    <>
      {toast && (
        <div className="fixed top-5 right-4 left-4 sm:left-auto z-50 max-w-md w-full pointer-events-auto">
          <div
            className={`p-4 rounded-2xl text-white text-xs font-extrabold flex items-center justify-between shadow-2xl backdrop-blur-md animate-in slide-in-from-top-4 duration-200 ${
              toast.type === 'success' ? 'bg-[#005432]/95 border border-emerald-500/50' : 'bg-slate-900/95 text-rose-300 border border-rose-500/40'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
              <span>{toast.msg}</span>
            </div>
            <button onClick={() => setToast(null)} className="p-1 text-slate-300 hover:text-white shrink-0 ml-2">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border-l-4 border-l-rose-500 border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-md space-y-4 my-4 transition-all">
      {/* Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
        <div className="cursor-pointer select-none" onClick={() => setIsExpanded(!isExpanded)}>
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-500" /> Dispute Filed on Contract #{tx.code.slice(-8)}
          </span>
          <h3 className="text-base font-extrabold text-slate-900 mt-0.5">{tx.title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 font-mono font-extrabold text-xs border border-rose-200">
            FROZEN ₦{(tx.amount / 100).toLocaleString()}
          </span>
          {!hasResponded && (
            <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 font-medium text-[11px] border border-amber-200 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-amber-600" /> {hoursLeft}h left to respond
            </span>
          )}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all ml-1"
            title={isExpanded ? "Collapse dispute details" : "Expand dispute details"}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-4 pt-1 animate-in fade-in duration-150">
          {/* Buyer Dispute Claim Details */}
      <div className="bg-rose-50/60 border border-rose-200 rounded-2xl p-4 space-y-2.5 text-xs">
        <div className="flex justify-between items-center text-slate-700">
          <span className="font-bold text-rose-800">Buyer Claim Reason: <span className="font-mono text-slate-900 bg-white px-2 py-0.5 rounded border border-rose-200">{dispute.reason}</span></span>
          <span className="text-[11px] text-slate-500 font-mono">{new Date(dispute.created_at).toLocaleDateString()}</span>
        </div>
        <p className="text-slate-800 leading-relaxed font-medium">{dispute.description}</p>
        
        {dispute.evidence_urls && dispute.evidence_urls.length > 0 && (
          <div className="pt-2 border-t border-rose-200/60">
            <span className="font-bold text-slate-700 text-[11px]">Buyer Evidence Uploaded:</span>
            <div className="flex gap-2 mt-1.5 overflow-x-auto">
              {dispute.evidence_urls.map((url, i) => (
                <img key={i} src={url} alt="Evidence" className="w-16 h-16 object-cover rounded-lg border border-slate-300" />
              ))}
            </div>
          </div>
        )}

        {dispute.ai_score && (
          <div className="pt-2 border-t border-rose-200/60">
            <p className="font-bold text-rose-800 text-[11px] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#006B3F]" /> AI Assessment: <span className="text-slate-900 font-mono">{dispute.ai_score.recommendation} ({dispute.ai_score.confidence}% confidence)</span>
            </p>
            <p className="text-slate-600 text-[11px] italic mt-0.5">{dispute.ai_score.reasoning}</p>
          </div>
        )}
      </div>

      {/* SELLER RESPONSE FORM (Shown if seller hasn't responded yet) */}
      {!hasResponded ? (
        <form onSubmit={handleSellerRespondSubmit} className="space-y-4 pt-1">
          <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
            Select Your Dispute Response Action:
          </h4>

          {/* 3 Option Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setSelectedOption('NO_RETURN')}
              className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between space-y-1.5 transition-all ${
                selectedOption === 'NO_RETURN'
                  ? 'bg-emerald-50 border-[#006B3F] ring-2 ring-[#006B3F]/20'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900">1. Accept — No Return</span>
                <CheckCircle2 className={`w-4 h-4 ${selectedOption === 'NO_RETURN' ? 'text-[#006B3F]' : 'text-slate-300'}`} />
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                Acknowledge issue. Buyer keeps item, issue refund.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedOption('RETURN_REQUIRED')}
              className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between space-y-1.5 transition-all ${
                selectedOption === 'RETURN_REQUIRED'
                  ? 'bg-amber-50 border-amber-600 ring-2 ring-amber-500/20'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900">2. Accept — Return First</span>
                <Truck className={`w-4 h-4 ${selectedOption === 'RETURN_REQUIRED' ? 'text-amber-600' : 'text-slate-300'}`} />
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                Accept claim but require buyer to return item before refund.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedOption('CONTESTED')}
              className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between space-y-1.5 transition-all ${
                selectedOption === 'CONTESTED'
                  ? 'bg-rose-50 border-rose-600 ring-2 ring-rose-500/20'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900">3. Contest & File Appeal</span>
                <ShieldAlert className={`w-4 h-4 ${selectedOption === 'CONTESTED' ? 'text-rose-600' : 'text-slate-300'}`} />
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                Disagree with claim. Submit counter-appeal statement & evidence photos.
              </p>
            </button>
          </div>

          {/* Statement Text Area */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Your Counter-Appeal Statement / Response Note</label>
            <textarea
              rows={3}
              required
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder={
                selectedOption === 'CONTESTED'
                  ? 'State your counter-appeal argument and explain why the claim should be dismissed...'
                  : 'Add notes for the buyer and compliance team...'
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Counter Evidence File Upload (Required if Contested) */}
          {selectedOption === 'CONTESTED' && (
            <div className="space-y-2 bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs">
              <label className="block font-bold text-slate-700">Upload Counter-Appeal Photo Evidence (Max 3 files)</label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={evidenceUrls.length >= 3 || isUploading}
                  className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-100 file:text-blue-800"
                />
                {isUploading && <span className="text-[11px] text-blue-600 animate-pulse">Uploading photo...</span>}
              </div>
              {evidenceUrls.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {evidenceUrls.map((url, i) => (
                    <img key={i} src={url} alt="Counter Evidence" className="w-14 h-14 object-cover rounded-lg border border-slate-300" />
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-500 italic">
              {hoursLeft > 0 ? `Appeal response window closes in ${hoursLeft} hours.` : 'Response time elapsed. Defaults to admin ruling.'}
            </span>
            <button
              type="submit"
              disabled={isSubmitting || !responseText.trim()}
              className="bg-[#006B3F] hover:bg-[#005432] text-white font-bold px-6 py-2.5 rounded-2xl text-xs transition-all shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting Appeal...' : selectedOption === 'CONTESTED' ? 'Submit Counter-Appeal' : 'Submit Response'}
            </button>
          </div>
        </form>
      ) : (
        /* AFTER RESPONSE SUBMITTED VIEW */
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 uppercase">Your Submitted Response:</span>
              <span className="px-2.5 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-200 text-slate-800">
                {dispute.seller_acceptance}
              </span>
            </div>
            <p className="text-slate-700 leading-relaxed font-medium">{dispute.seller_response}</p>
            {dispute.seller_evidence_urls && dispute.seller_evidence_urls.length > 0 && (
              <div className="flex gap-2 pt-2 border-t border-slate-200">
                {dispute.seller_evidence_urls.map((url, i) => (
                  <img key={i} src={url} alt="Counter Evidence" className="w-14 h-14 object-cover rounded-lg border border-slate-300" />
                ))}
              </div>
            )}
          </div>

          {/* ITEM RECEIVED BUTTON (Shown when state = RETURN_DISPATCHED) */}
          {tx.state === 'RETURN_DISPATCHED' && (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div>
                <h4 className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-amber-600" /> Return Package Dispatched by Buyer
                </h4>
                <p className="text-amber-800 text-[11px] mt-0.5">
                  Tracking: <span className="font-mono font-bold">{tx.return_tracking_id}</span> via {tx.return_logistics}.
                </p>
              </div>
              <button
                onClick={() => setShowConfirmModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all shadow-md shrink-0 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Item Received
              </button>
            </div>
          )}
        </div>
      )}

        </div>
      )}

      {/* CONFIRM RETURN RECEIPT MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#006B3F]" /> Confirm Returned Item Condition
              </h3>
              <button onClick={() => setShowConfirmModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Verify the condition of the returned item received from the buyer.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setConfirmCondition('ACCEPTABLE')}
                className={`p-3 rounded-2xl border text-center font-bold text-xs transition-all ${
                  confirmCondition === 'ACCEPTABLE'
                    ? 'bg-emerald-50 border-[#006B3F] text-[#006B3F] ring-2 ring-[#006B3F]/20'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                Acceptable Condition
              </button>
              <button
                type="button"
                onClick={() => setConfirmCondition('DAMAGED')}
                className={`p-3 rounded-2xl border text-center font-bold text-xs transition-all ${
                  confirmCondition === 'DAMAGED'
                    ? 'bg-rose-50 border-rose-600 text-rose-700 ring-2 ring-rose-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                Item Arrived Damaged
              </button>
            </div>

            {confirmCondition === 'DAMAGED' && (
              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Describe Damage Note (Required)</label>
                  <textarea
                    rows={2}
                    required
                    value={damageNote}
                    onChange={(e) => setDamageNote(e.target.value)}
                    placeholder="Describe condition, missing components, or physical damage..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Upload Damage Photos (Min 1 photo required)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleDamageUpload}
                    className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-rose-100 file:text-rose-800"
                  />
                  {isUploadingDamage && <span className="text-[11px] text-rose-600 animate-pulse">Uploading photo...</span>}
                  {damageUrls.length > 0 && (
                    <div className="flex gap-2 mt-1.5">
                      {damageUrls.map((url, i) => (
                        <img key={i} src={url} alt="Damage evidence" className="w-12 h-12 object-cover rounded-lg border border-slate-300" />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleReturnConfirmSubmit}
                disabled={isSubmittingConfirm}
                className="px-5 py-2 bg-[#006B3F] hover:bg-[#005432] text-white font-bold rounded-xl text-xs shadow-md disabled:opacity-50"
              >
                {isSubmittingConfirm ? 'Submitting...' : 'Confirm Status'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
