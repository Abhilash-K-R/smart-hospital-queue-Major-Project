import React, { useState } from 'react';
import {
  X,
  MessageSquare,
  Smartphone,
  ExternalLink,
  Copy,
  CheckCircle2,
  Bell,
  Navigation,
  ShieldCheck,
  Send,
  Sparkles,
  Info
} from 'lucide-react';

export default function MobileDispatchModal({ isOpen, onClose, dispatchData, onTriggerBrowserNotification }) {
  const [activeTab, setActiveTab] = useState('whatsapp'); // 'whatsapp' | 'sms'
  const [copied, setCopied] = useState(false);
  const [customPhone, setCustomPhone] = useState('');
  const [phoneEdited, setPhoneEdited] = useState(false);

  if (!isOpen || !dispatchData) return null;

  const recipient = phoneEdited ? customPhone : (dispatchData.phone || dispatchData.whatsapp?.recipient || '9876543210');
  const cleanPhone = recipient.replace(/[^0-9]/g, '');
  const finalPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  const whatsappText = dispatchData.whatsapp_text || dispatchData.whatsapp?.text || '';
  const smsText = dispatchData.sms_text || dispatchData.sms?.text || '';
  const currentText = activeTab === 'whatsapp' ? whatsappText : smsText;

  const realWhatsAppUrl = dispatchData.whatsapp_share_url || `https://wa.me/${finalPhone}?text=${encodeURIComponent(whatsappText)}`;
  const googleMapsUrl = dispatchData.google_maps_url || dispatchData.meta?.google_maps_url || 'https://maps.google.com/?q=13.376230,77.097439';

  const handleCopy = () => {
    navigator.clipboard.writeText(currentText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white p-5 flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <Smartphone className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-lg text-white">Dual Mobile Alert Simulator</h3>
                <span className="text-[10px] uppercase tracking-wider font-semibold bg-white/20 px-2 py-0.5 rounded-full">
                  Live Dispatch
                </span>
              </div>
              <p className="text-xs text-emerald-100 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                Shridevi Hospital & Research Hospital, Tumakuru
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Recipient Bar */}
        <div className="bg-slate-50 dark:bg-slate-800/60 px-5 py-3 border-b border-slate-200 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-700 dark:text-slate-200">Recipient Mobile:</span>
            <div className="flex items-center space-x-1">
              <span className="text-slate-400 font-medium">+91</span>
              <input
                type="text"
                value={phoneEdited ? customPhone : (dispatchData.whatsapp?.recipient || '9876543210')}
                onChange={(e) => {
                  setCustomPhone(e.target.value);
                  setPhoneEdited(true);
                }}
                placeholder="Enter 10 digit number"
                className="w-32 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Dual Channel Switcher Tabs */}
          <div className="inline-flex p-1 bg-slate-200 dark:bg-slate-700/70 rounded-xl">
            <button
              onClick={() => setActiveTab('whatsapp')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'whatsapp'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-emerald-500'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp Alert</span>
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse ml-1" />
            </button>
            <button
              onClick={() => setActiveTab('sms')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'sms'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-blue-500'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>SMS (GSM Text)</span>
              <span className="w-2 h-2 rounded-full bg-blue-300 animate-pulse ml-1" />
            </button>
          </div>
        </div>

        {/* Phone Mockup Body */}
        <div className="flex-1 overflow-y-auto p-5 bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-950 dark:to-slate-900 flex justify-center items-start">
          <div className="w-full max-w-md shadow-2xl rounded-3xl overflow-hidden border-4 border-slate-800 dark:border-slate-700 bg-slate-900 text-slate-900 flex flex-col">
            
            {/* Phone Top Notch */}
            <div className="bg-slate-900 text-white px-5 py-2 flex items-center justify-between text-[11px] select-none">
              <span className="font-semibold tracking-tight">10:42 AM</span>
              <div className="w-20 h-3 bg-black rounded-full mx-auto" />
              <div className="flex items-center space-x-1">
                <span className="text-[10px]">5G</span>
                <div className="w-4 h-2 bg-white rounded-sm" />
              </div>
            </div>

            {activeTab === 'whatsapp' ? (
              /* WhatsApp Mobile Screen */
              <div className="flex flex-col bg-[#0b141a] min-h-[380px] text-white">
                {/* WhatsApp Chat Header */}
                <div className="bg-[#1f2c34] px-4 py-3 flex items-center space-x-3 border-b border-[#2a3942]">
                  <div className="w-9 h-9 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-sm text-white shadow-inner">
                    SH
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-semibold text-sm truncate text-white">Shridevi Hospital Queue</span>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    </div>
                    <p className="text-[10px] text-emerald-400 font-medium">Official Verified OPD Bot • Online</p>
                  </div>
                </div>

                {/* WhatsApp Chat Canvas */}
                <div className="flex-1 p-3 bg-[radial-gradient(#1f2c34_1px,transparent_1px)] [background-size:12px_12px] bg-[#0b141a] space-y-2">
                  <div className="text-center my-1">
                    <span className="bg-[#182229] text-[#8696a0] text-[10px] px-2.5 py-0.5 rounded-md shadow-sm">
                      TODAY
                    </span>
                  </div>

                  {/* Message Bubble */}
                  <div className="bg-[#005c4b] text-white p-3.5 rounded-2xl rounded-tl-sm max-w-[95%] shadow-md border border-[#005c4b]/50">
                    <div className="whitespace-pre-line text-xs font-sans leading-relaxed text-slate-100">
                      {whatsappText}
                    </div>
                    <div className="flex items-center justify-end space-x-1 text-[10px] text-emerald-200/80 mt-2">
                      <span>Just now</span>
                      <span className="text-sky-300 font-bold">✓✓</span>
                    </div>
                  </div>
                </div>

                {/* WhatsApp Quick Action Bar */}
                <div className="p-2 bg-[#1f2c34] border-t border-[#2a3942] flex items-center justify-between text-xs">
                  <a
                    href={realWhatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all shadow-md active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send to Real WhatsApp</span>
                  </a>
                </div>
              </div>
            ) : (
              /* SMS Mobile Screen */
              <div className="flex flex-col bg-slate-950 min-h-[380px] text-white">
                {/* SMS Chat Header */}
                <div className="bg-slate-900 px-4 py-3 flex items-center justify-between border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs">
                      SH
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs text-white">VM-SHRIDEVI (Hospital SMS)</h4>
                      <p className="text-[10px] text-slate-400">Standard GSM SMS Gateway</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-blue-900/60 text-blue-300 border border-blue-700/50 px-2 py-0.5 rounded-full">
                    {dispatchData.sms?.character_count || smsText.length} chars
                  </span>
                </div>

                {/* SMS Canvas */}
                <div className="flex-1 p-4 bg-slate-950 space-y-3 flex flex-col justify-start">
                  <div className="text-center">
                    <span className="text-[10px] text-slate-500">Today • Standard Carrier SMS</span>
                  </div>

                  <div className="bg-blue-600 text-white p-3.5 rounded-2xl rounded-bl-sm max-w-[90%] shadow-lg">
                    <p className="text-xs font-mono leading-relaxed">{smsText}</p>
                    <div className="text-right text-[10px] text-blue-200 mt-1">Sent • Standard SMS</div>
                  </div>
                </div>

                {/* SMS Quick Action */}
                <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>Standard SMS Gateway Active</span>
                  <button
                    onClick={handleCopy}
                    className="py-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium flex items-center space-x-1.5 transition-all"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Text</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-white dark:bg-slate-900 p-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Simultaneous Dual Dispatch active (WhatsApp + SMS) to prevent missed appointments.</span>
          </div>

          <div className="flex items-center space-x-2">
            {onTriggerBrowserNotification && (
              <button
                onClick={onTriggerBrowserNotification}
                className="px-3 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-indigo-200 dark:border-indigo-800"
                title="Test native desktop/mobile browser notification"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Test Web Push</span>
              </button>
            )}

            <button
              onClick={handleCopy}
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Notification'}</span>
            </button>

            {dispatchData.meta?.google_maps_url && (
              <a
                href={dispatchData.meta.google_maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Navigate to Shridevi</span>
              </a>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
