const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['API_KEY', 'PASSWORD', 'JWT_TOKEN', 'PRIVATE_KEY', 'OTHER']
  },
  platform: {
    type: String,
    required: true,
    enum: ['ChatGPT', 'Claude', 'Gemini', 'GitHub', 'Other']
  },
  risk_score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  action: {
    type: String,
    required: true,
    enum: ['REDACTED', 'ALLOWED']
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  details: {
    type: String
  }
});

module.exports = mongoose.model('Event', eventSchema);
