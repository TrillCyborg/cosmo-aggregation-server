import mongoose from 'mongoose';
import uuid from 'uuid';
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  _id: { type: String, default: uuid.v4 },
  pushToken: String,
  createdAt: { type: Number, default: Date.now },
});

export default mongoose.model('User', UserSchema);
