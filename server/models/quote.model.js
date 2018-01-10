// import Promise from 'bluebird';
import mongoose from 'mongoose';
// import httpStatus from 'http-status';
// import APIError from '../helpers/APIError';

/**
 * Quote Schema
 */
const QuoteSchema = new mongoose.Schema({
  askPrice: Number,
  askVolume: Number,
  bidPrice: Number,
  bidVolume: Number,
  exchange: String,
  pair: String,
  timestamp: Date,
});

export default mongoose.model('Quote', QuoteSchema);
