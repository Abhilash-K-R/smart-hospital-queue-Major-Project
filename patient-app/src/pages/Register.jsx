import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { signupSchema } from '../utils/validators';
import { patientService } from '../services/patientService';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Activity, User, Phone, Lock, UserPlus, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

export const Register = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      phone: '',
      password: '',
      confirmPassword: ''
    }
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setApiError(null);

    try {
      const res = await patientService.signup({
        name: data.name.trim(),
        phone: data.phone.trim(),
        password: data.password
      });

      if (res && res.success) {
        navigate(`/login?registered=true&phone=${encodeURIComponent(data.phone.trim())}`);
      } else {
        setApiError(res?.message || "Registration failed. Please try again.");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || "Registration failed. Please try again.";
      setApiError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/30">
            <Activity className="w-8 h-8 animate-pulse" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Create Patient Account
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Register with your mobile number to manage appointments and live queue status
          </p>
        </div>

        {/* Card */}
        <div className="glass-card rounded-3xl p-8 space-y-6 shadow-2xl border border-slate-200 dark:border-slate-800">
          
          {apiError && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl flex items-center gap-3 text-rose-700 dark:text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{apiError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Full Name"
              placeholder="e.g. Ramesh Kumar"
              icon={User}
              error={errors.name?.message}
              {...register('name')}
            />

            <Input
              label="10-Digit Mobile Number"
              placeholder="e.g. 9876543210"
              icon={Phone}
              maxLength={10}
              error={errors.phone?.message}
              {...register('phone')}
            />

            <Input
              label="Password (min 6 characters)"
              type="password"
              placeholder="••••••••"
              icon={Lock}
              error={errors.password?.message}
              {...register('password')}
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              icon={Lock}
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            <Button
              type="submit"
              className="w-full"
              size="lg"
              icon={UserPlus}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <div>
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 dark:text-blue-400 font-bold hover:underline inline-flex items-center gap-1">
                Sign In <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <Link to="/forgot-password" className="text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:underline">
              Forgot password?
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};
export default Register;
