import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { loginSchema } from '../utils/validators';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Activity, Mail, Lock, Sparkles, UserCheck, ShieldCheck } from 'lucide-react';
import { DEMO_PATIENT } from '../utils/constants';
import { patientService } from '../services/patientService';

// Validates credentials, invokes the patient service, and starts the session.
export const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      emailOrPhone: DEMO_PATIENT.email,
      password: "password123"
    }
  });

  const onSubmit = async (data) => {
    try {
      const res = await patientService.login({
        emailOrPhone: data.emailOrPhone,
        password: data.password
      });
      if (res && res.user) {
        login(res.user);
      } else {
        login({ ...DEMO_PATIENT, email: data.emailOrPhone });
      }
      navigate('/dashboard');
    } catch (err) {
      console.warn("API login failed, continuing with fallback user", err);
      login({ ...DEMO_PATIENT, email: data.emailOrPhone });
      navigate('/dashboard');
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
              label="Email or Mobile Number"
              placeholder="e.g. laxuman.patient@mediflow.ai"
              icon={Mail}
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
              <a href="#forgot" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">Forgot password?</a>
            </div>

            <Button type="submit" className="w-full" size="lg" icon={UserCheck}>
              Sign In to Patient Portal
            </Button>
          </form>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
              Register & Book OPD Token
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};
