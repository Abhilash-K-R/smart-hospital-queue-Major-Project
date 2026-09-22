import { z } from 'zod';

// Validates the credentials submitted by the login screen.
export const loginSchema = z.object({
  emailOrPhone: z.string().min(3, "Please enter a valid email or 10-digit phone number"),
  password: z.string().min(4, "Password must be at least 4 characters long")
});

// Validates patient user signup / account creation
export const signupSchema = z.object({
  name: z.string().min(2, "Full Name must be at least 2 characters"),
  phone: z.string().regex(/^[0-9]{10}$/, "Mobile number must be exactly 10 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password")
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
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

// Validates the appointment form with support for self and dependent bookings.
export const appointmentSchema = z.object({
  department: z.string().min(1, "Department is required"),
  doctor: z.string().min(1, "Doctor is required"),
  date: z.string().min(1, "Date is required"),
  timeSlot: z.string().min(1, "Time slot is required"),
  symptoms: z.string().min(3, "Briefly mention symptoms"),
  attendeeType: z.enum(["myself", "dependent"]).default("myself"),
  patientName: z.string().optional(),
  patientAge: z.coerce.number().optional(),
  patientGender: z.string().optional(),
  contactPhone: z.string().optional()
}).superRefine((data, ctx) => {
  if (data.attendeeType === "dependent") {
    if (!data.patientName || data.patientName.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Patient Full Name is required (at least 2 characters)",
        path: ["patientName"]
      });
    }
    if (!data.patientAge || data.patientAge < 1 || data.patientAge > 120) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please enter a valid age between 1 and 120",
        path: ["patientAge"]
      });
    }
    if (!data.patientGender || !["Male", "Female", "Other"].includes(data.patientGender)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please select a gender",
        path: ["patientGender"]
      });
    }
    const cleanPhone = (data.contactPhone || "").replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length !== 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Contact phone must be a valid 10-digit mobile number",
        path: ["contactPhone"]
      });
    }
  }
});

