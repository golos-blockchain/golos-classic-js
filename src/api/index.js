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
    this._streamDefaults = {
      mode: 'head',
      startBlock: 0,
    };
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

  callReliable(method, ...args) {
    const callback = args[args.length - 1];
    const argsWithoutCb = args.slice(0, args.length - 1);
    this[method](...argsWithoutCb, (err, result)  => {
      if (err || !result) {
        console.error(method + ' reliable call - fail, retrying... Cause:', err ? err.message : 'API returned null');
        Promise.delay(1000).then(() => {
          this.callReliable(method, ...args);
        });
        return;
      }
      callback(null, result);
    });
  };

  streamBlockNumber(options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    defaults(options, this._streamDefaults);
    let startBlock = options.startBlock;
    let prevBlock = 0;
    let running = true;

    const update = () => {
      if (!running) return;

      this.callReliableAsync('getDynamicGlobalProperties')
        .then((result) => {
          const currentBlock = options.mode === 'irreversible'
            ? result.last_irreversible_block_num
            : result.head_block_number;

          if (!startBlock)
            startBlock = currentBlock;

          for (let i = startBlock; i <= currentBlock; i++) {
            callback(null, i);
          }
          startBlock = currentBlock + 1;

          Promise.delay(1000).then(() => {
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

  streamBlock(options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    defaults(options, this._streamDefaults);

    let current = '';
    let last = '';

    const release = this.streamBlockNumber(options, (err, id) => {
      if (err) {
        release();
        callback(err);
        return;
      }

      current = id;
      if (current !== last) {
        last = current;
        this.callReliable('getBlock', current, (err, res) => {
          res.block_num = current;
          res.timestamp_prev = new Date(new Date(res.timestamp).getTime() - 3000).toISOString().split('.')[0];
          callback(err, res);
        });
      }
    });

    return release;
  }

  streamTransactions(options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    defaults(options, this._streamDefaults);

    const release = this.streamBlock(options, (err, block) => {
      if (err) {
        release();
        callback(err);
        return;
      }

      if (block && block.transactions) {
        block.transactions.forEach((transaction) => {
          callback(null, transaction, block);
        });
      }
    });

    return release;
  }

  streamOperations(options = {}, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    defaults(options, this._streamDefaults);

    const release = this.streamTransactions(options, (err, transaction, block) => {
      if (err) {
        release();
        callback(err);
        return;
      }

      transaction.operations.forEach((operation) => {
        callback(null, operation, transaction, block);
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
