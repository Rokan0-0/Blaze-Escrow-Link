'use client';

import React, { useState } from 'react';
import { EscrowTransaction } from '@/lib/mock/types';
import { formatNaira } from '@/lib/formatters';
import { X, Copy, Check, Share2, MessageSquare, ExternalLink, ShieldCheck, Landmark } from 'lucide-react';

interface ShareCardModalProps {
  transaction: EscrowTransaction;
  onClose: () => void;
}

export function ShareCardModal({ transaction, onClose }: ShareCardModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedWhatsapp, setCopiedWhatsapp] = useState(false);
  const [copiedInstagram, setCopiedInstagram] = useState(false);

  const paymentUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/pay/${encodeURIComponent(transaction.code)}`
    : `https://blaze-escrow.ecobank.com/pay/${encodeURIComponent(transaction.code)}`;

  const whatsappMessage = `Hey! Pay securely for *${transaction.title}* (${formatNaira(transaction.amount)}) via Ecobank Blaze Escrow! 🔒\n\nFunds remain 100% safe in Ecobank vault until delivery is verified.\n👉 Pay via Escrow Link: ${paymentUrl}`;

  const instagramCaption = `🛍️ BUY SAFELY WITH ECOBANK ESCROW 🛍️\nItem: ${transaction.title}\nPrice: ${formatNaira(transaction.amount)}\n\nProtected by Ecobank Blaze 256-bit vault. 0% payment risk for buyers & sellers!\nLink to pay: ${paymentUrl}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(paymentUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyWhatsapp = () => {
    navigator.clipboard.writeText(whatsappMessage);
    setCopiedWhatsapp(true);
    setTimeout(() => setCopiedWhatsapp(false), 2000);
  };

  const handleCopyInstagram = () => {
    navigator.clipboard.writeText(instagramCaption);
    setCopiedInstagram(true);
    setTimeout(() => setCopiedInstagram(false), 2000);
  };

  const handleOpenWhatsappWeb = () => {
    const waUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 glass-modal flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Title */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#006B3F] font-bold text-xs uppercase tracking-wider">
            <Share2 className="w-4 h-4" /> 1-Click Social Commerce Share Generator
          </div>
          <h3 className="font-extrabold text-slate-900 text-lg">Share Escrow Link with Buyer</h3>
        </div>

        {/* Visual Social Card Preview */}
        <div className="bg-gradient-to-br from-emerald-900 via-[#006B3F] to-teal-900 text-white rounded-2xl p-5 shadow-lg space-y-3 relative">
          <div className="flex items-center justify-between border-b border-emerald-500/40 pb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold">
              <Landmark className="w-4 h-4 text-emerald-300" />
              <span>ECOBANK BLAZE ESCROW VAULT</span>
            </div>
            <span className="bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
              PROTECTED
            </span>
          </div>

          <div className="space-y-1">
            <h4 className="font-extrabold text-base leading-tight text-white">{transaction.title}</h4>
            <p className="text-xs text-emerald-100/90 font-medium line-clamp-2">{transaction.description}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 flex items-center justify-between font-mono text-xs border border-white/20">
            <div>
              <span className="text-[10px] text-emerald-200 uppercase block font-sans">Buyer Payment Required</span>
              <span className="text-xl font-black text-white">{formatNaira(transaction.amount)}</span>
            </div>
            <span className="text-xs text-emerald-300 font-bold bg-white/10 px-2.5 py-1 rounded-lg">
              0.75% Fee
            </span>
          </div>

          <div className="text-[10px] text-emerald-200 flex items-center justify-between pt-1 font-mono">
            <span>Code: {transaction.code}</span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> CBN Compliant
            </span>
          </div>
        </div>

        {/* 1-Click Action Buttons */}
        <div className="space-y-2.5">
          <button
            onClick={handleOpenWhatsappWeb}
            className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-extrabold py-3 px-4 rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-4 h-4" /> Direct Share to WhatsApp Chat
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleCopyWhatsapp}
              className="bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              {copiedWhatsapp ? <Check className="w-4 h-4 text-[#006B3F]" /> : <Copy className="w-4 h-4" />}
              {copiedWhatsapp ? 'Copied WhatsApp Msg' : 'Copy WhatsApp Format'}
            </button>

            <button
              onClick={handleCopyInstagram}
              className="bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              {copiedInstagram ? <Check className="w-4 h-4 text-[#006B3F]" /> : <Copy className="w-4 h-4" />}
              {copiedInstagram ? 'Copied IG Caption' : 'Copy IG Caption'}
            </button>
          </div>

          <button
            onClick={handleCopyLink}
            className="w-full bg-[#006B3F] hover:bg-[#005432] text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
          >
            {copiedLink ? <Check className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
            {copiedLink ? 'Payment URL Copied!' : 'Copy Direct Link URL'}
          </button>
        </div>
      </div>
    </div>
  );
}
