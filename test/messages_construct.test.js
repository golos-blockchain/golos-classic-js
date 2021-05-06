import assert from 'assert';
import { newTextMsg, newImageMsg, newImageMsgAsync,
    DEFAULT_APP, DEFAULT_VERSION } from '../src/auth/messages';
var th = require('./test_helper');
import { unmockHTMLImageElement, correctImageURL } from './mock_image';

describe('golos.messages_construct', function() {
    it('defaults', function() {
        assert.equal(DEFAULT_APP, 'golos-messenger');
        assert.equal(DEFAULT_VERSION, 1);
    })

    it('newTextMsg', function() {
        var msg = newTextMsg('Сообщение message');
        assert.equal(msg.body, 'Сообщение message');
        assert.deepStrictEqual([msg.app, msg.version], [DEFAULT_APP, DEFAULT_VERSION]);

        th.errorEquals(() => newTextMsg(), 'message.body should be a string');

        var msg = newTextMsg('');
        assert.equal(msg.body, '');
        assert.deepStrictEqual([msg.app, msg.version], [DEFAULT_APP, DEFAULT_VERSION]);

        var msg = newTextMsg('Сообщение', 'new-messenger');
        assert.equal(msg.body, 'Сообщение');
        assert.deepStrictEqual([msg.app, msg.version], ['new-messenger', DEFAULT_VERSION]);

        var msg = newTextMsg('Сообщение', 'new-messenger', 2);
        assert.equal(msg.body, 'Сообщение');
        assert.deepStrictEqual([msg.app, msg.version], ['new-messenger', 2]);

        th.errorEquals(() => newTextMsg('Сообщение', null), 'message.app should be a string, >= 1, <= 16')
        th.errorEquals(() => newTextMsg('Сообщение', 1), 'message.app should be a string, >= 1, <= 16')
        th.errorEquals(() => newTextMsg('Сообщение', ''), 'message.app should be a string, >= 1, <= 16')
        th.errorEquals(() => newTextMsg('Сообщение', '12345678901234567'), 'message.app should be a string, >= 1, <= 16')

        th.errorEquals(() => newTextMsg('Сообщение', 'РусскаяМатрешка', null), 'message.version should be an integer, >= 1')
        th.errorEquals(() => newTextMsg('Сообщение', 'РусскаяМатрешка', NaN), 'message.version should be an integer, >= 1')
        th.errorEquals(() => newTextMsg('Сообщение', 'РусскаяМатрешка', 1.2), 'message.version should be an integer, >= 1')
        th.errorEquals(() => newTextMsg('Сообщение', 'РусскаяМатрешка', '1.2'), 'message.version should be an integer, >= 1')
        th.errorEquals(() => newTextMsg('Сообщение', 'РусскаяМатрешка', -1), 'message.version should be an integer, >= 1')
        th.errorEquals(() => newTextMsg('Сообщение', 'РусскаяМатрешка', 0), 'message.version should be an integer, >= 1')
    });

    it('newImageMsg: no HTMLImageElement in nodejs', function(done) {
        unmockHTMLImageElement();

        newImageMsg(null, (err, msg) => {
            assert.equal(msg, null);
            assert.notEqual(err, null);
            assert.equal(err.message, 'Current environment does not support Image()');
        });
        var prog = [];
        newImageMsg(null, (err, msg) => {
            assert.equal(err.message, 'Current environment does not support Image()');
            assert.equal(prog.length, 1);
            assert.equal(prog[0][0], 100);
            assert.equal(prog[0][1].error, err);
            done();
        }, (progress, data) => {
            prog.push([progress, data]);
        });
    })

    it('newImageMsg: no callback', function() {
        var prog = [];
        newImageMsg('https://url.com/url', (err, msg) => {
            assert.equal(err.message, 'callback is required');

            assert.equal(prog.length, 1);
            assert.equal(prog[0][0], 100);
            assert.equal(prog[0][1].error, err);
            done();
        }, (progress, data) => {
            prog.push([progress, data]);
        });
    })

    it('newImageMsg: no image_url', function(done) {
        var prog = [];
        newImageMsg(null, (err, msg) => {
            assert.equal(err.message, 'image_url is required');

            assert.equal(prog.length, 1);
            assert.equal(prog[0][0], 100);
            assert.equal(prog[0][1].error, err);
            done();
        }, (progress, data) => {
            prog.push([progress, data]);
        });
    })

    it('newImageMsg: success', function(done) {
        var url = correctImageURL;

        var prog = [];
        newImageMsg(url, (err, msg) => {
            assert.notEqual(msg, null);
            assert.equal(msg.body, url);
            assert.equal(msg.type, 'image');
            assert.equal(msg.previewWidth, Image.mockedWidth);
            assert.equal(msg.previewHeight, Image.mockedHeight);
            assert.deepStrictEqual([msg.app, msg.version], [DEFAULT_APP, DEFAULT_VERSION]);
            assert.equal(err, null);

            assert.equal(prog.length, 2);
            assert.equal(prog[0][0], 0);
            assert.equal(prog[0][1].error, null);
            assert.equal(prog[1][0], 100);
            assert.equal(prog[1][1].error, null);
            done();
        }, (progress, data) => {
            prog.push([progress, data]);
        });
    })

    it('newImageMsg: wrong url', function(done) {
        var url = 'http://wrong-url';

        var prog = [];
        newImageMsg(url, (err, msg) => {
            assert.equal(msg, null);
            assert.notEqual(err, null);

            assert.equal(prog.length, 2);
            assert.equal(prog[0][0], 0);
            assert.equal(prog[0][1].error, null);
            assert.equal(prog[1][0], 100);
            assert.equal(prog[1][1].error, err);
            done();
        }, (progress, data) => {
            prog.push([progress, data]);
        });
    });

    it('newImageMsg: wrong message.app', function(done) {
        var url = correctImageURL;

        var prog = [];
        newImageMsg(url, (err, msg) => {
            try {
                assert.equal(msg, null);
                assert.notEqual(err, null);
                assert.equal(err.message, 'message.app should be a string, >= 1, <= 16');

                assert.equal(prog.length, 1);
                assert.equal(prog[0][0], 100);
                assert.equal(prog[0][1].error, err);

                done();
            } catch (err) {
                done(err);
            }
        }, (progress, data) => {
            prog.push([progress, data]);
        }, 123);
    });

    it('newImageMsg: wrong message.version', function(done) {
        var url = correctImageURL;

        var prog = [];
        newImageMsg(url, (err, msg) => {
            try {
                assert.equal(msg, null);
                assert.notEqual(err, null);
                assert.equal(err.message, 'message.version should be an integer, >= 1');

                assert.equal(prog.length, 1);
                assert.equal(prog[0][0], 100);
                assert.equal(prog[0][1].error, err);
                done();
            } catch (err) {
                done(err);
            }
        }, (progress, data) => {
            prog.push([progress, data]);
        }, DEFAULT_APP, '1.0');
    });

    it('newImageMsgAsync: no HTMLImageElement in nodejs', async function() {
        unmockHTMLImageElement();

        var msg;
        try {
            msg = await newImageMsgAsync(null);
        } catch (err) {
            assert.equal(err.message, 'Current environment does not support Image()');
        }
        if (msg) assert.fail();

        var prog = [];
        try {
            msg = await newImageMsgAsync(null, (progress, data) => {
                prog.push([progress, data]);
            });
        } catch (err) {
            assert.equal(err.message, 'Current environment does not support Image()');
            assert.equal(prog.length, 1);
            assert.equal(prog[0][0], 100);
            assert.equal(prog[0][1].error, err);
        }
        if (msg) assert.fail();
    })

    it('newImageMsgAsync: success', async function() {
        var url = correctImageURL;

        var prog = [];
        var msg = await newImageMsgAsync(url, (progress, data) => {
            prog.push([progress, data]);
        });
        assert.notEqual(msg, null);
        assert.equal(msg.body, url);
        assert.equal(msg.type, 'image');
        assert.equal(msg.previewWidth, Image.mockedWidth);
        assert.equal(msg.previewHeight, Image.mockedHeight);
        assert.deepStrictEqual([msg.app, msg.version], [DEFAULT_APP, DEFAULT_VERSION]);

        assert.equal(prog.length, 2);
        assert.equal(prog[0][0], 0);
        assert.equal(prog[0][1].error, null);
        assert.equal(prog[1][0], 100);
        assert.equal(prog[1][1].error, null);
    })

    it('newImageMsgAsync: wrong message.app', async function() {
        var url = correctImageURL;

        var msg;
        var prog = [];
        try {
            msg = await newImageMsgAsync(url, (progress, data) => {
                prog.push([progress, data]);
            }, 123);
        } catch (err) {
            assert.equal(err.message, 'message.app should be a string, >= 1, <= 16');

            assert.equal(prog.length, 1);
            assert.equal(prog[0][0], 100);
            assert.equal(prog[0][1].error, err);
        }
        if (msg) assert.fail();
    })

    it('newImageMsgAsync: wrong message.version', async function() {
        var url = correctImageURL;

        var msg;
        var prog = [];
        try {
            msg = await newImageMsgAsync(url, (progress, data) => {
                prog.push([progress, data]);
            }, DEFAULT_APP, '1.0');
        } catch (err) {
            assert.equal(err.message, 'message.version should be an integer, >= 1');

            assert.equal(prog.length, 1);
            assert.equal(prog[0][0], 100);
            assert.equal(prog[0][1].error, err);
        }
        if (msg) assert.fail();
    })
})
