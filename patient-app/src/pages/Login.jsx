import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { loginSchema } from '../utils/validators';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Activity, Mail, Lock, Sparkles, UserCheck, ShieldCheck, CheckCircle2, Phone } from 'lucide-react';
import { DEMO_PATIENT } from '../utils/constants';
import { patientService } from '../services/patientService';

// Validates credentials, invokes the patient service, and starts the session.
export const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  
  const isJustRegistered = searchParams.get('registered') === 'true';
  const isJustReset = searchParams.get('reset') === 'true';
  const prefilledPhone = searchParams.get('phone') || '';
  const [loginError, setLoginError] = useState(null);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      emailOrPhone: prefilledPhone || DEMO_PATIENT.email,
      password: isJustRegistered ? "" : "password123"
    }
  });

  useEffect(() => {
    if (prefilledPhone) {
      setValue('emailOrPhone', prefilledPhone);
    }
  }, [prefilledPhone, setValue]);

  const onSubmit = async (data) => {
    setLoginError(null);
    try {
      const res = await patientService.login({
        emailOrPhone: data.emailOrPhone,
        password: data.password
      });
      if (res && res.user) {
        login(res.user);
        // If user has an active appointment, go to dashboard, else go to book appointment
        if (res.user.appointment_id) {
          navigate('/dashboard');
        } else {
          navigate('/appointment');
        }
      } else {
        login({ ...DEMO_PATIENT, phone: data.emailOrPhone, email: data.emailOrPhone });
        navigate('/dashboard');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.detail || "Invalid mobile number or password.";
      setLoginError(errorMsg);
    }
  };

  const handleDemoLogin = () => {
    login(DEMO_PATIENT);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-3xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/30">
            <Activity className="w-8 h-8 animate-pulse" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Patient Portal Login</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Access your live AI queue status & departure tracker</p>
        </div>

        {/* Card */}
        <div className="glass-card rounded-3xl p-8 space-y-6 shadow-2xl border border-slate-200 dark:border-slate-800">
          
          {/* Registration Success Toast */}
          {isJustRegistered && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-2xl flex items-center gap-3 text-emerald-800 dark:text-emerald-200 text-xs animate-in fade-in duration-300 shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <strong className="block font-bold">Account created successfully!</strong>
                <span>Please sign in with your mobile number and password.</span>
              </div>
            </div>
          )}

          {/* Password Reset Success Toast */}
          {isJustReset && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-2xl flex items-center gap-3 text-emerald-800 dark:text-emerald-200 text-xs animate-in fade-in duration-300 shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <strong className="block font-bold">Password updated successfully!</strong>
                <span>Please sign in with your new password.</span>
              </div>
            </div>
          )}

          {/* Login Error Alert */}
          {loginError && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl flex items-center gap-3 text-rose-700 dark:text-rose-300 text-xs">
              <span>⚠️ {loginError}</span>
            </div>
          )}

          {/* Quick Demo Mode Login Banner */}
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <div className="text-[11px]">
                <strong className="text-slate-900 dark:text-white block font-bold">College Viva Demo Mode</strong>
                <span className="text-slate-500">Auto-fills Laxuman G (Token #18)</span>
              </div>
            </div>
            <button
              onClick={handleDemoLogin}
              className="px-3 py-1 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-amber-400 transition-colors shadow-sm shrink-0"
            >
              Demo Login
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Mobile Number or Email"
              placeholder="e.g. 9876543210 or email"
              icon={Phone}
              error={errors.emailOrPhone?.message}
              {...register('emailOrPhone')}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              icon={Lock}
              error={errors.password?.message}
              {...register('password')}
            />

            <div className="flex justify-between items-center text-xs">
              <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded text-blue-600 focus:ring-blue-500" />
                Remember credentials
              </label>
              <Link to="/forgot-password" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full" size="lg" icon={UserCheck}>
              Sign In to Patient Portal
            </Button>
          </form>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
              Sign Up / Register
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};
export default Login;
