var assert = require('assert');
import chai from 'chai';
import sinon from 'sinon';
import { mockHTMLImageElement } from './mock_image';

global.sandbox = sinon.sandbox.create();

sinon.assert.expose(chai.assert, {prefix: ''});

beforeEach(function() {
    mockHTMLImageElement();
});

afterEach(function() {
    global.sandbox.restore();
});

module.exports = {
            
    error(message_substring, f){
        var fail = false;
        try {
            f();
            fail = true;
        } catch (e) {
            if (e.toString().indexOf(message_substring) === -1) {
                throw new Error("expecting " + message_substring);
            }
        }
        if (fail) {
            throw new Error("expecting " + message_substring);
        }
    },

    clockSpeed(fakeMsecs, realMsecs) {
        var clock;
        setInterval(() => { clock.tick(fakeMsecs); }, realMsecs);
        clock = sandbox.useFakeTimers();
    }
}
