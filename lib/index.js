'use strict';

var Ose = require('ose');
var M = Ose.package(module);
exports = M.init();

/** Docs {{{1
 * @caption X.Org
 *
 * @readme
 * This package allows to control the X.Org server with xdotool.
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
 * defined by this package to the `"control"` [scope].
 *
 * @class xorg.lib
 * @type singleton
 */

// Public {{{1
exports.browserConfig = true;

M.content();

M.scope = 'control';
M.kind('./xorg', 'xorg');
