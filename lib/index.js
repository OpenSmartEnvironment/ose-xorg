'use strict';

const O = require('ose')(module)
  .setPackage('ose-xorg')
;

/** Docs {{{1
 * @caption X.Org
 *
 * @readme
 * This package allows to control the mouse and pointer in X.Org
 *
 * See [Media player example].
 *
 * @module xorg
 * @main xorg
 */

/**
 * @caption X.Org core
 *
 * @readme
 * Core singleton of ose-xorg npm package. Registers [entry kinds]
 * defined by this package to the `"control"` [schema].
 *
 * @class xorg.lib
 * @type singleton
 */

// Public {{{1
exports.browserConfig = true;

exports.config = function(name, val, deps) {
  require('./xorg');

  O.content('../content');
};
