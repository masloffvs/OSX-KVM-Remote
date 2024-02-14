const levelup = require('levelup');
const leveldown = require('leveldown');

const {app} = require("../config");

const _ = require("lodash");

const _path = _.get(app, "database.levelup.path", "{PWD}/data/levelup").replace('{PWD}', process.cwd)

const Levelup = levelup(leveldown(_path));

if (Levelup.supports && !Levelup.supports.permanence) {
	throw new Error('Persistent storage is required')
}

module.exports = { LevelupDatabase: Levelup }