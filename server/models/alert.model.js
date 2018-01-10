import mongoose from 'mongoose';
import uuid from 'uuid';

const Schema = mongoose.Schema;

const AlertSchema = new Schema({
  _id: { type: String, default: uuid.v4 },
  pair: String,
  price: Number,
  repeat: Boolean,
  userId: String,
  createdAt: Date,
});

// AlertSchema.post('remove', (alert) => console.log('REMOVED', alert._id));

export default mongoose.model('Alert', AlertSchema);
