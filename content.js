'use strict';

var O = require('ose').object(module, Init, 'ose/lib/http/content');
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
function Init() {
  O.super.call(this);

  this.addModule('lib/index');
  this.addModule('lib/xorg/index');
  this.addModule('lib/xorg/gaia/gesture');
};
