import cron from 'node-cron';
import Candles from './Candles';
import Candle from '../models/candle.model';

const ONE_MINUTE = 1000 * 60;

const getTime = () => parseInt((Date.now() / 10000).toFixed(0) * 10000, 10);

const handleMinute = (time = getTime()) => Promise.resolve()
  .then(() => {
    console.log('HANDLE MINUTE', time);
    return Candles.saveAll(time);
  });

const handleHour = (time = getTime()) => Promise.resolve()
  .then(() => {
    const startTime = time - (ONE_MINUTE * 5);
    console.log('HANDLE HOUR', startTime, time);
    return handleMinute(time)
      .then(() => new Promise((resolve, reject) =>
        Candle.find({ timestamp: { $gt: startTime, $lte: time } }, (err, docs) => {
          if (err) {
            return console.log('ERROR', err);
          }
          const minCandles = {};
          docs.forEach((doc) => {
            if (!minCandles[doc.source]) {
              minCandles[doc.source] = {};
            }
            if (!minCandles[doc.source][doc.pair]) {
              minCandles[doc.source][doc.pair] = [];
            }
            minCandles[doc.source][doc.pair].push(doc);
          });

          Promise.all(Object.keys(minCandles).map(source =>
            Promise.all(Object.keys(minCandles[source]).map(pair =>
              new Promise((res, rej) =>
                Candle.create(
                  Candles.aggregate({
                    from: minCandles[source][pair],
                    type: 'hour',
                    resetParams: { source, pair },
                    time,
                  }),
                  err => (err ? console.log('ERROR:', err) || rej() : res())
                )
              )
            ))
          )).then(resolve).catch(reject);
        })))
        .then(() => console.log('DONE!'));
  });

const handleDay = (time = getTime()) => Promise.resolve()
  .then(() => {
    console.log('HANDLE DAY');
  });

// '1-59 * * * *'
const minTimer = cron.schedule('1-4,6-9,11-14,16-19,21-24,26-29,31-34,36-39,41-44,46-49,51-54,56-59 * * * *', handleMinute);
// '0 * * * *'
const hourTimer = cron.schedule('*/5 * * * *', handleHour);
// '0 0 * * *'
// const dayTimer = cron.schedule('59 23 * * *', handleDay);

function initTimers() {
  minTimer.start();
  hourTimer.start();
  // dayTimer.start();
}

export default {
  initTimers,
};
