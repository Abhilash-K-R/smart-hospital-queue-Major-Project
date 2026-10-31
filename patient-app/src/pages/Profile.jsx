import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQueue } from '../context/QueueContext';
import { patientService } from '../services/patientService';
import { TopBar } from '../components/TopBar';
import { Button } from '../components/Button';
import { QRCodeSVG } from 'qrcode.react';
import {
  User,
  Camera,
  Upload,
  CheckCircle2,
  AlertCircle,
  Save,
  Edit3,
  ShieldCheck,
  Droplet,
  HeartPulse,
  Phone,
  Mail,
  MapPin,
  AlertTriangle,
  History,
  Download,
  LogOut,
  X
} from 'lucide-react';
import { downloadAppointmentPDF } from '../utils/helpers';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS = ['Male', 'Female', 'Other'];

export const Profile = () => {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuth();
  const { queueState } = useQueue();
  const fileInputRef = useRef(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    avatar: user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    age: user?.age || '',
    gender: user?.gender || 'Male',
    blood_group: user?.blood_group || user?.bloodGroup || 'O+',
    address: user?.address || '',
    emergency_contact_name: user?.emergency_contact_name || '',
    emergency_contact_phone: user?.emergency_contact_phone || user?.emergencyContact || '',
    allergies: user?.allergies || ''
  });

  // Preview state for newly uploaded photo
  const [avatarPreview, setAvatarPreview] = useState(null);

  // Fetch verified profile from backend on component mount
  useEffect(() => {
    let isMounted = true;
    const fetchLatestProfile = async () => {
      try {
        const profile = await patientService.getProfile();
        if (profile && isMounted) {
          const merged = {
            ...user,
            ...profile,
            blood_group: profile.blood_group || profile.bloodGroup || user?.blood_group || 'O+',
            emergency_contact_phone: profile.emergency_contact_phone || profile.emergencyContact || user?.emergency_contact_phone || ''
          };
          setUser(merged);
          setFormData({
            name: merged.name || '',
            phone: merged.phone || '',
            email: merged.email || '',
            avatar: merged.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
            age: merged.age || '',
            gender: merged.gender || 'Male',
            blood_group: merged.blood_group || 'O+',
            address: merged.address || '',
            emergency_contact_name: merged.emergency_contact_name || '',
            emergency_contact_phone: merged.emergency_contact_phone || '',
            allergies: merged.allergies || ''
          });
        }
      } catch (err) {
        console.warn('Could not fetch remote profile:', err);
      }
    };
    fetchLatestProfile();
    return () => { isMounted = false; };
  }, []);

  // Update formData if user context changes
  useEffect(() => {
    if (user && !isEditing) {
      setFormData(prev => ({
        ...prev,
        name: user.name || prev.name,
        phone: user.phone || prev.phone,
        email: user.email || prev.email,
        avatar: user.avatar || prev.avatar,
        age: user.age || prev.age,
        gender: user.gender || prev.gender,
        blood_group: user.blood_group || user.bloodGroup || prev.blood_group,
        address: user.address || prev.address,
        emergency_contact_name: user.emergency_contact_name || prev.emergency_contact_name,
        emergency_contact_phone: user.emergency_contact_phone || user.emergencyContact || prev.emergency_contact_phone,
        allergies: user.allergies || prev.allergies
      }));
    }
  }, [user, isEditing]);

  // Handle Photo Selection & Compression
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage('');
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage('Please upload a valid image file (JPEG, PNG, or WEBP).');
      return;
    }

    // Validate size (< 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage('Image size exceeds 2MB. Please select a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target.result;
      setAvatarPreview(base64Data);
      setFormData(prev => ({ ...prev, avatar: base64Data }));
    };
    reader.readAsDataURL(file);
  };

  // Handle Save Profile
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    if (!formData.name.trim()) {
      setErrorMessage('Full name is required.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        avatar: formData.avatar,
        age: formData.age ? parseInt(formData.age, 10) : null,
        gender: formData.gender,
        blood_group: formData.blood_group,
        bloodGroup: formData.blood_group,
        address: formData.address.trim(),
        emergency_contact_name: formData.emergency_contact_name.trim(),
        emergency_contact_phone: formData.emergency_contact_phone.trim(),
        emergencyContact: formData.emergency_contact_phone.trim(),
        allergies: formData.allergies.trim()
      };

      const res = await patientService.updateProfile(payload);
      const updatedUser = res?.user || { ...user, ...payload };
      
      setUser(updatedUser);
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error('Error saving profile:', err);
      setErrorMessage(err?.response?.data?.detail || 'Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const patientUid = user?.patient_uid || (user?.id ? String(100000 + Number(user.id)) : '100000');
  const displayAvatar = avatarPreview || formData.avatar || user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250';

  return (
    <div className="space-y-8" id="profile-pdf-container">
      <TopBar
        title="Patient Medical Profile"
        subtitle="Clinical record, verifiable patient UID, and hospital consultation records"
      />

      {/* Success Banner */}
      {saveSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl flex items-center justify-between text-emerald-800 dark:text-emerald-200 text-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">Patient clinical profile updated and saved to Mediflow Cloud successfully!</span>
          </div>
          <button onClick={() => setSaveSuccess(false)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-2xl flex items-center gap-3 text-rose-800 dark:text-rose-200 text-sm animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="font-semibold">{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column (8 cols): Clinical Profile & Medical Data */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Practo / Apollo Style Clinical Patient Header */}
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-bl-full pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              
              {/* Profile Avatar with Hover / Edit Camera Icon */}
              <div className="relative group shrink-0">
                <img
                  src={displayAvatar}
                  alt={formData.name || 'Patient'}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover ring-4 ring-blue-500/20 shadow-md group-hover:ring-blue-500/50 transition-all"
                />
                
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-slate-900/60 rounded-2xl flex flex-col items-center justify-center text-white opacity-90 hover:opacity-100 transition-opacity backdrop-blur-xs cursor-pointer"
                    title="Change Patient Photo"
                  >
                    <Camera className="w-6 h-6 mb-1 text-blue-300" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Change</span>
                  </button>
                )}

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoSelect}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                />
              </div>

              {/* Patient Core Identity Info */}
              <div className="flex-1 text-center sm:text-left space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {formData.name || 'Patient Name'}
                      </h2>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold bg-emerald-500/10 text-emerald-600 rounded-full border border-emerald-500/30">
                        <ShieldCheck className="w-3.5 h-3.5" /> Verified
                      </span>
                    </div>

                    {/* Permanent 6-Digit Patient UID & Demographics */}
                    <div className="flex items-center justify-center sm:justify-start gap-2 mt-1.5 flex-wrap text-xs">
                      <span className="font-mono font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800 tracking-wide">
                        Patient UID: {patientUid}
                      </span>
                      {formData.age ? <span className="text-slate-600 dark:text-slate-400 font-medium">• {formData.age} Yrs</span> : null}
                      <span className="text-slate-600 dark:text-slate-400 font-medium">• {formData.gender}</span>
                    </div>
                  </div>

                  {/* Blood Group Badge */}
                  <div className="px-3.5 py-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl flex items-center gap-2 self-center sm:self-start">
                    <Droplet className="w-4 h-4 text-rose-500 fill-rose-500" />
                    <div className="text-left">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block leading-tight">Blood Group</span>
                      <span className="text-sm font-black text-rose-700 dark:text-rose-300">{formData.blood_group}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-blue-500" />
                    <span>{formData.phone || 'No phone'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-cyan-500" />
                    <span>{formData.email || 'No email'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <HeartPulse className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Status: <strong className="text-emerald-600">Active</strong></span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Section 1: Demographics & Clinical Information Card */}
          <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-500" /> Clinical & Demographics Information
                </h3>
                <p className="text-xs text-slate-500">Official medical record attributes stored on hospital server</p>
              </div>

              <Button
                size="sm"
                variant={isEditing ? 'primary' : 'outline'}
                icon={isEditing ? Save : Edit3}
                onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Edit Profile'}
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 text-xs">
              
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  Full Legal Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Enter full name"
                  />
                ) : (
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{formData.name || 'Not provided'}</p>
                )}
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <label className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="10-digit mobile"
                  />
                ) : (
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{formData.phone || 'Not provided'}</p>
                )}
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  Email Address
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="email@example.com"
                  />
                ) : (
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{formData.email || 'Not provided'}</p>
                )}
              </div>

              {/* Age */}
              <div className="space-y-1.5">
                <label className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  Age (Years)
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    min="1"
                    max="125"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g. 28"
                  />
                ) : (
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{formData.age ? `${formData.age} Years` : 'Not specified'}</p>
                )}
              </div>

              {/* Gender */}
              <div className="space-y-1.5">
                <label className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  Gender
                </label>
                {isEditing ? (
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {GENDERS.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{formData.gender || 'Male'}</p>
                )}
              </div>

              {/* Blood Group Selector */}
              <div className="space-y-1.5">
                <label className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  Blood Group
                </label>
                {isEditing ? (
                  <select
                    value={formData.blood_group}
                    onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-rose-600 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  >
                    {BLOOD_GROUPS.map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm font-bold text-rose-600 dark:text-rose-400">{formData.blood_group}</p>
                )}
              </div>

              {/* Residential Address (Spans 3 cols) */}
              <div className="sm:col-span-2 md:col-span-3 space-y-1.5">
                <label className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  Residential Address
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="House / Street, Area, City, Pin"
                  />
                ) : (
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{formData.address || 'Not provided'}</p>
                )}
              </div>

            </div>

            {/* Emergency & Clinical Section */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> Emergency Contact & Known Allergies
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs">
                {/* Emergency Contact Name */}
                <div className="space-y-1.5">
                  <label className="text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px]">
                    Emergency Contact Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.emergency_contact_name}
                      onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white"
                      placeholder="e.g. Spouse / Parent Name"
                    />
                  ) : (
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {formData.emergency_contact_name || 'Not provided'}
                    </p>
                  )}
                </div>

                {/* Emergency Contact Phone */}
                <div className="space-y-1.5">
                  <label className="text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px]">
                    Emergency Contact Phone
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.emergency_contact_phone}
                      onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white"
                      placeholder="10-digit emergency contact"
                    />
                  ) : (
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {formData.emergency_contact_phone || 'Not provided'}
                    </p>
                  )}
                </div>

                {/* Known Allergies */}
                <div className="space-y-1.5">
                  <label className="text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px]">
                    Known Allergies / Medical Notes
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.allergies}
                      onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white"
                      placeholder="e.g. Penicillin, Dust, Seafood, None"
                    />
                  ) : (
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {formData.allergies || 'No known allergies reported'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Actions if Editing */}
            {isEditing && (
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setErrorMessage('');
                  }}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <Button
                  size="sm"
                  variant="primary"
                  icon={Save}
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving Changes...' : 'Save Patient Profile'}
                </Button>
              </div>
            )}
          </div>

          {/* Medical History */}
          <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-4 border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <History className="w-5 h-5 text-cyan-500" /> Historical OPD Consultations
            </h3>

            <div className="space-y-3">
              {[
                { date: "Jul 14, 2026", doctor: "Dr. Vikram K. Rao", dept: "Cardiology", status: "Completed", prescription: "Rx-9021 (ECG Normal)" },
                { date: "Jun 02, 2026", doctor: "Dr. Rajeswari R.", dept: "General Medicine", status: "Completed", prescription: "Rx-8812 (Routine Consultation)" }
              ].map((h, i) => (
                <div key={i} className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl flex items-center justify-between gap-4 border border-slate-200 dark:border-slate-800 text-xs">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white text-sm block">{h.doctor} ({h.dept})</span>
                    <span className="text-slate-500">{h.date} • {h.prescription}</span>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 rounded-md font-bold border border-emerald-500/20">
                    {h.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column (4 cols): Patient Hospital Pass & Actions */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card rounded-3xl p-6 text-center space-y-6 border border-blue-500/30 shadow-md">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-900">
                Official Credential
              </span>
              <h4 className="text-base font-bold text-slate-900 dark:text-white pt-1">
                Patient Digital Hospital Pass
              </h4>
            </div>

            <div className="flex justify-center p-4 bg-white rounded-2xl w-fit mx-auto shadow-sm ring-1 ring-slate-200">
              <QRCodeSVG
                value={`PATIENT_UID:${patientUid}|NAME:${formData.name || user?.name}|PHONE:${formData.phone || user?.phone}|TOKEN:${queueState?.tokenNumber || user?.tokenNumber || 'NONE'}`}
                size={144}
              />
            </div>

            <div className="text-xs text-slate-500 space-y-1 bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
              <p className="font-bold text-slate-900 dark:text-white">UID: {patientUid}</p>
              <p className="text-[11px]">Scan at OPD Entrance Kiosk or present at Doctor Reception.</p>
            </div>

            <Button
              className="w-full"
              icon={Download}
              onClick={() => downloadAppointmentPDF('profile-pdf-container', `MediFlow_Patient_Record_${formData.name || 'Patient'}.pdf`)}
            >
              Export Medical Summary (PDF)
            </Button>

            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="w-full py-2.5 px-4 rounded-2xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/50 transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout Patient Session</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
