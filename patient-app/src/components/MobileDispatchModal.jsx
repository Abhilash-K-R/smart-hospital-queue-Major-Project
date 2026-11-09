import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Copy,
  CheckCircle2,
  Bell,
  Navigation,
  ShieldCheck,
  Send,
  Sparkles,
  Info
} from 'lucide-react';

/**
 * MobileDispatchModal Component
 * -----------------------------
 * Displays a realistic mobile smartphone notification screen for Fast2SMS carrier SMS
 * for Shridevi Hospital OPD patients.
 * 
 * Features:
 * - Interactive smartphone frame mockup with top status bar.
 * - Carrier SMS simulation with verified hospital sender ID (VM-SHRIDEVI).
 * - Live custom phone number tester.
 * - 1-Credit GSM 7-bit character count indicator.
 * - Clipboard copy helper and native Web Push Notification trigger.
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal visibility flag
 * @param {Function} props.onClose - Modal close handler
 * @param {Object} props.dispatchData - Dispatch payload from /notifications/dispatch-preview
 * @param {Function} [props.onTriggerBrowserNotification] - Optional native browser notification trigger
 */
export default function MobileDispatchModal({ isOpen, onClose, dispatchData, onTriggerBrowserNotification }) {
  const [copied, setCopied] = useState(false);
  const [customPhone, setCustomPhone] = useState('');
  const [phoneEdited, setPhoneEdited] = useState(false);

  if (!isOpen || !dispatchData) return null;

  const recipient = phoneEdited ? customPhone : (dispatchData.phone || '9876543210');
  const cleanPhone = recipient.replace(/[^0-9]/g, '');

  const smsText = dispatchData.sms_text || dispatchData.sms?.text || '';
  const googleMapsUrl = dispatchData.google_maps_url || dispatchData.meta?.google_maps_url || 'https://maps.google.com/?q=13.376230,77.097439';

  const handleCopy = () => {
    navigator.clipboard.writeText(smsText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-600 text-white p-5 flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <Smartphone className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-lg text-white">Carrier SMS Alert Simulator</h3>
                <span className="text-[10px] uppercase tracking-wider font-semibold bg-white/20 px-2 py-0.5 rounded-full">
                  Fast2SMS GSM
                </span>
              </div>
              <p className="text-xs text-blue-100 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-300" />
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
                value={phoneEdited ? customPhone : (dispatchData.phone || '9876543210')}
                onChange={(e) => {
                  setCustomPhone(e.target.value);
                  setPhoneEdited(true);
                }}
                placeholder="Enter 10 digit number"
                className="w-32 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Fast2SMS Automated Gateway Active</span>
          </div>
        </div>

        {/* Phone Mockup Body */}
        <div className="flex-1 overflow-y-auto p-5 bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-950 dark:to-slate-900 flex justify-center items-start">
          <div className="w-full max-w-sm shadow-2xl rounded-3xl overflow-hidden border-4 border-slate-800 dark:border-slate-700 bg-slate-950 text-slate-900 flex flex-col">
            
            {/* Phone Top Notch */}
            <div className="bg-slate-900 text-white px-5 py-2 flex items-center justify-between text-[11px] select-none">
              <span className="font-semibold tracking-tight">{dispatchData.timestamp || '10:42 AM'}</span>
              <div className="w-20 h-3 bg-black rounded-full mx-auto" />
              <div className="flex items-center space-x-1">
                <span className="text-[10px]">5G</span>
                <div className="w-4 h-2 bg-white rounded-sm" />
              </div>
            </div>

            {/* SMS Mobile Screen */}
            <div className="flex flex-col bg-slate-950 min-h-[340px] text-white">
              {/* SMS Chat Header */}
              <div className="bg-slate-900 px-4 py-3 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs text-white">
                    SH
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs text-white">VM-SHRIDEVI (Hospital SMS)</h4>
                    <p className="text-[10px] text-slate-400">Official GSM Carrier SMS Gateway</p>
                  </div>
                </div>
                <span className="text-[10px] bg-blue-900/60 text-blue-300 border border-blue-700/50 px-2 py-0.5 rounded-full font-mono">
                  {smsText.length} chars (1 credit)
                </span>
              </div>

              {/* SMS Canvas */}
              <div className="flex-1 p-4 bg-slate-950 space-y-3 flex flex-col justify-start">
                <div className="text-center">
                  <span className="text-[10px] text-slate-500">Today • Standard Carrier SMS</span>
                </div>

                <div className="bg-blue-600 text-white p-3.5 rounded-2xl rounded-bl-sm max-w-[92%] shadow-lg">
                  <p className="text-xs font-mono leading-relaxed">{smsText}</p>
                  <div className="text-right text-[10px] text-blue-200 mt-1">Delivered via Fast2SMS</div>
                </div>
              </div>

              {/* SMS Quick Action */}
              <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>GSM 7-bit ASCII • 1 Credit</span>
                <button
                  onClick={handleCopy}
                  className="py-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium flex items-center space-x-1.5 transition-all shadow-sm"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy SMS</span>
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-white dark:bg-slate-900 p-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span>Fast2SMS Automated Carrier SMS + In-App Push Active</span>
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
              <span>{copied ? 'Copied!' : 'Copy SMS'}</span>
            </button>

            {googleMapsUrl && (
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm"
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
