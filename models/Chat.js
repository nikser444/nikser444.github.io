const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const chatSchema = new mongoose.Schema({
  chatId: {
    type: String,
    default: uuidv4,
    unique: true
  },
  type: {
    type: String,
    enum: ['private', 'group'],
    required: true
  },
  title: {
    type: String,
    trim: true
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  lastMessage: {
    text: String,
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Chat', chatSchema);