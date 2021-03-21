
import ByteBuffer from 'bytebuffer'
import assert from 'assert'
import base58 from 'bs58'
import {Aes, PrivateKey, PublicKey} from './ecc'
import {ops} from './serializer'

const toPrivateObj = o => (o ? o.d ? o : PrivateKey.fromWif(o) : o/*null or undefined*/)
const toPublicObj = o => (o ? o.Q ? o : PublicKey.fromString(o) : o/*null or undefined*/)

/**
    Decodes messages of format used by golos.messages.encode(), which are length-prefixed, and also messages sent by another way (not length-prefixed). Processes whole incoming array, or only part of it. Can process in reversed order.
    @arg {string|PrivateKey} private_memo_key - private memo key of "from" or "to".
    @arg {string|PublicKey} second_user_public_memo_key - public memo key of second user.
    @arg {array} message_objects - array of objects. Each object which contains nonce, checksum and encrypted_message (such object returns from private_message API).
    @arg {function|undefined} for_each - callback, calling on each message, after message is decoded, but before add it to result array. Params are (message, idx). If callback not returns true, message willn't be added to result array.
    @arg {int|undefined} begin_idx - if set, function will process messages only from it index (incl.). If begin_idx > end_idx, messages will be processed in reversed order.
    @arg {int|undefined} end_idx - if set, function will process messages only before it index (excl.). If end_idx < begin_idx, messages will be processed in reversed order.
    @arg {function|undefined} on_error - callback, calling on each message which can't be decrypted. Params are (message, idx, exception). If returns true, message (without `message` field) will be added to result array.
    @arg {function|undefined} before_decode - callback, calling on each message before decrypting. Params are (message, idx, results). If returns false, message will not be decrypted. Also, you can push it to `results` manually.
    @return {array} - result array of message_objects.
*/
export function decode(private_memo_key, second_user_public_memo_key, message_objects, for_each, begin_idx, end_idx, on_error, before_decode) {
    assert(private_memo_key, 'private_memo_key is required');
    assert(second_user_public_memo_key, 'second_user_public_memo_key is required');
    assert(message_objects, 'message_objects is required');
    if (!end_idx) end_idx = message_objects.length;
    if (!begin_idx) begin_idx = 0;
    const step = end_idx > begin_idx ? 1 : -1;

    let shared_secret;

    let results = [];
    for (let i = begin_idx; i != end_idx; i += step) {
        const message_object = message_objects[i];

        if (before_decode && !before_decode(message_object, i, results)) {
            continue;
        }

        // Most "heavy" lines
        if (!shared_secret) {
            const private_key = toPrivateObj(private_memo_key);
            const public_key = toPublicObj(second_user_public_memo_key);
            shared_secret = private_key.get_shared_secret(public_key);
        }

        try {
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
            message_object.message = decrypted;
            if (!for_each || for_each(message_object, i)) {
                results.push(message_object);
            }
        } catch (exception) {
            if (on_error && on_error(message_object, i, exception)) {
                results.push(message_object);
            }
        }
    }
    return results;
}

/**
    Encodes string to send with private_message_operation. Uses writeVString, so format of data to encode is string length + string.
    @arg {string|PrivateKey} from_private_memo_key - private memo key of "from"
    @arg {string|PublicKey} to_public_memo_key - private memo key of "to"
    @arg {string} message - message to encode. Please use JSON string like: '{"app":"golos-id","version":1,"body":"World"}'.
    @arg {string|undefined} nonce - unique identifier of message. When editing message, set to its nonce. Otherwise keep undefined.
    @return {object} - Object with fields: nonce, checksum and message. To use in operation, nonce should be converted with toString(), and another fields are ready to use.
*/
export function encode(from_private_memo_key, to_public_memo_key, message, nonce = undefined) {
    assert(from_private_memo_key, 'from_private_memo_key is required');
    assert(to_public_memo_key, 'to_public_memo_key is required');
    assert(message, 'message is required');

    const fromKey = toPrivateObj(from_private_memo_key);
    const toKey = toPublicObj(to_public_memo_key);

    const mbuf = new ByteBuffer(ByteBuffer.DEFAULT_CAPACITY, ByteBuffer.LITTLE_ENDIAN)
    mbuf.writeVString(message);
    message = new Buffer(mbuf.copy(0, mbuf.offset).toBinary(), 'binary');

    let data = Aes.encrypt(fromKey,
        toKey,
        message,
        nonce);
    data.encrypted_message = data.message;
    delete data.message;
    data.encrypted_message = data.encrypted_message.toString('hex');
    return data;
}
