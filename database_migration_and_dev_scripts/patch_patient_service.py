import os

path = 'patient-app/src/services/patientService.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

target = """  // Books a new appointment with a doctor, writing to Neon PostgreSQL.
  async bookAppointment(appointmentData) {
    const res = await api.post('/patients/book', appointmentData);
    if (res && res.patient) {
      localStorage.setItem('mediflow_user', JSON.stringify(res.patient));
    }
    return res;
  },"""

replacement = """  // Books a new appointment with a doctor, writing to Neon PostgreSQL.
  async bookAppointment(appointmentData) {
    const res = await api.post('/patients/book', appointmentData);
    if (res && res.patient) {
      localStorage.setItem('mediflow_user', JSON.stringify(res.patient));
    }
    return res;
  },

  // Fetches live dynamic slot availability for a doctor on a specific date
  async getAvailableSlots(doctorId, date) {
    try {
      const url = `/doctors/${doctorId}/available-slots?date=${encodeURIComponent(date)}`;
      return await api.get(url);
    } catch (err) {
      console.warn("Fetch available slots API fallback:", err);
      return null;
    }
  },"""

if target in content and "getAvailableSlots" not in content:
    content = content.replace(target, replacement)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("SUCCESS: Added getAvailableSlots to patientService.js")
else:
    print("Already present or target not found")
