import mongoose from 'mongoose';
import uuid from 'uuid';

const Schema = mongoose.Schema;

const LinksSchema = new Schema({
  _id: { type: String, default: uuid.v4 },
  website: String,
  twitter: String,
  facebook: String,
  reddit: String,
});

const CCImageSchema = new Schema({
  _id: { type: String, default: uuid.v4 },
  url: String,
  width: Number,
  height: Number,
});

const CoinSchema = new Schema({
  _id: { type: String, default: uuid.v4 },
  ccId: String,
  name: String,
  symbol: String,
  coinName: String,
  fullName: String,
  picUrl: String,
  algorithm: String,
  proofType: String,
  totalSupply: Number,
  startDate: String,
  subs: [String],
  possibleSubs: [String],
  exchanges: [String],
  links: LinksSchema,
  ccImage: CCImageSchema,
});

export default mongoose.model('Coin', CoinSchema);
