import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const PriceSchema = new Schema({
  pair: String,
  price: Number,
  source: String,
  updatedAt: Date
});

export default mongoose.model('Price', PriceSchema);
