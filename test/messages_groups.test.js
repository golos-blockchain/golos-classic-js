import assert from 'assert';
import { makeDatedGroups } from '../src/auth/messages';
var th = require('./test_helper');

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

describe('golos.messages_groups', function() {

    it('makeDatedGroups', function() {
        th.errorEquals(() => makeDatedGroups(), 'message_objects is required');
        th.errorEquals(() => makeDatedGroups([]), 'condition is required');
        th.errorEquals(() => makeDatedGroups([], () => {}), 'wrapper is required');
    })

    it('makeDatedGroups: main cases', function() {
        clear();
        add('00:00:01', false);
        add('00:00:02', false);

        var res = makeDatedGroups(messages, (msg) => {
            return msg.cond;
        }, (group) => {
            return unprefix(group);
        });

        assert.deepStrictEqual(res, []);

        clear();
        add('00:00:03', false);
        add('00:00:02', false);
        add('00:00:01', false);

        var res = makeDatedGroups(messages, (msg) => {
            return msg.cond;
        }, (group) => {
            return unprefix(group);
        });

        assert.deepStrictEqual(res, []);

        clear();
        add('00:00:03', false);
        add('00:00:02', true);
        add('00:00:01', false);

        var res = makeDatedGroups(messages, (msg) => {
            return msg.cond;
        }, (group) => {
            return unprefix(group);
        });

        assert.deepStrictEqual(res, [
            {nonce: 2, start_date: time_point_min, stop_date: time_point_min},
        ]);

        clear();
        add('00:00:05', false);
        add('00:00:04', true);
        add('00:00:04', true);
        add('00:00:03', false);
        add('00:00:02', true);
        add('00:00:02', true);
        add('00:00:01', false);

        var res = makeDatedGroups(messages, (msg) => {
            return msg.cond;
        }, (group) => {
            return unprefix(group);
        });

        assert.deepStrictEqual(res, [
            {nonce: 0, start_date: '00:00:03', stop_date: '00:00:04'},
            {nonce: 0, start_date: '00:00:01', stop_date: '00:00:02'},
        ]);
    })

    it('makeDatedGroups: start/end-border cases', function() {
        clear();
        add('00:00:04', true);
        add('00:00:04', true);
        add('00:00:03', false);
        add('00:00:02', true);
        add('00:00:01', false);

        var res = makeDatedGroups(messages, (msg) => {
            return msg.cond;
        }, (group) => {
            return unprefix(group);
        });

        assert.deepStrictEqual(res, [
            {nonce: 0, start_date: '00:00:03', stop_date: '00:00:04'},
            {nonce: 4, start_date: time_point_min, stop_date: time_point_min},
        ]);

        clear();
        add('00:00:05', false);
        add('00:00:04', true);
        add('00:00:03', false);
        add('00:00:02', true);
        add('00:00:02', true);

        var res = makeDatedGroups(messages, (msg) => {
            return msg.cond;
        }, (group) => {
            return unprefix(group);
        });

        assert.deepStrictEqual(res, [
            {nonce: 2, start_date: time_point_min, stop_date: time_point_min},
            {nonce: 0, start_date: '00:00:01', stop_date: '00:00:02'},
        ]);

        // same, but with singles nor ranges

        clear();
        add('00:00:04', true);
        add('00:00:03', false);
        add('00:00:02', true);
        add('00:00:01', false);

        var res = makeDatedGroups(messages, (msg) => {
            return msg.cond;
        }, (group) => {
            return unprefix(group);
        });

        assert.deepStrictEqual(res, [
            {nonce: 1, start_date: time_point_min, stop_date: time_point_min},
            {nonce: 3, start_date: time_point_min, stop_date: time_point_min},
        ]);

        clear();
        add('00:00:05', false);
        add('00:00:04', true);
        add('00:00:03', false);
        add('00:00:02', true);

        var res = makeDatedGroups(messages, (msg) => {
            return msg.cond;
        }, (group) => {
            return unprefix(group);
        });

        assert.deepStrictEqual(res, [
            {nonce: 2, start_date: time_point_min, stop_date: time_point_min},
            {nonce: 4, start_date: time_point_min, stop_date: time_point_min},
        ]);
    })

    it('makeDatedGroups: start/end/both-duplicating cases', function() {
        clear();
        add('00:00:05', false);
        add('00:00:04', true);
        add('00:00:03', true);
        add('00:00:02', true);
        add('00:00:02', true);
        add('00:00:02', false);
        add('00:00:01', false);

        var res = makeDatedGroups(messages, (msg) => {
            return msg.cond;
        }, (group) => {
            return unprefix(group);
        });

        assert.deepStrictEqual(res, [
            {nonce: 0, start_date: '00:00:02', stop_date: '00:00:04'},
            {nonce: 4, start_date: time_point_min, stop_date: time_point_min},
            {nonce: 5, start_date: time_point_min, stop_date: time_point_min},
        ]);

        clear();
        add('00:00:05', false);
        add('00:00:04', false);
        add('00:00:04', true);
        add('00:00:04', true);
        add('00:00:03', true);
        add('00:00:02', true);
        add('00:00:01', false);

        var res = makeDatedGroups(messages, (msg) => {
            return msg.cond;
        }, (group) => {
            return unprefix(group);
        });

        assert.deepStrictEqual(res, [
            {nonce: 3, start_date: time_point_min, stop_date: time_point_min},
            {nonce: 4, start_date: time_point_min, stop_date: time_point_min},
            {nonce: 0, start_date: '00:00:01', stop_date: '00:00:03'},
        ]);

        clear();
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

        var res = makeDatedGroups(messages, (msg) => {
            return msg.cond;
        }, (group) => {
            return unprefix(group);
        });

        assert.deepStrictEqual(res, [
            {nonce: 3, start_date: time_point_min, stop_date: time_point_min},
            {nonce: 4, start_date: time_point_min, stop_date: time_point_min},
            {nonce: 0, start_date: '00:00:02', stop_date: '00:00:04'},
            {nonce: 9, start_date: time_point_min, stop_date: time_point_min},
            {nonce: 10, start_date: time_point_min, stop_date: time_point_min},
        ]);
    })

    it('makeDatedGroups: mixed case', function() {
        clear();
        add('00:00:05', true);
        add('00:00:05', true);
        add('00:00:04', true);
        add('00:00:04', false);
        add('00:00:04', true);
        add('00:00:03', true);
        add('00:00:02', true);
        add('00:00:02', true);

        var res = makeDatedGroups(messages, (msg) => {
            return msg.cond;
        }, (group) => {
            return unprefix(group);
        });

        assert.deepStrictEqual(res, [
            {nonce: 0, start_date: '00:00:04', stop_date: '00:00:05'},
            {nonce: 3, start_date: time_point_min, stop_date: time_point_min},
            {nonce: 5, start_date: time_point_min, stop_date: time_point_min},
            {nonce: 0, start_date: '00:00:01', stop_date: '00:00:03'},
        ]);
    })

    it('makeDatedGroups: null cond', function() {
        clear();
        add('00:00:03', false);
        add('00:00:02', null);
        add('00:00:02', true);
        add('00:00:02', null);
        add('00:00:02', true);
        add('00:00:01', false);

        var res = makeDatedGroups(messages, (msg) => {
            return msg.cond;
        }, (group) => {
            return unprefix(group);
        });

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

        var res = makeDatedGroups(messages, (msg) => {
            return msg.cond;
        }, (group) => {
            return unprefix(group);
        });

        assert.deepStrictEqual(res, [
            {nonce: 0, start_date: '00:00:01', stop_date: '00:00:02'},
        ]);
    })

    it('applyDatedGroup', function() {
    })
})
