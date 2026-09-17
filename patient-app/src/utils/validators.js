import { z } from 'zod';

// Validates the credentials submitted by the login screen.
export const loginSchema = z.object({
  emailOrPhone: z.string().min(3, "Please enter a valid email or 10-digit phone number"),
  password: z.string().min(4, "Password must be at least 4 characters long")
});

// Validates the complete patient registration and appointment request.
export const registerSchema = z.object({
  fullName: z.string().min(2, "Full Name is required"),
  age: z.coerce.number().min(1, "Age must be valid").max(120, "Age must be realistic"),
  gender: z.enum(["Male", "Female", "Other"], { required_error: "Please select gender" }),
  phone: z.string().regex(/^[0-9]{10}$/, "Phone number must be 10 digits"),
  email: z.string().email("Invalid email address"),
  bloodGroup: z.string().min(1, "Please select blood group"),
  department: z.string().min(1, "Department is required"),
  doctor: z.string().min(1, "Doctor selection is required"),
  symptoms: z.string().min(5, "Please describe your primary symptoms"),
  appointmentDate: z.string().min(1, "Appointment Date is required"),
  appointmentTime: z.string().min(1, "Appointment Time is required"),
  address: z.string().min(5, "Full address is required"),
  emergencyContact: z.string().regex(/^[0-9]{10}$/, "Emergency contact must be 10 digits")
});

// Validates the shorter appointment form used by existing patients.
export const appointmentSchema = z.object({
  department: z.string().min(1, "Department is required"),
  doctor: z.string().min(1, "Doctor is required"),
  date: z.string().min(1, "Date is required"),
  timeSlot: z.string().min(1, "Time slot is required"),
  symptoms: z.string().min(3, "Briefly mention symptoms")
});
