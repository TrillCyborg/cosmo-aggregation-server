// RUN WITH: babel-node --presets es2015

require('dotenv').config();
import mongoose from 'mongoose';
import axios from 'axios';
import uuid from 'uuid';
import fs from 'fs';
import _ from 'lodash';
import bittrex from 'node.bittrex.api';
import Coin from '../server/models/coin.model';
import Pair from '../server/models/pair.model';

const EXCHANGE = 'BITTREX';

const recordCoin = async (coin) =>
  new Promise((resolve, reject) => fs.appendFile(__dirname + '/records/bittrexPairsSetup.txt', `${coin}\n`, (err) => {
    if (err) {
      return reject(err);
    }
    resolve();
  }));

const getRecordedCoins = async (coins) =>
  new Promise((resolve, reject) => fs.readFile(__dirname + '/records/bittrexPairsSetup.txt', (err, data) => {
    if (err) {
      return reject(err);
    }
    const coinsToGet = _.difference(coins, data.toString().split('\n'));
    resolve(coinsToGet)
  }));

const fetchExchangeCoins = () => axios.get('https://bittrex.com/api/v1.1/public/getcurrencies')
  .then(({ data }) => {
    const coins = data.result;
    const activeCoins = [];
    const inactiveCoins = [];
    coins.forEach(coin => {
      const { IsActive, Notice } = coin;
      if (!IsActive && (!Notice || Notice.indexOf('Wallet no longer operational') !== -1)) {
        inactiveCoins.push(coin);
      } else {
        activeCoins.push(coin);
      }
    });
    return { activeCoins, inactiveCoins };
  });

const fetchExchangeMarkets = () => axios.get('https://bittrex.com/api/v1.1/public/getmarkets')
  .then(({ data }) => {
    const markets = {};
    data.result.forEach(({ MarketCurrency, MarketName }) => {
      if (!markets[MarketCurrency]) {
        markets[MarketCurrency] = [];
      }
      const pair = MarketName.split('-');
      markets[MarketCurrency].push(`${pair[1]}-${pair[0]}`)
    });
    return markets;
  })

const setupPairs = async () => {
  const { activeCoins, inactiveCoins } = await fetchExchangeCoins();
  const markets = await fetchExchangeMarkets();
  const coins = activeCoins.map(({ Currency }) => Currency);
  await new Promise((resolve, reject) =>
    Coin.find({ symbol: { $in: coins } }, (err, docs) => {
      if (err) {
        console.log('ERROR', err);
        return reject(err);
      }
      docs.forEach(doc => {
        doc.exchanges = _.uniq(doc.exchanges.concat([EXCHANGE]));
        if (!doc.markets) {
          doc.markets = { BITTREX: [] }
        }
        doc.markets.BITTREX = markets[doc.symbol]
        doc.save();
      });
      resolve();
    }));
  const pairs = Object.keys(markets).reduce((arr, coin) => arr.concat(markets[coin]), []);
  await new Promise((resolve, reject) =>
    Pair.find({ pair: { $in: pairs } }, async (err, docs) => {
      if (err) {
        console.log('ERROR', err);
        return reject(err);
      }
      const unfound = pairs.filter(pair => !_.find(docs, (o) => pair === o.pair));
      docs.forEach((doc) => {
        console.log(JSON.stringify(doc, null, 4))
        doc.sources = _.uniq(doc.sources.concat([EXCHANGE]));
        doc.save();
      });
      await Promise.all(unfound.map(pair => new Promise((resolve, reject) => {
        const market = pair.split('-');
        Pair.create({ pair, base: market[0], quote: market[1], sources: [EXCHANGE] }, (err, doc) => {
          if (err) {
            console.log('ERROR', err);
            return reject(err);
          }
          console.log(pair);
          resolve();
        });
      })));
      resolve();
    }));
}

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
