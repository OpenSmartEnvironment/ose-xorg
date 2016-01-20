'use strict';

const O = require('ose')(module)
  .singleton('ose/lib/http/content')
;

exports = O.init();

/** Docs  {{{1
 * @module xorg
 */

/**
 * @caption X.Org content
 *
 * @readme
 * Provides files of [ose-xorg] package to the browser.
 *
 * @class xorg.content
 * @type singleton
 * @extends ose.lib.http.content
 */

// Public {{{1
exports.addModule('lib/index');
exports.addModule('lib/xorg/index');
exports.addModule('lib/xorg/gesture');
