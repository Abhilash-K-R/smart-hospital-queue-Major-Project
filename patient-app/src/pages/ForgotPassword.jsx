import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { patientService } from '../services/patientService';
import {
  KeyRound,
  Phone,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

export const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = Request OTP, 2 = Verify OTP & Reset
  const [phone, setPhone] = useState('');
  const [virtualOtp, setVirtualOtp] = useState('123456');
  const [showOtpBanner, setShowOtpBanner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Step 1 Form: Mobile Number
  const {
    register: registerPhone,
    handleSubmit: handlePhoneSubmit,
    formState: { errors: phoneErrors }
  } = useForm({
    defaultValues: { phone: '' }
  });

  // Step 2 Form: OTP & New Password
  const {
    register: registerReset,
    handleSubmit: handleResetSubmit,
    setValue: setResetValue,
    formState: { errors: resetErrors }
  } = useForm({
    defaultValues: { otp: '', newPassword: '', confirmNewPassword: '' }
  });

  const onSendOTP = async (data) => {
    setErrorMsg('');
    setLoading(true);
    const cleanPhone = String(data.phone || '').replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number');
      setLoading(false);
      return;
    }

    try {
      const res = await patientService.requestForgotPasswordOTP(cleanPhone);
      setPhone(cleanPhone);
      const returnedOtp = res?.otp || '123456';
      setVirtualOtp(returnedOtp);
      setShowOtpBanner(true);
      setResetValue('otp', returnedOtp);
      setStep(2);
    } catch (err) {
      const msg = err.response?.data?.detail || 'No patient account registered with this mobile number.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const onResetPassword = async (data) => {
    setErrorMsg('');
    if (data.newPassword !== data.confirmNewPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }
    if (data.newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const res = await patientService.resetPassword({
        phone: phone,
        otp: data.otp || '123456',
        newPassword: data.newPassword
      });

      if (res && res.success) {
        setSuccessMsg('Password reset successfully! Redirecting to login...');
        setTimeout(() => {
          navigate(`/login?reset=true&phone=${phone}`);
        }, 1500);
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to reset password. Please check the OTP.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/30">
            <KeyRound className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Reset Your Password
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {step === 1
              ? "Enter your registered 10-digit mobile number to receive a virtual OTP"
              : "Verify with the on-screen OTP and create your new secure password"}
          </p>
        </div>

        {/* Card */}
        <div className="glass-card rounded-3xl p-8 space-y-6 shadow-2xl border border-slate-200 dark:border-slate-800">
          
          {/* Step Progress Indicator */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 text-xs font-bold">
            <span className={`flex items-center gap-1.5 ${step === 1 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
              <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-[10px]">1</span>
              Mobile Number
            </span>
            <span className="text-slate-300 dark:text-slate-700">───</span>
            <span className={`flex items-center gap-1.5 ${step === 2 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
              <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px]">2</span>
              OTP & New Password
            </span>
          </div>

          {/* Virtual OTP Alert Toast */}
          {showOtpBanner && (
            <div className="p-4 bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-blue-500/15 border border-emerald-500/30 rounded-2xl space-y-1.5 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-500" /> Virtual OTP Generated
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono font-bold">
                  DEMO MODE
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                Your verification code is: <strong className="font-mono text-sm tracking-widest text-emerald-600 dark:text-emerald-400 bg-white/70 dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-emerald-300 dark:border-emerald-700">{virtualOtp}</strong>
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                (Pre-filled automatically below for instant verification during review)
              </p>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl flex items-center gap-3 text-rose-700 dark:text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-3 text-emerald-700 dark:text-emerald-300 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* STEP 1: Enter Mobile */}
          {step === 1 && (
            <form onSubmit={handlePhoneSubmit(onSendOTP)} className="space-y-4">
              <Input
                label="Registered 10-Digit Mobile Number"
                placeholder="e.g. 9876543210"
                icon={Phone}
                type="tel"
                maxLength={10}
                error={phoneErrors.phone?.message}
                {...registerPhone('phone', {
                  required: 'Mobile number is required',
                  pattern: {
                    value: /^[6-9]\d{9}$/,
                    message: 'Please enter a valid 10-digit Indian mobile number'
                  }
                })}
              />

              <Button
                type="submit"
                className="w-full"
                size="lg"
                loading={loading}
                icon={ArrowRight}
              >
                Send Verification OTP
              </Button>
            </form>
          )}

          {/* STEP 2: Enter OTP & New Password */}
          {step === 2 && (
            <form onSubmit={handleResetSubmit(onResetPassword)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Registered Mobile: <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">+91 {phone}</span>
                </label>
              </div>

              <Input
                label="6-Digit Verification Code (OTP)"
                placeholder="123456"
                icon={KeyRound}
                maxLength={6}
                error={resetErrors.otp?.message}
                {...registerReset('otp', {
                  required: 'OTP is required'
                })}
              />

              <Input
                label="New Password"
                type="password"
                placeholder="••••••••"
                icon={Lock}
                error={resetErrors.newPassword?.message}
                {...registerReset('newPassword', {
                  required: 'New password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters'
                  }
                })}
              />

              <Input
                label="Confirm New Password"
                type="password"
                placeholder="••••••••"
                icon={Lock}
                error={resetErrors.confirmNewPassword?.message}
                {...registerReset('confirmNewPassword', {
                  required: 'Please confirm your new password'
                })}
              />

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setShowOtpBanner(false);
                    setErrorMsg('');
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Change Phone
                </button>
                <Button
                  type="submit"
                  className="flex-1"
                  size="lg"
                  loading={loading}
                  icon={ShieldCheck}
                >
                  Update Password
                </Button>
              </div>
            </form>
          )}

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
            Remembered your password?{' '}
            <Link to="/login" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
              Back to Sign In
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ForgotPassword;
