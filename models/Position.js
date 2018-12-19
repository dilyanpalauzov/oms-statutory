const moment = require('moment');

const { Sequelize, sequelize } = require('../lib/sequelize');

const Position = sequelize.define('Position', {
    name: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '',
        validate: {
            notEmpty: { msg: 'Position name should be set.' },
        }
    },
    starts: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: '',
        validate: {
            notEmpty: { msg: 'Event start date should be set.' },
            isDate: { msg: 'Event start date should be valid.' }
        }
    },
    ends: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: '',
        validate: {
            notEmpty: { msg: 'Event end date should be set.' },
            isDate: { msg: 'Event end date should be valid.' },
            laterThanStart(val) {
                if (moment(val).isSameOrBefore(this.starts)) {
                    throw new Error('Event cannot start after or at the same time it ends.');
                }
            }
        }
    },
    places: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: '',
        validate: {
            notEmpty: { msg: 'Places amount should be set.' },
            isNumeric: { msg: 'Places amount should be valid.' },
            min: { args: [1], msg: 'Places amount should be at least 1' }
        }
    },
    status: {
        type: Sequelize.ENUM('open', 'closed'),
        allowNull: false,
        defaultValue: 'open',
        validate: {
            isIn: {
                args: [['open', 'closed']],
                msg: 'Position status can be one of these: "open", "closed".'
            }
        }
    },
}, { underscored: true, tableName: 'positions' });

Position.beforeValidate((position) => {
    if (position.starts) {
        // If it's set we set the status either to "open" or "closed"
        // based on starts and ends params.
        // Also if it should start in the future, we set the cron task for it
        // to open applications.
        // TODO: add cron task for it.
        position.status = moment().isBetween(position.starts, position.ends, null, '[]')
            ? 'open'
            : 'closed';
    } else {
        // Else, if it's not set, that means we want to open the application
        // period right now. So, position.starts should be the current time.
        position.starts = new Date();
        position.status = 'open';
    }
});

Position.afterUpdate((position) => {
    // Yeah, nasty, but prevents us from circular dependencies issues. Been there, done that.
    const cron = require('../lib/cron');

    // Clearing the deadlines and setting them again on afterSave() (just in case).
    // Only needed on update.
    cron.clearDeadlinesForPosition(position.id);
});

Position.afterSave((position) => {
    // Yeah, nasty, but prevents us from circular dependencies issues. Been there, done that.
    const cron = require('../lib/cron');

    // Schedule 2 deadlines, one for opening and one for closing.
    // If there should be no deadline, cron will catch it.
    // Should be run on create and update.
    cron.registerOpenApplicationDeadline(position.starts, position.id);
    cron.registerCloseApplicationDeadline(position.ends, position.id);
});

module.exports = Position;
