import io from 'socket.io-client';
import cryptocompare from './cryptocompare';

const socket = io.connect('wss://streamer.cryptocompare.com');

socket.on('m', cryptocompare.handleMessage);

const addSubs = subs => socket.emit('SubAdd', { subs });
const removeSubs = subs => socket.emit('SubRemove', { subs });

export default { addSubs, removeSubs };
