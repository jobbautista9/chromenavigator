/* -*- Mode: C++; tab-width: 8; indent-tabs-mode: nil; c-basic-offset: 4 -*-
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// A large portion of the original code has been snipped.
// A large portion of this code wasn't in the original code. The license header
// is here for legal reasons, I think. If you want to look at the original,
// refer to http://lxr.mozilla.org/seamonkey/source/extensions/irc/js/lib/utils.js
// and its cvs history there.

function getWindowByType(windowType) {
  return Services.wm.getMostRecentWindow(windowType);
}

function stringTrim(s) {
  if (!s)
    return "";
  s = s.replace(/^\s+/, "");
  return s.replace(/\s+$/, "");
}

function dumpObjectTree (o, recurse, compress, level) {
  var s = "";
  var pfx = "";

  if (typeof recurse == "undefined")
    recurse = 0;
  if (typeof level == "undefined")
    level = 0;
  if (typeof compress == "undefined")
    compress = true;

  for (var i = 0; i < level; i++)
    pfx += (compress) ? "| " : "|  ";

  var tee = (compress) ? "+ " : "+- ";

  for (i in o) {
    var t, ex;

    try {
      t = typeof o[i];
    } catch (ex) {
      t = "ERROR";
    }

    switch (t) {
      case "function":
        var sfunc = String(o[i]).split("\n");
        if (sfunc[2] == "    [native code]")
          sfunc = "[native code]";
        else
          if (sfunc.length == 1)
            sfunc = String(sfunc);
          else
            sfunc = sfunc.length + " lines";
        s += pfx + tee + i + " (function) " + sfunc + "\n";
        break;

      case "object":
        s += pfx + tee + i + " (object)\n";
        if (!compress)
          s += pfx + "|\n";
        if ((i != "parent") && (recurse))
          s += dumpObjectTree (o[i], recurse - 1,
              compress, level + 1);
        break;

      case "string":
        if (o[i].length > 200)
          s += pfx + tee + i + " (" + t + ") " + 
            o[i].length + " chars\n";
        else
          s += pfx + tee + i + " (" + t + ") '" + o[i] + "'\n";
        break;

      case "ERROR":
        s += pfx + tee + i + " (" + t + ") ?\n";
        break;

      default:
        s += pfx + tee + i + " (" + t + ") " + o[i] + "\n";

    }
    if (!compress)
      s += pfx + "|\n";
  }
  s += pfx + "*\n";
  return s;
}

function confirmEx(msg, buttons, defaultButton, checkText, checkVal, parent, title) {
  /* Note that on versions before Mozilla 0.9, using 3 buttons,
   * the revert or dontsave button, or custom button titles will NOT work.
   *
   * The buttons should be listed in the 'accept', 'cancel' and 'extra' order,
   * and the exact button order is host app- and platform-dependant.
   * For example, on Windows this is usually [button 1] [button 3] [button 2],
   * and on Linux [button 3] [button 2] [button 1].
   */
  var ps = Services.prompt;

  var buttonConstants = {
    ok: ps.BUTTON_TITLE_OK,
    cancel: ps.BUTTON_TITLE_CANCEL,
    yes: ps.BUTTON_TITLE_YES,
    no: ps.BUTTON_TITLE_NO,
    save: ps.BUTTON_TITLE_SAVE,
    revert: ps.BUTTON_TITLE_REVERT,
    dontsave: ps.BUTTON_TITLE_DONT_SAVE
  };
  var buttonFlags = 0;
  var buttonText = [null, null, null];

  if (!isinstance(buttons, Array))
    throw "buttons parameter must be an Array";
  if ((buttons.length < 1) || (buttons.length > 3))
    throw "the buttons array must have 1, 2 or 3 elements";

  for (var i = 0; i < buttons.length; i++) {
    var buttonFlag = ps.BUTTON_TITLE_IS_STRING;
    if ((buttons[i][0] == "!") && (buttons[i].substr(1) in buttonConstants))
      buttonFlag = buttonConstants[buttons[i].substr(1)];
    else
      buttonText[i] = buttons[i];

    buttonFlags += ps["BUTTON_POS_" + i] * buttonFlag;
  }

  // ignore anything but a proper number
  var defaultIsNumber = (typeof defaultButton == "number");
  if (defaultIsNumber && arrayHasElementAt(buttons, defaultButton))
    buttonFlags += ps["BUTTON_POS_" + defaultButton + "_DEFAULT"];

  if (!parent)
    parent = window;
  if (!title)
    title = "Confirm";
  if (!checkVal)
    checkVal = new Object();

  var rv = ps.confirmEx(parent, title, msg, buttonFlags, buttonText[0],
      buttonText[1], buttonText[2], checkText, checkVal);
  return rv;
}

function arrayHasElementAt(ary, i) {
  return typeof ary[i] != "undefined";
}

function equalsObject(o1, o2, path) {
  if (!path)
    path = "o1";
  for (var p in o1) {
    // Recursing forever is pretty non-funny:
    if (p == "parent")
      continue;

    if (!(p in o2)) {
      throw path + "." + p + " does not occur in " + path.replace(/^o1/, "o2");
      return false;
    }

    if (typeof o1[p] == "object") {
      if (!equalsObject(o1[p], o2[p], path + "." + p))
        return false;
    }
    else if (o1[p] != o2[p]) {
      throw path + "." + p + " is " + String(o1[p]) + " while in o2 it is " + String(o2[p]);
      return false;
    }
  }
  for (p in o2) {
    // If the property did exist in o1, the previous loop tested it:
    if (!(p in o1)) {
      throw path.replace(/^o1/, "o2") + "." + p + " does not occur in " + path;
      return false;
    }
  }
  return true;
}

function isinstance(inst, base) {
  /* Returns |true| if |inst| was constructed by |base|. Not 100% accurate,
   * but plenty good enough for us. This is to work around the fix for bug
   * 254067 which makes instanceof fail if the two sides are 'from'
   * different windows (something we don't care about).
   */
  return (inst && base &&
      ((inst instanceof base) ||
       (inst.constructor && (inst.constructor.name == base.name))));
}

function formatException(ex) {
  if (isinstance(ex, Error)) {
    return getStr("exception.format", [ex.name, ex.message, ex.fileName,
        ex.lineNumber]);
  }
  if ((typeof ex == "object") && ("filename" in ex)) {
    return getStr("exception.format", [ex.name, ex.message, ex.filename,
        ex.lineNumber]);
  }

  return String(ex);
}

function glimpseEscape(str) {
  return str.replace(/([\$\^\*\[\|\(\)\!\\;,#><\-.])/g, "\\$1");
}

function getStr(id, args) {
  if (typeof args != "undefined") {
    if ((args instanceof Array) && args.length > 0)
      return document.getElementById("locale-strings").getFormattedString(id, args);
    if (args !== null && args.constructor == String)
      return document.getElementById("locale-strings").getFormattedString(id, [args]);
  }
  return document.getElementById("locale-strings").getString(id);
}

function setStatusText(str) {
  document.getElementById("status-text").setAttribute("label", str);
}

function setStatusProgress(n) {
  var progressMeter = document.getElementById("status-progress-bar");
  if (n == -1) {
    progressMeter.parentNode.parentNode.setAttribute("hidden", "true");
  } else {
    progressMeter.setAttribute("value", String(n));
    progressMeter.parentNode.parentNode.setAttribute("hidden", "false");
  }
}

function logException (ex) {
  Cu.reportError(ex);
}

function getFormattedBytes(bytes) {
  var strBytes = String(bytes);
  var ary = [];
  while (strBytes) {
    ary.unshift(strBytes.substr(-3));
    strBytes = strBytes.slice(0, -3);
  }
  let shortBytes = getShortBytes(bytes);
  if (!shortBytes) {
    return getStr("props.bytes.noshort", ary.join("."));
  }
  return getStr("props.bytes", [ary.join(".")].concat(shortBytes));
}

function getShortBytes(bytes) {
  if (bytes < 1024)
    return null
  var labels = ["KiB", "MiB", "GiB", "TiB"], i = -1;
  while (bytes > 1024) {
    bytes /= 1024;
    i++;
  }
  return [bytes.toFixed(2), labels[i]];
}

