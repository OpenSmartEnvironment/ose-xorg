'use strict';

var O = require('ose').module(module);

var EntrySocket = O.class('ose/lib/entry/command');

// Public {{{1
exports.post = function(name, data) {  // {{{2
  if (this.xorgClient && this.xorgClient.link && (name in this.xorgClient.link)) {
    this.xorgClient.link[name](data);
  } else {
    O.log.error(O.error(this, 'DISCONNECTED', 'Link is not connected'));
  }
};

exports.displayLayout = function() {  // {{{2
  var that = this;

  this.xorgClient = new EntrySocket(this.entry, this.entry.id, 'client');

  this.points = [];

  var el = this.$(' > .touchKeyarea')  // {{{3
    .attr('contenteditable', '')
    .on('click', onClick.bind(this))
    .on('input', onInput.bind(this))
    .on('focus', onFocus.bind(this))
    .on('keyup', onKeyup.bind(this))
  ;

  var hammer = new Hammer.Manager(el[0], {  // {{{3
    recognizers: [
      [Hammer.Pan],
      [Hammer.Tap]
    ]
  });
  hammer.on('panstart', onPanstart.bind(this))
  hammer.on('panmove', onPanmove.bind(this));
  hammer.on('panend', onPanend.bind(this));
  hammer.on('tap', onTap.bind(this));

  this.$(' > .buttonsRight')  // {{{3
    .append(this.newWidget('button', 'esc', {
      label: 'esc',
      tap: onEscape.bind(this)
    }))
    .append(button('shift'))
    .append(button('control'))
    .append(button('alt'))
    .append(button('super'))
    .append(button('fx'))
  ;

  setTimeout(function() {  // {{{3
    el.focus();
    clearEdit(that, el);
  }, 100);

  function button(name, send) {  // {{{3
    return that.newWidget('button', name, {
      label: name,
      value: ButtonState.off,
      tap: tapButton.bind(that, name, send)
    });
  };

  // }}}3
};

exports.updateStateKey = function(key, value) {  // {{{2
  switch (key) {
  case 'mods':  // Change buttons states depending on incoming mods.
    for (var kex in value.mods) {
      switch (kex) {
      case 'shift':
      case 'control':
      case 'alt':
      case 'super':
        var value = this.widget(kex);

        switch (value) {
          case ButtonState.off:
          case ButtonState.auto:
            if (value[kex]) this.widget(kex, ButtonState.on);
            break;
          case ButtonState.on:
            if (! value[kex]) this.widget(kex, ButtonState.off)
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

  var el = this.$(' > .touchKeyarea');
  var offset = el.offset();

  if ((el.width() + offset.left - ev.center.x) < 70) {
    this.$(' > menu.buttonsRight > button').each(function(index, button) {
      button = $(button);
      var offset = button.offset();

//      console.log('BUTTON', button, offset);

      if (
        (ev.center.y > offset.top) &&
        (ev.center.y < (offset.top + button.height()))
      ) {
        button.trigger('click');
        return false;
      }
    });

    return false;
  }

  if (this.widget('shift') === ButtonState.auto) {
    this.sendClick(3);
    this.widget('shift', ButtonState.off);
  } else {
    this.sendClick(1);
  }

  return false;
}

function onPanstart(ev) {  // {{{2
//  this.log('PANSTART');

  this.offset = this.$('>.touchCanvas').offset();

  this.lastPoint = {
    X: ev.center.x - this.offset.left,
    Y: ev.center.y - this.offset.top
  };

  this.lastDragstart = ev.timeStamp;

  if (this.widget('alt') === ButtonState.auto) {
    this.sendKey('down', 'alt');
  }

  if (this.widget('shift') === ButtonState.auto) {
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

  if (this.widget('super') !== ButtonState.off) {
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

function tapButton(name, send, ev) {  // {{{2
  var el = $(ev.target);
  var widget = el.prop('ose');
  var value = widget.val(el);

  switch (value) {
  case 0:  // Button is "off", change it to "auto".
    widget.update(el, ButtonState.auto);

    break;
  case 1:  // Button is "on", change it to "off" and send "keyup".
    widget.update(el, ButtonState.off);

    switch (name) {
    case 'shift':  // When "shift" is released, release mouse button "1".
      if (this.entry.state.mods[1]) this.sendButton(1, false);
      // WARNING: There is no break here.
    case 'control':
    case 'alt':
    case 'super':
      if (this.entry.state.mods[name]) this.sendKey('up', name);
      break;
    }

    break;
  case 2:  // Button is "auto", change it to "on" and send "keydown".
    widget.update(el, ButtonState.on);

    if (! this.entry.state.mods[name]) this.sendKey('down', name);

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

    var el = that.$(' > .touchKeyarea');

    var value = el.text();
    if (value === DefaultText) return;  // Nothing happened, input cleanup.

    var keycomb = getKeyComb(that);

//    that.log('INPUT DO', {text: value, lenght: value.length});

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
var ButtonState = {  // {{{2
  off: 0,
  on: 1,
  auto: 2
};

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

  function button(id) {
    var result = that.widget(id);

    switch (result) {
      case ButtonState.on:
        return false;
        break;
      case ButtonState.auto:
        that.widget(id, ButtonState.off);
        return true;
        break;
      default:
        return false;
    }
  }
}

function clearMods(that) {  // {{{2
  that.widget('shift', ButtonState.off);
  that.widget('control', ButtonState.off);
  that.widget('super', ButtonState.off);
  that.widget('alt', ButtonState.off);
  that.widget('fx', ButtonState.off);
}

function dragendUni(that, ev) {  // {{{2
  var result = new PDollarRecognizer().Recognize(that.points);

  if (result.Score > 0.05) {
//    that.log('RECOGNIZED ' + result.Name + '; score: ', result.Score);
  }

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

    if (! el) el = that.$(' > .touchKeyarea');

    el.text(DefaultText);

    el = el[0].childNodes[0];
    var range = document.createRange();
    range.setStart(el, 1);
    range.setEnd(el, 1);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }
};

// }}}1
