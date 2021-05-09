import { assert } from 'chai';
import { makeDatedGroups } from '../src/auth/messages';
import th from './test_helper';

const time_point_min = '1970-01-01T00:00:00';

let messages = [];
let nonce = 0;
function clear() {
    messages = [];
    nonce = 0;
}
function add(create_date, cond) {
    create_date = '2021-01-01T' + create_date;
    messages.push({create_date, cond, nonce: ++nonce});
}
function unprefix(group) {
    const { start_date, stop_date } = group;
    if (start_date !== time_point_min) group.start_date = start_date.split('T')[1];
    if (stop_date !== time_point_min) group.stop_date = stop_date.split('T')[1];
    return group;
}

describe('golos.messages_groups: makeDatedGroups()', function() {

    beforeEach(function() {
        this.condition = (msg) => {
            return msg.cond;
        };
        this.wrapper = (group) => {
            return unprefix(group);
        };
        clear();
    })

    it('input arguments', function() {
        assert.throws(() => makeDatedGroups(), 'message_objects is required');
        assert.throws(() => makeDatedGroups([]), 'condition is required');
        assert.throws(() => makeDatedGroups([], () => {}), 'wrapper is required');
    })

    it('empty messages', function() {
        var res = makeDatedGroups(messages, this.condition, this.wrapper);

        assert.deepStrictEqual(res, []);
    })

    it('no matching messages', function() {
        add('00:00:03', false);
        add('00:00:02', false);
        add('00:00:01', false);

        var res = makeDatedGroups(messages, this.condition, this.wrapper);

        assert.deepStrictEqual(res, []);
    })

    it('single match', function() {
        add('00:00:03', false);
        add('00:00:02', true);
        add('00:00:01', false);

        var res = makeDatedGroups(messages, this.condition, this.wrapper);

        assert.deepStrictEqual(res, [
            {nonce: 2, start_date: time_point_min, stop_date: time_point_min},
        ]);
    })

    it('sequenced matches', function() {
        add('00:00:05', false);
        add('00:00:04', true);
        add('00:00:04', true);
        add('00:00:03', false);
        add('00:00:02', true);
        add('00:00:02', true);
        add('00:00:01', false);

        var res = makeDatedGroups(messages, this.condition, this.wrapper);

        assert.deepStrictEqual(res, [
            {nonce: 0, start_date: '00:00:03', stop_date: '00:00:04'},
            {nonce: 0, start_date: '00:00:01', stop_date: '00:00:02'},
        ]);
    })

    it('sequenced matches at start', function() {
        add('00:00:04', true);
        add('00:00:04', true);
        add('00:00:03', false);
        add('00:00:02', true);
        add('00:00:01', false);

        var res = makeDatedGroups(messages, this.condition, this.wrapper);

        assert.deepStrictEqual(res, [
            {nonce: 0, start_date: '00:00:03', stop_date: '00:00:04'},
            {nonce: 4, start_date: time_point_min, stop_date: time_point_min},
        ]);
    })

    it('sequenced matches at end', function() {
        add('00:00:05', false);
        add('00:00:04', true);
        add('00:00:03', false);
        add('00:00:02', true);
        add('00:00:02', true);

        var res = makeDatedGroups(messages, this.condition, this.wrapper);

        assert.deepStrictEqual(res, [
            {nonce: 2, start_date: time_point_min, stop_date: time_point_min},
            {nonce: 0, start_date: '00:00:01', stop_date: '00:00:02'},
        ]);
    })

    it('single match at start', function() {
        add('00:00:04', true);
        add('00:00:03', false);
        add('00:00:02', true);
        add('00:00:01', false);

        var res = makeDatedGroups(messages, this.condition, this.wrapper);

        assert.deepStrictEqual(res, [
            {nonce: 1, start_date: time_point_min, stop_date: time_point_min},
            {nonce: 3, start_date: time_point_min, stop_date: time_point_min},
        ]);
    })

    it('single match at end', function() {
        add('00:00:05', false);
        add('00:00:04', true);
        add('00:00:03', false);
        add('00:00:02', true);

        var res = makeDatedGroups(messages, this.condition, this.wrapper);

        assert.deepStrictEqual(res, [
            {nonce: 2, start_date: time_point_min, stop_date: time_point_min},
            {nonce: 4, start_date: time_point_min, stop_date: time_point_min},
        ]);
    })

    it('duplicating date at sequence start', function() {
        add('00:00:05', false);
        add('00:00:04', false);
        add('00:00:04', true);
        add('00:00:04', true);
        add('00:00:03', true);
        add('00:00:02', true);
        add('00:00:01', false);

        var res = makeDatedGroups(messages, this.condition, this.wrapper);

        assert.deepStrictEqual(res, [
            {nonce: 3, start_date: time_point_min, stop_date: time_point_min},
            {nonce: 4, start_date: time_point_min, stop_date: time_point_min},
            {nonce: 0, start_date: '00:00:01', stop_date: '00:00:03'},
        ]);
    })

    it('duplicating date at sequence end', function() {
        add('00:00:05', false);
        add('00:00:04', true);
        add('00:00:03', true);
        add('00:00:02', true);
        add('00:00:02', true);
        add('00:00:02', false);
        add('00:00:01', false);

        var res = makeDatedGroups(messages, this.condition, this.wrapper);

        assert.deepStrictEqual(res, [
            {nonce: 0, start_date: '00:00:02', stop_date: '00:00:04'},
            {nonce: 4, start_date: time_point_min, stop_date: time_point_min},
            {nonce: 5, start_date: time_point_min, stop_date: time_point_min},
        ]);
    })

    it('duplicating date at sequence start and end', function() {
        add('00:00:06', false);
        add('00:00:05', false);
        add('00:00:05', true);
        add('00:00:05', true);
        add('00:00:04', true);
        add('00:00:04', true);
        add('00:00:04', true);
        add('00:00:03', true);
        add('00:00:02', true);
        add('00:00:02', true);
        add('00:00:02', false);
        add('00:00:01', false);

        var res = makeDatedGroups(messages, this.condition, this.wrapper);

        assert.deepStrictEqual(res, [
            {nonce: 3, start_date: time_point_min, stop_date: time_point_min},
            {nonce: 4, start_date: time_point_min, stop_date: time_point_min},
            {nonce: 0, start_date: '00:00:02', stop_date: '00:00:04'},
            {nonce: 9, start_date: time_point_min, stop_date: time_point_min},
            {nonce: 10, start_date: time_point_min, stop_date: time_point_min},
        ]);
    })

    it('mixed case', function() {
        add('00:00:05', true);
        add('00:00:05', true);
        add('00:00:04', true);
        add('00:00:04', false);
        add('00:00:04', true);
        add('00:00:03', true);
        add('00:00:02', true);
        add('00:00:02', true);

        var res = makeDatedGroups(messages, this.condition, this.wrapper);

        assert.deepStrictEqual(res, [
            {nonce: 0, start_date: '00:00:04', stop_date: '00:00:05'},
            {nonce: 3, start_date: time_point_min, stop_date: time_point_min},
            {nonce: 5, start_date: time_point_min, stop_date: time_point_min},
            {nonce: 0, start_date: '00:00:01', stop_date: '00:00:03'},
        ]);
    })

    it('null condition', function() {
        add('00:00:03', false);
        add('00:00:02', null);
        add('00:00:02', true);
        add('00:00:02', null);
        add('00:00:02', true);
        add('00:00:01', false);

        var res = makeDatedGroups(messages, this.condition, this.wrapper);

        assert.deepStrictEqual(res, [
            {nonce: 0, start_date: '00:00:01', stop_date: '00:00:02'},
        ]);

        clear();
        add('00:00:03', false);
        add('00:00:02', true);
        add('00:00:02', null);
        add('00:00:02', true);
        add('00:00:02', null);
        add('00:00:01', false);

        var res = makeDatedGroups(messages, this.condition, this.wrapper);

        assert.deepStrictEqual(res, [
            {nonce: 0, start_date: '00:00:01', stop_date: '00:00:02'},
        ]);
    })
})

describe('golos.messages_groups: applyDatedGroup()', function() {
})
