import cron from 'node-cron';
import { minCandles, hourCandles, dayCandles } from './Candles';
import { lastPrices } from './Prices';
import Candle from '../models/candle.model';

const ONE_MINUTE = 1000 * 60;
const ONE_HOUR = ONE_MINUTE * 60;
const ONE_DAY = ONE_HOUR * 24;

const getTime = () => parseInt((Date.now() / 10000).toFixed(0) * 10000, 10);

const handleCandlesToMerge = ({ time, startTime, timeCandles }) => new Promise((resolve, reject) =>
  Candle.find({ timestamp: { $gt: startTime, $lte: time } }, (err, docs) => {
    if (err) {
      console.log('ERROR', err);
      return reject(err);
    }
    const candles = {};
    docs.forEach((doc) => {
      if (!candles[doc.source]) {
        candles[doc.source] = {};
      }
      if (!candles[doc.source][doc.pair]) {
        candles[doc.source][doc.pair] = [];
      }
      candles[doc.source][doc.pair].push(doc);
    });

    delete candles.COSMO;

    Object.keys(candles).forEach(source =>
      Object.keys(candles[source]).forEach((pair) => {
        timeCandles.merge(candles[source][pair], true);
      })
    );
    return timeCandles.saveAll(time)
      .then(resolve)
      .catch(reject);
  }));

const handleQuarterMinute = (time = getTime()) => Promise.resolve()
  .then(() => {
    console.log(`HANDLE QUARTER MINUTE: ${time}`);
    return lastPrices.saveAll(time);
  });

const handleMinute = (time = getTime()) => Promise.resolve()
  .then(() => {
    console.log(`HANDLE MINUTE: ${time}`);
    return minCandles.saveAll(time);
  });

const handleHour = (time = getTime()) => Promise.resolve()
  .then(() => {
    const startTime = time - (ONE_MINUTE * 5);
    console.log(`HANDLE HOUR: ${startTime} - ${time}`);
    return handleMinute(time)
      .then(() => handleCandlesToMerge({
        time,
        startTime,
        timeCandles: hourCandles
      }));
  });

const handleDay = (time = getTime()) => Promise.resolve()
  .then(() => {
    const startTime = time - ONE_DAY;
    console.log(`HANDLE DAY: ${startTime} - ${time}`);
    return handleHour(time)
      .then(() => handleCandlesToMerge({
        time,
        startTime,
        timeCandles: dayCandles
      }));
  });

const quarterMinTimer = cron.schedule('0,15,30,45 * * * * *', handleQuarterMinute);
// '1-59 * * * *'
// 1-4,6-9,11-14,16-19,21-24,26-29,31-34,36-39,41-44,46-49,51-54,56-59
const minTimer = cron.schedule('1-59 * * * *', handleMinute);
// '0 1-23 * * *'
// */5
const hourTimer = cron.schedule('0 1-23 * * *', handleHour);
// '0 0 * * *'
const dayTimer = cron.schedule('0 0 * * *', handleDay);

function initTimers() {
  quarterMinTimer.start();
  minTimer.start();
  hourTimer.start();
  dayTimer.start();
}

export default {
  initTimers,
};
