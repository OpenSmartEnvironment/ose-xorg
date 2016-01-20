'use strict';

const O = require('ose')(module)
  .singleton('ose/lib/kind')
;

exports = O.init('control', 'xorg');

exports.role = ['remote'];

/** Docs
 * @module xorg
 */

/**
 * @caption X.Org server kind
 *
 * @readme
 * [Entry kind] for X.Org server
 *
 * Uses xdotool to remotely control the keyboard and pointer
 *
 * @kind xorg
 * @class xorg.lib.xorg
 * @extend ose.lib.kind
 * @type singleton
 */

exports.on('client', O.link.bindResp(O, './resp'));
/**
 * Create an [X.Org response socket]
 *
 * @method client
 * @handler
 */

exports.layout('gesture', require('./gesture'));

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

