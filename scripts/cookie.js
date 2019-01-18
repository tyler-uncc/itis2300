/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, undef:false, curly:true, browser:true, es5:true, indent:4, maxerr:500, white:true*/
/*global Cookie:true, escape:true, unescape:true*/

/**
 * Web Programming Step by Step, Cookie.js library
 * @author: Marty Stepp
 * @version: 2012/02/20
 * website: http://www.webstepbystep.com/
 *
 * This is a helper library for manipulating cookies in JavaScript.
 * It provides the following public functions:
 * 
 * ============================================================================
 * void Cookie.clear()
 * removes all cookies on the current page
 * 
 * boolean Cookie.exists(string name)
 * returns true if you have set a cookie with the given name, otherwise false
 * 
 * string Cookie.get(string name)
 * returns the value for the cookie with the given name (null if not found)
 * 
 * void Cookie.remember(HTMLElement element, string cookieName)
 * Remembers the given element (checkbox, radio button, select, text box) state
 * using the given cookie name.  If the client returns to the page, the element
 * will restore its state.  If cookieName is omitted, chosen automatically.
 * 
 * void Cookie.remove(string name)
 * deletes the cookie with the given name, if it exists
 * 
 * void Cookie.set(string name, string value)
 * sets a cookie for the given name, replacing any prior value
 * 
 * array Cookie.toArray()
 * returns all cookies on current page as an associative [name => value] array
 * 
 * array Cookie.toArrayNames()
 * returns all cookie names on current page as a standard 0-based indexed array
 * ============================================================================
 * 
 * This library passes the JSHint code analyzer (jshint.com) and, depending on
 * flags used, also passes the stricter JSLint analyzer (jslint.com).
 *
 * This software is licensed for use under the MIT license:
 * 
 * Open Source Initiative OSI - The MIT License (MIT):Licensing
 *
 * The MIT License (MIT)
 * Copyright (c) 2012 Marty Stepp
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */

/** Cookie class stores things related to cookies. */
if (typeof(Cookie) === "undefined") {
    var Cookie = function () {};
}

(function () {
    "use strict";
    
    // avoid re-loading same library twice
    if (typeof(Cookie) === "function" && typeof(Cookie.LOADED) !== "undefined") { return; }
 
    // library constants
    Cookie.AUTO_REMEMBER_STATEFUL = true;         // auto-remember elements with class 'stateful'
    Cookie.DEFAULT_EXPIRATION = 30;               // default of 30 days till cookie expires
    Cookie.COMMA_PLACEHOLDER = "_&COMMA_";
    Cookie.EQUALS_PLACEHOLDER = "_&EQUALS_";
    Cookie.SEMICOLON_PLACEHOLDER = "_&SEMI_";     // for escaping special chars in cookie text
    Cookie.COOKIE_NAME_PREFIX = "__cjs_";   // prefix for auto-named cookies
    Cookie.SUPPORTED_INPUT_TYPES = {              // a set of input type=___ values to test
        "date" : true,
        "datetime" : true,
        "datetime-local" : true,
        "email" : true,
        "hidden" : true,
        "month" : true,
        "number" : true,
        "password" : true,
        "search" : true,
        "tel" : true,
        "text" : true,
        "time" : true,
        "url" : true,
        "week" : true
    };

    /** Removes all cookies on the current page. */
    Cookie.clear = function (name) {
        var cookies = Cookie.toArrayNames();
        for (var i = 0; i < cookies.length; i++) {
            Cookie.remove(cookies[i]);
        }
    };

    /** Returns true if a cookie exists with the given name. */
    Cookie.exists = function (name) {
        return Cookie.get(name) !== null;
    };

    /** Returns the value of the cookie with the given name (null if not found). */
    Cookie.get = function (name) {
        name = Cookie.encodeName(name);
        var cookies = Cookie.toArray();
        if (typeof(cookies[name]) !== "undefined") {
            return cookies[name];
        } else {
            return null;
        }
    };

    /** 
     * Turns the given HTML DOM element into one that will remember its
     * state (value, checked-ness, etc.), using a cookie with the given name.
     * If the client returns to this page later, the element will restore its state.
     *
     * Works with the following DOM element types:
     * <input type="checkbox" />         - remembers whether box is checked
     * <input type="text" />
     * <input type="password" />         - remembers the text typed into the box
     * <datalist>...</datalist>
     * <textarea>...</textarea>
     * <select>...</select>              - remembers which option has been selected
     * <input type="radio" name="..." /> - remembers which radio button is selected
     *
     * When used with radio buttons, this needs to be called on only one of the
     * buttons in a particular 'name' group; it'll attach to the others too.
     *
     * element can be a string id or an HTML DOM element object.
     * If no cookieName is passed, one is chosen automatically based on
     * the element's id or name attribute.
     */
    Cookie.remember = function (element, cookieName, expiration) {
        // resolve true element and cookie name to use
        element = Cookie.resolveElement(element);
        if (!element || typeof(element.tagName) !== "string") {
            throw "Cookie.js: DOM element cannot be undefined or null, and must be a valid HTML DOM element object";
        }
        cookieName = Cookie.resolveName(element, cookieName);
        if (element.remembered && element.cookieName === cookieName) {
            // already remembered by this cookie name; no need to repeat
            return;
        }
        
        var tag = element.tagName.toLowerCase();
        var type = element.type;
        
        if (tag === "select" || tag === "textarea" || tag === "datalist" ||
                (tag === "input" && (!type || Cookie.SUPPORTED_INPUT_TYPES[type]))) {
            // text box (single or multi line), or select box (must remember 'value' property)
            Cookie.makeStatefulTextBox(element, cookieName, expiration);
        } else if (tag === "input" && type === "checkbox") {
            // checkbox (must remember 'checked' property)
            Cookie.makeStatefulCheckbox(element, cookieName, expiration);
        } else if (tag === "input" && type === "radio") {
            // radio button (must remember 'value' property and manage a group)
            Cookie.makeStatefulRadioButton(element, cookieName, expiration);
        } else {
            throw "Cookie.js: Unsupported DOM element " + tag + ": " + element;
        }
    };

    /** Removes the cookie with the given name. */
    Cookie.remove = function (name) {
        Cookie.set(name, "", -1);
    };

    /** Sets the cookie with the given name to have the given value.
     *  Can pass an optional number of days till expiration
     *  (default 0, meaning a session cookie that expires after the current browser session)
     *  and an optional URL path within the current domain (default /).
     */
    Cookie.set = function (name, value, days, path) {
        name = Cookie.encodeName(name);
        value = Cookie.encodeValue(value);
        var expires = "";   // days === 0, default
        if (days && days > 0) {
            var date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toGMTString();
        } else if (days < 0) {
            expires = "; expires=Thu, 01-Jan-1970 00:00:01 GMT";
        }
        if (!path) {
            path = "/";
        }
        document.cookie = name + "=" + value + expires + "; path=" + path;
    };
    
    /** Returns all cookies on current page as an associative [name => value] array. */
    Cookie.toArray = function () {
        var hash = {};
        var cookies = document.cookie.split(/[ ]*;[ ]*/);
        for (var i = 0; i < cookies.length; i++) {
            var crumbs = cookies[i].split("=");
            if (crumbs.length >= 2) {
                hash[crumbs[0]] = Cookie.decodeValue(crumbs[1]);
            }
        }
        return hash;
    };
    
    /** Returns all cookie -names- on current page as a standard 0-based-indexed array. */
    Cookie.toArrayNames = function () {
        var a = [];
        var cookies = document.cookie.split(/[ ]*;[ ]*/);
        for (var i = 0; i < cookies.length; i++) {
            var crumbs = cookies[i].split("=");
            if (crumbs.length < 2) {
                continue;
            }
            a.push(crumbs[0]);
        }
        return a;
    };
    
    
    // * BEGIN UNDOCUMENTED PRIVATE FUNCTIONS *
    // The functions below are internal functions used to implement the public API above.
    // They should not be called directly by clients.
    // Since they are not published public API, we do not guarantee that they will
    // remain in future versions of this library.  Do not call or depend on these below.
    
    /** Helper for adding an event listener to a DOM element. */
    Cookie.addEventListener = function (element, event, fn) {
        if (!event) {
            throw "Cookie.js: event name cannot be null or empty";
        }
        if (typeof(fn) !== "function") {
            throw "Cookie.js: event handler function cannot be null or empty";
        }
        Cookie.resolveElement(element);
        if (element.addEventListener) {
            element.addEventListener(event, fn, false);
        } else if (element.attachEvent) {   // IE makes web dev cry :-(
            element.attachEvent("on" + event, fn);
        } else {
            element["on" + event] = fn;   // fallback to DOM level 0 events
        }
    };

    /** Strips illegal cookie-name characters from the given cookie name and returns it. */
    Cookie.encodeName = function (name) {
        if (!name) {
            throw "Cookie.js: cookie name cannot be null or empty";
        }
        return name.replace(/[^a-zA-Z0-9_]+/g, "");  // strip illegal chars
    };

    /** Encodes illegal cookie-name characters from the given cookie value and returns it. */
    Cookie.encodeValue = function (value) {
        if (typeof(value) !== "string") {
            value = "" + value;   // convert to string first
        }
        if (value && typeof(value.replace) === "function") {
            value = value.replace(/[;]/g, Cookie.SEMICOLON_PLACEHOLDER);   // semicolon is the cookie delimiter; must escape
            value = value.replace(/[,]/g, Cookie.COMMA_PLACEHOLDER);       // comma is also a cookie delimiter; must escape
            value = value.replace(/[=]/g, Cookie.EQUALS_PLACEHOLDER);      // equals is also a cookie delimiter; must escape
            // value = escape(value);
        }
        return value;
    };

    /** Encodes illegal cookie-name characters from the given cookie value and returns it. */
    Cookie.decodeValue = function (value) {
        if (typeof(value) !== "string") {
            value = "" + value;   // convert to string first
        }
        if (value && typeof(value.replace) === "function") {
            value = value.replace(new RegExp(Cookie.SEMICOLON_PLACEHOLDER, "g"), ";");
            value = value.replace(new RegExp(Cookie.COMMA_PLACEHOLDER, "g"), ",");
            value = value.replace(new RegExp(Cookie.EQUALS_PLACEHOLDER, "g"), "=");
            // value = unescape(value);
        }
        return value;
    };

    /** Turns the given checkbox into one that will remember its checked-ness,
     *  using a client-side cookie with the given name.
     */
    Cookie.makeStatefulCheckbox = function (element, cookieName, expiration) {
        Cookie.makeStatefulHelper(element, cookieName, expiration, Cookie.statefulCheckboxChange);
    };
    
    /** Turns the given radio button into one that will remember its checked-ness,
     *  using a client-side cookie with the given name.
     *  Will also uncheck other radio buttons in the same name group.
     */
    Cookie.makeStatefulRadioButton = function (element, cookieName, expiration) {
        element = Cookie.resolveElement(element);
        if (element.name) {
            // set radio buttons' checked values to saved value from cookie
            var radios = document.getElementsByName(element.name);
            for (var i = 0; i < radios.length; i++) {
                Cookie.makeStatefulHelper(radios[i], cookieName, expiration, Cookie.statefulRadioButtonChange);
            }
        } else {
            // no name attribute; just a single radio button (unusual, but okay)
            Cookie.makeStatefulHelper(element, cookieName, expiration, Cookie.statefulCheckboxChange);
        }
    };
    
    /** Turns the given select box into one that will remember its selected value,
     *  using a client-side cookie with the given name.
     */
    Cookie.makeStatefulSelect = function (element, cookieName, expiration) {
        element = Cookie.resolveElement(element);
        cookieName = Cookie.resolveName(element, cookieName);
        element.cookieName = cookieName;
        if (Cookie.exists(cookieName)) {
            element.value = Cookie.get(cookieName);
            if (!element.disabled && typeof(element.onchange) === "function") {
                element.onchange();
            }
        }
        Cookie.addEventListener(element, "change", function (event) {
            if (!element.disabled) {
                Cookie.statefulSelectChange(element, cookieName, expiration);
            }
        });
        element.remembered = true;
    };

    /** Turns the given input text box into one that will remember its selected value,
     *  using a client-side cookie with the given name.
     *  Works for input type=text and for textarea.
     *  (identical implementation code to makeStatefulSelect)
     */
    Cookie.makeStatefulTextBox = Cookie.makeStatefulSelect;
    
    // private helper to capture common code between check box and radio button
    Cookie.makeStatefulHelper =  function (element, cookieName, expiration, handler) {
        element = Cookie.resolveElement(element);
        cookieName = Cookie.resolveName(element, cookieName);
        element.cookieName = cookieName;
        if (Cookie.exists(cookieName) && !element.disabled) {
            var cookieValue = Cookie.get(cookieName);
            var shouldBeChecked = cookieValue === "true" || cookieValue === element.value;
            if (Boolean(element.checked) !== Boolean(shouldBeChecked)) {
                element.checked = shouldBeChecked;
                if (!element.disabled && typeof(element.onclick) === "function") {
                    element.onclick();
                }
                if (!element.disabled && typeof(element.onchange) === "function") {
                    element.onchange();
                }
            }
        }
        Cookie.addEventListener(element, "change", function (event) {
            if (!element.disabled) {
                handler(element, cookieName, expiration);
            }
        });
        element.remembered = true;
    };
    
    /** This function is called when a "stateful" checkbox's checked state
     *  changes, and stores that state in a cookie to be restored later.
     */
    Cookie.statefulCheckboxChange = function (element, cookieName, expiration) {
        if (typeof(expiration) === "undefined" || expiration < 0) {
            expiration = Cookie.DEFAULT_EXPIRATION;   // default # days
        }
        element = Cookie.resolveElement(element);
        cookieName = Cookie.resolveName(element, cookieName);
        Cookie.set(cookieName, element.checked ? "true" : "false", expiration);
    };

    // This function is called when a "stateful" radio button's checked state
    // changes, and stores that state in a cookie to be restored later.
    Cookie.statefulRadioButtonChange = function (element, cookieName, expiration) {
        if (typeof(expiration) === "undefined" || expiration < 0) {
            expiration = Cookie.DEFAULT_EXPIRATION;   // default # days
        }
        element = Cookie.resolveElement(element);
        cookieName = Cookie.resolveName(element, cookieName);
        
        // also set all cookies for all other radio buttons in this button's group
        if (element.checked) {
            Cookie.set(cookieName, element.value, expiration);
            if (element.name) {
                var radios = document.getElementsByName(element.name);
                for (var i = 0; i < radios.length; i++) {
                    if (radios[i].cookieName && radios[i].cookieName !== cookieName) {
                        Cookie.set(radios[i].cookieName, "false", expiration);
                    }
                }
            }
        }
    };

    /**
     * This function is called when a "stateful" select box's selected element
     * changes, and stores that value in a cookie to be restored later.
     */
    Cookie.statefulSelectChange = function (element, cookieName, expiration) {
        if (typeof(expiration) === "undefined" || expiration < 0) {
            expiration = Cookie.DEFAULT_EXPIRATION;   // default # days
        }
        element = Cookie.resolveElement(element);
        cookieName = Cookie.resolveName(element, cookieName);
        Cookie.set(cookieName, element.value, expiration);
    };

    /**
     * Helper for resolving an HTML DOM element.
     * This allows the client to pass a string ID or a DOM element object.
     */
    Cookie.resolveElement = function (element) {
        if (!element) {
            throw "Cookie.js: failed attempt to resolve null/empty DOM element";
        } else if (typeof(element) === "string") {
            if (document && document.body && typeof(document.getElementById) === "function") {
                return document.getElementById(element);
            } else {
                throw "Cookie.js: document.body hasn't been created yet; you must wait for window load event to attach cookies to DOM elements";
            }
        } else if (typeof(element) !== "object") {
            throw "Cookie.js: not a valid HTML DOM element: " + element;
        } else {
            return element;
        }
    };

    /**
     * Helper for resolving a cookie name.
     * This allows the caller to leave the cookie name blank and we will
     * automatically set it based on the name or id attribute of the element.
     */
    Cookie.resolveName = function (element, cookieName) {
        if (cookieName) {
            return cookieName;
        } 
        element = Cookie.resolveElement(element);
        if (element.type === "radio" && element.name) {
            // use form query parameter name for radio buttons
            return Cookie.COOKIE_NAME_PREFIX + element.name;
        } else if (element.id) {
            // try id first because ids must be unique on the page
            return "__cookie_js_" + element.id;
        } else if (element.name) {
            // try form query parameter name
            return "__cookie_js_" + element.name;
        } else {
            throw "Cookie.js: cannot resolve a valid cookie name for HTML DOM element: " + element;
        }
    };
    
    /**
     * Automatically attaches listeners to all elements on the page with class 'remember'.
     * A convenience so that you can use the library without having to write any of your own JS code.
     * Just put class="remember" on the form elements you want to remember, and off you go.
     */
    Cookie.rememberAllStateful = function () {
        if (typeof(document.querySelectorAll) === "function") {
            var statefuls = document.querySelectorAll(".remember");
            for (var i = 0; i < statefuls.length; i++) {
                var tag = statefuls[i].tagName.toLowerCase();
                if (tag === "input" || tag === "select" || tag === "textarea") {
                    Cookie.remember(statefuls[i]);
                } else if (typeof(statefuls[i].querySelectorAll) === "function") {
                    // a div or form or something; find all input elements inside and make them stateful
                    var statefulInputs = statefuls[i].querySelectorAll("input, select, textarea, datalist");
                    for (var j = 0; j < statefulInputs.length; j++) {
                        Cookie.remember(statefulInputs[j]);
                    }
                }
            }
        }
    };
    
    Cookie.LOADED = true;
    
    // 'main' method to handle window.onload
    if (Cookie.AUTO_REMEMBER_STATEFUL) {
        Cookie.addEventListener(window, "load", Cookie.rememberAllStateful);
    }
})();
