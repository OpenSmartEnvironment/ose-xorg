'use strict';

var O = require('ose').module(module);

var EntrySocket = O.class('ose/lib/entry/command');

// Public {{{1
exports.post = function(name, data) {  // {{{2
//  return this.log('NOT POSTING' + name, data);
//  this.log('POSTING ' + name, data);

  if (O.link.canSend(this.xorgClient)) {
    O.link.send(this.xorgClient, name, data);
  } else {
    O.log.error(this, 'DISCONNECTED', 'Link is not connected');
  }
};

exports.displayLayout = function() {  // {{{2
  var that = this;

  this.xorgClient = new EntrySocket(this.entry, this.entry.id, 'client');

  var el = this.find('section.touchArea')
    .attr('contenteditable', undefined)
    .attr('readonly', undefined)
    .on('input', onInput.bind(this))
    .on('blur', onBlur.bind(this))
    .on('focus', onFocus.bind(this))
    .on('keyup', onKeyup.bind(this))
    .on('mousedown', onMousedown.bind(this))
    .on('touchstart', onMousedown.bind(this))
  ;

  this.find('section.buttons')
    .button('text', 'esc', onEscape.bind(this))
    .button('text', 'shift', tapButton.bind(this), {label: 'shift'})
    .button('text', 'control', tapButton.bind(this), {label: 'control'})
    .button('text', 'alt', tapButton.bind(this), {label: 'alt'})
    .button('text', 'super', tapButton.bind(this), {label: 'super'})
    .button('text', 'fx', tapButton.bind(this), {label: 'fx'})
  ;

  setTimeout(function() {
    el.focus();
    clearEdit(that, el);
  }, 100);
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
        var button = this.find('i[label="' + kex + '"]');

        switch (button.val()) {
        case '':
        case null:
        case undefined:
          button.val(value[kex] ? 'on' : 'off');
          break;
        case 'off':
        case 'auto':
          if (value[kex]) button.val('on');
          break;
        case 'on':
          if (! value[kex]) button.val('off');
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
  this.post('key' + type, {
    value: val,
    keycomb: keycomb || {}
  });
};

exports.sendButton = function(btn, state) {  // {{{2
  this.post('button', {
    button: btn,
    state: state
 });
};

exports.sendClick = function(btn) {  // {{{2
  this.post('click', {button: btn});
};

// Event Handlers {{{1
function tapButton(ev) {  // {{{2
  this.stop(ev);

  var button = this.wrap(ev.target);
  var name = button.attr('label');
  var value = button.val();

  switch (value) {
  case '':
  case null:
  case undefined:
  case 'off':  // Button is "off", change it to "auto".
    button.val('auto');

    break;
  case 'on':  // Button is "on", change it to "off" and send "keyup".
    button.val('off');

    switch (name) {
    case 'shift':  // When "shift" is released, release mouse button "1".
      if (this.entry.sval.mods[1]) this.sendButton(1, false);
      // WARNING: There is no break here.
    case 'control':
    case 'alt':
    case 'super':
      if (name in this.entry.sval.mods && this.entry.sval.mods[name]) this.sendKey('up', name);
      break;
    }

    break;
  case 'auto':  // Button is "auto", change it to "on" and send "keydown".
    button.val('on');

    if (name in this.entry.sval.mods && ! this.entry.sval.mods[name]) this.sendKey('down', name);

    break;
  default:
    throw new Error('Invalid button state: ' + value);
  }
}

function onFocus(ev) {  // {{{2
  clearEdit(this);
};

function onBlur(ev) {  // {{{2
  var that = this;

  setTimeout(function() {
    if (that.el) {
      that.find('section.touchArea').focus();
    }
  });
};

function onClick(ev) {  // {{{2
  this.stop(ev);

  this.onSelection();

  clearEdit(this);

  var s = this.find('i[label="shift"]');
  if (s.val() === 'auto') {
    this.sendClick(3);
    s.val('off');
  } else {
    this.sendClick(1);
  }
};

function onInput(ev) {  // {{{2
  var that = this;

  setTimeout(function doIt() {  // {{{3
    clearEdit(that, el);

    var el = that.find('section.touchArea');

    var value = el.text();
    if (value === DefaultText) return;  // Nothing happened, input cleanup.

    var keycomb = getKeyComb(that);

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
  });

  // }}}3
}

function onEscape() {  // {{{2
  this.escape();

  clearEdit(this, 100);

  return false;
}

function onMousedown(ev) {  // {{{2
  if (this.drag) return;

  var that = this;
  var drag = this.drag = O.ui.input.startDrag(ev, this.offset);

//  this.log('MOUSEDOWN ' + ev.type, drag.start);

  drag.onmove(function(ev, point) {  // {{{3
//    that.log('MOVE', ev.touches);

    if (! drag.points) {
      drag.points = [drag.start, point];

      if (that.find('i[label="alt"]').val() === 'auto') {
        drag.alt = true;
        that.sendKey('down', 'alt');
      }

      if (that.find('i[label="shift"]').val() === 'auto') {
        drag.shift = true;
        that.sendButton(1, true);
      }
    } else {
      drag.points.push(point);
    }

    that.canvas.beginPath();
    that.canvas.moveTo(drag.last.x, drag.last.y);

    that.canvas.lineTo(point.x, point.y);
    that.canvas.stroke();

    var x = accelerate(point.x - drag.last.x);
    var y = accelerate(point.y - drag.last.y);

    drag.last = point;

    switch (that.find('i[label="super"]').val()) {
    case '':
    case null:
    case undefined:
    case 'off':
      that.post('move', {
        x: x,
        y: y
      });
      break;
    default:
      that.post('scroll', {
        x: x,
        y: y
      });
      break;
    }
  });

  drag.ondrop(function(ev) {  // {{{3
    delete that.drag;

    // Release buttons pressed during mousedown
    if (drag.shift) that.sendButton(1, false);
    if (drag.alt) that.sendKey('up', 'alt');

    if (! drag.points) {
      onClick.call(that, ev);
      return;
    }

//    dragendUni(that, drag.points);
//    dragendMulti(that, drag.points);

    that.clearCanvas();
    clearEdit(that);
  });

  // }}}3
}

function onKeyup(ev) {  // {{{2
//  console.log('KEYUP', ev);

  clearEdit(this);

  switch (ev.keyCode) {
  case 0:
    return;
  case 16:   // Shift
  case 17:   // Control
  case 18:   // Alt
  case 20:   // Capslock
  case 91:   // Super
  case 116:  // F5
  case 145:  // ScrLk
  case 229:  // ???
    return;
  case 27:
    this.escape();
    return false;
  case 9:    // Tab
  case 13:
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
    var result = that.find('i[label="' + label + '"]');

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
  that.find('i[label="shift"]').val('off');
  that.find('i[label="control"]').val('off');
  that.find('i[label="super"]').val('off');
  that.find('i[label="alt"]').val('off');
  that.find('i[label="fx"]').val('off');
}

function dragendUni(that, points) {  // {{{2
  var result = new PDollarRecognizer().Recognize(that.points);

  if (result.Score > 0.05) {
//    that.log('RECOGNIZED ' + result.Name + '; score: ', result.Score);
  }

  that.clearCanvas();
};

function dragendMulti(that, points) {  // {{{2
  that.lastDragend = ev.timeStamp;

  setTimeout(function() {
    if ((ev.timeStamp - that.lastDragstart) > 0) {
      var result = new PDollarRecognizer().Recognize(points);

      if (result.Score > 0.05) {
//        that.log('RECOGNIZED ' + result.Name + '; score: ', result.Score);
      }

      that.clearCanvas();
//      that.points = [];
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

    if (! el) el = that.find('section.touchArea');

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

