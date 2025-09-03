const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const messageSchema = new mongoose.Schema({
  messageId: {
    type: String,
    default: uuidv4,
    unique: true
  },
  chatId: {
    type: String,
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    trim: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'voice', 'video'],
    default: 'text'
  },
  media: {
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    url: String
  },
  reactions: [{
    emoji: String,
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  }],
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date
}, {
  timestamps: true
});

// Индексы для быстрого поиска
messageSchema.index({ chatId: 1, createdAt: -1 });
messageSchema.index({ text: 'text' });

module.exports = mongoose.model('Message', messageSchema);