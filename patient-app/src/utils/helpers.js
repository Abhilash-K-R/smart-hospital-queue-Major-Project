import confetti from 'canvas-confetti';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Converts a wait duration in minutes into patient-friendly text.
export const formatMinutesToWords = (minutes) => {
  if (minutes <= 0) return 'Immediate / Call Now';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0) {
    return `${hrs} hr ${mins} mins`;
  }
  return `${mins} Mins`;
};

// Converts a relative departure delay into a localized clock time.
export const getDepartureTimestamp = (minutesFromNow = 10) => {
  const now = new Date();
  const dep = new Date(now.getTime() + minutesFromNow * 60000);
  return dep.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
};

// Triggers the visual confirmation effect after token generation.
export const triggerConfetti = () => {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#2563EB', '#3B82F6', '#06B6D4', '#22C55E']
  });
};

// Captures a DOM element and downloads it as a printable appointment PDF.
export const downloadAppointmentPDF = async (elementId, filename = "MediFlow_Appointment_Slip.pdf") => {
  const element = document.getElementById(elementId);
  if (!element) return;

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, pdfHeight);
    pdf.save(filename);
  } catch (err) {
    console.error("PDF generation failed:", err);
  }
};

// Opens the browser print flow for the current document content.
export const printElement = (elementId) => {
  const content = document.getElementById(elementId);
  if (!content) return;
  window.print();
};
