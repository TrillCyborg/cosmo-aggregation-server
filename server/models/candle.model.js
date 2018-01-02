// import Promise from 'bluebird';
import mongoose from 'mongoose';

/**
 * Candle Schema
 */
const CandleSchema = new mongoose.Schema({
  open: Number,
  close: Number,
  high: Number,
  low: Number,
  volumeFrom: Number,
  volumeTo: Number,
  timestamp: Number,
  type: String,
  source: String,
  pair: String,
});

export default mongoose.model('Candle', CandleSchema);
