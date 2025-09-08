import mongoose from 'mongoose';

/* अगर speakers निकाल दिए तो यह schema में रहें या पूरी तरह हटा दें */
// const speakerSchema = new mongoose.Schema({
//   name: String,
//   bio: String,
//   photoUrl: String
// }, { _id: false });

const eventSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, required: true },
    date:        { type: Date,   required: true },
    time:        { type: String, required: true },
    venue:       { type: String, required: true },
    capacity:    { type: Number, required: true },

    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref : 'User',
      required: true
    },

    logoUrl:  { type: String },          // e.g. /uploads/logos/<filename>

    qrCode:          String,
    registrationUrl: String,

    status: {
      type: String,
      enum: ['draft', 'published', 'completed'],
      default: 'draft'
    }
  },
  { timestamps: true }
);

export default mongoose.model('Event', eventSchema);
