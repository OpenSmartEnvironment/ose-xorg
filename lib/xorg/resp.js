'use strict';

var O = require('ose').class(module, C);

var Exec = require('child_process').exec;
var Keysym = require('keysym');

// Public {{{1
function C(entry) {  // {{{2
  this.entry = entry;
};

exports.close = function() {  // {{{2
  delete this.entry;
};

exports.error = function() {  // {{{2
  delete this.entry;
};

exports.move = function(req, socket) {  // {{{2
  exec('mousemove_relative', '--', req.x, req.y);
  O.link.close(socket);
};

exports.button = function(req, socket) {  // {{{2
  button(this.entry, req.button, req.state);
  O.link.close(socket);
};

exports.scroll = function(req, socket) {  // {{{2
  scroll(req.x, req.y);
  O.link.close(socket);
};

exports.click = function(req, socket) {  // {{{2
  exec('click', req.button);
  O.link.close(socket);
};

exports.keypress = function(req, socket) {  // {{{2
  if (
    (typeof req.value === 'number') &&
    (req.value >= 0) &&
    (req.value < 256)
  ) {
    keypress(this.entry, req.value, req.keycomb);
    O.link.close(socket);
  } else {
    O.link.error(socket, O.error(this.entry, 'Invalid arguments', req));
  }
};

exports.keyup = function(req, socket) {  // {{{2
  key(this.entry, 'keyup', req.value);
  O.link.close(socket);
};

exports.keydown = function(req, socket) {  // {{{2
  key(this.entry, 'keydown', req.value);
  O.link.close(socket);
};

// }}}1
// Private {{{1
function exec() {  // {{{2
  var command = 'xdotool ' + Array.prototype.join.call(arguments, ' ');

  /*
  switch (arguments[0]) {
  case 'mousemove_relative':
    break;
  default:
    console.log('XORG', command);
  }
  */

  Exec(command, function(error, stdout, stderr) {
    if (error) console.log('ERROR' + error);
    if (stdout) console.log('STDOUT' + stdout);
    if (stderr) console.log('STDERR' + stderr);
  });
}

function button(entry, button, state) {  // {{{2
  updateMod(entry, button, state);

  switch (state) {
    case true:
      exec('mousedown', button);
      break;
    case false:
      exec('mouseup', button);
      break;
    default:
      O.log.unhandled('Invalid button state', state);
  }
}

function scroll(x, y) {  // {{{2
  if (y < 0) {
    exec('click', 4);
  } else if (y > 0) {
    exec('click', 5);
  }

  if (x < 0) {
    exec('click', 6);
  } else if (x > 0) {
    exec('click', 7);
  }
}

function keypress(entry, state, keycomb) {  // {{{2
  var keysym = Keysym.fromUnicode(state);

  switch (state) {
    case 33:
      keysym = 'Prior';
      break;
    case 34:
      keysym = 'Next';
      break;
    case 37:
      keysym = 'Left';
      break;
    case 38:
      keysym = 'Up';
      break;
    case 39:
      keysym = 'Right';
      break;
    case 40:
      keysym = 'Down';
      break;
    case 46:
      keysym = 'Delete';
      break;
    default:
      keysym = keysym[0];

      if (! keysym) return;
      keysym = keysym.names[0];
  }

  switch (keysym) {
    case 'nobreakspace':
      keysym = 'space'
      break;
  }

  if (keycomb.fx && (state >= 49) && (state <= 57)) keysym = 'F' + keysym;
  if (keycomb.shift) keysym = 'Shift+' + keysym;
  if (keycomb.control) keysym = 'Control+' + keysym;
  if (keycomb['super']) keysym = 'Super+' + keysym;
  if (keycomb.alt) keysym = 'Alt+' + keysym;

  key(entry, 'key', keysym);
}

function key(entry, type, key) {  // {{{2
  switch (type) {
    case 'key':
      break;
    case 'keyup':
      updateMod(entry, key, false);
      break;
    case 'keydown':
      updateMod(entry, key, true);
      break;
    default:
      O.log.unhandled('Invalid type: ' + type);
      return;
  }

  exec(type, key);
}

function updateMod(entry, name, value) {  // {{{2
  if (typeof value !== 'boolean') {
    O.log.unhandled('Invalid modifier', {name: name, value: value});
    return;
  }

  if (! (name in entry.state.mods)) {
    O.log.unhandled('Unknown modifier', {name: name, value: value});
    return;
  }

  var result = {};

  result[name] = value;

  entry.setState({mods: result});
};

// }}}1
