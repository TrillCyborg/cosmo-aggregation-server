// RUN WITH: babel-node --presets es2015 scripts/setupExchangePairs.js

require('dotenv').config();
import mongoose from 'mongoose';
import axios from 'axios';
import uuid from 'uuid';
import fs from 'fs';
import _ from 'lodash';
import AWS from 'aws-sdk';
// import WebSocket from 'ws';
import Coin from '../server/models/coin.model';
import Pair from '../server/models/pair.model';

const s3 = new AWS.S3();

const EXCHANGE = 'BINANCE';
const SAVE = false;

const DEFAULT_BITTREX_PIC = 'https://bittrex.com/Content/img/symbols/BTC.png';
const SUPPORTED_QUOTES = {
  BITTREX: ['BTC', 'ETH', 'USDT'],
  BINANCE: ['BTC', 'ETH', 'BNB', 'USDT'],
  KUCOIN: ['BTC', 'ETH', 'NEO', 'USDT', 'KCS'],
  // ETHERDELTA: ['ETH'],
};

const exchanges = {
  BITTREX: {
    fetchExchangeMarkets: () => axios.get('https://bittrex.com/api/v1.1/public/getmarkets')
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
      }),
    fetchExchangeCoins: () => axios.get('https://bittrex.com/api/v1.1/public/getmarkets')
      .then(({ data }) => data.result.reduce((obj, coin) => {
        obj[coin.MarketCurrency] = {
          name: coin.MarketCurrency,
          symbol: coin.MarketCurrency,
          coinName: coin.MarketCurrencyLong,
          fullName: `${coin.MarketCurrencyLong} (${coin.MarketCurrency})`,
          picUrl: coin.LogoUrl === DEFAULT_BITTREX_PIC ? null : coin.LogoUrl,
          exchanges: [EXCHANGE],
          markets: {
            [EXCHANGE]: [],
          },
        };
        return obj;
      }, {})),
  },
  BINANCE: {
    fetchExchangeMarkets: () => axios.get('https://api.binance.com/api/v1/ticker/allPrices')
      .then(({ data }) => {
        const markets = {};
        data.filter(({ symbol }) => symbol !== '123456').forEach(({ symbol }) => {
          let index;
          SUPPORTED_QUOTES[EXCHANGE].forEach(quote => {
            const i = symbol.indexOf(quote);
            if (i > 0) {
              index = i;
            }
          });
          const base = symbol.slice(0,index);
          const quote = symbol.slice(index);
          if (!markets[base]) {
            markets[base] = [];
          }
          markets[base].push(`${base}-${quote}`);
        });
        return markets;
      }),
    fetchExchangeCoins: () => axios.get('https://api.binance.com/api/v1/exchangeInfo')
      .then(({ data }) => data.symbols.reduce((obj, market) => {
        obj[market.baseAsset] = {
          name: market.baseAsset,
          symbol: market.baseAsset,
          coinName: market.MarketCurrencyLong,
          exchanges: [EXCHANGE],
          markets: {
            [EXCHANGE]: [],
          },
        };
        return obj;
      }, {})),
  },
  KUCOIN: {
    fetchExchangeMarkets: () => axios.get('https://api.kucoin.com/v1/market/open/symbols')
      .then(({ data }) => {
        const markets = {};
        data.data.forEach(({ coinType, symbol, trading }) => {
          if (trading) {
            if (!markets[coinType]) {
              markets[coinType] = [];
            }
            markets[coinType].push(symbol)
          }
        });
        return markets;
      }),
    fetchExchangeCoins: () => axios.get('https://api.kucoin.com/v1/market/open/coins')
      .then(({ data }) => data.data.reduce((obj, coin) => {
        obj[coin.coin] = {
          name: coin.coin,
          symbol: coin.coin,
          coinName: coin.name,
          fullName: `${coin.name} (${coin.coin})`,
          exchanges: [EXCHANGE],
          markets: {
            [EXCHANGE]: [],
          },
        };
        return obj;
      }, {})),
  },
  // ETHERDELTA: {
  //   fetchExchangeMarkets: () => new Promise((resolve) => {
  //     const ws = new WebSocket('https://socket.etherdelta.com/getMarket', {
  //       perMessageDeflate: false
  //     });
  //     ws.on('open', () => {
  //       console.log('GERRRRPS');
  //     });
  //
  //     ws.on('message', (data) => {
  //       console.log(data);
  //       resolve()
  //     });
  //   }),
  // }
};

const saveCoinPic = (coin, picUrl) => new Promise(async (resolve, reject) => {
  if (!SAVE) {
    return resolve();
  }
  const type = picUrl.split('.')[picUrl.split('.').length - 1];
  const { data: stream } = await axios({
    method: 'GET',
    url: picUrl,
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

const updateCoins = (coins) => new Promise((resolve, reject) =>
  Coin.find({ symbol: { $in: coins } }, (err, docs) => {
    const unfound = coins.filter(coin => !_.find(docs, (o) => coin === o.symbol))
    if (err) {
      console.log('ERROR', err);
      return reject(err);
    }
    docs.forEach(doc => {
      doc.exchanges = _.uniq(doc.exchanges.concat([EXCHANGE]));
      if (!doc.markets) {
        doc.markets = { [EXCHANGE]: [] }
      }
      doc.markets[EXCHANGE] = coins[doc.symbol]
      if (SAVE) {
        doc.save();
      }
      console.log('UPDATE COIN:', doc.symbol);
    });
    resolve(unfound);
  }));

const updatePairs = (pairs) => new Promise((resolve, reject) =>
  Pair.find({ pair: { $in: pairs } }, async (err, docs) => {
    if (err) {
      console.log('ERROR', err);
      return reject(err);
    }
    const unfound = pairs.filter(pair => !_.find(docs, (o) => pair === o.pair));
    docs.forEach((doc) => {
      doc.sources = _.uniq(doc.sources.concat([EXCHANGE]));
      if (SAVE) {
        doc.save();
      }
      console.log('UPDATE PAIR:', doc.pair);
    });
    resolve(unfound)
  }));

const createCoins = (coins) => new Promise(async (resolve, reject) => {
  const exchangeCoins = await exchanges[EXCHANGE].fetchExchangeCoins();
  const coinsToSave = Object.keys(coins).map(coin => {
    const coinToSave = exchangeCoins[coin];
    coinToSave.markets[EXCHANGE] = coins[coin];
    return coinToSave;
  });
  await Promise.all(coinsToSave.map((coin, i) => new Promise(async (resolve, reject) => {
    if (coin.picUrl) {
      const picUrl = await saveCoinPic(coin.symbol, coin.picurl);
      coinsToSave[i].picUrl = picUrl;
    }
    Coin.create(coin, (err, doc) => {
      if (err) {
        console.log('ERROR', err);
        return reject(err);
      }
      console.log('CREATE COIN:', JSON.stringify(doc, null, 4));
      resolve();
    });
  })));
  resolve();
});

const createPairs = (pairs) => Promise.all(pairs.map(pair => new Promise((resolve, reject) => {
  const market = pair.split('-');
  Pair.create({ pair, base: market[0], quote: market[1], sources: [EXCHANGE] }, (err, doc) => {
    if (err) {
      console.log('ERROR', err);
      return reject(err);
    }
    console.log('CREATE PAIR:', JSON.stringify(pair, null, 4));
    resolve();
  });
})));

const setupPairs = async () => {
  const markets = await exchanges[EXCHANGE].fetchExchangeMarkets();
  const coins = Object.keys(markets);
  console.log(coins);
  return;
  const pairs = coins.reduce((arr, coin) => arr.concat(markets[coin]), []);

  const unfoundCoins = await updateCoins(coins);
  const unfoundPairs = await updatePairs(pairs);

  if (unfoundCoins && unfoundCoins.length) {
    const coinsToMake = unfoundCoins.reduce((obj, coin) => {
      obj[coin] = markets[coin];
      return obj;
    }, {});
    await createCoins(coinsToMake);
  }

  if(unfoundPairs && unfoundPairs.length) {
    await createPairs(unfoundPairs);
  }
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
