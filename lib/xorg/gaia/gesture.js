'use strict';

var O = require('ose').module(module);

var EntrySocket = O.class('ose/lib/entry/command');

// Public {{{1
exports.post = function(name, data) {  // {{{2
  if (O.link.canSend(this.xorgClient)) {
    O.link.send(this.xorgClient, name, data);
  } else {
    O.log.error(this, 'DISCONNECTED', 'Link is not connected');
  }
};

exports.displayLayout = function() {  // {{{2
  var that = this;

  this.xorgClient = new EntrySocket(this.entry, this.entry.id, 'client');

  this.points = [];

  var el = this.find('div.touchKeyarea')  // {{{3
    .attr('contenteditable', '')
    .on('click', onClick.bind(this))
    .on('input', onInput.bind(this))
    .on('focus', onFocus.bind(this))
    .on('keyup', onKeyup.bind(this))
  ;

  var hammer = new Hammer.Manager(el.el, {  // {{{3
    recognizers: [
      [Hammer.Pan],
      [Hammer.Tap]
    ]
  });
  hammer.on('panstart', onPanstart.bind(this))
  hammer.on('panmove', onPanmove.bind(this));
  hammer.on('panend', onPanend.bind(this));
  hammer.on('tap', onTap.bind(this));

  this.find('menu.buttonsRight')  // {{{3
    .add([
      button('Esc', onEscape.bind(this)),
      button('Shift'),
      button('Control'),
      button('Alt'),
      button('Super'),
      button('Fx'),
    ])
  ;

  setTimeout(function() {  // {{{3
    el.focus();
    clearEdit(that, el);
  }, 100);

  function button(name, send) {  // {{{3
    return that.new('button', {label: name.toLowerCase()})
      .text(name)
      .on('click', send || tapButton.bind(that, name.toLowerCase()))
      .val('off')
    ;
  };

  // }}}3
};

exports.updateStateKey = function(key, value) {  // {{{2
  switch (key) {
  case 'mods':  // Change buttons states depending on incoming mods.
    for (var kex in value) {
      switch (kex) {
      case 'shift':
      case 'control':
      case 'alt':
      case 'super':
        var w = this.find('button[label="' + kex + '"]');

        switch (w.val()) {
        case '':
        case null:
        case undefined:
          w.val(value[kex] ? 'on' : 'off');
          break;
        case 'off':
        case 'auto':
          if (value[kex]) w.val('on');
          break;
        case 'on':
          if (! value[kex]) w.val('off');
          break;
        }

        break;
      }
    }

    break;
  default:
    O.log.unhandled('XORG TOUCH UPDATE STATE Error', value);
  }
};

exports.escape = function() {  // {{{2
  this.sendKey('press', 27, getKeyComb(this));

  clearMods(this);
};

exports.sendKey = function(type, val, keycomb) {  // {{{2
//  this.log('KEY NOT SENT', {type: type, val: val, comb: keycomb}); return;

  this.post('key' + type, {
    value: val,
    keycomb: keycomb || {}
  });
};

exports.sendButton = function(btn, state) {  // {{{2
//  this.log('BUTTON NOT SENT', {button: btn, state: state}); return;

  this.post('button', {
    button: btn,
    state: state
 });
};

exports.sendClick = function(btn) {  // {{{2
//  this.log('CLICK NOT SENT', {button: btn}); return;

  this.post('click', {button: btn});
};

// }}}1
// Event Handlers {{{1
function onTap(ev) {  // {{{2
  clearEdit(this);

  var d = this.find('div.touchKeyarea');
  var w = d.width();
  var m = this.find('menu.buttonsRight');
  var mw = m.width();
  var mh = m.height();

  if (
    (ev.center.x > (w - mw)) &&
    (ev.center.y < (mh + this.offset.top))
  ) {
    var t = ev.center.y - this.offset.top;
    for (var i = m.el.childNodes.length; i > 0; i--) {
      var b = m.el.childNodes[i - 1];
      if (b.offsetTop < t) {
        b.click();
        return;
      }
    }

    return;
  }

  var s = this.find('button[label="shift"]');
  if (s.val() === 'auto') {
    this.sendClick(3);
    s.val('off');
  } else {
    this.sendClick(1);
  }

  return false;
}

function onPanstart(ev) {  // {{{2
//  this.log('PANSTART');

  this.lastPoint = {
    X: ev.center.x - this.offset.left,
    Y: ev.center.y - this.offset.top
  };

  this.lastDragstart = ev.timeStamp;

  if (this.find('button[label="alt"]').val() === 'auto') {
    this.sendKey('down', 'alt');
  }

  if (this.find('button[label="shift"]').val() === 'auto') {
    this.sendButton(1, true);
  }
};

function onPanmove(ev) {  // {{{2
  var point = {
    X: ev.center.x - this.offset.left,
    Y: ev.center.y - this.offset.top
  };

  this.points.push(point);

  this.canvas.beginPath();
  this.canvas.moveTo(this.lastPoint.X, this.lastPoint.Y);

  this.canvas.lineTo(point.X, point.Y);
  this.canvas.stroke();

  var x = accelerate(point.X - this.lastPoint.X);
  var y = accelerate(point.Y - this.lastPoint.Y);

  this.lastPoint = point;

  if (this.find('button[label="super"]').val() !== 'off') {
    this.post('scroll', {
      x: x,
      y: y
    });
  } else {
    this.post('move', {
      x: x,
      y: y
    });
  }
};

function onPanend(ev) {  // {{{2
  dragendUni(this, ev);
//  dragendMulti(this, ev);

  // Release buttons in "auto" state.
  var mods = getKeyComb(this);
  if (mods.shift) this.sendButton(1, false);
  // if (mods.alt) this.sendKey('up', 'alt');

  clearEdit(this);

  return true;
};

function tapButton(name, ev) {  // {{{2
  this.stop(ev);

  var w = this.find('button[label="' + name + '"]');
  var value = w.val();

  switch (value) {
  case 'off':  // Button is "off", change it to "auto".
    w.val('auto');

    break;
  case 'on':  // Button is "on", change it to "off" and send "keyup".
    w.val('off');

    switch (name) {
    case 'shift':  // When "shift" is released, release mouse button "1".
      if (this.entry.state.mods[1]) this.sendButton(1, false);
      // WARNING: There is no break here.
    case 'control':
    case 'alt':
    case 'super':
      if (name in this.entry.state.mods && this.entry.state.mods[name]) this.sendKey('up', name);
      break;
    }

    break;
  case 'auto':  // Button is "auto", change it to "on" and send "keydown".
    w.val('on');

    if (name in this.entry.state.mods && ! this.entry.state.mods[name]) this.sendKey('down', name);

    break;
  default:
    throw new Error('Invalid button state: ' + value);
  }
}

function onFocus(ev) {  // {{{2
  clearEdit(this);
};

function onClick(ev) {  // {{{2
  clearEdit(this);
};

function onInput(ev) {  // {{{2
  var that = this;

  setTimeout(function doIt() {  // {{{3
    clearEdit(that, el);

    var el = that.find('div.touchKeyarea');

    var value = el.text();
    if (value === DefaultText) return;  // Nothing happened, input cleanup.

    var keycomb = getKeyComb(that);

//    that.log('INPUT DO', {text: value, length: value.length});

    switch (value.length) {
    case 2:  // Deletion detected.
      switch (value) {
      case 'a\u2060':  // Non standard Android Chrome Beta 37 beahviour.
      case '\u2060b':
        that.sendKey('press', 8, keycomb);
        break;
      case 'ab':
        that.sendKey('press', 127, keycomb);
        break;
      default:
        O.log.unhandled('Invalid content value', value);
      }
      break;
    case 4:
      if (value.substr(0, 3) === DefaultText) {
        that.sendKey('press', value.charCodeAt(3), keycomb);  // Non standard Android Chrome Beta 37 behaviour.
      } else {
        that.sendKey('press', value.charCodeAt(1), keycomb);  // Standard input.
      }
      break;
    default:
      that.log('DO KEY NOT IMPLEMENTED', {keyCode: ev.keyCode, which: ev.which, text: value});
    }
  }, 0);

  // }}}3
};

function onEscape() {  // {{{2
  this.escape();

  clearEdit(this, 100);

  return false;
};

function onKeyup(ev) {  // {{{2
//  console.log('KEYUP', ev);

  clearEdit(this);

  switch (ev.keyCode) {
    case 0:
      return;
    case 16:  // Shift
    case 17:  // Control
    case 18:  // Alt
    case 20:  // Capslock
    case 91:  // Super
    case 116:  // F5
    case 145:  // ScrLk
    case 229:  // ???
      return;
    case 27:
      this.escape();
      return false;
    case 9:  // Tab
    case 13:  // Tab
    case 33:
    case 34:
    case 35:
    case 36:
    case 37:
    case 38:
    case 39:
    case 40:
      this.sendKey('press', ev.keyCode, getKeyComb(this));
      return false;
  }
};

// }}}1
// Private {{{1
var DefaultText = 'a\u2060b';

function accelerate(n) {  // {{{2
  if (! n) return 0;

  if (n < 0) {
    var neg = true;
    n = 0 - n;
  }

  var result = Math.pow(n, 1.5);

  result = Math.round(result);

  if (neg) result = 0 - result;

  return result;
}

function getKeyComb(that) {  // {{{2
  var result = {
    shift: button('shift'),
    control: button('control'),
    'super': button('super'),
    alt: button('alt'),
    fx: button('fx')
  };

  return result;

  function button(label) {
    var result = that.find('button[label="' + label + '"]');

    switch (result.val()) {
    case 'on':
      return false;
      break;
    case 'auto':
      result.val('off');
      return true;
      break;
    default:
      return false;
    }
  }
}

function clearMods(that) {  // {{{2
  that.find('button[label="shift"]').val('off');
  that.find('button[label="control"]').val('off');
  that.find('button[label="super"]').val('off');
  that.find('button[label="alt"]').val('off');
  that.find('button[label="fx"]').val('off');
}

function dragendUni(that, ev) {  // {{{2
  /*
  var result = new PDollarRecognizer().Recognize(that.points);

  if (result.Score > 0.05) {
//    that.log('RECOGNIZED ' + result.Name + '; score: ', result.Score);
  }
  */

  that.clearCanvas();
  that.points = [];
};

function dragendMulti(that, ev) {  // {{{2
  that.lastDragend = ev.timeStamp;

  setTimeout(function() {
    if ((ev.timeStamp - that.lastDragstart) > 0) {
      var result = new PDollarRecognizer().Recognize(points);

      if (result.Score > 0.05) {
//        that.log('RECOGNIZED ' + result.Name + '; score: ', result.Score);
      }

      that.clearCanvas();
      that.points = [];
    }
  }, 1000);
};

function clearEdit(that, el, timeout) {  // {{{2
  if (that.clearEditTimeout) return;

  if (typeof el === 'number') {
    timeout = el;
    el = undefined;
  }

  that.clearEditTimeout = setTimeout(doIt, timeout || 0);

  function doIt() {
    delete that.clearEditTimeout;

    if (! el) el = that.find('div.touchKeyarea');

    el.text(DefaultText);

    el = el.el.childNodes[0];
    var range = document.createRange();
    range.setStart(el, 1);
    range.setEnd(el, 1);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }
};

// }}}1
