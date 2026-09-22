// staff-dashboard/src/utils/audioAnnouncer.js
// Provides browser-native audio chime and voice announcements for calling patients

export const playHospitalChime = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    // 2-tone melodic hospital chime (Ding-Dong / E5 -> C5)
    const now = ctx.currentTime;
    
    // Tone 1: 659.25 Hz (E5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.5);

    // Tone 2: 523.25 Hz (C5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(523.25, now + 0.25);
    gain2.gain.setValueAtTime(0.18, now + 0.25);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.25);
    osc2.stop(now + 0.85);
  } catch (e) {
    console.warn("Audio chime playback error:", e);
  }
};

export const announcePatientCall = (tokenNumber, roomNo = "Room 204", patientName = "") => {
  // 1. Play melodic chime
  playHospitalChime();

  // 2. Speak patient token call using Web Speech API
  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel(); // Stop any pending speech
      
      const cleanToken = tokenNumber ? tokenNumber.replace('OPD-', 'Token ') : 'Next patient';
      const cleanRoom = roomNo || 'Consultation Room';
      
      const speechText = `${cleanToken}, please proceed to ${cleanRoom}.`;
      const utterance = new SpeechSynthesisUtterance(speechText);
      utterance.rate = 0.95; // Slightly slower, clear hospital pace
      utterance.pitch = 1.05;
      utterance.volume = 1.0;

      // Small delay after chime before speaking
      setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, 400);
    } catch (err) {
      console.warn("Voice speech synthesis error:", err);
    }
  }
};
