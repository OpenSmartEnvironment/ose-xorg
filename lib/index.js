'use strict';

var O = require('ose').module(module);
O.package = 'ose-xorg';
O.scope = 'control';

/** Docs {{{1
 * @caption X.Org
 *
 * @readme
 * This package allows to control the X.Org server with xdotool.
 *
 * See [Media player example].
 *
 * @scope control
 * @module xorg
 * @main xorg
 */

/**
 * @caption X.Org core
 *
 * @readme
 * Core singleton of ose-xorg npm package. Registers [entry kinds]
 * defined by this package to the `"control"` [scope].
 *
 * @class xorg.lib
 * @type singleton
 */

// Public {{{1
exports.browserConfig = true;

exports.config = function(name, data, deps) {
  O.kind('./xorg', 'xorg', deps);

  O.content('../content');
};
