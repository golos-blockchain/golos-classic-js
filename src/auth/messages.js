
import ByteBuffer from 'bytebuffer'
import assert from 'assert'
import base58 from 'bs58'
import Promise from 'bluebird';
import truncate from 'lodash/truncate';
import {Aes, PrivateKey, PublicKey} from './ecc'
import {ops} from './serializer'
import {fitImageToSize} from '../utils';
const {isInteger} = Number

/** @const {string} DEFAULT_APP 
    @default 'golos-messenger' */
export const DEFAULT_APP = 'golos-messenger';
/** @const {string} DEFAULT_VERSION 
    @default 1 */
export const DEFAULT_VERSION = 1;
/** @const {string} MAX_PREVIEW_WIDTH 
    @default 600 */
export const MAX_PREVIEW_WIDTH = 600;
/** @const {string} MAX_PREVIEW_HEIGHT 
    @default 300 */
export const MAX_PREVIEW_HEIGHT = 300;
/** @const {string} MAX_TEXT_QUOTE_LENGTH
    @default 200 */
export const MAX_TEXT_QUOTE_LENGTH = 200;
/** @const {string} MAX_IMAGE_QUOTE_LENGTH
    @default 2000 */
export const MAX_IMAGE_QUOTE_LENGTH = 2000;

const toPrivateObj = o => (o ? o.d ? o : PrivateKey.fromWif(o) : o/*null or undefined*/)
const toPublicObj = o => (o ? o.Q ? o : PublicKey.fromString(o) : o/*null or undefined*/)

function validateAppVersion(app, version) {
    assert(typeof app === 'string' && app.length >= 1 && app.length <= 16,
        'message.app should be a string, >= 1, <= 16');
    assert(isInteger(version) && version >= 1,
        'message.version should be an integer, >= 1');
}

function validateBody(body) {
    assert(typeof body === 'string', 'message.body should be a string');
}

function validateImageMsg(msg) {
    assert(isInteger(msg.previewWidth) && msg.previewWidth >= 1 && msg.previewWidth <= MAX_PREVIEW_WIDTH,
        'message.previewWidth (for image) should be an integer, >= 1, <= ' + MAX_PREVIEW_WIDTH);

    assert(isInteger(msg.previewHeight) && msg.previewHeight >= 1 && msg.previewHeight <= MAX_PREVIEW_HEIGHT,
        'message.previewHeight (for image) should be an integer, >= 1, <= ' + MAX_PREVIEW_HEIGHT);
}

function validateMsgWithQuote(msg) {
    if (msg.quote !== undefined) {
        assert(typeof msg.quote === 'object', 'message.quote should be an object or undefined at all');
        assert(typeof msg.quote.from === 'string' && msg.quote.from.length >= 1 && msg.quote.from.length <= 16,
            'message.quote.from should be a valid nickname of sender of message, to which this reply is');
        assert(typeof msg.quote.nonce === 'string' && msg.quote.nonce.length,
            'message.quote.nonce should be a valid nonce of message, to which this reply is');

        if (msg.quote.type !== 'image') {
            assert(typeof msg.quote.body === 'string' && msg.quote.body.length <= MAX_TEXT_QUOTE_LENGTH,
                'message.quote.body should be a truncated (length <= 200) text of message, to which this reply is');
        } else {
            assert(typeof msg.quote.body === 'string' && msg.quote.body.length <= MAX_IMAGE_QUOTE_LENGTH,
                'message.quote.body should be a truncated (length <= 2000) image URL from message, to which this reply is');
        }
    }
}

/**
    Creates new message, which can be encoded by golos.messages.encode.
    @arg {string} text - text ("body") of the message.
    @arg {string} [app = DEFAULT_APP] - "app" field of the message. Should be a string with length from 1 to 16.
    @arg {string} [version = DEFAULT_VERSION] - "version" field of the message. Should be an integer, starting of 1.
    @throws {Exception} when supplied data is invalid.
    @return {object} - result message object.
*/
export function newTextMsg(text, app = DEFAULT_APP, version = DEFAULT_VERSION) {
    validateBody(text);
    validateAppVersion(app, version);
    const msg = {
        app,
        version,
        body: text,
    };
    return msg;
}

/**
    Creates new image message, which can be encoded by golos.messages.encode.
    @arg {string} image_url - URL of the image in the Internet (please use https://, and store images in image hostings, to make them storing eternally). This URL will be a "body" of the message.
    @arg {function} callback - callback. Params are <code>(err, message)</code>. Calling after message construction (err is null in this case), or if error occured (err is exception, message is null).
    @arg {function} [on_progress = undefined] - progress callback. Params are <code>(percent, extra_data)</code>. Percent is integer from 1 to 100.
    @arg {string} [app = DEFAULT_APP] - "app" field of the message. Should be a string with length from 1 to 16.
    @arg {string} [version = DEFAULT_VERSION] - "version" field of the message. Should be an integer, starting of 1.
    @throws {Exception} only if callback called due error, and callback also throws error. So callback shouldn't throw errors.
*/
exports.newImageMsg = function(image_url, callback, on_progress = undefined, app = DEFAULT_APP, version = DEFAULT_VERSION) {
    let reportProgress = (progress, error = null) => {
        if (on_progress) on_progress(progress, {error});
    };

    try {
        assert(typeof Image !== 'undefined', 'Current environment does not support Image()');
        assert(image_url, 'image_url is required');
        assert(callback, 'callback is required');
        validateAppVersion(app, version);

        reportProgress(0);

        let reportLoadError = (errorText) => {
            const err = new Error(errorText);
            reportProgress(100, err);
            callback(err, null);
        };

        let img = new Image();
        let watchdog;
        let clearWatchdog = () => {
            if (watchdog) clearTimeout(watchdog);
        };
        img.onerror = img.onabort = () => {
            clearWatchdog();
            reportLoadError('Cannot load image');
        };
        img.onload = () => {
            clearWatchdog();
            reportProgress(100);
            const previewSize = fitImageToSize(img.width, img.height, MAX_PREVIEW_WIDTH, MAX_PREVIEW_HEIGHT);
            const msg = {
                app,
                version,
                body: image_url,
                type: 'image',
                previewWidth: previewSize.width,
                previewHeight: previewSize.height,
            };
            validateImageMsg(msg);
            callback(null, msg);
        };
        watchdog = setTimeout(() => {
            if (!img.complete) {
                img.onload = img.onerror = img.onabort = {};
                reportLoadError('Image load timed out, maybe it is too large');
            }
        }, 5000);
        img.src = image_url;
    } catch (err) {
        reportProgress(100, err);
        if (callback) callback(err, null);
    }
};

/**
    Creates new image message, which can be encoded by golos.messages.encode. Async version of function, should be called with await.
    @arg {string} image_url - URL of the image in the Internet. It will be a "body" of the message.
    @arg {function} [on_progress = undefined] - progress callback. Params are <code>(percent, extra_data)</code>. Percent is integer from 1 to 100.
    @arg {string} [app = DEFAULT_APP] - "app" field of the message. Should be a string with length from 1 to 16.
    @arg {string} [version = DEFAULT_VERSION] - "version" field of the message. Should be an integer, starting of 1.
    @throws {Exception} if error occured.
    @return {object} - result message object.
    @function newImageMsgAsync
*/
exports.newImageMsgAsync = Promise.promisify(function (...args) {
    const callback = args[args.length - 1];
    let [ image_url, on_progress, app, version ] = args.slice(0, args.length - 1);
    return exports.newImageMsg(image_url, callback, on_progress, app, version);
});

/**
    Makes your message the reply to another message_object. Call it after `newTextMsg`/`newImageMsg`/etc, next call `encode`, and finally send resulting message as usually.
    @arg {object} msg = Your message, created by `newTextMsg`, `newImageMsg`, etc.
    @arg {object} quoted_message_object = Message to which you want to reply. It should be one of messages returned by `golos.messages.decode`, and have "from", "nonce", and (warning!) "message". If message is invalid (cannot be decoded), it has no "message" field, and if you try reply it, it will throw.
    @throws {Exception} if quoted_message_object is invalid.
    @return {object} - result message object, which can be encoded and sent.
    @function newImageMsgAsync
*/
export function makeQuoteMsg(msg, quoted_message_object) {
    assert(quoted_message_object, 'quoted_message_object is required');
    const assertPrefix = 'quoted_message_object should be one of VALID objects, returned by `golos.messages.decode`';
    assert(quoted_message_object.from, `${assertPrefix}, and have "from" field`);
    assert(quoted_message_object.nonce, `${assertPrefix}, and have "nonce" field`);
    assert(quoted_message_object.message, `${assertPrefix}, and have "message" field`);
    assert(quoted_message_object.message.body, `${assertPrefix}, and have "message" field with "body"`);

    let type = quoted_message_object.message.type;
    let body = quoted_message_object.message.body;
    if (type !== 'image') {
        body = truncate(body, {length: MAX_TEXT_QUOTE_LENGTH, omission: '...'});
    } else {
        if (body.length > MAX_IMAGE_QUOTE_LENGTH) {
            body = truncate(body, {length: MAX_TEXT_QUOTE_LENGTH, omission: '...'});
            type = undefined; // make it text
        }
    }
    if (!msg) msg = {};
    msg.quote = {
        from: quoted_message_object.from,
        nonce: quoted_message_object.nonce,
        body,
    };
    if (type) msg.quote.type = type;
    return msg;
}

function forEachMessage(message_objects, begin_idx, end_idx, callback) {
    if (begin_idx === undefined) begin_idx = 0;
    if (end_idx === undefined) end_idx = message_objects.length;
    const step = end_idx > begin_idx ? 1 : -1;
    for (let i = begin_idx; i != end_idx; i += step) {
        const message_object = message_objects[i];
        // return true is `continue`
        // return false is `break`
        if (!callback(message_object, i))
            break;
    }
}

/**
    Decodes messages of format used by golos.messages.encode(), which are length-prefixed, and also messages sent by another way (not length-prefixed).<br>
    Also, parses (JSON) and validates each message (app, version...). (Invalid messages are also added to result, it is need to mark them as read. To change it, use <code>on_error</code>).<br>
    Processes whole incoming array, or only part of it.<br>
    Can process in reversed order.
    @arg {string|PrivateKey} private_memo_key - private memo key of "from" or "to".
    @arg {string|PublicKey} second_user_public_memo_key - public memo key of second user.
    @arg {array} message_objects - array of objects. Each object should contain nonce, checksum and encrypted_message (such object returns from private_message API).
    @arg {function} [before_decode = undefined] - callback, calling on each message before processing. Params are <code>(message, idx, results)</code>. If returns true, message will not be processed. Also, you can push it to <code>results</code> manually.
    @arg {function} [for_each = undefined] - callback, calling on each message, after message is decoded, parsed and validated, but before add it to result array. Params are <code>(message, idx)</code>. If returns true, message willn't be added to result array.
    @arg {function} [on_error = undefined] - callback, calling on each message which can't be decrypted, parsed, validated, or if <code>for_each</code> throws. Params are <code>(message, idx, exception)</code>. If returns true, message willn't be added to result array.
    @arg {int} [begin_idx = undefined] - if set, function will process messages only from this index (incl.). If begin_idx > end_idx, messages will be processed in reversed order.
    @arg {int} [end_idx = undefined] - if set, function will process messages only before this index (excl.). If end_idx < begin_idx, messages will be processed in reversed order.
    @arg {bool} [raw_messages = false] - if set, function will not parse messages as JSON and validate them.
    @return {array} - result array of message_objects. Each object has "message" and "raw_message" fields. If message is invalid, it has only "raw_message" field. And if message cannot be decoded at all, it hasn't any of these fields.
*/
export function decode(private_memo_key, second_user_public_memo_key, message_objects, before_decode = undefined, for_each = undefined, on_error = undefined, begin_idx = undefined, end_idx = undefined, raw_messages = false) {
    assert(private_memo_key, 'private_memo_key is required');
    assert(second_user_public_memo_key, 'second_user_public_memo_key is required');
    assert(message_objects, 'message_objects is required');

    // Most "heavy" lines
    const private_key = toPrivateObj(private_memo_key);
    const public_key = toPublicObj(second_user_public_memo_key);
    let shared_secret = private_key.get_shared_secret(public_key);

    let results = [];
    forEachMessage(message_objects, begin_idx, end_idx, (message_object, i) => {
        // Return true if for_each should not be called
        let processOnError = (exception) => {
            if (on_error) {
                if (!on_error(message_object, i, exception)) {
                    results.push(message_object);
                }
                return true;
            }
            return false;
        };

        try {
            message_object.raw_message = null; // Will be set if message will be successfully decoded
            message_object.message = null; // Will be set if message will be also successfully parsed and validated

            if (before_decode && before_decode(message_object, i, results)) {
                return true;
            }

            let decrypted = Aes.decrypt(shared_secret, null,
                message_object.nonce.toString(),
                Buffer.from(message_object.encrypted_message, 'hex'),
                message_object.checksum);

            const mbuf = ByteBuffer.fromBinary(decrypted.toString('binary'), ByteBuffer.DEFAULT_CAPACITY, ByteBuffer.LITTLE_ENDIAN)
            try {
                mbuf.mark()
                decrypted = mbuf.readVString()
            } catch(e) {
                mbuf.reset()
                // Sender did not length-prefix the memo
                decrypted = new Buffer(mbuf.toString('binary'), 'binary').toString('utf-8')
            }

            decrypted = decrypted.toString();
            message_object.raw_message = decrypted;
            if (!raw_messages) {
                let msg = JSON.parse(message_object.raw_message);
                msg.type = msg.type || 'text';
                validateBody(msg.body);
                if (msg.type === 'image')
                    validateImageMsg(msg);
                validateAppVersion(msg.app, msg.version);
                validateMsgWithQuote(msg);
                message_object.message = msg;
            }
        } catch (exception) {
            if (processOnError(exception))
                return true;
        }
        try {
            if (!for_each || !for_each(message_object, i)) {
                results.push(message_object);
            }
        } catch (exception) {
            processOnError(exception);
        }
        return true;
    });
    return results;
}

/**
    Encodes message to send with private_message_operation. Converts object to JSON string. Uses writeVString, so format of data to encode is string length + string.
    @arg {string|PrivateKey} from_private_memo_key - private memo key of "from"
    @arg {string|PublicKey} to_public_memo_key - private memo key of "to"
    @arg {object} message - message to encode.
    @arg {string|undefined} nonce - unique identifier of message. When editing message, set to its nonce. Otherwise keep undefined.
    @return {object} - Object with fields: nonce, checksum and message.
*/
export function encode(from_private_memo_key, to_public_memo_key, message, nonce = undefined) {
    assert(from_private_memo_key, 'from_private_memo_key is required');
    assert(to_public_memo_key, 'to_public_memo_key is required');
    assert(message, 'message is required');

    const fromKey = toPrivateObj(from_private_memo_key);
    const toKey = toPublicObj(to_public_memo_key);

    const mbuf = new ByteBuffer(ByteBuffer.DEFAULT_CAPACITY, ByteBuffer.LITTLE_ENDIAN)
    mbuf.writeVString(JSON.stringify(message));
    message = new Buffer(mbuf.copy(0, mbuf.offset).toBinary(), 'binary');

    let data = Aes.encrypt(fromKey,
        toKey,
        message,
        nonce);

    return {
        nonce: data.nonce.toString(),
        encrypted_message: data.message.toString('hex'),
        checksum: data.checksum,
    };
}

/**
    Selects messages by condition (e.g unread, or selected by user), and groups them into ranges with `nonce` (if range has 1 message) or `start_date`+`stop_date` (if range has few messages). Can wrap these ranges into operations: `private_mark_message` and `private_delete_message`.
    @arg {array} message_objects - array of message objects. It can be result array from `golos.messages.decode`.
    @arg {function} condition - callback, calling on each message. Params are (message, idx). If returns true, message is adding to ranges. If returns false/undefined/null, message is skipping. If returns -1, processing loop breaks.
    @arg {function} wrapper - callback, calling on each range, when adding it to result array. Allows to wrap range as an operation. Params are (range). Should return wrapped result. If returns false/undefined/null, range skipping.
    @arg {int|undefined} begin_idx - if set, function will process messages only from it index (incl.). If begin_idx > end_idx, messages will be processed in reversed order.
    @arg {int|undefined} end_idx - if set, function will process messages only before it index (excl.). If end_idx < begin_idx, messages will be processed in reversed order.
    @return {array} - result array of operations, which can be sent in single transaction.
*/
export function makeDatedGroups(message_objects, condition, wrapper, begin_idx, end_idx) {
    assert(message_objects, 'message_objects is required');
    assert(condition, 'condition is required');
    assert(wrapper, 'wrapper is required');

    let results = [];

    let group = null;
    let before = null;

    let fixStartDate = (start_date) => {
        return new Date(new Date(start_date+'Z').getTime() - 1000).toISOString().split('.')[0];
    };

    const time_point_min = '1970-01-01T00:00:00';

    let pushResult = (nonces, start_date, stop_date) => {
        if (nonces) {
            for (const nonce of nonces) {
                let wrapped = wrapper({
                    start_date: time_point_min,
                    stop_date: time_point_min,
                    nonce,
                });
                if (wrapped) results.push(wrapped);
            }
        } else {
            let wrapped = wrapper({
                start_date,
                stop_date,
                nonce: 0,
            });
            if (wrapped) results.push(wrapped);
        }
    };

    let pushGroup = (nextCreateDate) => {
        if (!group)
            return;

        let { beforeNonces, nonces, afterNonces } = group;

        if (!nextCreateDate || nextCreateDate !== group.start_date) {
            nonces.push(...afterNonces);
            afterNonces = [];
        }

        pushResult(beforeNonces);

        if (nonces.length > 1) {
            if (!afterNonces.length)
                group.start_date = fixStartDate(group.start_date);
            pushResult(null, group.start_date, group.stop_date);
        } else if (nonces[0]) {
            pushResult([nonces[0]]);
        }

        pushResult(afterNonces);

        group = null;
    };

    forEachMessage(message_objects, begin_idx, end_idx, (message_object, i) => {
        const cond = condition(message_object, i);
        const { create_date, nonce } = message_object;
        if (cond === -1) {
            return false;
        } else if (cond) {
            if (!group) {
                group = {
                    stop_date: create_date,
                    beforeNonces: [],
                    afterNonces: [],
                    nonces: [],
                };
            }

            if (create_date === before) {
                group.beforeNonces.push(nonce);
            } else {
                if (before) {
                    before = null;
                    group.stop_date = create_date;
                }

                if (create_date !== group.start_date) {
                    group.nonces.push(...group.afterNonces);
                    group.afterNonces = [];
                }
                group.afterNonces.push(nonce);
            }
            group.start_date = create_date;
        } else if (cond === false) {
            pushGroup(create_date);
            before = create_date;
        }
        return true;
    });
    pushGroup();

    return results;
}
