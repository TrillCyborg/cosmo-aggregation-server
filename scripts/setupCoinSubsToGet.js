// RUN WITH: babel-node --presets es2015

// UNUSED...

require('dotenv').config();
import mongoose from 'mongoose';
import axios from 'axios';
import uuid from 'uuid';
import fs from 'fs';
import _ from 'lodash';
import Coin from '../server/models/coin.model';

const SUPPORTED_QUOTE_CURRENCIES = ['BTC', 'ETH', 'LTC', 'USD', 'EUR', 'AUD', 'CAD', 'CNY', 'GBP', 'ILS', 'JPY', 'THB', 'TRY'];

const timeout = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

const recordCoin = async (coin) =>
  new Promise((resolve, reject) => fs.appendFile(__dirname + '/coinSubsToGetScraped.txt', `${coin}\n`, (err) => {
    if (err) {
      return reject(err);
    }
    resolve();
  }));

const getScrapedCoins = async (coins) =>
  new Promise((resolve, reject) => fs.readFile(__dirname + '/coinSubsToGetScraped.txt', (err, data) => {
    if (err) {
      return reject(err);
    }
    const coinsToGet = _.difference(coins, data.toString().split('\n'));
    resolve(coinsToGet)
  }));

const setupCoinSubsToGet = async () =>
  new Promise((resolve, reject) =>
    Coin.find({}, async (err, docs) => {
      if (err) {
        return reject(err);
      }
      console.log('CHECKPOINT 01', docs.length);
      const coinsToGet = await getScrapedCoins(docs.map(doc => doc.symbol));
      const chunks = _.chunk(docs.filter(doc => coinsToGet.indexOf(doc.symbol) !== -1), 60);
      console.log('CHUNKSSSS', JSON.stringify(chunks, null, 4));
      console.log('CHECKPOINT 02', chunks.length, chunks.length * SUPPORTED_QUOTE_CURRENCIES.length);
      resolve();
    }));


mongoose.connect(process.env.MONGO_HOST, { server: { socketOptions: { keepAlive: 1 } } }, async () => {
  try {
    console.log('Connected to DB');
    await setupCoinSubsToGet();
  } catch (e) {
    console.log('ERROR: ', e);
  }
  process.exit();
});
mongoose.connection.on('error', () => {
  throw new Error(`unable to connect to database: ${process.env.MONGO_HOST}`);
});
