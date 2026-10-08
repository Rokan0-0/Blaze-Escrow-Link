import React, { useState, useEffect, useRef } from 'react';
import { DisputeMessage } from '@/lib/mock/types';
import { mockStore } from '@/lib/mock/store';
import { Image as ImageIcon, Upload, X, RefreshCw } from 'lucide-react';

interface DisputeThreadProps {
  disputeId: string;
  currentUserId: string;
  currentUserRole: 'buyer' | 'seller' | 'admin';
}

export function DisputeThread({ disputeId, currentUserId, currentUserRole }: DisputeThreadProps) {
  const [messages, setMessages] = useState<DisputeMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [attachedImageUrl, setAttachedImageUrl] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/dispute/${disputeId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.messages) {
          setMessages(data.messages);
        }
      } else {
        // Fallback to local mockStore
        const msgs = mockStore.getDisputeMessages(disputeId);
        setMessages(msgs);
      }
    } catch {
      const msgs = mockStore.getDisputeMessages(disputeId);
      setMessages(msgs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 4000);
    return () => clearInterval(interval);
  }, [disputeId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) {
        setAttachedImageUrl(data.url);
      }
    } catch {
      setAttachedImageUrl('https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600&auto=format&fit=crop&q=80');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Message limit calculations for non-admin
  const userMessagesCount = messages.filter(m => m.sender_id === currentUserId && !m.is_system).length;
  const isLimitReached = currentUserRole !== 'admin' && userMessagesCount >= 3;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if ((!text && !attachedImageUrl) || sending || isLimitReached) return;

    setSending(true);
    let fullMsg = text;
    if (attachedImageUrl) {
      fullMsg = text ? `${text}\n[Evidence Image]: ${attachedImageUrl}` : `[Evidence Image]: ${attachedImageUrl}`;
    }

    setInputText('');
    setAttachedImageUrl('');

    try {
      const res = await fetch('/api/dispute/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dispute_id: disputeId,
          sender_id: currentUserId,
          message: fullMsg,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.messages) setMessages(data.messages);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to send message');
        // Fallback
        mockStore.addDisputeMessage({
          dispute_id: disputeId,
          sender_id: currentUserId,
          sender_role: currentUserRole,
          message: fullMsg,
        });
        setMessages(mockStore.getDisputeMessages(disputeId));
      }
    } catch {
      mockStore.addDisputeMessage({
        dispute_id: disputeId,
        sender_id: currentUserId,
        sender_role: currentUserRole,
        message: fullMsg,
      });
      setMessages(mockStore.getDisputeMessages(disputeId));
    } finally {
      setSending(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300';
      case 'seller':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300';
      case 'buyer':
        return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col h-[450px]">
      {/* Header */}
      <div className="bg-slate-800/80 px-4 py-3 border-b border-slate-700/60 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h4 className="text-sm font-semibold text-white tracking-wide uppercase">
            Dispute Thread & Compliance Audit Log
          </h4>
        </div>
        {currentUserRole !== 'admin' && (
          <span className={`text-xs px-2 py-0.5 rounded font-medium ${isLimitReached ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-700 text-slate-300'}`}>
            {isLimitReached ? 'Message limit reached (3/3)' : `Messages sent: ${userMessagesCount}/3`}
          </span>
        )}
      </div>

      {/* Messages Scroll Log */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 font-sans text-sm">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No messages logged in this dispute thread yet.
          </div>
        ) : (
          messages.map((msg) => {
            if (msg.is_system) {
              return (
                <div key={msg.id} className="flex justify-center my-2">
                  <div className="bg-slate-800/90 border border-slate-700/70 text-slate-300 text-xs px-3 py-1.5 rounded-lg italic text-center max-w-[85%] shadow-sm">
                    <span className="font-semibold text-slate-400 not-italic mr-1.5">[SYSTEM]</span>
                    {msg.message}
                    <span className="ml-2 not-italic text-[10px] text-slate-500">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            }

            const isSelf = msg.sender_id === currentUserId;
            const hasImageUrlMatch = msg.message.match(/\[Evidence Image\]:\s*(https?:\/\/[^\s]+)/);
            const textWithoutImage = msg.message.replace(/\[Evidence Image\]:\s*(https?:\/\/[^\s]+)/, '').trim();

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'} my-1`}
              >
                <div className="flex items-center space-x-1.5 mb-1 text-[11px]">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold border ${getRoleBadgeColor(
                      msg.sender_role
                    )}`}
                  >
                    {msg.sender_role}
                  </span>
                  <span className="text-slate-400 font-mono text-[10px]">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div
                  className={`max-w-[80%] rounded-xl px-3.5 py-2 text-sm leading-relaxed shadow-sm space-y-1.5 ${
                    isSelf
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : msg.sender_role === 'admin'
                      ? 'bg-purple-900/60 border border-purple-500/30 text-purple-100 rounded-bl-none'
                      : 'bg-slate-800 text-slate-100 border border-slate-700/80 rounded-bl-none'
                  }`}
                >
                  {textWithoutImage && <div>{textWithoutImage}</div>}
                  {hasImageUrlMatch && (
                    <div className="pt-1">
                      <img
                        src={hasImageUrlMatch[1]}
                        alt="Evidence attachment"
                        className="max-w-xs max-h-48 rounded-lg object-cover border border-white/20 shadow-xs cursor-pointer"
                        onClick={() => window.open(hasImageUrlMatch[1], '_blank')}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Image Attachment Preview */}
      {attachedImageUrl && (
        <div className="px-3 py-1.5 bg-slate-800/90 border-t border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={attachedImageUrl} alt="Attachment" className="w-8 h-8 rounded border border-slate-600 object-cover" />
            <span className="text-xs text-slate-300 font-medium">Photo attached to message</span>
          </div>
          <button
            type="button"
            onClick={() => setAttachedImageUrl('')}
            className="text-slate-400 hover:text-rose-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="p-3 bg-slate-800/80 border-t border-slate-700/60 flex items-center space-x-2">
        <label className="cursor-pointer p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all shrink-0">
          {isUploadingImage ? (
            <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
          ) : (
            <ImageIcon className="w-4 h-4" />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={isLimitReached || sending || isUploadingImage}
            className="hidden"
          />
        </label>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            isLimitReached
              ? 'Message limit reached for this phase'
              : 'Type your message to the dispute log (max 500 chars)...'
          }
          disabled={isLimitReached || sending}
          maxLength={500}
          className="flex-1 bg-slate-900 border border-slate-700 text-white text-sm rounded-lg px-3.5 py-2 focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed placeholder-slate-500"
        />
        <button
          type="submit"
          disabled={(!inputText.trim() && !attachedImageUrl) || sending || isLimitReached}
          className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-all duration-150 flex items-center justify-center min-w-[80px]"
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
