import { assert } from 'chai';
import cloneDeep from 'lodash/cloneDeep';
import { encode, decode, newTextMsg, newImageMsgAsync, makeQuoteMsg,
    DEFAULT_APP, DEFAULT_VERSION, MAX_PREVIEW_WIDTH, MAX_PREVIEW_HEIGHT,
    MAX_TEXT_QUOTE_LENGTH, MAX_IMAGE_QUOTE_LENGTH } from '../src/auth/messages';
import th from './test_helper';
import { correctImageURL } from './mock_image';
var sandbox = global.sandbox;

const alice = {
    memo: '5JpqCdoBbBDu3dH5iAPR1bpMpP726LALzzJ2Gp4krUwHPQJ7FHA',
    memo_pub: 'GLS7R6TH9DSKrvhryK9j6DV97ekNEKyT1QopHtxh8CZo2QVF5uo54',
};
const bob = {
    memo: '5KD3SYGUafZjixCq18THjH9uTq6EvBq9uuXHevZSrPoMgki2mDL',
    memo_pub: 'GLS67bFM2GtnEcrayTquHXdA8QdgRUgmGtUTQK24ez3uz4XLDShzc',
};

describe('golos.messages: encode()', function() {
    it('input arguments', function() {
        assert.throws(() => encode(), 'from_private_memo_key is required');
        assert.throws(() => encode(alice.memo), 'to_public_memo_key is required');
        assert.throws(() => encode(alice.memo, bob.memo_pub), 'message is required');

        assert.throws(() => encode(1, alice.memo, bob.memo_pub));
    })

    it('normal case', function() {
        var msg = newTextMsg('Привет');
        var res = encode(alice.memo, bob.memo_pub, msg);

        assert.isString(res.nonce);
        assert.isNotEmpty(res.nonce);

        assert.isTrue(Number.isInteger(res.checksum));

        assert.isString(res.encrypted_message);
        assert.isNotEmpty(res.encrypted_message);
    })

    it('cyrillic, emoji, etc', function() {
        var veryLong = 'Очень';
        for (let i = 0; i < 100; ++i) {
            veryLong += ' длинный текст. Длинный текст.\nОчень';
        }

        for (let str of [
                'Привет',
                'как дела',
                'Hi',
                ')))',
                '',
                ' ',
                '\t',
                '\n',
                '\r\n',
                'Привет, это тебе: ' + String.fromCodePoint(0x1F354), // emoji
                veryLong,
            ]) {
            var msg = newTextMsg(str);
            var enc = encode(alice.memo, bob.memo_pub, msg);
            msg.type = 'text';

            var res = decode(bob.memo, alice.memo_pub, [enc]);
            assert.lengthOf(res, 1);
            assert.deepStrictEqual(res[0].message, msg);
        }
    })

    it('alice -> alice, bob', function() {
        var msg = newTextMsg('Привет');
        var enc = encode(alice.memo, bob.memo_pub, msg);
        msg.type = 'text';

        var res = decode(alice.memo, bob.memo_pub, [enc]);
        assert.lengthOf(res, 1);
        assert.deepStrictEqual(res[0].message, msg);

        var res = decode(bob.memo, alice.memo_pub, [enc]);
        assert.lengthOf(res, 1);
        assert.deepStrictEqual(res[0].message, msg);
    })

    it('alice -> alice', function() {
        var msg = newTextMsg('Привет');
        var enc = encode(alice.memo, alice.memo_pub, msg);
        msg.type = 'text';

        var res = decode(alice.memo, alice.memo_pub, [enc]);
        assert.lengthOf(res, 1);
        assert.deepStrictEqual(res[0].message, msg);

        var res = decode(bob.memo, alice.memo_pub, [enc]);
        assert.lengthOf(res, 1);
        assert.isNull(res[0].message);

        var res = decode(alice.memo, bob.memo_pub, [enc]);
        assert.lengthOf(res, 1);
        assert.isNull(res[0].message);
    })

    it('edit case', function() {
        var msg = newTextMsg('Привет');
        var enc = encode(alice.memo, bob.memo_pub, msg);
        msg.type = 'text';

        var res = decode(bob.memo, alice.memo_pub, [enc]);
        assert.lengthOf(res, 1);
        assert.deepStrictEqual(res[0].message, msg);

        var msg = newTextMsg('Приветик');
        var enc = encode(alice.memo, bob.memo_pub, msg, enc.nonce);
        msg.type = 'text';

        var res2 = decode(bob.memo, alice.memo_pub, [enc]);
        assert.lengthOf(res2, 1);
        assert.deepStrictEqual(res2[0].message, msg);
        assert.strictEqual(res2[0].nonce, res[0].nonce);
        assert.strictEqual(res2[0].checksum, res[0].checksum);
    })
})

describe('golos.messages: decode()', function() {
    before(async function () {
        var msg = newTextMsg('Привет');
        var msgEnc = encode(alice.memo, bob.memo_pub, msg);
        msg.type = 'text'; // for comparison

        var msg2 = await newImageMsgAsync(correctImageURL);
        var msgEnc2 = encode(alice.memo, bob.memo_pub, msg2);

        this._msgs = [
            msg,
            msg2,
            {},
            {},
        ];
        this._msgObjs = [
            msgEnc,
            msgEnc2,
            encode(alice.memo, alice.memo_pub, {}),
            encode(alice.memo, bob.memo_pub, {}),
        ];

        this._decoded = decode(bob.memo, alice.memo_pub, this._msgObjs);
    })
    beforeEach(function() {
        // encode/decode are slow, so we just cloning instead of recreating
        this.msgs = cloneDeep(this._msgs);
        this.msgObjs = cloneDeep(this._msgObjs);
        this.decoded = cloneDeep(this._decoded);
    })

    it('input arguments', async function() {
        assert.throws(() => decode(), 'private_memo_key is required');
        assert.throws(() => decode(null), 'private_memo_key is required');
        assert.throws(() => decode(alice.memo), 'second_user_public_memo_key is required');
        assert.throws(() => decode(alice.memo, null), 'second_user_public_memo_key is required');
        assert.throws(() => decode(alice.memo, bob.memo_pub), 'message_objects is required');

        assert.throws(() => decode('wrong key', bob.memo_pub, []), 'Non-base58 character');
        assert.throws(() => decode(alice.memo, 'wrong key', []), 'Cannot read property \'toUncompressed\' of null');
    })

    it('validation', async function() {
        var normalText = this.msgs[0];
        var normalTextEnc = this.msgObjs[0];
        var normalImage = this.msgs[1];
        var normalImageEnc = this.msgObjs[1];

        // 100 messages are recommended limit for get_thread
        var messages = [];

        // non-decodable
        {
            let msg = encode(alice.memo, alice.memo_pub, normalText);
            messages.push({
                nonce: msg.nonce,
                checksum: 1,
                encrypted_message: 'not encrypted',
            });
        }
        // non-JSON
        {
            sandbox.stub(JSON, 'stringify', (data) => {
                return data; // as it is
            });

            messages.push(encode(alice.memo, bob.memo_pub, 'не json'));

            JSON.stringify.restore();
        }
        // JSON, but not object
        messages.push(encode(alice.memo, bob.memo_pub, 'Привет'));
        // no body
        messages.push(encode(alice.memo, bob.memo_pub, {}));
        // no app, version
        messages.push(encode(alice.memo, bob.memo_pub, {body: 'Привет'}));

        // normal text msgs
        for (let i = 0; i < 50 - 5; ++i) {
            messages.push(normalTextEnc);
        }

        // normal image msgs
        for (let i = 0; i < 50; ++i) {
            messages.push(normalImageEnc);
        }

        var res = decode(bob.memo, alice.memo_pub, messages);

        assert.lengthOf(res, 100);
        // non-decodable
        assert.isNull(res[0].raw_message);
        assert.isNull(res[0].message);
        // non-JSON
        assert.equal(res[1].raw_message, 'не json');
        assert.isNull(res[1].message);
        // JSON, but not object
        assert.equal(res[2].raw_message, '"Привет"');
        assert.isNull(res[2].message);
        // no body
        assert.equal(res[3].raw_message, '{}');
        assert.isNull(res[3].message);
        // no app, version
        assert.equal(res[4].raw_message, '{"body":"Привет"}');
        assert.isNull(res[4].message);
        // normal msgs
        normalText.type = 'text';
        for (let i = 5; i < 50; ++i) {
            assert.deepStrictEqual(res[i].message, normalText);
        }
        for (let i = 50; i < res.length; ++i) {
            assert.deepStrictEqual(res[i].message, normalImage);
        }

        // With on_error

        var on_error = sandbox.spy();
        var res2 = decode(bob.memo, alice.memo_pub, cloneDeep(messages),
            undefined, undefined, (msg, idx, err) => {
                on_error(msg, idx, err.message);
            });

        on_error = on_error.getCalls();
        assert.lengthOf(on_error, 5);
        // non decodable
        assert.calledWith(on_error[0], messages[0], 0, 'Invalid key');
        // not JSON
        assert.calledWith(on_error[1], messages[1], 1);
        // JSON, but not object
        assert.calledWith(on_error[2], messages[2], 2);
        // no body
        assert.calledWith(on_error[3], messages[3], 3, 'message.body should be a string');
        // no app, version
        assert.calledWith(on_error[4], messages[4], 4, 'message.app should be a string, >= 1, <= 16');

        assert.deepStrictEqual(res2, res);

        // With raw_messages

        var on_error_raw = sandbox.spy();
        var res3 = decode(bob.memo, alice.memo_pub, cloneDeep(messages),
            undefined, undefined, (msg, idx, err) => {
                on_error_raw(msg, idx, err.message);
            }, undefined, undefined, true);

        on_error_raw = on_error_raw.getCalls();
        assert.lengthOf(on_error_raw, 1);

        // non decodable
        assert.calledWith(on_error[0], messages[0], 0, 'Invalid key')

        assert.lengthOf(res3, res2.length);

        assert.isNull(res3[0].raw_message);
        assert.isNull(res3[0].message);
        assert.equal(res3[1].raw_message, res[1].raw_message);
        assert.isNull(res3[1].message);
        assert.equal(res3[2].raw_message, res[2].raw_message);
        assert.isNull(res3[2].message);
        assert.equal(res3[3].raw_message, res[3].raw_message);
        assert.isNull(res3[3].message);
        assert.equal(res3[4].raw_message, res[4].raw_message);
        assert.isNull(res3[4].message);
        // and normal
        for (let i = 5; i < 50; ++i) {
            assert.equal(res3[i].raw_message, res[i].raw_message);
            assert.isNull(res3[i].message);
        }
        for (let i = 50; i < res.length; ++i) {
            assert.equal(res3[i].raw_message, res[i].raw_message);
            assert.isNull(res3[i].message);
        }
    })

    it('image validation', async function() {
        var normalImage = this.msgs[1];
        var normalImageEnc = this.msgObjs[1];

        var messages = [];

        // normal
        messages.push(normalImageEnc);

        var addMsg = ((breaker) => {
            var msg = Object.assign({}, normalImage);
            breaker(msg);
            msg = encode(alice.memo, bob.memo_pub, msg);
            messages.push(msg);
        });
        // no body
        addMsg(msg => delete msg.body);
        // no app
        addMsg(msg => delete msg.app);
        // previewWidth, previewHeight problems
        addMsg(msg => delete msg.previewWidth);
        addMsg(msg => msg.previewWidth = '12px');
        addMsg(msg => msg.previewWidth = 0);
        addMsg(msg => msg.previewWidth = MAX_PREVIEW_WIDTH + 1);
        addMsg(msg => delete msg.previewHeight);
        addMsg(msg => msg.previewHeight = '12px');
        addMsg(msg => msg.previewHeight = 0);
        addMsg(msg => msg.previewHeight = MAX_PREVIEW_HEIGHT + 1);

        var on_error = sandbox.spy();
        var res = decode(bob.memo, alice.memo_pub, messages,
            undefined, undefined, (msg, idx, err) => {
                on_error(msg, idx, err.message);
            });

        on_error = on_error.getCalls();
        assert.lengthOf(on_error, 10);

        // no body
        assert.calledWith(on_error[0], messages[1], 1, 'message.body should be a string');
        // no app
        assert.calledWith(on_error[1], messages[2], 2, 'message.app should be a string, >= 1, <= 16');
        // previewWidth, previewHeight problems
        assert.calledWith(on_error[2], messages[3], 3, 'message.previewWidth (for image) should be an integer, >= 1, <= 600');
        assert.calledWith(on_error[3], messages[4], 4, 'message.previewWidth (for image) should be an integer, >= 1, <= 600');
        assert.calledWith(on_error[4], messages[5], 5, 'message.previewWidth (for image) should be an integer, >= 1, <= 600');
        assert.calledWith(on_error[5], messages[6], 6, 'message.previewWidth (for image) should be an integer, >= 1, <= 600')
        assert.calledWith(on_error[6], messages[7], 7, 'message.previewHeight (for image) should be an integer, >= 1, <= 300');
        assert.calledWith(on_error[7], messages[8], 8, 'message.previewHeight (for image) should be an integer, >= 1, <= 300');
        assert.calledWith(on_error[8], messages[9], 9, 'message.previewHeight (for image) should be an integer, >= 1, <= 300');
        assert.calledWith(on_error[9], messages[10], 10, 'message.previewHeight (for image) should be an integer, >= 1, <= 300');

        assert.lengthOf(res, messages.length);
    })

    it('on_error without return', async function() {
        var on_error = sandbox.spy();

        var res = decode(bob.memo, alice.memo_pub, this.msgObjs, undefined, undefined,
            (msg, i, ex) => {
                on_error(msg, i, ex.message);
            });
        assert.deepStrictEqual(res, this.decoded);

        on_error = on_error.getCalls();
        assert.lengthOf(on_error, 2);
        assert.calledWith(on_error[0], this.msgObjs[2], 2, 'Invalid key')
        assert.calledWith(on_error[1], this.msgObjs[3], 3, 'message.body should be a string')
    })

    it('on_error with return false', async function() {
        var res = decode(bob.memo, alice.memo_pub, this.msgObjs, undefined, undefined,
            (msg, i, ex) => {
                return false;
            });
        assert.deepStrictEqual(res, this.decoded);
    })

    it('on_error with return true', async function() {
        var res = decode(bob.memo, alice.memo_pub, this.msgObjs, undefined, undefined,
            (msg, i, ex) => {
                return true;
            });
        assert.lengthOf(res, 2);
        assert.deepStrictEqual(res[0].message, this.msgs[0]);
        assert.deepStrictEqual(res[1].message, this.msgs[1]);
    })

    it('for_each without return', async function() {
        var for_each = sandbox.spy();
        var res = decode(bob.memo, alice.memo_pub, this.msgObjs, undefined,
            (msg, i) => {
                for_each(msg, i);
            });
        assert.deepStrictEqual(res, this.decoded);

        for_each = for_each.getCalls();
        assert.equal(for_each.length, res.length);
        for (let i = 0; i < this.decoded.length; ++i) {
            assert.calledWith(for_each[i], this.decoded[i], i);
        }
    })

    it('for_each with return false', async function() {
        var res = decode(bob.memo, alice.memo_pub, this.msgObjs, undefined,
            (msg, i) => {
                return false;
            });
        assert.deepStrictEqual(res, this.decoded);
    })

    it('for_each with return true', async function() {
        var res = decode(bob.memo, alice.memo_pub, this.msgObjs, undefined,
            (msg, i) => {
                if (i % 2 != 0) return true;
            });
        assert.deepStrictEqual(res[0], this.decoded[0]);
        assert.deepStrictEqual(res[1], this.decoded[2]);
    })

    it('for_each with on_error shouldn\'t be called if error occured', async function() {
        var for_each = sandbox.spy();
        var on_error = sandbox.spy();
        var res = decode(bob.memo, alice.memo_pub, this.msgObjs, undefined,
            (msg, i) => {
                for_each(msg, i);
            }, (msg, i, exception) => {
                on_error(msg, i, exception.message);
            });
        assert.lengthOf(res, this.msgObjs.length);

        for_each = for_each.getCalls();
        assert.lengthOf(for_each, 2);
        assert.calledWith(for_each[0], res[0], 0);
        assert.calledWith(for_each[1], res[1], 1);

        on_error = on_error.getCalls();
        assert.lengthOf(on_error, 2);
        assert.calledWith(on_error[0], res[2], 2);
        assert.calledWith(on_error[1], res[3], 3);
    })

    it('for_each throws, on_error decides push result or not', async function() {
        var on_error = sandbox.spy();
        var res = decode(bob.memo, alice.memo_pub, this.msgObjs, undefined,
            (msg, i) => {
                throw new Error('for_each fail');
            }, (msg, i, exception) => {
                on_error(msg, i, exception.message);
                if (i === 2) return true; // do not push
            });

        assert.lengthOf(res, 3);

        on_error = on_error.getCalls();
        assert.lengthOf(on_error, 4);
        assert.calledWith(on_error[0], res[0], 0, 'for_each fail');
        assert.calledWith(on_error[1], res[1], 1, 'for_each fail');
        assert.calledWith(on_error[2], this.msgObjs[2], 2, 'Invalid key');
        assert.calledWith(on_error[3], res[2], 3, 'message.body should be a string');
    })

    it('before_decode with no return', async function() {
        // for comparison
        for (let obj of this.decoded) obj.field = 'test';

        var before_decode = sandbox.spy();
        var res = decode(bob.memo, alice.memo_pub, this.msgObjs, 
            (msg, i, results) => {
                msg.field = 'test';
                before_decode(msg, i, results);
            });

        assert.deepStrictEqual(res, this.decoded);

        // check before_decode calls
        before_decode = before_decode.getCalls();
        assert.lengthOf(before_decode, this.msgObjs.length);
        for (let i = 0; i < before_decode.length; ++i) {
            assert.calledWith(before_decode[i], this.msgObjs[i], i, res);
        }
    })

    it('before_decode with return false', async function() {
        // for comparison
        for (let obj of this.decoded) obj.field = 'test';

        // before_decode with return false
        var res = decode(bob.memo, alice.memo_pub, this.msgObjs, 
            (msg, i, results) => {
                msg.field = 'test';
                return false;
            });

        assert.deepStrictEqual(res, this.decoded);
    })

    it('before_decode with return true (canceling mode)', async function() {
        // for comparison
        for (let obj of this.decoded) obj.field = 'test';

        var res = decode(bob.memo, alice.memo_pub, this.msgObjs, 
            (msg, i, results) => {
                msg.field = 'test';
                return i % 2 != 0;
            });

        assert.lengthOf(res, 2);
        assert.deepStrictEqual(res[0], this.decoded[0]);
        assert.deepStrictEqual(res[1], this.decoded[2]);
    })

    it('before_decode throws without on_error', async function() {
        var before_decode = sandbox.spy();
        var res = decode(bob.memo, alice.memo_pub, this.msgObjs, 
            (msg, i, results) => {
                before_decode(msg, i, results);
                throw new Error('before_decode fail');
            });

        before_decode = before_decode.getCalls();

        assert.lengthOf(before_decode, res.length);
        assert.lengthOf(res, this.msgObjs.length);
        for (let i = 0; i < res.length; ++i) {
            assert.calledWith(before_decode[i], res[i], i, res);
            assert.isNull(res[i].raw_message);
            assert.isNull(res[i].message);
        }
    })

    it('before_decode throws with on_error', async function() {
        var res = decode(bob.memo, alice.memo_pub, this.msgObjs, 
            (msg, i, results) => {
                throw new Error('before_decode fail');
            }, undefined, (msg, i, err) => {
                assert.equal(err.message, 'before_decode fail');
                msg.message = 'alt msg';
            });

        assert.lengthOf(res, this.msgObjs.length);
        for (let i = 0; i < res.length; ++i) {
            assert.isNull(res[i].raw_message);
            assert.equal(res[i].message, 'alt msg');
        }
    })

    it('ordering + slicing', async function() {
        // default case
        var res = decode(bob.memo, alice.memo_pub, this.msgObjs);

        // reversed order case
        var resRev = decode(bob.memo, alice.memo_pub, this.msgObjs,
            undefined, undefined, undefined, this.msgObjs.length - 1, -1);

        assert.deepStrictEqual([...resRev].reverse(), res);

        // reversed + slicing
        var resSl = decode(bob.memo, alice.memo_pub, cloneDeep(this.msgObjs),
            undefined, undefined, undefined, this.msgObjs.length - 2, 0);

        assert.lengthOf(resSl, 2);
        assert.deepStrictEqual(resSl[0], resRev[1]);
        assert.deepStrictEqual(resSl[1], resRev[2]);

        // default + slicing by begin_idx only
        var resSl = decode(bob.memo, alice.memo_pub, cloneDeep(this.msgObjs),
            undefined, undefined, undefined, 2);
        assert.lengthOf(resSl, 2);
        assert.deepStrictEqual(resSl[0], res[2]);
        assert.deepStrictEqual(resSl[1], res[3]);
    })
})

describe('golos.messages: decode() replies', function() {
    it('message', function() {
        var msg = newTextMsg('Привет');
        var enc = encode(alice.memo, bob.memo_pub, msg);
        const orig = Object.assign({
            from: 'alice',
        }, enc);

        var origDecoded = decode(alice.memo, bob.memo_pub, [orig]);

        var msg2 = newTextMsg('Hi');
        msg2 = makeQuoteMsg(msg2, origDecoded[0]);
        var enc2 = encode(alice.memo, bob.memo_pub, msg2);
        const reply = Object.assign({
            from: 'bob',
        }, enc2);

        var bothDecoded = decode(alice.memo, bob.memo_pub, [orig, enc2]);
        assert.lengthOf(bothDecoded, 2);
        assert.strictEqual(bothDecoded[1].message.quote.from, bothDecoded[0].from);
        assert.strictEqual(bothDecoded[1].message.quote.nonce, bothDecoded[0].nonce);
        assert.strictEqual(bothDecoded[1].message.quote.body, bothDecoded[0].message.body);
        assert.strictEqual(bothDecoded[1].message.quote.type, bothDecoded[0].message.type);
    })

    it('too long message', function() {
        var msg = newTextMsg('a'.repeat(MAX_TEXT_QUOTE_LENGTH + 1));
        var enc = encode(alice.memo, bob.memo_pub, msg);
        const orig = Object.assign({
            from: 'alice',
        }, enc);

        var origDecoded = decode(alice.memo, bob.memo_pub, [orig]);

        var msg2 = newTextMsg('Hi');
        msg2 = makeQuoteMsg(msg2, origDecoded[0]);
        // keep its original length to make message invalid
        msg2.quote.body = 'a'.repeat(MAX_TEXT_QUOTE_LENGTH + 1);
        var enc2 = encode(alice.memo, bob.memo_pub, msg2);
        const reply = Object.assign({
            from: 'bob',
        }, enc2);

        var bothDecoded = decode(alice.memo, bob.memo_pub, [orig, enc2]);
        assert.lengthOf(bothDecoded, 2);
        assert.isNotNull(bothDecoded[1].raw_message);
        assert.isNull(bothDecoded[1].message);
    })

    it('image message (its body can be long)', async function() {
        assert.isTrue(correctImageURL.length > MAX_TEXT_QUOTE_LENGTH, 'too short correctImageURL for this test');

        var msg = await newImageMsgAsync(correctImageURL);
        var enc = encode(alice.memo, bob.memo_pub, msg);
        const orig = Object.assign({
            from: 'alice',
        }, enc);

        var origDecoded = decode(alice.memo, bob.memo_pub, [orig]);

        var msg2 = newTextMsg('Hi');
        msg2 = makeQuoteMsg(msg2, origDecoded[0]);
        var enc2 = encode(alice.memo, bob.memo_pub, msg2);
        const reply = Object.assign({
            from: 'bob',
        }, enc2);

        var bothDecoded = decode(alice.memo, bob.memo_pub, [orig, enc2]);
        assert.lengthOf(bothDecoded, 2);
        assert.strictEqual(bothDecoded[1].message.quote.from, bothDecoded[0].from);
        assert.strictEqual(bothDecoded[1].message.quote.nonce, bothDecoded[0].nonce);
        assert.strictEqual(bothDecoded[1].message.quote.body, bothDecoded[0].message.body);
        assert.strictEqual(bothDecoded[1].message.quote.type, bothDecoded[0].message.type);
    })

    it('image message (too long)', async function() {
        var msg = {
            body: 'a'.repeat(MAX_IMAGE_QUOTE_LENGTH + 1),
            type: 'image',
            app: DEFAULT_APP,
            version: DEFAULT_VERSION,
            previewWidth: MAX_PREVIEW_WIDTH,
            previewHeight: MAX_PREVIEW_HEIGHT,
        };
        var enc = encode(alice.memo, bob.memo_pub, msg);
        const orig = Object.assign({
            from: 'alice',
        }, enc);

        var origDecoded = decode(alice.memo, bob.memo_pub, [orig]);

        var msg2 = newTextMsg('Hi');
        msg2 = makeQuoteMsg(msg2, origDecoded[0]);
        var enc2 = encode(alice.memo, bob.memo_pub, msg2);
        const reply = Object.assign({
            from: 'bob',
        }, enc2);

        var bothDecoded = decode(alice.memo, bob.memo_pub, [orig, enc2]);
        assert.lengthOf(bothDecoded, 2);
        assert.strictEqual(bothDecoded[1].message.quote.from, bothDecoded[0].from);
        assert.strictEqual(bothDecoded[1].message.quote.nonce, bothDecoded[0].nonce);
        assert.strictEqual(bothDecoded[1].message.quote.body, bothDecoded[0].message.body.substring(0, MAX_TEXT_QUOTE_LENGTH - 3) + '...');
        assert.strictEqual(bothDecoded[1].message.quote.type, undefined);
    })
})
