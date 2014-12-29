'use strict';

exports = require('ose')
  .singleton(module, 'ose/lib/http/content')
  .exports
;

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
exports.addFiles = function() {
  this.addModule('lib/index');
  this.addModule('lib/xorg/index');
  this.addModule('lib/xorg/bb/gesture');
};
