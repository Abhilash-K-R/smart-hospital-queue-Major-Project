const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  specialization: { type: String, required: true },
  avgConsultationTime: { type: Number, default: 15 }, // in minutes
  roomNumber: { type: String },
  isActive: { type: Boolean, default: true }
});

module.exports = mongoose.model('Doctor', doctorSchema);