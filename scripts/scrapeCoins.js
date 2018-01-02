// RUN WITH: babel-node --presets es2015
require('dotenv').config();
import mongoose from 'mongoose';
import axios from 'axios';
import uuid from 'uuid';
import fs from 'fs';
import _ from 'lodash';
import AWS from 'aws-sdk';
import Coin from '../server/models/coin.model';

const s3 = new AWS.S3();

const timeout = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

async function getCryptoCompareCoinsList() {
  const coinsList = await axios.get('https://www.cryptocompare.com/api/data/coinlist/')
    .then(({ data }) => {
      if (data.Data) {
        return data.Data;
      } else {
        throw new Error('NO DATA');
      }
    });
  return coinsList;
}

async function getCryptoCompareCoinData(coin) {
  const coinSnapshot = await axios.get(`https://www.cryptocompare.com/api/data/coinsnapshotfullbyid/?id=${coin.Id}`).then(({ data }) => data.Data);
  const coinSocialSnapshot = await axios.get(`https://www.cryptocompare.com/api/data/socialstats/?id=${coin.Id}`).then(({ data }) => data.Data);

  if (!coinSnapshot || !coinSocialSnapshot) {
    return console.log('NO DATA FOR', coin.Symbol, coin.Id);
  }

  const coinData = {
    name: coin.Name,
    symbol: coin.Symbol,
    coinName: coin.CoinName,
    fullName: coin.FullName,
    ccId: coin.Id,
    algorithm: coin.Algorithm,
    proofType: coin.ProofType,
    totalSupply: coin.TotalCoinSupply === 'N/A'
      ? null
      : coin.TotalCoinSupply.replace(/\D/, '').split(',').join('').split(' ').join(''),
    possibleSubs: coinSnapshot.StreamerDataRaw.map((sub) => {
      const split = sub.split('~');
      return `${split[2]}-${split[3]}`;
    }),
    links: {},
  };

  if (coinSnapshot.SEO) {
    coinData.ccImage = {
      url: coinSnapshot.SEO.OgImageUrl,
      width: coinSnapshot.SEO.OgImageWidth,
      height: coinSnapshot.SEO.OgImageHeight,
    };
  }

  if (coinSnapshot.General) {
    coinData.startDate = coinSnapshot.General.StartDate;
    if (coinSnapshot.General.Website) {
      coinData.links.website = coinSnapshot.General.Website.split("'")[1];
    }
  }

  if (coinSocialSnapshot.Twitter) {
    coinData.links.twitter = coinSocialSnapshot.Twitter.link;
  }
  if (coinSocialSnapshot.Facebook) {
    coinData.links.facebook = coinSocialSnapshot.Facebook.link;
  }
  if (coinSocialSnapshot.Reddit) {
    coinData.links.reddit = coinSocialSnapshot.Reddit.link;
  }

  return coinData;
}

const saveCoinPic = async (coin, ccPicUrl) =>
  new Promise(async (resolve, reject) => {
    const type = ccPicUrl.split('.')[ccPicUrl.split('.').length - 1];
    const { data: stream } = await axios({
      method: 'GET',
      url: `https://www.cryptocompare.com${ccPicUrl}`,
      responseType: 'stream',
    });

    const params = {
      Body: stream,
      Bucket: 'cosmo-crypto',
      Key: `static/media/coin-pics/${coin}.${type}`,
      ACL: 'public-read',
    };

    s3.upload(params, (err, data) => {
      if (err) {
        console.log('ERROR', err);
        return reject(err);
      }
      resolve(params.Key);
    });
  });

const saveCoinToMongo = async (coin) =>
  new Promise((resolve, reject) =>
    Coin.create(coin, (err, doc) => {
      if (err) {
        return reject(err);
      }
      resolve();
      console.log('SAVED: ', coin.symbol);
    }));

const recordCoin = async (coin) =>
  new Promise((resolve, reject) => fs.appendFile(__dirname + '/coinsScraped.txt', `${coin}\n`, (err) => {
    if (err) {
      return reject(err);
    }
    resolve();
  }));

const getScrapedCoins = async (coins) =>
  new Promise((resolve, reject) => fs.readFile(__dirname + '/coinsScraped.txt', (err, data) => {
    if (err) {
      return reject(err);
    }
    const coinsToGet = _.difference(coins, data.toString().split('\n'));
    resolve(coinsToGet)
  }));

async function scrapeCoins() {
  const coinsList = await getCryptoCompareCoinsList();
  const coins = Object.keys(coinsList);
  const coinsToGet = await getScrapedCoins(coins);
  console.log(coinsToGet.sort())
  const coinData = {};
  let error = false;
  await Promise.all(coinsToGet.map(async (c, i) => {
    try {
      await timeout(1500 * i);
      if (error) {
        return;
      }
      const coin = await getCryptoCompareCoinData(coinsList[c]);
      const picUrl = await saveCoinPic(coin.symbol.toLowerCase(), coin.ccImage.url);
      coin.picUrl = picUrl;
      await saveCoinToMongo(coin);
      await recordCoin(coin.symbol);
      coinData[c] = coin;
    } catch (e) {
      console.log('ERROR: ', e);
      error = true;
      process.exit();
    }
  }));
  console.log(JSON.stringify(Object.keys(coinData), null, 4));
}

mongoose.connect(process.env.MONGO_HOST, { server: { socketOptions: { keepAlive: 1 } } }, async () => {
  console.log('Connected to DB');
  await scrapeCoins();
  process.exit();
});
mongoose.connection.on('error', () => {
  throw new Error(`unable to connect to database: ${process.env.MONGO_HOST}`);
});
