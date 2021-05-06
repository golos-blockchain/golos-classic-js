import assert from 'assert';
import sinon from 'sinon';
import { encode, decode, newTextMsg, newImageMsgAsync,
    DEFAULT_APP, DEFAULT_VERSION, MAX_PREVIEW_WIDTH, MAX_PREVIEW_HEIGHT } from '../src/auth/messages';
var th = require('./test_helper');
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

function createTextMsg(str) {
    var msg = newTextMsg('Привет');
    var msgEnc = encode(alice.memo, bob.memo_pub, msg);
    msgEnc = Object.assign({
        nonce: msgEnc.nonce.toString()
    }, msgEnc)
    return [msg, msgEnc];
}

async function createImageMsg(url) {
    var msg = await newImageMsgAsync(url);
    var msgEnc = encode(alice.memo, bob.memo_pub, msg);
    msgEnc = Object.assign({
        nonce: msgEnc.nonce.toString()
    }, msgEnc)
    return [msg, msgEnc];
}

describe('golos.messages', function() {
    before(function () {
        var [msg, msgEnc] = createTextMsg('Привет');
        msg.type = 'text'; // for comparison
        var [msg2, msgEnc2] = createTextMsg('и тебе привет');
        msg2.type = 'text'; // for comparison
        this.msgs = [
            msg,
            msg2,
            {},
            {},
        ];
        this.msgObjs = [
            msgEnc,
            msgEnc2,
            encode(alice.memo, alice.memo_pub, {}),
            encode(alice.memo, bob.memo_pub, {}),
        ];
    })

    it('encode', function() {
        th.errorEquals(() => encode(), 'from_private_memo_key is required');
        th.errorEquals(() => encode(alice.memo), 'to_public_memo_key is required');
        th.errorEquals(() => encode(alice.memo, bob.memo_pub), 'message is required');

        th.errorEquals(() => encode(1, alice.memo, bob.memo_pub), 'Expected String');

        var msg = newTextMsg('Привет');
        var res = encode(alice.memo, bob.memo_pub, msg);
        assert.ok(Number.isInteger(res.checksum));
    })

    it('encode decode: cyrillic, emoji, etc', function() {
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
            assert.equal(res.length, 1);
            assert.deepStrictEqual(res[0].message, msg);
        }
    })

    it('encode decode: alice -> alice, bob', function() {
        var msg = newTextMsg('Привет');
        var enc = encode(alice.memo, bob.memo_pub, msg);
        msg.type = 'text';

        var res = decode(alice.memo, bob.memo_pub, [enc]);
        assert.equal(res.length, 1);
        assert.deepStrictEqual(res[0].message, msg);

        var res = decode(bob.memo, alice.memo_pub, [enc]);
        assert.equal(res.length, 1);
        assert.deepStrictEqual(res[0].message, msg);
    })

    it('encode decode: alice -> alice', function() {
        var msg = newTextMsg('Привет');
        var enc = encode(alice.memo, alice.memo_pub, msg);
        msg.type = 'text';

        var res = decode(alice.memo, alice.memo_pub, [enc]);
        assert.equal(res.length, 1);
        assert.deepStrictEqual(res[0].message, msg);

        var res = decode(bob.memo, alice.memo_pub, [enc]);
        assert.equal(res.length, 1);
        assert.equal(res[0].message, null);

        var res = decode(alice.memo, bob.memo_pub, [enc]);
        assert.equal(res.length, 1);
        assert.equal(res[0].message, null);
    })

    it('encode decode: edit case', function() {
        var msg = newTextMsg('Привет');
        var enc = encode(alice.memo, bob.memo_pub, msg);
        msg.type = 'text';

        var res = decode(bob.memo, alice.memo_pub, [enc]);
        assert.equal(res.length, 1);
        assert.deepStrictEqual(res[0].message, msg);

        var msg = newTextMsg('Приветик');
        var enc = encode(alice.memo, bob.memo_pub, msg, enc.nonce);
        msg.type = 'text';

        var res2 = decode(bob.memo, alice.memo_pub, [enc]);
        assert.equal(res2.length, 1);
        assert.deepStrictEqual(res2[0].message, msg);
        assert.equal(res2[0].nonce, res[0].nonce);
        assert.equal(res2[0].checksum, res[0].checksum);
    })

    it('decode: input arguments', async function() {
        th.errorEquals(() => decode(), 'private_memo_key is required');
        th.errorEquals(() => decode(null), 'private_memo_key is required');
        th.errorEquals(() => decode(alice.memo), 'second_user_public_memo_key is required');
        th.errorEquals(() => decode(alice.memo, null), 'second_user_public_memo_key is required');
        th.errorEquals(() => decode(alice.memo, bob.memo_pub), 'message_objects is required');

        th.errorEquals(() => decode('wrong key', bob.memo_pub, []), 'Non-base58 character');
        th.errorEquals(() => decode(alice.memo, 'wrong key', []), 'Cannot read property \'toUncompressed\' of null');
    })

    it('decode: validation', async function() {
        var [normalText, normalTextEnc] = createTextMsg('Привет');
        var [normalImage, normalImageEnc] = await createImageMsg(correctImageURL);

        // 100 messages are recommended limit for get_thread
        var messages = [];

        // non-decodable
        {
            let msg = encode(alice.memo, alice.memo_pub, normalText);
            messages.push({
                nonce: msg.nonce.toString(),
                checksum: 1,
                encrypted_message: 'not encrypted',
            });
        }
        // non-JSON
        {
            sandbox.stub(JSON, 'stringify', (data) => {
                return data; // as it is
            });

            let msg = encode(alice.memo, bob.memo_pub, 'не json');
            messages.push(Object.assign({
                nonce: msg.nonce.toString()
            }, msg));

            JSON.stringify.restore();
        }
        // JSON, but not object
        {
            let msg = encode(alice.memo, bob.memo_pub, 'Привет');
            messages.push(Object.assign({
                nonce: msg.nonce.toString()
            }, msg));
        }
        // no body
        {
            let msg = encode(alice.memo, bob.memo_pub, {});
            messages.push(Object.assign({
                nonce: msg.nonce.toString()
            }, msg));
        }
        // no app, version
        {
            let msg = encode(alice.memo, bob.memo_pub, {body: 'Привет'});
            messages.push(Object.assign({
                nonce: msg.nonce.toString()
            }, msg));
        }

        // normal text msgs
        for (let i = 0; i < 50 - 5; ++i) {
            messages.push(normalTextEnc);
        }

        // normal image msgs
        for (let i = 0; i < 50; ++i) {
            messages.push(normalImageEnc);
        }

        var res = decode(bob.memo, alice.memo_pub, messages);

        assert.equal(res.length, 100);
        // non-decodable
        assert.deepStrictEqual(res[0].raw_message, null);
        assert.deepStrictEqual(res[0].message, null);
        // non-JSON
        assert.deepStrictEqual(res[1].raw_message, 'не json');
        assert.deepStrictEqual(res[1].message, null);
        // JSON, but not object
        assert.deepStrictEqual(res[2].raw_message, '"Привет"');
        assert.deepStrictEqual(res[2].message, null);
        // no body
        assert.deepStrictEqual(res[3].raw_message, '{}');
        assert.deepStrictEqual(res[3].message, null);
        // no app, version
        assert.deepStrictEqual(res[4].raw_message, '{"body":"Привет"}');
        assert.deepStrictEqual(res[4].message, null);
        // normal msgs
        normalText.type = 'text';
        for (let i = 5; i < 50; ++i) {
            assert.deepStrictEqual(res[i].message, normalText);
        }
        for (let i = 50; i < res.length; ++i) {
            assert.deepStrictEqual(res[i].message, normalImage);
        }

        // With on_error

        var errors = [];
        var res2 = decode(bob.memo, alice.memo_pub, messages,
            undefined, undefined, (msg, idx, err) => {
                errors.push({msg, idx, err});
            });

        assert.equal(errors.length, 5);
        // non decodable
        assert.deepStrictEqual(errors[0].msg, messages[0]);
        assert.equal(errors[0].idx, 0);
        assert.equal(errors[0].err.message, 'Invalid key');
        // not JSON
        assert.deepStrictEqual(errors[1].msg, messages[1]);
        assert.equal(errors[1].idx, 1);
        // JSON, but not object
        assert.deepStrictEqual(errors[2].msg, messages[2]);
        assert.equal(errors[2].idx, 2);
        // no body
        assert.deepStrictEqual(errors[3].msg, messages[3]);
        assert.equal(errors[3].idx, 3);
        assert.equal(errors[3].err.message, 'message.body should be a string');
        // no app, version
        assert.deepStrictEqual(errors[4].msg, messages[4]);
        assert.equal(errors[4].idx, 4);
        assert.equal(errors[4].err.message, 'message.app should be a string, >= 1, <= 16');

        assert.deepStrictEqual(res2, res);

        // With raw_messages

        var errors3 = [];
        var res3 = decode(bob.memo, alice.memo_pub, messages,
            undefined, undefined, (msg, idx, err) => {
                errors3.push({msg, idx, err});
            }, undefined, undefined, true);

        assert.deepStrictEqual(res3, res2);
        assert.equal(errors3.length, 1);
        assert.deepStrictEqual(errors3[0], errors[0]);
        assert.equal(res3[0].raw_message, null);
        assert.equal(res3[0].message, null);
        assert.equal(res3[1].raw_message, res2[1].raw_message);
        assert.equal(res3[1].message, null);
        assert.equal(res3[2].raw_message, res2[2].raw_message);
        assert.equal(res3[2].message, null);
        assert.equal(res3[3].raw_message, res2[3].raw_message);
        assert.equal(res3[3].message, null);
    })

    it('decode: image validation', async function() {
        var [normalImage, normalImageEnc] = await createImageMsg(correctImageURL);

        var messages = [];

        // normal
        messages.push(normalImageEnc);

        var addMsg = ((breaker) => {
            var msg = Object.assign({}, normalImage);
            breaker(msg);
            msg = encode(alice.memo, bob.memo_pub, msg);
            messages.push(Object.assign({
                nonce: msg.nonce.toString()
            }, msg));
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

        var errors = [];
        var res = decode(bob.memo, alice.memo_pub, messages,
            undefined, undefined, (msg, idx, err) => {
                errors.push({msg, idx, err});
            });

        assert.equal(res.length, messages.length);
        assert.equal(errors.length, 10);
        // non decodable
        assert.equal(errors[0].err.message, 'message.body should be a string');
        assert.equal(errors[1].err.message, 'message.app should be a string, >= 1, <= 16');
        assert.equal(errors[2].err.message, 'message.previewWidth (for image) should be an integer, >= 1, <= 600');
        assert.equal(errors[3].err.message, 'message.previewWidth (for image) should be an integer, >= 1, <= 600');
        assert.equal(errors[4].err.message, 'message.previewWidth (for image) should be an integer, >= 1, <= 600');
        assert.equal(errors[5].err.message, 'message.previewWidth (for image) should be an integer, >= 1, <= 600')
        assert.equal(errors[6].err.message, 'message.previewHeight (for image) should be an integer, >= 1, <= 300');
        assert.equal(errors[7].err.message, 'message.previewHeight (for image) should be an integer, >= 1, <= 300');
        assert.equal(errors[8].err.message, 'message.previewHeight (for image) should be an integer, >= 1, <= 300');
        assert.equal(errors[9].err.message, 'message.previewHeight (for image) should be an integer, >= 1, <= 300');
    })

    it('decode: lifecycle of on_error', async function() {
        var [normalText, normalTextEnc] = createTextMsg('Привет');
        normalText.type = 'text'; // for comparison
        var messages = [
            normalTextEnc,
            encode(alice.memo, bob.memo_pub, {}),
        ];

        // no on_error
        var res = decode(bob.memo, alice.memo_pub, messages);
        assert.equal(res.length, 2);
        assert.deepStrictEqual(res[0].message, normalText)
        assert.notEqual(res[1].raw_message, null)
        assert.equal(res[1].message, null)

        // on_error without return
        var res2 = decode(bob.memo, alice.memo_pub, messages, undefined, undefined,
            (msg, i, ex) => {
                assert.deepStrictEqual(msg, messages[1]);
                assert.equal(i, 1);
                assert.equal(ex.message, 'message.body should be a string');
            });
        assert.deepStrictEqual(res2, res);

        // on_error with return false
        var res3 = decode(bob.memo, alice.memo_pub, messages, undefined, undefined,
            (msg, i, ex) => {
                return false;
            });
        assert.deepStrictEqual(res3, res);

        // on_error with return true
        var res4 = decode(bob.memo, alice.memo_pub, messages, undefined, undefined,
            (msg, i, ex) => {
                return true;
            });
        assert.equal(res4.length, 1);
        assert.deepStrictEqual(res4[0].message, normalText);
    })

    it('decode: lifecycle of for_each', async function() {
        // no for_each
        var res = decode(bob.memo, alice.memo_pub, this.msgObjs);
        assert.equal(res.length, 4);
        assert.deepStrictEqual(res[0].message, this.msgs[0]);
        assert.deepStrictEqual(res[1].message, this.msgs[1]);
        assert.equal(res[2].raw_message, null);
        assert.equal(res[3].raw_message, '{}');

        // for_each without return
        var res2m = [];
        var res2 = decode(bob.memo, alice.memo_pub, this.msgObjs, undefined,
            (msg, i) => {
                res2m[i] = Object.assign({}, msg);
            });
        assert.equal(res2m.length , res2.length);
        assert.deepStrictEqual(res2m, res2);
        assert.deepStrictEqual(res2, res);

        // for_each with return false
        var res2m = [];
        var res2 = decode(bob.memo, alice.memo_pub, this.msgObjs, undefined,
            (msg, i) => {
                res2m[i] = Object.assign({}, msg);
                return false;
            });
        assert.equal(res2m.length, res2.length);
        assert.deepStrictEqual(res2m, res2);
        assert.deepStrictEqual(res2, res);

        // for_each with return true
        var res2m = {};
        var res2 = decode(bob.memo, alice.memo_pub, this.msgObjs, undefined,
            (msg, i) => {
                if (i % 2 != 0) return true;
                res2m[i] = Object.assign({}, msg);
            });
        assert.equal(Object.entries(res2m).length, 2);
        assert.equal(Object.entries(res2m).length, res2.length);
        assert.deepStrictEqual(res2m[0], res2[0]);
        assert.deepStrictEqual(res2m[2], res2[1]);
    })

    it('decode: lifecycle of for_each + on_error', async function() {
        // for_each shouldn't be called if error occured and on_error specified
        var res2m = {};
        var res2e = {};
        var res2 = decode(bob.memo, alice.memo_pub, this.msgObjs, undefined,
            (msg, i) => {
                res2m[i] = Object.assign({}, msg);
                return false;
            }, (msg, i, exception) => {
                res2e[i] = Object.assign({}, msg);
            });
        assert.equal(res2.length, this.msgObjs.length);
        assert.equal(Object.entries(res2m).length, 2);
        assert.deepStrictEqual(res2m[0].message, this.msgs[0]);
        assert.deepStrictEqual(res2m[1].message, this.msgs[1]);
        assert.equal(Object.entries(res2e).length, 2);
        assert.deepStrictEqual(res2e[2].raw_message, null);
        assert.deepStrictEqual(res2e[3].raw_message, '{}');

        // if for_each throws, on_error should call,
        // and pushing element to result depends on on_error call
        var res2e = [];
        var errors = [];
        var res2 = decode(bob.memo, alice.memo_pub, this.msgObjs, undefined,
            (msg, i) => {
                throw new Error('for_each fail');
            }, (msg, i, exception) => {
                errors.push({i, exception});
                res2e[i] = Object.assign({}, msg);
            });
        assert.equal(res2e.length, this.msgObjs.length);
        assert.deepStrictEqual(res2e, res2);
    })

    it('decode: before_decode', async function() {
        // no before_decode
        var res = decode(bob.memo, alice.memo_pub, this.msgObjs);

        // for next comparisons
        for (let msg of res)
            msg.field = 'test';

        // before_decode with no return
        var res2 = decode(bob.memo, alice.memo_pub, this.msgObjs, 
            (msg, i, results) => {
                msg.field = 'test';
            });

        assert.deepStrictEqual(res2, res);

        // before_decode with return false
        var res3 = decode(bob.memo, alice.memo_pub, this.msgObjs, 
            (msg, i, results) => {
                msg.field = 'test';
                return false;
            });

        assert.deepStrictEqual(res3, res);

        // before_decode with return true (canceling mode)
        // + test params
        var res4idx = [];
        var res4 = decode(bob.memo, alice.memo_pub, this.msgObjs, 
            (msg, i, results) => {
                msg.field = 'test';
                res4idx[i] = msg;
                return i % 2 != 0;
            });

        assert.equal(res4.length, 2);
        assert.deepStrictEqual(res4[0], res3[0]);
        assert.deepStrictEqual(res4[1], res3[2]);
        assert.deepStrictEqual(res4idx, res3);
        assert.deepStrictEqual(res4idx, res); // check field
    })

    it('decode: before_decode + on_error', async function() {
        // before_decode without on_error
        var res = decode(bob.memo, alice.memo_pub, this.msgObjs, 
            (msg, i, results) => {
                throw new Error('before_decode fail');
            });
        assert.equal(res.length, 4);
        for (let i = 0; i < res.length; ++i) {
            assert.equal(res[i].raw_message, null);
            assert.equal(res[i].message, null);
        }
    })

    it('decode: ordering + slicing', async function() {
        // default case
        var res = decode(bob.memo, alice.memo_pub, this.msgObjs);

        // reversed order case
        var resRev = decode(bob.memo, alice.memo_pub, this.msgObjs,
            undefined, undefined, undefined, this.msgObjs.length - 1, -1);

        assert.deepStrictEqual([...resRev].reverse(), res);

        // slicing
        var resSl = decode(bob.memo, alice.memo_pub, this.msgObjs,
            undefined, undefined, undefined, this.msgObjs.length - 2, 0);

        assert.equal(resSl.length, 2);
        assert.deepStrictEqual(resSl[0], resRev[1]);
        assert.deepStrictEqual(resSl[1], resRev[2]);

        // slicing: begin_idx only
        var resSl = decode(bob.memo, alice.memo_pub, this.msgObjs,
            undefined, undefined, undefined, 2);
        assert.equal(resSl.length, 2);
        assert.deepStrictEqual(resSl[0], res[2]);
        assert.deepStrictEqual(resSl[1], res[3]);
    })
})
