// RUN WITH: babel-node --presets es2015

// UNUSED...

require('dotenv').config();
import mongoose from 'mongoose';
import axios from 'axios';
import uuid from 'uuid';
import fs from 'fs';
import _ from 'lodash';
import Coin from '../server/models/coin.model';
import Pair from '../server/models/pair.model';

const SUPPORTED_CRYPTO_QUOTES =  ['BTC', 'ETH'];
const SUPPORTED_FIAT_QUOTES = ['USD', 'EUR', 'AUD', 'CAD', 'CNY', 'GBP', 'ILS', 'JPY', 'THB', 'TRY'];

const timeout = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

const recordCoin = async (coin) =>
  new Promise((resolve, reject) => fs.appendFile(__dirname + '/records/pairsSetup.txt', `${coin}\n`, (err) => {
    if (err) {
      return reject(err);
    }
    resolve();
  }));

const getRecordedCoins = async (coins) =>
  new Promise((resolve, reject) => fs.readFile(__dirname + '/records/pairsSetup.txt', (err, data) => {
    if (err) {
      return reject(err);
    }
    const coinsToGet = _.difference(coins, data.toString().split('\n'));
    resolve(coinsToGet)
  }));

const setupPairs = async () =>
  new Promise((resolve, reject) =>
    Coin.find({}, async (err, docs) => {
      if (err) {
        return reject(err);
      }
      const coinsToSetup = await getRecordedCoins(docs.map(doc => doc.symbol));
      const filteredDocs = docs.filter(doc => coinsToSetup.indexOf(doc.symbol) !== -1);
      const outkasts = [];
      await Promise.all(filteredDocs.map(async (doc) => {
        // console.log(JSON.stringify(doc, null, 4));
        let supportedQuotes;
        const coin = doc.symbol;
        const subs = doc.possibleCCSubs.map(sub => sub.split('-')[1]);
        if (coin === 'BTC') {
          supportedQuotes = SUPPORTED_FIAT_QUOTES;
        } else if (coin === 'ETH') {
          supportedQuotes = SUPPORTED_FIAT_QUOTES.concat(SUPPORTED_CRYPTO_QUOTES.filter(sub => sub !== coin));
        } else {
          supportedQuotes = SUPPORTED_CRYPTO_QUOTES.filter(sub => sub !== coin);
        }
        const subsToGet = _.intersection(subs, supportedQuotes)
        if (subsToGet.indexOf('BTC') !== -1 && subsToGet.indexOf('ETH') !== -1) {
          const i = subsToGet.indexOf('ETH');
          subsToGet.splice(i, 1);
        }
        if (subsToGet && subsToGet.length) {
          console.log(coin, subsToGet);
          await Promise.all(subsToGet.map(quote => new Promise((resolve, reject) =>
            Pair.create({ pair: `${coin}-${quote}`, sources: ['CCCAGG'], base: coin, quote }, (err, pair) => {
              if (err) return reject(err);
              console.log(`${coin}-${quote}`)
              resolve();
            })
          )));
          doc.subs = subsToGet.map(quote => `${coin}-${quote}`);
          doc.exchanges = ['CCCAGG'];
          doc.save();
          await recordCoin(coin);
        } else {
          outkasts.push(coin);
          console.log('NOPE', coin, doc.possibleCCSubs.map(sub => sub.split('-')[1]));
        }
      }));
      console.log(outkasts.join(','))
      resolve();
    }));


mongoose.connect(process.env.MONGO_HOST, { server: { socketOptions: { keepAlive: 1 } } }, async () => {
  try {
    console.log('Connected to DB');
    await setupPairs();
  } catch (e) {
    console.log('ERROR: ', e);
  }
  process.exit();
});
mongoose.connection.on('error', () => {
  throw new Error(`unable to connect to database: ${process.env.MONGO_HOST}`);
});
