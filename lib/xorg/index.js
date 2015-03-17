'use strict';

var O = require('ose').object(module, 'ose/lib/kind');
exports = O.exports;

/** Docs
 * @module xorg
 */

/**
 * @caption X.Org server kind
 *
 * @readme
 * [Entry kind] for X.Org server
 *
 * It uses xdotool to remotely control the desktop.
 *
 * @class xorg.lib.xorg
 * @extend ose.lib.kind
 * @type singleton
 */

exports.init = function() {
  this.on('client', O.link.bindResp(O, './resp'));
};

exports.homeInit = function(entry) {
  entry.setState({mods: {
    shift: false,
    alt: false,
    control: false,
    super: false,
    1: false,
    2: false,
    3: false,
    4: false,
    5: false,
    6: false,
    7: false
  }});
};

