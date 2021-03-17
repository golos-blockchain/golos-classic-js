import EventEmitter from 'events';
import Promise from 'bluebird';
import cloneDeep from 'lodash/cloneDeep';
import defaults from 'lodash/defaults';
import isNode from 'detect-node';
import newDebug from 'debug';
import config from '../config';
import methods from './methods';
import { camelCase } from '../utils';
import transports from './transports';

const debugEmitters = newDebug('golos:emitters');
const debugSetup = newDebug('golos:setup');

const DEFAULTS = {
  id: 0,
};

class Golos extends EventEmitter {
  constructor(options = {}) {
    super(options);
    defaults(options, DEFAULTS);
    this.options = cloneDeep(options);
  }
  _setTransport(url) {
      if (url && url.match('^((http|https)?:\/\/)')) {
        this.transport = new transports.http();
        this.url = url;
      } else if (url && url.match('^((ws|wss)?:\/\/)')) {
        this.transport = new transports.ws();
        this.url = url;
      } else {
      throw Error("unknown transport! [" + url + "]");
    }
  }

  setWebSocket(url) {
    console.warn("golos.api.setWebSocket(url) is now deprecated instead use golos.config.set('websocket',url)");
    debugSetup('Setting WS', url);
    config.set('websocket', url);
    this._setTransport(url);
    this.stop();
  }

  start() {
    const url = config.get('websocket');
    this._setTransport(url);
    return this.transport.start();
  }

  stop() {
    debugSetup('Stopping...');
    const ret = this.transport.stop();
    this.transport = null;
    this.url = null;
    return ret;
  }

  send(api, data, callback) {
    debugSetup('Golos::send', api, data);
    if (!this.transport) {
      this.start();
    } else {
      let url = config.get('websocket');
      if (url !== this.url) {
        debugSetup('websocket URL changed, restarting transport...');
        this.stop();
        this.start();
      }
    }
    return this.transport.send(api, data, callback);
  }

  streamBlockNumber(mode = 'head', callback, ts = 200) {
    if (typeof mode === 'function') {
      callback = mode;
      mode = 'head';
    }
    let current = '';
    let running = true;

    const update = () => {
      if (!running) return;

      this.getDynamicGlobalPropertiesAsync()
        .then((result) => {
          const blockId = mode === 'irreversible'
            ? result.last_irreversible_block_num
            : result.head_block_number;

          if (blockId !== current) {
            if (current) {
              for (let i = current; i < blockId; i++) {
                if (i !== current) {
                  callback(null, i);
                }
                current = i;
              }
            } else {
              current = blockId;
              callback(null, blockId);
            }
          }

          Promise.delay(ts).then(() => {
            update();
          });
        }, (err) => {
          callback(err);
        });
    };

    update();

    return () => {
      running = false;
    };
  }

  streamBlock(mode = 'head', callback) {
    if (typeof mode === 'function') {
      callback = mode;
      mode = 'head';
    }

    let current = '';
    let last = '';

    const release = this.streamBlockNumber(mode, (err, id) => {
      if (err) {
        release();
        callback(err);
        return;
      }

      current = id;
      if (current !== last) {
        last = current;
        this.getBlock(current, callback);
      }
    });

    return release;
  }

  streamTransactions(mode = 'head', callback) {
    if (typeof mode === 'function') {
      callback = mode;
      mode = 'head';
    }

    const release = this.streamBlock(mode, (err, result) => {
      if (err) {
        release();
        callback(err);
        return;
      }

      if (result && result.transactions) {
        result.transactions.forEach((transaction) => {
          callback(null, transaction);
        });
      }
    });

    return release;
  }

  streamOperations(mode = 'head', callback) {
    if (typeof mode === 'function') {
      callback = mode;
      mode = 'head';
    }

    const release = this.streamTransactions(mode, (err, transaction) => {
      if (err) {
        release();
        callback(err);
        return;
      }

      transaction.operations.forEach((operation) => {
        callback(null, operation);
      });
    });

    return release;
  }
}

// Generate Methods from methods.js
methods.forEach((method) => {
  const methodName = method.method_name || camelCase(method.method);
  const methodParams = method.params || [];
  const defaultParms = {};
  const hasDefaultValues = method.has_default_values;

  if (hasDefaultValues) {
    methodParams.forEach( param => {
      const [p, value] = param.split('=');
      defaultParms[p] = value ? JSON.parse(value) : '';
    })
  }

  Golos.prototype[`${methodName}With`] =
    function Golos$$specializedSendWith(options, callback) {
      const params = methodParams.map((param) => options[hasDefaultValues ? param.split('=')[0] : param]);
      return this.send(method.api, {
        method: method.method,
        params,
      }, callback);
    };

  Golos.prototype[methodName] =
    function Golos$specializedSend(...args) {
      let options =  {};
      if (hasDefaultValues) {
        const argsWithoutCb = args.slice(0, args.length - 1);
        methodParams.forEach((param, i) => {
          const [p, value] = param.split('=');
          if (argsWithoutCb[i]) {
            options[p] = argsWithoutCb[i];
          }
        })
        options = Object.assign({}, defaultParms, options);
      } else {
        const opt = methodParams.reduce((memo, param, i) => {
          memo[param] = args[i];
          return memo;
        }, {});
        options = Object.assign({}, opt);
      }
      const callback = args[hasDefaultValues ? args.length - 1: methodParams.length];

      return this[`${methodName}With`](options, callback);
    };
});

Promise.promisifyAll(Golos.prototype);

Golos.prototype['setBlockAppliedCallback'] =
  function Golos$setCallback(type, callback) {
    return this.send(
      'database_api',
      {
        method: 'set_block_applied_callback',
        params: [type],
      },
      callback
    );
};

Golos.prototype['setPendingTransactionCallback'] =
  function Golos$setCallback(callback) {
    return this.send(
      'database_api',
      {
        method: 'set_pending_transaction_callback',
        params: [],
      },
      callback
    );
 };

 Golos.prototype['setPrivateMessageCallback'] =
 function Golos$setCallback(query, callback) {
   return this.send(
     'private_message',
     {
       method: 'set_callback',
       params: [query],
     },
     callback
   );
};

// Export singleton instance
const golos = new Golos();
exports = module.exports = golos;
exports.Golos = Golos;
exports.Golos.DEFAULTS = DEFAULTS;
