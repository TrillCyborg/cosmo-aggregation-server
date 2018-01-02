import mongoose from 'mongoose';
import uuid from 'uuid';

const Schema = mongoose.Schema;

const PairSchema = new Schema({
  _id: { type: String, default: uuid.v4 },
  pair: String,
  base: String,
  quote: String,
  sources: [String],
});

export default mongoose.model('Pair', PairSchema);
