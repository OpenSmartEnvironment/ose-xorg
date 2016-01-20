'use strict';

const O = require('ose')(module);

var EntrySocket = O.getClass('ose/lib/entry/command');

// Public {{{1
exports.post = function(name, data) {  // {{{2
//  return console.log('NOT POSTING', name, data);
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

  var ta = this.find('section.touchArea')
//    .attr('contenteditable', undefined)
    .on('drag', onDrag.bind(this))
    .on('tap', onTap.bind(this))
    .listen('input', onInput.bind(this))
    .find('span')
      .listen('focus', onFocus.bind(this))
      .listen('blur', onBlur.bind(this))
      .listen('keyup', onKeyup.bind(this))
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
    ta.el.focus();
    clearEdit(that);
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
function tapButton(val) {  // {{{2
  var name = val.wrap.attr('label');

  switch (val.wrap.val()) {
  case '':
  case null:
  case undefined:
  case 'off':  // Button is "off", change it to "auto".
    val.wrap.val('auto');

    break;
  case 'on':  // Button is "on", change it to "off" and send "keyup".
    val.wrap.val('off');

    switch (name) {
    case 'shift':  // When "shift" is released, release mouse button "1".
      if (this.entry.sval.mods[1]) this.sendButton(1, false);
      // NO BREAK
    case 'control':
    case 'alt':
    case 'super':
      if (name in this.entry.sval.mods && this.entry.sval.mods[name]) this.sendKey('up', name);
      break;
    }

    break;
  case 'auto':  // Button is "auto", change it to "on" and send "keydown".
    val.wrap.val('on');

    if (name in this.entry.sval.mods && ! this.entry.sval.mods[name]) this.sendKey('down', name);

    break;
  default:
    throw new Error('Invalid button state: ' + val.wrap.val());
  }

  return false;
}

function onFocus(ev) {  // {{{2
  clearEdit(this);
};

function onBlur(ev) {  // {{{2
  var that = this;

  setTimeout(function() {
    if (that.el) {
      that.find('section.touchArea > span').el.focus();
    }
  });
};

function onTap(ma) {  // {{{2
  this.onSelection();

  clearEdit(this);

  var s = this.find('i[label="shift"]');
  if (s.val() === 'auto') {
    this.sendClick(3);
    s.val('off');
  } else {
    this.sendClick(1);
  }

  return false;
};

function onInput(ev) {  // {{{2
  var that = this;

  setTimeout(function doIt() {  // {{{3
    clearEdit(that);

    var el = that.find('section.touchArea > span');

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

function onDrag(ma) {  // {{{2
//  this.log('MOUSEDOWN ' + ma.type, ma.start);

  ma.points = [ma.begin];

  if (this.find('i[label="alt"]').val() === 'auto') {
    ma.alt = true;
    this.sendKey('down', 'alt');
  }

  if (this.find('i[label="shift"]').val() === 'auto') {
    ma.shift = true;
    this.sendButton(1, true);
  }

  onMove.call(this, ma);

  ma.drag = onMove.bind(this);
  ma.drop = onDrop.bind(this);

  return false;
}

function onMove(ma) {  // {{{3
  var prev = ma.points[ma.points.length - 1];

  ma.points.push(ma.last);

  var x = accelerate(ma.last.x - prev.x);
  var y = accelerate(ma.last.y - prev.y);

  if (! (x || y)) return false;

  this.canvas.beginPath();
  this.canvas.moveTo(prev.x - this.offset.x, prev.y - this.offset.y);

  this.canvas.lineTo(ma.last.x - this.offset.x, ma.last.y - this.offset.y);
  this.canvas.stroke();

  switch (this.find('i[label="super"]').val()) {
  case '':
  case null:
  case undefined:
  case 'off':
    this.post('move', {
      x: x,
      y: y
    });
    break;
  default:
    this.post('scroll', {
      x: x,
      y: y
    });
    break;
  }

  return false;
}

function onDrop(ma) {  // {{{2
  // Release buttons pressed during mousedown
  if (ma.shift) this.sendButton(1, false);
  if (ma.alt) this.sendKey('up', 'alt');

//    dragendUni(this, ma.points);
//    dragendMulti(this, ma.points);

  this.clearCanvas();
  clearEdit(this);
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

function clearEdit(that, timeout) {  // {{{2
  if (that.clearEditTimeout) return;

  that.clearEditTimeout = setTimeout(function() {
    delete that.clearEditTimeout;

    var el = that.find('section.touchArea > span');

    el.text(DefaultText);

    el = el.el.childNodes[0];
    var range = document.createRange();
    range.setStart(el, 1);
    range.setEnd(el, 1);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }, timeout || 0);
};

