import Promise from 'bluebird';
import isNode from 'detect-node';
import newDebug from 'debug';
import config from '../../config';
import Transport from './base';

const cbMethods = [
  'set_block_applied_callback',
  'set_pending_transaction_callback',
  'set_callback'
];

let WebSocket;
if (isNode) {
  WebSocket = require('ws'); // eslint-disable-line global-require
} else if (typeof window !== 'undefined') {
  WebSocket = window.WebSocket;
} else {
  throw new Error('Couldn\'t decide on a `WebSocket` class');
}

const debugProtocol = newDebug('golos:protocol');
const debugWs = newDebug('golos:ws');

export default class WsTransport extends Transport {
  constructor(options = {}) {
    super(Object.assign({id: 0}, options));

    this._requests = new Map();
    this.isOpen = false;
    this.currentP = Promise.fulfilled();
  }

  start() {
  	if (this.startP) {
      return this.startP;
    }

    const startP = new Promise((resolve, reject) => {
      if (startP !== this.startP) return;
      const url = config.get('websocket');
      this.ws = new WebSocket(url);

      const releaseOpen = this.listenTo(this.ws, 'open', () => {
        debugWs('Opened WS connection with', url);
        this.isOpen = true;
        releaseOpen();
        resolve();
      });

      const releaseClose = this.listenTo(this.ws, 'close', () => {
        debugWs('Closed WS connection with', url);
        this.isOpen = false;
        delete this.ws;
        this.stop();

        const err = new Error('The WS connection was closed before this operation was made');
        if (startP.isPending()) {
          reject(err);
        }

        for (let [id, val] of Object.entries(this.callbacks)) {
          delete this.callbacks[id];
          val.cb(err, null);
        }
      });

      const releaseMessage = this.listenTo(this.ws, 'message', (message) => {
        debugWs('Received message', message.data);
        const data = JSON.parse(message.data);
        const id = data.id;
        const request = this.requests[id] || this.callbacks[id];
        if (!request) {
          debugWs('Golos.onMessage error: unknown request ', id);
          return;
        }
        delete this.requests[id];
        this.onMessage(data, request);
      });

      this.releases = this.releases.concat([
        releaseOpen,
        releaseClose,
        releaseMessage,
      ]);
    });

    this.startP = startP;

    return startP;
  }

  stop() {
    if (this.ws) this.ws.close();
    delete this.startP;
    delete this.ws;
    this.releases.forEach((release) => release());
    this.releases = [];
  }

  onMessage(message, request) {
    const {api, data, resolve, reject, start_time} = request;
    debugWs('-- Golos.onMessage -->', message.id);
    const errorCause = message.error;
    if (errorCause) {
      const err = new Error(
        // eslint-disable-next-line prefer-template
        (errorCause.message || 'Failed to complete operation') +
        ' (see err.payload for the full error payload)'
      );
      err.payload = message;
      reject(err);
      return;
    }

    debugProtocol('Resolved', api, data, '->', message);
    if (cbMethods.includes(data.method)) {
      this.callbacks[message.id].cb(null, message.result);
    } else {
      delete this.requests[message.id];
      resolve(message.result);
    }
  }

  send(api, data, callback) {
  	const id = data.id || this.id++;
    const startP = this.start();

    this.currentP = startP
    .then(() => new Promise((resolve, reject) => {
        if (!this.ws) {
          reject(new Error('The WS connection was closed while this request was pending'));
          return;
        }

        const payload = JSON.stringify({
          id,
          method: 'call',
          jsonrpc: '2.0',
          params: [
            api,
            data.method,
            data.params,
          ],
        });

        debugWs('Sending message', payload);
        if (cbMethods.includes(data.method)) {
          this.callbacks[id] = {
            api,
            data,
            cb: callback
          };
        } else {
          this.requests[id] = {
            api,
            data,
            resolve,
            reject,
            start_time: Date.now()
          };
        }

        this.ws.send(payload);
      }))
      .nodeify(callback);

    return this.currentP;
  }
}