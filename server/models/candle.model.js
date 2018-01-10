// import Promise from 'bluebird';
import uuid from 'uuid';
import mongoose from 'mongoose';

/**
 * Candle Schema
 */
const CandleSchema = new mongoose.Schema({
  _id: { type: String, default: uuid.v4 },
  open: Number,
  close: Number,
  high: Number,
  low: Number,
  volumeFrom: Number,
  volumeTo: Number,
  timestamp: Date,
  type: String,
  source: String,
  pair: String,
});

export default mongoose.model('Candle', CandleSchema);
