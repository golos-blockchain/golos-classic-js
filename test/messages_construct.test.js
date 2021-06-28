import { assert } from 'chai';
import { newTextMsg, newImageMsg, newImageMsgAsync, makeQuoteMsg,
    DEFAULT_APP, DEFAULT_VERSION, MAX_TEXT_QUOTE_LENGTH, MAX_IMAGE_QUOTE_LENGTH } from '../src/auth/messages';
import th from './test_helper';
import { unmockHTMLImageElement, correctImageURL } from './mock_image';

describe('golos.messages_construct: newTextMsg()', function() {
    it('defaults', function() {
        assert.strictEqual(DEFAULT_APP, 'golos-messenger');
        assert.strictEqual(DEFAULT_VERSION, 1);
    })

    it('normal case', function() {
        var msg = newTextMsg('Сообщение message');
        assert.equal(msg.body, 'Сообщение message');
        assert.deepStrictEqual([msg.app, msg.version], [DEFAULT_APP, DEFAULT_VERSION]);
    })

    it('call without args', function() {
        assert.throws(() => newTextMsg(), 'message.body should be a string');
    })

    it('empty body', function() {
        var msg = newTextMsg('');
        assert.strictEqual(msg.body, '');
        assert.deepStrictEqual([msg.app, msg.version], [DEFAULT_APP, DEFAULT_VERSION]);
    })

    it('custom app', function() {
        var msg = newTextMsg('Сообщение', 'new-messenger');
        assert.equal(msg.body, 'Сообщение');
        assert.deepStrictEqual([msg.app, msg.version], ['new-messenger', DEFAULT_VERSION]);
    })

    it('custom version', function() {
        var msg = newTextMsg('Сообщение', 'new-messenger', 2);
        assert.equal(msg.body, 'Сообщение');
        assert.deepStrictEqual([msg.app, msg.version], ['new-messenger', 2]);
    })

    it('wrong app', function() {
        assert.throws(() => newTextMsg('Сообщение', null), 'message.app should be a string, >= 1, <= 16');
        assert.throws(() => newTextMsg('Сообщение', null), 'message.app should be a string, >= 1, <= 16')
        assert.throws(() => newTextMsg('Сообщение', 1), 'message.app should be a string, >= 1, <= 16')
        assert.throws(() => newTextMsg('Сообщение', ''), 'message.app should be a string, >= 1, <= 16')
        assert.throws(() => newTextMsg('Сообщение', '12345678901234567'), 'message.app should be a string, >= 1, <= 16')
    })

    it('wrong version', function() {
        assert.throws(() => newTextMsg('Сообщение', 'РусскаяМатрешка', null), 'message.version should be an integer, >= 1')
        assert.throws(() => newTextMsg('Сообщение', 'РусскаяМатрешка', NaN), 'message.version should be an integer, >= 1')
        assert.throws(() => newTextMsg('Сообщение', 'РусскаяМатрешка', 1.2), 'message.version should be an integer, >= 1')
        assert.throws(() => newTextMsg('Сообщение', 'РусскаяМатрешка', '1.2'), 'message.version should be an integer, >= 1')
        assert.throws(() => newTextMsg('Сообщение', 'РусскаяМатрешка', -1), 'message.version should be an integer, >= 1')
        assert.throws(() => newTextMsg('Сообщение', 'РусскаяМатрешка', 0), 'message.version should be an integer, >= 1')
    })
})

describe('golos.messages_construct: newImageMsg()', function() {
    it('no HTMLImageElement in nodejs (no on_progress)', function(done) {
        unmockHTMLImageElement();

        newImageMsg(null, (err, msg) => {
            try {
                assert.isNull(msg);
                assert.isNotNull(err);
                assert.equal(err.message, 'Current environment does not support Image()');
                done();
            } catch (err) {
                done(err);
            }
        });
    })

    it('no HTMLImageElement in nodejs', function(done) {
        unmockHTMLImageElement();

        var on_progress = sandbox.spy();
        newImageMsg(null, (err, msg) => {
            try {
                assert.equal(err.message, 'Current environment does not support Image()');

                on_progress = on_progress.getCalls();
                assert.lengthOf(on_progress, 1);
                assert.calledWith(on_progress[0], 100, { error: err });
                done();
            } catch (err) {
                done(err);
            }
        }, (progress, data) => {
            on_progress(progress, data);
        });
    })

    it('no callback', function() {
        var on_progress = sandbox.spy();
        var msg;
        try {
            msg = newImageMsg('https://url.com/url', undefined, on_progress);
        } catch (err) {
            assert.equal(err.message, 'callback is required');

            on_progress = on_progress.getCalls();
            assert.lengthOf(on_progress, 1);
            assert.calledWith(on_progress[0], 100, { error: err });
        }
        if (msg) assert.fail();
    })

    it('no image_url', function(done) {
        var on_progress = sandbox.spy();
        newImageMsg(null, (err, msg) => {
            try {
                assert.equal(err.message, 'image_url is required');

                on_progress = on_progress.getCalls();
                assert.lengthOf(on_progress, 1);
                assert.calledWith(on_progress[0], 100, { error: err });

                done();
            } catch (err) {
                done(err);
            }
        }, (progress, data) => {
            on_progress(progress, data);
        });
    })

    it('wrong app', function(done) {
        var url = correctImageURL;

        var on_progress = sandbox.spy();
        newImageMsg(url, (err, msg) => {
            try {
                assert.isNull(msg);
                assert.isNotNull(err);
                assert.equal(err.message, 'message.app should be a string, >= 1, <= 16');

                on_progress = on_progress.getCalls();
                assert.lengthOf(on_progress, 1);
                assert.calledWith(on_progress[0], 100, { error: err });

                done();
            } catch (err) {
                done(err);
            }
        }, (progress, data) => {
            on_progress(progress, data);
        }, 123);
    })

    it('wrong version', function(done) {
        var url = correctImageURL;

        var on_progress = sandbox.spy();
        newImageMsg(url, (err, msg) => {
            try {
                assert.isNull(msg);
                assert.isNotNull(err);
                assert.equal(err.message, 'message.version should be an integer, >= 1');

                on_progress = on_progress.getCalls();
                assert.lengthOf(on_progress, 1);
                assert.calledWith(on_progress[0], 100, { error: err });

                done();
            } catch (err) {
                done(err);
            }
        }, (progress, data) => {
            on_progress(progress, data);
        }, DEFAULT_APP, '1.0');
    })

    it('normal case (no on_progress)', function(done) {
        var url = correctImageURL;

        newImageMsg(url, (err, msg) => {
            try {
                assert.isNotNull(msg);
                assert.equal(msg.body, url);
                assert.equal(msg.type, 'image');
                assert.strictEqual(msg.previewWidth, Image.mockedWidth);
                assert.strictEqual(msg.previewHeight, Image.mockedHeight);
                assert.deepStrictEqual([msg.app, msg.version], [DEFAULT_APP, DEFAULT_VERSION]);
                assert.isNull(err);

                done();
            } catch (err) {
                done(err);
            }
        });
    })

    it('normal case', function(done) {
        var url = correctImageURL;

        var on_progress = sandbox.spy();
        newImageMsg(url, (err, msg) => {
            try {
                assert.isNotNull(msg);
                assert.equal(msg.body, url);
                assert.equal(msg.type, 'image');
                assert.strictEqual(msg.previewWidth, Image.mockedWidth);
                assert.strictEqual(msg.previewHeight, Image.mockedHeight);
                assert.deepStrictEqual([msg.app, msg.version], [DEFAULT_APP, DEFAULT_VERSION]);
                assert.isNull(err);

                on_progress = on_progress.getCalls();
                assert.lengthOf(on_progress, 2);
                assert.calledWith(on_progress[0], 0, { error: null });
                assert.calledWith(on_progress[1], 100, { error: null });

                done();
            } catch (err) {
                done(err);
            }
        }, (progress, data) => {
            on_progress(progress, data);
        });
    })

    it('wrong url (no on_progress)', function(done) {
        var url = 'http://wrong-url';

        newImageMsg(url, (err, msg) => {
            try {
                assert.isNull(msg);
                assert.isNotNull(err);
                assert.equal(err.message, 'Cannot load image');

                done();
            } catch (err) {
                done(err);
            }
        });
    })

    it('wrong url', function(done) {
        var url = 'http://wrong-url';

        var on_progress = sandbox.spy();
        newImageMsg(url, (err, msg) => {
            try {
                assert.isNull(msg);
                assert.isNotNull(err);
                assert.equal(err.message, 'Cannot load image');

                on_progress = on_progress.getCalls();
                assert.lengthOf(on_progress, 2);
                assert.calledWith(on_progress[0], 0, { error: null });
                assert.calledWith(on_progress[1], 100, { error: err });

                done();
            } catch (err) {
                done(err);
            }
        }, (progress, data) => {
            on_progress(progress, data);
        });
    })

    it('aborting (no on_progress)', function(done) {
        var url = 'http://wrong-url';
        global.Image.abortOnFail = true;

        newImageMsg(url, (err, msg) => {
            try {
                assert.isNull(msg);
                assert.isNotNull(err);
                assert.equal(err.message, 'Cannot load image');

                done();
            } catch (err) {
                done(err);
            }
        });
    })

    it('timeouting (no on_progress)', function(done) {
        var url = 'http://wrong-url';
        global.Image.timeouting = true;

        th.clockSpeed(5000, 100);

        newImageMsg(url, (err, msg) => {
            try {
                assert.isNull(msg);
                assert.isNotNull(err);
                assert.equal(err.message, 'Image load timed out, maybe it is too large');

                done();
            } catch (err) {
                done(err);
            }
        });
    })
})

describe('golos.messages_construct: newImageMsgAsync()', function() {
    it('no HTMLImageElement in nodejs', async function() {
        unmockHTMLImageElement();

        var on_progress = sandbox.spy();
        var msg;
        try {
            msg = await newImageMsgAsync(null, (progress, data) => {
                on_progress(progress, data);
            });
        } catch (err) {
            assert.equal(err.message, 'Current environment does not support Image()');

            on_progress = on_progress.getCalls();
            assert.lengthOf(on_progress, 1);
            assert.calledWith(on_progress[0], 100, { error: err });
        }
        if (msg) assert.fail();
    })

    it('wrong app', async function() {
        var url = correctImageURL;

        var msg;
        var on_progress = sandbox.spy();
        try {
            msg = await newImageMsgAsync(url, (progress, data) => {
                on_progress(progress, data);
            }, 123);
        } catch (err) {
            assert.equal(err.message, 'message.app should be a string, >= 1, <= 16');

            on_progress = on_progress.getCalls();
            assert.lengthOf(on_progress, 1);
            assert.calledWith(on_progress[0], 100, { error: err });
        }
        if (msg) assert.fail();
    })

    it('wrong version', async function() {
        var url = correctImageURL;

        var msg;
        var on_progress = sandbox.spy();
        try {
            msg = await newImageMsgAsync(url, (progress, data) => {
                on_progress(progress, data);
            }, DEFAULT_APP, '1.0');
        } catch (err) {
            assert.equal(err.message, 'message.version should be an integer, >= 1');

            on_progress = on_progress.getCalls();
            assert.lengthOf(on_progress, 1);
            assert.calledWith(on_progress[0], 100, { error: err });
        }
        if (msg) assert.fail();
    })

    it('no on_progress case', async function() {
        var url = correctImageURL;

        var msg = await newImageMsgAsync(url);
        assert.isNotNull(msg);
        assert.equal(msg.body, url);
        assert.equal(msg.type, 'image');
        assert.strictEqual(msg.previewWidth, Image.mockedWidth);
        assert.strictEqual(msg.previewHeight, Image.mockedHeight);
        assert.deepStrictEqual([msg.app, msg.version], [DEFAULT_APP, DEFAULT_VERSION]);
    })

    it('normal case', async function() {
        var url = correctImageURL;

        var on_progress = sandbox.spy();
        var msg = await newImageMsgAsync(url, (progress, data) => {
            on_progress(progress, data);
        });
        assert.isNotNull(msg);
        assert.equal(msg.body, url);
        assert.equal(msg.type, 'image');
        assert.strictEqual(msg.previewWidth, Image.mockedWidth);
        assert.strictEqual(msg.previewHeight, Image.mockedHeight);
        assert.deepStrictEqual([msg.app, msg.version], [DEFAULT_APP, DEFAULT_VERSION]);

        on_progress = on_progress.getCalls();
        assert.lengthOf(on_progress, 2);
        assert.calledWith(on_progress[0], 0, { error: null });
        assert.calledWith(on_progress[1], 100, { error: null });
    })

    it('wrong url', async function() {
        var url = 'http://wrong-url';

        var msg;
        var on_progress = sandbox.spy();
        try {
            msg = await newImageMsgAsync(url, (progress, data) => {
                on_progress(progress, data);
            });
        } catch (err) {
            on_progress = on_progress.getCalls();
            assert.lengthOf(on_progress, 2);
            assert.calledWith(on_progress[0], 0, { error: null });
            assert.equal(on_progress[1].args[0], 100);
            assert.equal(on_progress[1].args[1].error.message, err.message);
        }
        if (msg) assert.fail();
    })
})

describe('golos.messages_construct: makeQuoteMsg()', function() {
    it('quote for null message', function() {
        assert.throws(() => makeQuoteMsg(), 'quoted_message_object is required');
    });

    it('quote for message, but not message_object from golos.messages.decode', function() {
        const orig = newTextMsg('How do you do?');
        let quote = newTextMsg('All right!');
        assert.throws(() => makeQuoteMsg(quote, orig), 'quoted_message_object should be one of VALID objects, returned by `golos.messages.decode`, and have "from" field');
    });

    it('normal case, short text message', function() {
        const orig = {
            from: 'danlarimer',
            nonce: '123',
            message: newTextMsg('a'.repeat(MAX_TEXT_QUOTE_LENGTH)),
        };
        let msg = newTextMsg('All right!');

        let msgCopy = Object.assign({}, msg);
        let msgRes = makeQuoteMsg(msgCopy, orig);
        assert.isNotNull(msgRes);
        assert.isNotNull(msgRes.quote);
        assert.strictEqual(msgRes.quote.from, orig.from);
        assert.strictEqual(msgRes.quote.nonce, orig.nonce);
        assert.strictEqual(msgRes.quote.type, orig.message.type);
        assert.strictEqual(msgRes.quote.body, orig.message.body);

        assert.deepStrictEqual(msgRes, msgCopy);
        assert.strictEqual(msg.quote, undefined);
    });

    it('long text message', function() {
        const orig = {
            from: 'danlarimer',
            nonce: '123',
            message: newTextMsg('a'.repeat(MAX_TEXT_QUOTE_LENGTH + 1)),
        };
        let msg = newTextMsg('All right!');

        let msgRes = makeQuoteMsg(msg, orig);
        assert.isNotNull(msgRes);
        assert.isNotNull(msgRes.quote);
        assert.strictEqual(msgRes.quote.from, orig.from);
        assert.strictEqual(msgRes.quote.nonce, orig.nonce);
        assert.strictEqual(msgRes.quote.type, orig.message.type);
        assert.strictEqual(msgRes.quote.body, orig.message.body.substring(0, MAX_TEXT_QUOTE_LENGTH - 3) + '...');
    });

    it('image message', async function() {
        assert.isTrue(correctImageURL.length > MAX_TEXT_QUOTE_LENGTH, 'too short correctImageURL for this test');

        const orig = {
            from: 'danlarimer',
            nonce: '123',
            message: await newImageMsgAsync(correctImageURL)
        };
        let msg = newTextMsg('All right!');

        let msgRes = makeQuoteMsg(msg, orig);
        assert.isNotNull(msgRes);
        assert.isNotNull(msgRes.quote);
        assert.strictEqual(msgRes.quote.from, orig.from);
        assert.strictEqual(msgRes.quote.nonce, orig.nonce);
        assert.strictEqual(msgRes.quote.type, orig.message.type);
        assert.strictEqual(msgRes.quote.body, orig.message.body);
    });

    it('quote-first approach (null msg)', function() {
        const orig = {
            from: 'danlarimer',
            nonce: '123',
            message: newTextMsg('Hi!'),
        };

        let msgRes = makeQuoteMsg(null, orig);
        assert.isNotNull(msgRes);
        assert.isNotNull(msgRes.quote);
        assert.strictEqual(msgRes.quote.from, orig.from);
        assert.strictEqual(msgRes.quote.nonce, orig.nonce);
        assert.strictEqual(msgRes.quote.type, orig.message.type);
        assert.strictEqual(msgRes.quote.body, orig.message.body);
    });

    it('quote-first approach (empty-object msg)', function() {
        const orig = {
            from: 'danlarimer',
            nonce: '123',
            message: newTextMsg('Hi!'),
        };

        let msgRes = makeQuoteMsg({}, orig);
        assert.isNotNull(msgRes);
        assert.isNotNull(msgRes.quote);
        assert.strictEqual(msgRes.quote.from, orig.from);
        assert.strictEqual(msgRes.quote.nonce, orig.nonce);
        assert.strictEqual(msgRes.quote.type, orig.message.type);
        assert.strictEqual(msgRes.quote.body, orig.message.body);
    });
})
