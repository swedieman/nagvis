/*****************************************************************************
 *
 * nagvis.js - Some NagVis function which are used in NagVis frontend
 *
 * Copyright (c) 2004-2010 NagVis Project (Contact: info@nagvis.org)
 *
 * License:
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 2 as
 * published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 675 Mass Ave, Cambridge, MA 02139, USA.
 *
 *****************************************************************************/
 
/**
 * @author	Lars Michelsen <lars@vertical-visions.de>
 */

/* Comments for jslint */
/*global document, location, navigator, window, setTimeout, ActiveXObject */
/*global XMLHttpRequest, alert */

/*jslint evil: true, */

/* Initiate global vars which are set later in the parsed HTML */
var oWorkerProperties, oGeneralProperties, oRotationProperties, oPageProperties;
var oViewProperties;
var oFileAges;
var oStatusMessageTimer;
var aMapObjects = [];
var oMapSummaryObj;
var regexCache = {};

// Initialize and define some other basic vars
var iNow = Date.parse(new Date());

// Define some state options
var oStates = {};

function date(format, timestamp) {
    // http://kevin.vanzonneveld.net
    // +   original by: Carlos R. L. Rodrigues (http://www.jsfromhell.com)
    // +      parts by: Peter-Paul Koch (http://www.quirksmode.org/js/beat.html)
    // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +   improved by: MeEtc (http://yass.meetcweb.com)
    // +   improved by: Brad Touesnard
    // +   improved by: Tim Wiel
    // +   improved by: Bryan Elliott
    //
    // +   improved by: Brett Zamir (http://brett-zamir.me)
    // +   improved by: David Randall
    // +      input by: Brett Zamir (http://brett-zamir.me)
    // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +   improved by: Brett Zamir (http://brett-zamir.me)
    // +   improved by: Brett Zamir (http://brett-zamir.me)
    // +   improved by: Theriault
    // +  derived from: gettimeofday
    // +      input by: majak
    // +   bugfixed by: majak
    // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +      input by: Alex
    // +   bugfixed by: Brett Zamir (http://brett-zamir.me)
    // +   improved by: Theriault
    // +   improved by: Brett Zamir (http://brett-zamir.me)
    // +   improved by: Theriault
    // +   improved by: Thomas Beaucourt (http://www.webapp.fr)
    // +   improved by: JT
    // +   improved by: Theriault
    // +   improved by: Rafał Kukawski (http://blog.kukawski.pl)
    // %        note 1: Uses global: php_js to store the default timezone
    // %        note 2: Although the function potentially allows timezone info (see notes), it currently does not set
    // %        note 2: per a timezone specified by date_default_timezone_set(). Implementers might use
    // %        note 2: this.php_js.currentTimezoneOffset and this.php_js.currentTimezoneDST set by that function
    // %        note 2: in order to adjust the dates in this function (or our other date functions!) accordingly
    // *     example 1: date('H:m:s \\m \\i\\s \\m\\o\\n\\t\\h', 1062402400);
    // *     returns 1: '09:09:40 m is month'
    // *     example 2: date('F j, Y, g:i a', 1062462400);
    // *     returns 2: 'September 2, 2003, 2:26 am'
    // *     example 3: date('Y W o', 1062462400);
    // *     returns 3: '2003 36 2003'
    // *     example 4: x = date('Y m d', (new Date()).getTime()/1000); 
    // *     example 4: (x+'').length == 10 // 2009 01 09
    // *     returns 4: true
    // *     example 5: date('W', 1104534000);
    // *     returns 5: '53'
    // *     example 6: date('B t', 1104534000);
    // *     returns 6: '999 31'
    // *     example 7: date('W U', 1293750000.82); // 2010-12-31
    // *     returns 7: '52 1293750000'
    // *     example 8: date('W', 1293836400); // 2011-01-01
    // *     returns 8: '52'
    // *     example 9: date('W Y-m-d', 1293974054); // 2011-01-02
    // *     returns 9: '52 2011-01-02'
    var that = this,
        jsdate, f, formatChr = /\\?([a-z])/gi, formatChrCb,
        // Keep this here (works, but for code commented-out
        // below for file size reasons)
        //, tal= [],
        _pad = function (n, c) {
            if ((n = n + "").length < c) {
                return new Array((++c) - n.length).join("0") + n;
            } else {
                return n;
            }
        },
        txt_words = ["Sun", "Mon", "Tues", "Wednes", "Thurs", "Fri", "Satur",
        "January", "February", "March", "April", "May", "June", "July",
        "August", "September", "October", "November", "December"],
        txt_ordin = {
            1: "st",
            2: "nd",
            3: "rd",
            21: "st", 
            22: "nd",
            23: "rd",
            31: "st"
        };
    formatChrCb = function (t, s) {
        return f[t] ? f[t]() : s;
    };
    f = {
    // Day
        d: function () { // Day of month w/leading 0; 01..31
            return _pad(f.j(), 2);
        },
        D: function () { // Shorthand day name; Mon...Sun
            return f.l().slice(0, 3);
        },
        j: function () { // Day of month; 1..31
            return jsdate.getDate();
        },
        l: function () { // Full day name; Monday...Sunday
            return txt_words[f.w()] + 'day';
        },
        N: function () { // ISO-8601 day of week; 1[Mon]..7[Sun]
            return f.w() || 7;
        },
        S: function () { // Ordinal suffix for day of month; st, nd, rd, th
            return txt_ordin[f.j()] || 'th';
        },
        w: function () { // Day of week; 0[Sun]..6[Sat]
            return jsdate.getDay();
        },
        z: function () { // Day of year; 0..365
            var a = new Date(f.Y(), f.n() - 1, f.j()),
                b = new Date(f.Y(), 0, 1);
            return Math.round((a - b) / 864e5) + 1;
        },

    // Week
        W: function () { // ISO-8601 week number
            var a = new Date(f.Y(), f.n() - 1, f.j() - f.N() + 3),
                b = new Date(a.getFullYear(), 0, 4);
            return 1 + Math.round((a - b) / 864e5 / 7);
        },

    // Month
        F: function () { // Full month name; January...December
            return txt_words[6 + f.n()];
        },
        m: function () { // Month w/leading 0; 01...12
            return _pad(f.n(), 2);
        },
        M: function () { // Shorthand month name; Jan...Dec
            return f.F().slice(0, 3);
        },
        n: function () { // Month; 1...12
            return jsdate.getMonth() + 1;
        },
        t: function () { // Days in month; 28...31
            return (new Date(f.Y(), f.n(), 0)).getDate();
        },

    // Year
        L: function () { // Is leap year?; 0 or 1
            return new Date(f.Y(), 1, 29).getMonth() === 1 | 0;
        },
        o: function () { // ISO-8601 year
            var n = f.n(), W = f.W(), Y = f.Y();
            return Y + (n === 12 && W < 9 ? -1 : n === 1 && W > 9);
        },
        Y: function () { // Full year; e.g. 1980...2010
            return jsdate.getFullYear();
        },
        y: function () { // Last two digits of year; 00...99
            return (f.Y() + "").slice(-2);
        },

    // Time
        a: function () { // am or pm
            return jsdate.getHours() > 11 ? "pm" : "am";
        },
        A: function () { // AM or PM
            return f.a().toUpperCase();
        },
        B: function () { // Swatch Internet time; 000..999
            var H = jsdate.getUTCHours() * 36e2, // Hours
                i = jsdate.getUTCMinutes() * 60, // Minutes
                s = jsdate.getUTCSeconds(); // Seconds
            return _pad(Math.floor((H + i + s + 36e2) / 86.4) % 1e3, 3);
        },
        g: function () { // 12-Hours; 1..12
            return f.G() % 12 || 12;
        },
        G: function () { // 24-Hours; 0..23
            return jsdate.getHours();
        },
        h: function () { // 12-Hours w/leading 0; 01..12
            return _pad(f.g(), 2);
        },
        H: function () { // 24-Hours w/leading 0; 00..23
            return _pad(f.G(), 2);
        },
        i: function () { // Minutes w/leading 0; 00..59
            return _pad(jsdate.getMinutes(), 2);
        },
        s: function () { // Seconds w/leading 0; 00..59
            return _pad(jsdate.getSeconds(), 2);
        },
        u: function () { // Microseconds; 000000-999000
            return _pad(jsdate.getMilliseconds() * 1000, 6);
        },

    // Timezone
        e: function () { // Timezone identifier; e.g. Atlantic/Azores, ...
// The following works, but requires inclusion of the very large
// timezone_abbreviations_list() function.
/*              return this.date_default_timezone_get();
*/
            throw 'Not supported (see source code of date() for timezone on how to add support)';
        },
        I: function () { // DST observed?; 0 or 1
            // Compares Jan 1 minus Jan 1 UTC to Jul 1 minus Jul 1 UTC.
            // If they are not equal, then DST is observed.
            var a = new Date(f.Y(), 0), // Jan 1
                c = Date.UTC(f.Y(), 0), // Jan 1 UTC
                b = new Date(f.Y(), 6), // Jul 1
                d = Date.UTC(f.Y(), 6); // Jul 1 UTC
            return 0 + ((a - c) !== (b - d));
        },
        O: function () { // Difference to GMT in hour format; e.g. +0200
            var a = jsdate.getTimezoneOffset();
            return (a > 0 ? "-" : "+") + _pad(Math.abs(a / 60 * 100), 4);
        },
        P: function () { // Difference to GMT w/colon; e.g. +02:00
            var O = f.O();
            return (O.substr(0, 3) + ":" + O.substr(3, 2));
        },
        T: function () { // Timezone abbreviation; e.g. EST, MDT, ...
// The following works, but requires inclusion of the very
// large timezone_abbreviations_list() function.
/*              var abbr = '', i = 0, os = 0, default = 0;
            if (!tal.length) {
                tal = that.timezone_abbreviations_list();
            }
            if (that.php_js && that.php_js.default_timezone) {
                default = that.php_js.default_timezone;
                for (abbr in tal) {
                    for (i=0; i < tal[abbr].length; i++) {
                        if (tal[abbr][i].timezone_id === default) {
                            return abbr.toUpperCase();
                        }
                    }
                }
            }
            for (abbr in tal) {
                for (i = 0; i < tal[abbr].length; i++) {
                    os = -jsdate.getTimezoneOffset() * 60;
                    if (tal[abbr][i].offset === os) {
                        return abbr.toUpperCase();
                    }
                }
            }
*/
            return 'UTC';
        },
        Z: function () { // Timezone offset in seconds (-43200...50400)
            return -jsdate.getTimezoneOffset() * 60;
        },

    // Full Date/Time
        c: function () { // ISO-8601 date.
            return 'Y-m-d\\Th:i:sP'.replace(formatChr, formatChrCb);
        },
        r: function () { // RFC 2822
            return 'D, d M Y H:i:s O'.replace(formatChr, formatChrCb);
        },
        U: function () { // Seconds since UNIX epoch
            return jsdate.getTime() / 1000 | 0;
        }
    };
    this.date = function (format, timestamp) {
        that = this;
        jsdate = (
            (typeof timestamp === 'undefined') ? new Date() : // Not provided
            (timestamp instanceof Date) ? new Date(timestamp) : // JS Date()
            new Date(timestamp * 1000) // UNIX timestamp (auto-convert to int)
        );
        return format.replace(formatChr, formatChrCb);
    };
    return this.date(format, timestamp);
}

/**
 * Update the worker counter
 *
 * @author	Lars Michelsen <lars@vertical-visions.de>
 */
function updateWorkerCounter() {
	var oWorkerCounter = document.getElementById('workerLastRunCounter');
	// write the time to refresh to header counter
	if(oWorkerCounter) {
		if(oWorkerProperties.last_run) {
			oWorkerCounter.innerHTML = date(oGeneralProperties.date_format, oWorkerProperties.last_run/1000);
		}
	}
	oWorkerCounter = null;
	return true;
}

/**
 * Function to start the page refresh/rotation
 *
 * @author	Lars Michelsen <lars@vertical-visions.de>
 */
function rotatePage() {
	if(oRotationProperties.nextStepUrl !== '') {
		if(oRotationProperties.rotationEnabled == true) {
			window.open(oRotationProperties.nextStepUrl, "_self");
			return true;
		}
	} else {
		window.location.reload(true);
		return true;
	}
	return false;
}

/**
 * Function counts down in 1 second intervals. If nextRotationTime is smaller
 * than 0, refresh/rotate
 *
 * @author	Lars Michelsen <lars@vertical-visions.de>
 */
function rotationCountdown() {
	// Only proceed with counting when rotation is enabled and the next step time 
	// has a proper value
	if(oRotationProperties.rotationEnabled && oRotationProperties.rotationEnabled == true && oRotationProperties.nextStepTime && oRotationProperties.nextStepTime !== '') {
		// Countdown one second
		oRotationProperties.nextStepTime -= 1;
		
		if(oRotationProperties.nextStepTime <= 0) {
			return rotatePage();
		} else {
			var oRefCountHead = document.getElementById('refreshCounterHead');
			// write the time to refresh to header counter
			if(oRefCountHead) {
				oRefCountHead.innerHTML = oRotationProperties.nextStepTime;
				oRefCountHead = null;
			}
			
			var oRefCount = document.getElementById('refreshCounter');
			// write the time to refresh to the normal counter
			if(oRefCount) {
				oRefCount.innerHTML = oRotationProperties.nextStepTime;
				oRefCount = null;
			}
		}
	}
	return false;
}

/**
 * Function gets the value of url params
 *
 * @author	Lars Michelsen <lars@vertical-visions.de>
 */
function getUrlParam(name) {
	var name2 = name.replace('[', '\\[').replace(']', '\\]');
	var regexS = "[\\?&]"+name2+"=([^&#]*)";
	var regex = new RegExp( regexS );
	var results = regex.exec(window.location);
	if(results === null) {
		return '';
	} else {
		return results[1];
	}
}

/**
 * Function to set the rotation switch label dynamicaly
 *
 * @author	Lars Michelsen <lars@vertical-visions.de>
 */
function setRotationLabel() {
	if(oRotationProperties.rotationEnabled == true) {
		document.getElementById('rotationStart').style.display = 'none';
		document.getElementById('rotationStop').style.display = 'inline';
	} else {
		document.getElementById('rotationStart').style.display = 'inline';
		document.getElementById('rotationStop').style.display = 'none';
	}
}

/**
 * Function to start/stop the rotation
 *
 * @author	Lars Michelsen <lars@vertical-visions.de>
 */
function switchRotation() {
	if(oRotationProperties.rotationEnabled == true) {
		oRotationProperties.rotationEnabled = false;
		
		setRotationLabel();
	} else {
		oRotationProperties.rotationEnabled = true;
		
		setRotationLabel();
	}
}

function getCurrentTime() {
	var oDate = new Date();
	var sHours = oDate.getHours();
	sHours = (( sHours < 10) ? "0"+sHours : sHours);
	var sMinutes = oDate.getMinutes();
	sMinutes = (( sMinutes < 10) ? "0"+sMinutes : sMinutes);
	var sSeconds = oDate.getSeconds();
	sSeconds = (( sSeconds < 10) ? "0"+sSeconds : sSeconds);
	
	return sHours+":"+sMinutes+":"+sSeconds;
}

function getRandomLowerCaseLetter() {
   return String.fromCharCode(97 + Math.round(Math.random() * 25));
}

function getRandom(min, max) {
	if( min > max ) {
		return -1;
	}
	
	if( min == max ) {
		return min;
	}
	
	return min + parseInt(Math.random() * (max-min+1), 0);
}

function cloneObject(what) {
	var o;
	var i;
	
	if(what instanceof Array) {
		o = [];
	} else {
		o = {};
	}
	
	for (i in what) {
		if (typeof what[i] == 'object') {
			if(i != 'parsedObject') {
				o[i] = cloneObject(what[i]);
			}
		} else {
			o[i] = what[i];
		}
	}
	
	return o;
}

function pageWidth() {
	var w;
	
	if(window.innerWidth !== null  && typeof window.innerWidth !== 'undefined') { 
		w = window.innerWidth;
	} else if(document.documentElement && document.documentElement.clientWidth) {
		w = document.documentElement.clientWidth;
	} else if(document.body !== null) {
		w = document.body.clientWidth;
	} else {
		w = null;
	}
	
	return w;
}

function pageHeight() {
	var h;
	
	if(window.innerHeight !== null && typeof window.innerHeight !== 'undefined') {
		h = window.innerHeight;
	} else if(document.documentElement && document.documentElement.clientHeight) {
		h = document.documentElement.clientHeight;
	} else if(document.body !== null) {
		h = document.body.clientHeight;
	} else {
		h = null;
	}
	
	return h;
}

function getScrollTop() {
	if (typeof window.pageYOffset !== 'undefined') 
		return window.pageYOffset;
	else if (typeof document.compatMode !== 'undefined' && document.compatMode !== 'BackCompat')
		return document.documentElement.scrollTop;
	else if (typeof document.body !== 'undefined')
		return document.body.scrollTop;
}

function getScrollLeft() {
	if (typeof window.pageXOffset !== 'undefined') 
		return window.pageXOffset;
	else if (typeof document.compatMode != 'undefined' && document.compatMode !== 'BackCompat')
		return document.documentElement.scrollLeft;
	else if (typeof document.body !== 'undefined')
		return document.body.scrollLeft;
}


/**
 * Scrolls the screen to the defined coordinates
 *
 * @author	Lars Michelsen <lars@vertical-visions.de>
 */
function scrollSlow(iTargetX, iTargetY, iSpeed) {
	var currentScrollTop = getScrollTop();
	var currentScrollLeft = getScrollLeft();
	var iMapOffsetTop;
	var scrollTop;
	var scrollLeft;
	var iWidth;
	var iHeight;
	
	var iStep = 2;
	
	// Get offset of the map div
	var oMap = document.getElementById('map');
	if(oMap && oMap.offsetTop) {
		iMapOffsetTop = oMap.offsetTop;
	} else {
		iMapOffsetTop = 0;
	}
	oMap = null;
	
	// Get measure of the screen
	iWidth = pageWidth();
	iHeight = pageHeight() - iMapOffsetTop;
		
	if(iTargetY <= (currentScrollTop+iHeight)  && iTargetY >= currentScrollTop) {
		// Target is in current view
		scrollTop = 0;
	} else if(iTargetY < currentScrollTop) {
		// Target is above current view
		scrollTop = -iStep;
	} else if(iTargetY > currentScrollTop) {
		// Target is below current view
		scrollTop = iStep;
	}
	
	if(iTargetX <= (currentScrollLeft+iWidth) && iTargetX >= currentScrollLeft) {
		// Target is in current view
		scrollLeft = 0;
	} else if(iTargetX < currentScrollLeft) {
		// Target is left from current view
		scrollLeft = -iStep;
	} else if(iTargetX > currentScrollLeft) {
		// Target is right from current view
		scrollLeft = iStep;
	} else {
		scrollLeft = 0;
	}
	
	eventlog("scroll", "debug", currentScrollLeft+" to "+iTargetX+" = "+scrollLeft+", "+currentScrollTop+" to "+iTargetY+" = "+scrollTop);
	
	if(scrollTop !== 0 || scrollLeft !== 0) {
		window.scrollBy(scrollLeft, scrollTop);
		
		setTimeout(function() { scrollSlow(iTargetX, iTargetY, iSpeed); }, iSpeed);
	} else {
		eventlog("scroll", "debug", 'No need to scroll: '+currentScrollLeft+' - '+iTargetX+', '+currentScrollTop+' - '+iTargetY);
	}
}

/**
 * escapeUrlValues
 *
 * Escapes some evil signs in the url parameters
 *
 * @author	Lars Michelsen <lars@vertical-visions.de>
 */
function escapeUrlValues(sStr) {
	if(typeof sStr === undefined || sStr === null || sStr === '') {
		return sStr;
	}
	
	sStr = new String(sStr);
	
	if(sStr.search('\\+') !== -1) {
		sStr = sStr.replace(/\+/g, '%2B');
	}
	
	if(sStr.search('&') !== -1) {
		sStr = sStr.replace(/&/g, '%26');
	}
	
	if(sStr.search('#') !== -1) {
		sStr = sStr.replace(/#/g, '%23');
	}
	
	if(sStr.search(':') !== -1) {
		sStr = sStr.replace(/:/g, '%3A');
	}
	
	if(sStr.search(' ') !== -1) {
		sStr = sStr.replace(/ /g, '%20');
	}
	
	if(sStr.search('=') !== -1) {
		sStr = sStr.replace(/=/g, '%3D');
	}
	
	if(sStr.search('\\?') !== -1) {
		sStr = sStr.replace(/\?/g, '%3F');
	}
	
	return sStr;
}

/**
 * Function to dumping arrays/objects in javascript for debugging purposes
 * Taken from http://refactormycode.com/codes/226-recursively-dump-an-object
 *
 * @author	Lars Michelsen <lars@vertical-visions.de>
 */
function oDump(object, depth, max){
	depth = depth || 0;
	max = max || 2;
	
	if (depth > max) {
		return false;
	}
	
	var indent = "";
	for (var i = 0; i < depth; i++) {
		indent += "  ";
	}
	
	var output = "";  
	for (var key in object) {
		output += "\n" + indent + key + ": ";
		switch (typeof object[key]) {
			case "object": output += oDump(object[key], depth + 1, max); break;
			case "function": output += "function"; break;
			default: output += object[key]; break;        
		}
	}
	return output;
}

/**
 * Detect firefox browser
 *
 * @author	Lars Michelsen <lars@vertical-visions.de>
 */
function isFirefox() {
  return navigator.userAgent.indexOf("Firefox") > -1;
}

/*
 * addDOMLoadEvent - Option schedules given javascript code to be executed after
 *                   the whole page was loaded in browser
 *
 * (c)2006 Jesse Skinner/Dean Edwards/Matthias Miller/John Resig
 * Special thanks to Dan Webb's domready.js Prototype extension
 * and Simon Willison's addLoadEvent
 *
 * For more info, see:
 * http://www.thefutureoftheweb.com/blog/adddomloadevent
 * http://dean.edwards.name/weblog/2006/06/again/
 * http://www.vivabit.com/bollocks/2006/06/21/a-dom-ready-extension-for-prototype
 * http://simon.incutio.com/archive/2004/05/26/addLoadEvent
 *
 * Hope the use here in NagVis is ok for license reasons. If not please contact me.
 *
 * @author	Lars Michelsen <lars@vertical-visions.de>
 */
addDOMLoadEvent = (function(){
    // create event function stack
    var load_events = [],
        load_timer,
        script,
        done,
        exec,
        old_onload,
        init = function () {
            done = true;

            // kill the timer
            clearInterval(load_timer);

            // execute each function in the stack in the order they were added
            while (exec = load_events.shift())
                exec();

            if (script) script.onreadystatechange = '';
        };

    return function (func) {
        // if the init function was already ran, just run this function now and stop
        if (done) return func();

        if (!load_events[0]) {
            // for Mozilla/Opera9
            if (document.addEventListener)
                document.addEventListener("DOMContentLoaded", init, false);

            // for Internet Explorer
            /*@cc_on @*/
            /*@if (@_win32)
                document.write("<script id=__ie_onload defer src=><\/script>");
                script = document.getElementById("__ie_onload");
                script.onreadystatechange = function() {
                    if (this.readyState == "complete")
                        init(); // call the onload handler
                };
              @end
            @*/

            // for Safari
            if (/WebKit/i.test(navigator.userAgent)) { // sniff
                load_timer = setInterval(function() {
                    if (/loaded|complete/.test(document.readyState))
                        init(); // call the onload handler
                }, 10);
            }

            // for other browsers set the window.onload, but also execute the old window.onload
            old_onload = window.onload;
            window.onload = function() {
                init();
                if (old_onload) old_onload();
            };
        }

        load_events.push(func);
    }
})();

/**
 * Handles javascript errors in the browser. It sends some entry to the frontend
 * eventlog. It also displays an error box to the user.
 * It returns true to let the browser also handle the error.
 *
 * @author	Lars Michelsen <lars@vertical-visions.de>
 */
function handleJSError(sMsg, sUrl, iLine) {
	if(!isset(sUrl))
  	var sUrl = '<Empty URL>';
	// Log to javascript eventlog
	eventlog("js-error", "critical", "JS-Error occured: " + sMsg + " " + sUrl + " (" + iLine + ")");
	
	// Show error box
	var oMsg = {};
	oMsg.type = 'CRITICAL';
	oMsg.message = "Javascript error occured:\n " + sMsg + " "
	               + sUrl + " (" + iLine + ")<br /><br /><font style='font-size:10px'>- Stacktrace - <br />"
	               + printStackTrace().join("<br />") + '</font>';
	oMsg.title = "Javascript error";
	
	// Handle application message/error
	frontendMessage(oMsg);
	oMsg = null;
	
	return false;
}

// Enable javascript error handler
try {
	window.onerror = handleJSError;
} catch(er) {}

/**
 * Cross browser mapper to add an event to an object
 *
 * @author	Lars Michelsen <lars@vertical-visions.de>
 */
function addEvent(obj, type, fn) {
   if(obj.addEventListener) {
      obj.addEventListener(type, fn, false);
   } else if (obj.attachEvent) {
      obj["e"+type+fn] = fn;
      
      obj[type+fn] = function() {
      	obj["e"+type+fn](window.event);
      }
      
      obj.attachEvent("on"+type, obj[type+fn]);
   }
}

/**
 * Displays a system status message
 *
 * @author	Lars Michelsen <lars@vertical-visions.de>
 */
function displayStatusMessage(msg, type, hold) {
	var iMessageTime = 5000;
	
	var oMessage = document.getElementById('statusMessage');
	
	// Initialize when not yet done
	if(!oMessage) {
		oMessage = document.createElement('div');
		oMessage.setAttribute('id', 'statusMessage');
		
		document.body.appendChild(oMessage);
	}
	
	// When there is another timer clear it
	if(oStatusMessageTimer) {
		clearTimeout(oStatusMessageTimer);
	}
	
	var cont = msg;
	if (type) {
		cont = '<div class="'+type+'">'+cont+'</div>';
	}
	
	oMessage.innerHTML = cont;
	oMessage.style.display = 'block';
	
	if (type != 'loading') {
		oMessage.onmousedown = function() { hideStatusMessage(); return true; };
	}
	
	if (!hold) {
		oStatusMessageTimer = window.setTimeout(function() { hideStatusMessage(); }, iMessageTime);
	}
	
	oMessage = null;
}


// make a message row disapear
function hideStatusMessage() {
	var oMessage = document.getElementById('statusMessage');
	
	// Only hide when initialized
	if(oMessage) {
		oMessage.style.display = 'none';
		oMessage.onmousedown = null;
	}
}

/**
 * Creates a html box on the map. Used by textbox objects, labels and line labels
 *
 * @return  Object  Returns the div object of the textbox
 * @author  Lars Michelsen <lars@vertical-visions.de>
 */
function drawNagVisTextbox(id, className, bgColor, borderColor, x, y, z, w, h, text, customStyle) {
		var oLabelDiv = document.getElementById(id);
		if(!oLabelDiv) {
			oLabelDiv = document.createElement('div');
			oLabelDiv.setAttribute('id', id);
		}
		oLabelDiv.setAttribute('class', className);
		oLabelDiv.setAttribute('className', className);
		oLabelDiv.style.background = bgColor;
		oLabelDiv.style.borderColor = borderColor;
		
		oLabelDiv.style.position = 'absolute';
		oLabelDiv.style.left = x + 'px';
		oLabelDiv.style.top = y + 'px';
		
		if(w && w !== '' && w !== 'auto')
			oLabelDiv.style.width = w+'px';
		
		if(h && h !== '' && h !== 'auto')
			oLabelDiv.style.height = h+'px';
		
		oLabelDiv.style.zIndex = parseInt(z) + 1;
		oLabelDiv.style.overflow = 'visible';
		
		/**
		 * IE workaround: The transparent for the color is not enough. The border
		 * has really to be hidden.
		 */
		if(borderColor == 'transparent')
			oLabelDiv.style.borderStyle = 'none';
		else
			oLabelDiv.style.borderStyle = 'solid';
		
		// Create span for text and add label text
		var oLabelSpan = null;
		if(oLabelDiv.childNodes.length == 0)
			oLabelSpan = document.createElement('span');
		else
			oLabelSpan = oLabelDiv.childNodes[0];
		
		// Setting custom style if someone wants the textbox to be
		// styled.
		//
		// The problem here is that the custom style is given as content of the
		// HTML style attribute. But that can not be applied easily using plain
		// JS. So parse the string and apply the options manually.
		if(customStyle && customStyle !== '') {
			// Split up the coustom style string to apply the attributes
			var aStyle = customStyle.split(';');
			for(var i in aStyle) {
				var aOpt = aStyle[i].split(':');
				
				if(aOpt[0] && aOpt[0] != '' && aOpt[1] && aOpt[1] != '') {
					var sKey = aOpt[0].replace(/(-[a-zA-Z])/g, '$1');
					
					var regex = /(-[a-zA-Z])/;
					var result = regex.exec(aOpt[0]);
					
					if(result !== null) {
						for (var i = 1; i < result.length; i++) {
							var fixed = result[i].replace('-', '').toUpperCase();
							sKey = sKey.replace(result[i], fixed);
						}
					}
					
					oLabelSpan.style[sKey] = aOpt[1];
				}
			}
		}
		
		oLabelSpan.innerHTML = text;
		
		oLabelDiv.appendChild(oLabelSpan);
		oLabelSpan = null;
		
		return oLabelDiv;
}

/**
 * Scales a hex color down/up
 *
 * @return  String  New and maybe scaled hex code
 * @author  Lars Michelsen <lars@vertical-visions.de>
 */
function lightenColor(code, rD, gD, bD) {
	var r = parseInt(code.substring(1, 3), 16);
	var g = parseInt(code.substring(3, 5), 16);
	var b = parseInt(code.substring(5, 7), 16);
	
	r += rD;  if (r > 255) r = 255;  if (r < 0) r = 0;
	g += gD;  if (g > 255) g = 255;  if (g < 0) g = 0;
	b += bD;  if (b > 255) b = 255;  if (b < 0) b = 0;
	
	code  = r.length < 2 ? "0"+r.toString(16) : r.toString(16);
	code += g.length < 2 ? "0"+g.toString(16) : g.toString(16);
	code += b.length < 2 ? "0"+b.toString(16) : b.toString(16);
	
	return "#" + code.toUpperCase();
}

/**
 * Handles regular expressions in NagVis js frontend (including regex cache)
 *
 * @author  Lars Michelsen <lars@vertical-visions.de>
 */
function getRegEx(n, exp, mod) {
	if(typeof(regexCache[n]) !== 'undefined')
		return regexCache[n];
	else
		if(mod !== undefined) {
			regexCache[n+'-'+mod] = new RegExp(exp, mod);
			return regexCache[n+'-'+mod];
		} else {
			regexCache[n] = new RegExp(exp);
			return regexCache[n];
		}
}

/**
 * Sends a user option to the server using an async json request
 *
 * @author  Lars Michelsen <lars@vertical-visions.de>
 */
function storeUserOption(key, value) {
	// Set in current page
	oUserProperties[key] = value;

	// And send to server
	var url = oGeneralProperties.path_server + '?mod=User&act=setOption&opts['+escapeUrlValues(key)+']=' + escapeUrlValues(value);
	getAsyncRequest(url, false, undefined, undefined);
}

/**
 * Checks if a variable is set
 *
 * @author  Lars Michelsen <lars@vertical-visions.de>
 */
function isset(v) {
	return typeof(v) !== 'undefined';
}

/*** Handles the object dragging ***/

var draggingEnabled = true;
var draggingObject = null;
var dragObjectOffset = null;
var dragObjectPos = null;
var dragObjectStartPos = null;
var dragObjectChilds = {};
var dragObjectHandler = null;

function getTarget(event) {
	var target = event.target ? event.target : event.srcElement;
	while(target && target.tagName != 'DIV') {
		target = target.parentNode;
  }
	return target;
}

function getButton(event) {
	if (event.which == null)
		/* IE case */
		return (event.button < 2) ? "LEFT" : ((event.button == 4) ? "MIDDLE" : "RIGHT");
	else
		/* All others */
		return (event.which < 2) ? "LEFT" : ((event.which == 2) ? "MIDDLE" : "RIGHT");
}

function makeDragable(objects, dragStopHandler, dragMoveHandler) {
	var len = objects.length;
	if(len == 0)
		return false;
	
	for(var i = 0; i < len; i++) {
		var o = document.getElementById(objects[i]);
		if(o) {
			addEvent(o, "mousedown", function(e) { dragStart(e, dragMoveHandler); }); 
			addEvent(o, "mouseup",   function(e) { dragStop(e,  dragStopHandler); }); 
			o = null;
		}
	}
	len = null;
}

function dragStart(event, dragHandler) {
	if(!event)
		event = window.event;
	
	var target = getTarget(event);
	var button = getButton(event);
	
	// Skip calls when already dragging or other button than left mouse
	if(draggingObject !== null || button != 'LEFT' || !draggingEnabled)
		return true;
	
	var posx, posy;
	if (event.pageX || event.pageY) {
		posx = event.pageX;
		posy = event.pageY;
	} else if (event.clientX || event.clientY) {
		posx = event.clientX;
		posy = event.clientY;
	}
	
	/*if(event.stopPropagation)
		event.stopPropagation();
	event.cancelBubble = true;*/
	
	draggingObject = target;
	draggingObject.x = draggingObject.offsetLeft;
	draggingObject.y = draggingObject.offsetTop;
	
  // Save relative offset of the mouse to the snapin title to prevent flipping on drag start
  dragObjectOffset   = [ posy - draggingObject.offsetTop - getHeaderHeight(), 
                         posx - draggingObject.offsetLeft ];
  dragObjectStartPos = [ draggingObject.offsetTop, draggingObject.offsetLeft ];

	// Assign the handler which is called during object movements
	dragObjectHandler = dragHandler;

	// Save diff coords of relative objects
	var sLabelName = target.id.replace('box_', 'rel_label_');
	var oLabel = document.getElementById(sLabelName);
	if(oLabel) {
		dragObjectChilds[sLabelName] = [ oLabel.offsetTop - draggingObject.offsetTop,
		                                 oLabel.offsetLeft - draggingObject.offsetLeft ];
		oLabel = null;
	}
	sLabelName = null;
	
	// Disable the default events for all the different browsers
	if(event.preventDefault)
		event.preventDefault();
	else
		event.returnValue = false;
	return true;
}

function dragObject(event) {
	if(!event)
		event = window.event;
	
	if(draggingObject === null || !draggingEnabled)
		return true;
	
	var posx, posy;
	if (event.pageX || event.pageY) {
		posx = event.pageX;
		posy = event.pageY;
	} else if (event.clientX || event.clientY) {
		posx = event.clientX;
		posy = event.clientY;
	}
	
	var newTop  = posy - dragObjectOffset[0] - getHeaderHeight();
	var newLeft = posx - dragObjectOffset[1];

  draggingObject.style.position = 'absolute';
	draggingObject.style.top  = newTop + 'px';
	draggingObject.style.left = newLeft + 'px';
	draggingObject.x = newLeft;
	draggingObject.y = newTop;

	// When this object has a relative coordinated label, then move this too
	moveRelativeObject(draggingObject.id, newTop, newLeft);

	// Call the dragging handler when one is ste
	if(dragObjectHandler)
		dragObjectHandler(draggingObject);
}

function moveRelativeObject(parentId, parentTop, parentLeft) {
	var sLabelName = parentId.replace('box_', 'rel_label_');
	if(typeof dragObjectChilds[sLabelName] !== 'undefined') {
		var oLabel = document.getElementById(sLabelName);
		if(oLabel) {
  		oLabel.style.position = 'absolute';
			oLabel.style.top  = (dragObjectChilds[sLabelName][0] + parentTop) + 'px';
			oLabel.style.left = (dragObjectChilds[sLabelName][1] + parentLeft) + 'px';
			oLabel = null;
		}
	}
	sLabelName = null;
}

function dragStop(event, handler) {
	if(draggingObject === null || !draggingEnabled
	   || typeof draggingObject.y == 'undefined' || typeof draggingObject.x == 'undefined')
		return;
	
	// When x or y are negative just return this and make no change
	if(draggingObject.y < 0 || draggingObject.x < 0) {
		draggingObject.style.top  = dragObjectStartPos[0] + 'px';
		draggingObject.style.left = dragObjectStartPos[1] + 'px';
		moveRelativeObject(draggingObject.id, dragObjectStartPos[0], dragObjectStartPos[1])
		draggingObject = null;
		return;
	}

	// Skip when the object has not been moved
	if(draggingObject.y == dragObjectStartPos[0] && draggingObject.x == dragObjectStartPos[1]) {
		draggingObject = null;
		return;
	}

	handler(draggingObject);
	
	dragObjectHandler = null;
	draggingObject = null;
}

/************************************************
 * Register events
 *************************************************/

// First firefox and the IE
if (window.addEventListener) {
  window.addEventListener("mousemove", function(e) {
    dragObject(e);
    return false;
  }, false);
} else {
  document.documentElement.onmousemove  = function(e) {
    dragObject(e);
    return false;
  };
}
=======
>>>>>>> refs/heads/nagvis-1.5:share/frontend/nagvis-js/js/nagvis.js
