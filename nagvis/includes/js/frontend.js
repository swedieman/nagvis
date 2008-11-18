/*****************************************************************************
 *
 * frontend.js - Functions implementing the new ajax frontend with automatic
 *               worker function etc.
 *
 * Copyright (c) 2004-2008 NagVis Project
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
 
/**
 * Definition of needed variables
 */
var oHoverTemplates = {};
var oHoverUrls = {};

/**
 * runWorker()
 *
 * This function is the heart of the new NagVis frontend. It's called worker.
 * The worker is being called by setTimeout() every second. This method checks
 * for tasks which need to be performed like:
 * - Countdown the timers
 * - Rotating to other page
 * - Reload page because of configuration file changes
 * - Handling configuration file changes
 * - Get objects which need an update of the state information
 * - Update the state information
 * - Handle state changes
 * After all work it goes to sleep for 1 second and calls itselfs again. These
 * tasks are not performed every run, some every second and some every 
 * configured worker_interval. The state information is refreshed like 
 * configured in worker_update_object_states.
 *
 * @param   Integer  The iterator for the run id
 * @param   String   The type of the page which is currently displayed
 * @author	Lars Michelsen <lars@vertical-visions.de>
 */
function runWorker(iCount, sType) {
	// If the iterator is 0 it is the first run of the worker. Its only task is
	// to render the page
	if(iCount === 0) {
		// Initialize everything
		eventlog("worker", "info", "Initializing Worker (Run-ID: "+iCount+")");
		
		// Handle the map rendering
		if(sType == 'map') {
			setMapBasics(oPageProperties);
			
			eventlog("worker", "info", "Parsing map objects");
			setMapObjects(aInitialMapObjects);
			
			// Bulk get all hover templates which are needed on the map
			eventlog("worker", "info", "Fetching hover templates and hover urls");
			getHoverTemplates(aMapObjects);
			setMapHoverUrls();
			
			// Assign the hover templates to the objects and parse them
			eventlog("worker", "info", "Parse hover menus");
			parseHoverMenus(aMapObjects);
			
			eventlog("worker", "info", "Finished parsing map");
		} else if(sType === 'overview') {
			setMapBasics(oPageProperties);
			
			eventlog("worker", "info", "Parsing overview page");
			parseOverviewPage();
			
			eventlog("worker", "info", "Parsing maps");
			parseOverviewMaps(aInitialMaps);
			
			eventlog("worker", "info", "Parsing rotations");
			setOverviewRotations(aInitialRotations);
			
			// Bulk get all hover templates which are needed on the map
			eventlog("worker", "info", "Fetching hover templates");
			getHoverTemplates(aMaps);
			
			// Assign the hover templates to the objects and parse them
			eventlog("worker", "info", "Parse hover menus");
			parseHoverMenus(aMaps);
			
			eventlog("worker", "info", "Finished parsing overview");
		}
	} else {
		/**
		 * Do these actions every run (every second)
		 */
		
		// Countdown the rotation counter
		// Not handled by ajax frontend. Reload the page with the new url
		// If it returns true this means that the page is being changed: Stop the
		// worker.
		if(rotationCountdown() === true) {
			eventlog("worker", "debug", "Worker stopped: Rotate/Refresh detected");
			return false;
		}
		
		updateWorkerCounter();
		
		/**
		 * Do these actions every X runs (Every worker_interval seconds)
		 */
		
		if(sType === 'map') {
			if(iCount % oWorkerProperties.worker_interval === 0) {
				// Log normal worker step
				eventlog("worker", "debug", "Update (Run-ID: "+iCount+")");
				
				// Get the file ages of important files
				var oFileAges = getCfgFileAges();
				
				// Check for changed main configuration
				if(oFileAges && checkMainCfgChanged(oFileAges.mainCfg)) {
					// FIXME: Not handled by ajax frontend, reload the page
					window.location.reload(true);
				}
				
				// Check for changed map configuration
				if(oFileAges && checkMapCfgChanged(oFileAges[oPageProperties.map_name])) {
					// Set map basics
					var oMapBasics = getSyncRequest(oGeneralProperties.path_htmlbase+'/nagvis/ajax_handler.php?action=getMapProperties&objName1='+oPageProperties.map_name);
					if(oMapBasics) {
						setMapBasics(oMapBasics);
					}
					oMapBasics = null;
					
					// Set map objects
					var oMapObjects = getSyncRequest(oGeneralProperties.path_htmlbase+'/nagvis/ajax_handler.php?action=getMapObjects&objName1='+oPageProperties.map_name);
					if(oMapObjects) {
						setMapObjects(oMapObjects);
					}
					oMapObjects = null;
					
					// Bulk get all hover templates which are needed on the map
					getHoverTemplates(aMapObjects);
          setMapHoverUrls();
					
					// Assign the hover templates to the objects and parse them
					parseHoverMenus(aMapObjects);
				}
				
				// Now proceed with real actions when everything is OK
				var arrObj = getObjectsToUpdate(aMapObjects);
				
				// Create the ajax request for bulk update, handle shape updates
				var aUrlParts = [];
				var aShapesToUpdate = [];
				for(var i = 0, len = arrObj.length; i < len; i++) {
					var type = aMapObjects[arrObj[i]].conf.type;
					
					// Shapes which need to be updated need a special handling
					if(type === 'shape') {
						aShapesToUpdate.push(arrObj[i]);
					} else {
						var obj_id = aMapObjects[arrObj[i]].objId;
						var name = aMapObjects[arrObj[i]].conf.name;
						var service_description = aMapObjects[arrObj[i]].conf.service_description;
						var map = oPageProperties.map_name;
						var sUrlPart = '';
						
						if(name) {
							sUrlPart = sUrlPart + '&i[]='+obj_id+'&m[]='+map+'&t[]='+type+'&n1[]='+name;
						
							if(service_description) {
								sUrlPart = sUrlPart + '&n2[]='+service_description;
							} else {
								sUrlPart = sUrlPart + '&n2[]=';
							}
							
							// Append part to array of parts
							aUrlParts.push(sUrlPart);
						}
					}
				}
				
				// Get the updated objectsupdateMapObjects via bulk request
				var o = getBulkSyncRequest(oGeneralProperties.path_htmlbase+'/nagvis/ajax_handler.php?action=getObjectStates&ty=state', aUrlParts, 1900, false);
				var bStateChanged = false;
				if(o.length > 0) {
					bStateChanged = updateObjects(o, aMapObjects, sType);
				}
				o = null;
				
				// Update shapes when needed
				if(aShapesToUpdate.length > 0) {
					updateShapes(aShapesToUpdate);
				}
				
				// When some state changed on the map update the title and favicon
				if(bStateChanged) {
					var o = getSyncRequest(oGeneralProperties.path_htmlbase+'/nagvis/ajax_handler.php?action=getObjectStates&ty=state&i[]='+oPageProperties.map_name+'&m[]=&t[]=map&n1[]='+oPageProperties.map_name+'&n2[]=', false)[0];
					
					// Update favicon
					setPageFavicon(getFaviconImage(o));
					
					// Update page title
					setPageTitle(oPageProperties.alias+' ('+o.summary_state+') :: '+oGeneralProperties.internal_title);
					
					// Change background color
					if(oPageProperties.event_background && oPageProperties.event_background == '1') {
						setPageBackgroundColor(getBackgroundColor(o));
					}
					
					o = null;
				}
				
				// Update lastWorkerRun
				oWorkerProperties.last_run = Date.parse(new Date());
			}
		} else if(sType === 'overview') {
			if(iCount % oWorkerProperties.worker_interval === 0) {
				// Log normal worker step
				eventlog("worker", "debug", "Update (Run-ID: "+iCount+")");
				
				// Get the file ages of important files
				var oFileAges = getCfgFileAges(false);
				
				// Check for changed main configuration
				if(oFileAges && checkMainCfgChanged(oFileAges.mainCfg)) {
					// FIXME: Not handled by ajax frontend, reload the page
					window.location.reload(true);
				}
				
				//FIXME: Map configuration changed?
				
				// Now proceed with real actions when everything is OK
				var arrObj = getObjectsToUpdate(aMaps);
				
				// Create the ajax request for bulk update, handle object updates
				var aUrlParts = [];
				for(var i = 0, len = arrObj.length; i < len; i++) {
					var type = aMaps[arrObj[i]].conf.type;
					
					var obj_id = aMaps[arrObj[i]].objId;
					var name = aMaps[arrObj[i]].conf.name;
					var service_description = aMaps[arrObj[i]].conf.service_description;
					var map = oPageProperties.map_name;
					var sUrlPart = '';
					
					if(name) {
						sUrlPart = sUrlPart + '&i[]='+obj_id+'&t[]='+type+'&n1[]='+name;
					
						if(service_description) {
							sUrlPart = sUrlPart + '&n2[]='+service_description;
						} else {
							sUrlPart = sUrlPart + '&n2[]=';
						}
						
						// Append part to array of parts
						aUrlParts.push(sUrlPart);
					}
				}
				
				// Get the updated objectsupdateMapObjects via bulk request
				var o = getBulkSyncRequest(oGeneralProperties.path_htmlbase+'/nagvis/ajax_handler.php?action=getObjectStates&ty=state', aUrlParts, 1900, false);
				var bStateChanged = false;
				if(o.length > 0) {
					bStateChanged = updateObjects(o, aMaps, sType);
				}
				
				// When some state changed on the map update the title and favicon
				/* FIXME: if(bStateChanged) {
					var o = getSyncRequest(oGeneralProperties.path_htmlbase+'/nagvis/ajax_handler.php?action=getObjectStates&ty=state&i[]='+oPageProperties.map_name+'&m[]=&t[]=map&n1[]='+oPageProperties.map_name+'&n2[]=', false)[0];
					
					// Update favicon
					setPageFavicon(getFaviconImage(o));
					
					// Update page title
					setPageTitle(oPageProperties.alias+' ('+o.summary_state+') :: '+oGeneralProperties.internal_title);
					
					// Change background color
					if(oPageProperties.event_background && oPageProperties.event_background == '1') {
						setPageBackgroundColor(getBackgroundColor(o));
					}
				}*/
				
				// Update lastWorkerRun
				oWorkerProperties.last_run = Date.parse(new Date());
			}
		}
	}
	
	
	// Sleep until next worker run (1 Second)
	window.setTimeout(function() {runWorker((iCount+1), sType)}, 1000);
}

/**
 * getObjectsToUpdate()
 *
 * Detects objects with deprecated state information
 *
 * @return  Array    The array of aMapObjects indexes which need an update
 * @author	Lars Michelsen <lars@vertical-visions.de>
 */
function getObjectsToUpdate(aObjs) {
	eventlog("worker", "debug", "getObjectsToUpdate: Start");
	var arrReturn = [];
	
	// Assign all object indexes to return Array
	for(var i = 0, len = aObjs.length; i < len; i++) {
		if(aObjs[i].lastUpdate <= (Date.parse(new Date())-(oWorkerProperties.worker_update_object_states*1000))) {
			// Do not update shapes where enable_refresh=0
			if(aObjs[i].type !== 'shape' || (aObjs[i].type === 'shape' && aObjs[i].enable_refresh && aObjs[i].enable_refresh === '1')) {
				arrReturn.push(i);
			}
		}
	}
	
	// Now spread the objects in the available timeslots
	var iNumTimeslots = Math.ceil(oWorkerProperties.worker_update_object_states / oWorkerProperties.worker_interval);
	var iNumObjectsPerTimeslot = Math.ceil(aObjs.length / iNumTimeslots);
	eventlog("worker", "debug", "Number of timeslots: "+iNumTimeslots+" Number of Objects per Slot: "+iNumObjectsPerTimeslot);
	
	// Only spread when the number of objects is larger than the objects for each
	// timeslot
	if(arrReturn.length > iNumObjectsPerTimeslot) {
		eventlog("worker", "debug", "Spreading map objects in timeslots");
		// Just remove all elements from the end of the array
		arrReturn = arrReturn.slice(0, iNumObjectsPerTimeslot);
	}
	
	eventlog("worker", "debug", "getObjectsToUpdate: Have to update "+arrReturn.length+" objects");
	return arrReturn;
}

/**
 * getCfgFileAges()
 *
 * Bulk get file ages of important files
 *
 * @return  Boolean
 * @author	Lars Michelsen <lars@vertical-visions.de>
 */
function getCfgFileAges(bMap) {
	if(typeof bMap === 'undefined') {
		bMap = true;
	}
	
	if(bMap) {
		return getSyncRequest(oGeneralProperties.path_htmlbase+'/nagvis/ajax_handler.php?action=getCfgFileAges&f[]=mainCfg&m[]='+oPageProperties.map_name);
	} else {
		return getSyncRequest(oGeneralProperties.path_htmlbase+'/nagvis/ajax_handler.php?action=getCfgFileAges&f[]=mainCfg');
	}
}

/**
 * checkMainCfgChanged()
 *
 * Detects if the main configuration file has changed since last load
 *
 * @return  Boolean
 * @author	Lars Michelsen <lars@vertical-visions.de>
 */
function checkMainCfgChanged(iCurrentAge) {
	eventlog("worker", "debug", "MainCfg Current: "+date(oGeneralProperties.date_format, iCurrentAge)+" Cached: "+date(oGeneralProperties.date_format, oFileAges.main_config));
	
	if(oFileAges.main_config != iCurrentAge) {
		return true;
	} else {
		return false;
	}
}

/**
 * checkMapCfgChanged()
 *
 * Detects if the map configuration file has changed since last load
 *
 * @return  Boolean
 * @author	Lars Michelsen <lars@vertical-visions.de>
 */
function checkMapCfgChanged(iCurrentAge) {
	eventlog("worker", "debug", "MapCfg Current: "+date(oGeneralProperties.date_format, iCurrentAge)+" Cached: "+date(oGeneralProperties.date_format, oFileAges.map_config));
	
	if(oFileAges.map_config != iCurrentAge) {
		return true;
	} else {
		return false;
	}
}

/**
 * setMapHoverUrls()
 *
 * Gets the code for needed hover templates and saves it for later use in icons
 *
 * @param   Object   Object with basic page properties
 * @author	Lars Michelsen <lars@vertical-visions.de>
 */
function setMapHoverUrls() {
	var aUrlParts = [];
	var aTemplateObjects;
	
	// Loop all map objects to get the used hover templates
	for(var a = 0, len = aMapObjects.length; a < len; a++) {
		// Ignore objects which
		// a) have a disabled hover menu
		// b) do use hover_url
		if(aMapObjects[a].conf.hover_menu && aMapObjects[a].conf.hover_menu == 1 && aMapObjects[a].conf.hover_url && aMapObjects[a].conf.hover_url != '') {
			oHoverUrls[aMapObjects[a].conf.hover_url] = '';
		}
	}
	
	// Build string for bulk fetching the templates
	for(var i in oHoverUrls) {
		if(i != 'Inherits') {
			aUrlParts.push('&url[]='+i);
		}
	}
	
	// Get the needed templates via bulk request
	aTemplateObjects = getBulkSyncRequest(oGeneralProperties.path_htmlbase+'/nagvis/ajax_handler.php?action=getHoverUrl', aUrlParts, 1900, true);
	
	// Set the code to global object oHoverTemplates
	if(aTemplateObjects.length > 0) {
		for(var i = 0, len = aTemplateObjects.length; i < len; i++) {
			oHoverUrls[aTemplateObjects[i].url] = aTemplateObjects[i].code;
		}
	}
}

/**
 * parseHoverMenus()
 *
 * Assigns the hover template code to the object, replaces all macros and
 * adds the menu to all map objects
 *
 * @param   Object   Object with basic page properties
 * @author	Lars Michelsen <lars@vertical-visions.de>
 */
function parseHoverMenus(aObjs) {
	for(var a = 0; a < aObjs.length; a++) {
		if(aObjs[a].conf.hover_menu) {
			aObjs[a].parseHoverMenu();
		}
	}
}

/**
 * getHoverTemplates()
 *
 * Gets the code for needed hover templates and saves it for later use in icons
 *
 * @author	Lars Michelsen <lars@vertical-visions.de>
 */
function getHoverTemplates(aObjs) {
	var aUrlParts = [];
	var aTemplateObjects;
	
	// Loop all map objects to get the used hover templates
	for(var a = 0, len = aObjs.length; a < len; a++) {
		// Ignore objects which
		// a) have a disabled hover menu
		// b) do not use hover_url
		if(aObjs[a].conf.hover_menu && aObjs[a].conf.hover_menu == '1' && (!aObjs[a].conf.hover_url || aObjs[a].conf.hover_url == '')) {
			oHoverTemplates[aObjs[a].conf.hover_template] = '';
		}
	}
	
	// Build string for bulk fetching the templates
	for(var i in oHoverTemplates) {
		if(i != 'Inherits') {
			aUrlParts.push('&name[]='+i);
		}
	}
	
	// Get the needed templates via bulk request
	aTemplateObjects = getBulkSyncRequest(oGeneralProperties.path_htmlbase+'/nagvis/ajax_handler.php?action=getHoverTemplate', aUrlParts, 1900, true);
	
	// Set the code to global object oHoverTemplates
	if(aTemplateObjects.length > 0) {
		for(var i = 0, len = aTemplateObjects.length; i < len; i++) {
			oHoverTemplates[aTemplateObjects[i].name] = aTemplateObjects[i].code;
		}
	}
}

/**
 * setMapBasics()
 *
 * Sets basic information like background image
 *
 * @param   Object   Object with basic page properties
 * @author	Lars Michelsen <lars@vertical-visions.de>
 */
function setMapBasics(oProperties) {
	setPageBasics(oProperties);
	setMapBackgroundImage(oProperties.background_image);
}

/**
 * setMapObjects()
 *
 * Does initial parsing of map objects
 *
 * @param   Array    Array of objects to parse to the map
 * @author	Lars Michelsen <lars@vertical-visions.de>
 */
function setMapObjects(aMapObjectConf) {
	eventlog("worker", "debug", "setMapObjects: Start setting map objects");
	for(var i = 0, len = aMapObjectConf.length; i < len; i++) {
		var sType = aMapObjectConf[i].type
		var oObj;
		
		switch (sType) {
			case 'host':
				oObj = new NagVisHost(aMapObjectConf[i]);
			break;
			case 'service':
				oObj = new NagVisService(aMapObjectConf[i]);
			break;
			case 'hostgroup':
				oObj = new NagVisHostgroup(aMapObjectConf[i]);
			break;
			case 'servicegroup':
				oObj = new NagVisServicegroup(aMapObjectConf[i]);
			break;
			case 'map':
				oObj = new NagVisMap(aMapObjectConf[i]);
			break;
			case 'textbox':
				oObj = new NagVisTextbox(aMapObjectConf[i]);
			break;
			case 'shape':
				oObj = new NagVisShape(aMapObjectConf[i]);
			break;
			default:
				alert('Error: Unknown object type');
			break;
		}
		
		if(oObj != null) {
			// Save object to map objects array
			aMapObjects.push(oObj);
			
			// Parse object to map
			oObj.parse();
		}
	}
	eventlog("worker", "debug", "setMapObjects: End setting map objects");
}

/**
 * updateShapes()
 *
 * Bulk refreshes shapes (Only reparsing)
 *
 * @param   Array    Array of objects to reparse
 * @return  Boolean  Returns true when some state has changed
 * @author	Lars Michelsen <lars@vertical-visions.de>
 */
function updateShapes(aShapes) {
	for(var i = 0, len = aShapes.length; i < len; i++) {
		aMapObjects[i].parse();
	}
}

/**
 * updateObjects()
 *
 * Bulk update objects
 *
 * @param   Array    Array of objects to parse to the map
 * @return  Boolean  Returns true when some state has changed
 * @author	Lars Michelsen <lars@vertical-visions.de>
 */
function updateObjects(aMapObjectInformations, aObjs, sType) {
	var bStateChanged = false;
	
	for(var i = 0, len = aMapObjectInformations.length; i < len; i++) {
		var objId = aMapObjectInformations[i].objId;
		var intIndex = -1;
		
		// Find the id with the matching objId
		for(var a = 0, len1 = aObjs.length; a < len1; a++) {
			if(aObjs[a].objId == objId) {
				intIndex = a;
			}
		}
		
		var oObj = aObjs[intIndex];
		
		// Save old state for later "change detection"
		oObj.saveLastState();
		
		if(intIndex >= 0) {
			// Update this object
			for (var strIndex in aMapObjectInformations[i]) {
				if(aMapObjectInformations[i][strIndex] != 'objId') {
					oObj.conf[strIndex] = aMapObjectInformations[i][strIndex];
				}
			}
			
			// Update members list
			oObj.getMembers();
		}
		
		// Update lastUpdate timestamp
		oObj.setLastUpdate();
		
		// Objects with view_type=gadget need to be reloaded even when no state
		// changed (perfdata could be changed since last update)
		if(!oObj.stateChanged() && oObj.conf.view_type === 'gadget') {
			// Reparse object to map
			oObj.parse();
		}
		
		// Detect state changes and do some actions
		if(oObj.stateChanged()) {
			
			/* Internal handling */
			
			// Save for return code
			bStateChanged = true;
			
			// Reparse object to map
			if(sType === 'map') {
				oObj.parse();
			} else if(sType === 'overview') {
				oObj.parsedObject = oObj.parsedObject.parentNode.replaceChild(oObj.parseOverview(), oObj.parsedObject);
			}
			
			/**
			 * Additional eventhandling
			 *
			 * event_log=1/0
			 * event_highlight=1/0
			 * event_scroll=1/0
			 * event_sound=1/0
			 */
			
			// - Highlight (Flashing)
			if(oPageProperties.event_highlight) {
				if(oObj.conf.view_type && oObj.conf.view_type === 'line') {
					// FIXME: Atm only flash icons, not lines
				} else {
					// Detach the handler
					setTimeout(function() { flashIcon(intIndex, 10) }, 0);
				}
			}
			
			// - Scroll to object
			if(oPageProperties.event_scroll) {
				// Detach the handler
				setTimeout(function() { scrollSlow(oObj.conf.x, oObj.conf.y, 15) }, 0);
			}
			
			// - Eventlog
			if(oObj.conf.type == 'service') {
				eventlog("state-change", "info", oObj.conf.type+" "+oObj.conf.name+" "+oObj.conf.service_description+": Old state: "+oObj.last_conf.summary_state+" New state: "+oObj.conf.summary_state);
			} else {
				eventlog("state-change", "info", oObj.conf.type+" "+oObj.conf.name+": Old state: "+oObj.last_conf.summary_state+" New state: "+oObj.conf.summary_state);
			}
			
			// - Sound
			if(oPageProperties.event_sound) {
				// Detach the handler
				setTimeout(function() { playSound(intIndex, 1) }, 0);
			}
		}

		// Reparse the hover menu
		oObj.parseHoverMenu();
	}
	
	return bStateChanged;
}

/**
 * playSound()
 *
 * Play a sound for an object state
 *
 * @param   Integer  Index in aMapObjects
 * @param   Integer  Iterator for number of left runs
 * @author	Lars Michelsen <lars@vertical-visions.de>
 */
function playSound(intIndex, iNumTimes){
	var sSound = '';
	
	var id = aMapObjects[intIndex].parsedObject.id
	
	var oObjIcon = document.getElementById(id+'-icon');
	var oObjIconDiv = document.getElementById(id+'-icondiv');
	
	var sState = aMapObjects[intIndex].conf.summary_state;
	
	if(oStates[sState]
	     && oStates[sState].sound
	     && oStates[sState].sound != '') {
		sSound = oStates[sState].sound;
	}
	
	eventlog("state-change", "debug", "Sound to play: "+sSound);
	
	if(sSound != '') {
		// Remove old sound when present
		if(document.getElementById('sound'+sState)) {
			document.body.removeChild(document.getElementById('sound'+sState));
		}
		
		// Load sound
		var oEmbed = document.createElement('embed');
		oEmbed.setAttribute('id', 'sound'+sState);
		// Relative URL does not work, add full url
		oEmbed.setAttribute('src', window.location.protocol + '//' + window.location.host + ':' + window.location.port + oGeneralProperties.path_htmlsounds+sSound);
		oEmbed.setAttribute('width', '0');
		oEmbed.setAttribute('height', '0');
		oEmbed.setAttribute('hidden', 'true');
		oEmbed.setAttribute('loop', 'false');
		oEmbed.setAttribute('autostart', 'true');
		oEmbed.setAttribute('enablejavascript', 'true');
		
		// Add object to body => the sound is played
		oEmbed = document.body.appendChild(oEmbed);
		oEmbed = null;
		
		iNumTimes = iNumTimes - 1;
		
		if(iNumTimes > 0) {
			setTimeout(function() { playSound(intIndex, iNumTimes) }, 500);
		}
	}
	
	oObjIcon = null;
	oObjIconDiv = null;
}

/**
 * flashIcon()
 *
 * Highlights an object by show/hide a border around the icon
 *
 * @param   Integer  Index in aMapObjects
 * @param   Integer  Iterator for number of runs left
 * @author	Lars Michelsen <lars@vertical-visions.de>
 */
function flashIcon(intIndex, iNumTimes){
	var id = aMapObjects[intIndex].parsedObject.id
	
	var oObjIcon = document.getElementById(id+'-icon');
	var oObjIconDiv = document.getElementById(id+'-icondiv');
	
	var sColor = oStates[aMapObjects[intIndex].conf.summary_state].color;
	
	if(oObjIcon.style.border && oObjIcon.style.border.indexOf("none") != -1) {
		oObjIcon.style.border = "5px solid "+sColor;
		oObjIconDiv.style.top = (aMapObjects[intIndex].conf.y-5)+'px';
		oObjIconDiv.style.left = (aMapObjects[intIndex].conf.x-5)+'px';
	} else {
		oObjIcon.style.border = "none";
		oObjIconDiv.style.top = aMapObjects[intIndex].conf.y+'px';
		oObjIconDiv.style.left = aMapObjects[intIndex].conf.x+'px';
	}
	
	iNumTimes = iNumTimes - 1;
	
	if(iNumTimes > 0 || (iNumTimes == 0 && oObjIcon.style.border.indexOf("none") == -1)) {
		setTimeout(function() { flashIcon(intIndex, iNumTimes) }, 500);
	}
	
	oObjIcon = null;
	oObjIconDiv = null;
}

/**
 * getBackgroundColor()
 *
 * Gets the background color of the map by the summary state of the map
 *
 * @param   Object   Map object
 * @return  String   Hex code representing the color
 * @author	Lars Michelsen <lars@vertical-visions.de>
 */
function getBackgroundColor(oObj) {
	var sColor;
	
	// When state is PENDING, OK, UP, set default background color
	if(oObj.summary_state == 'PENDING' || oObj.summary_state == 'OK' || oObj.summary_state == 'UP') {
		sColor = oPageProperties.background_color;
	} else {
		sColor = oStates[oObj.summary_state].bgColor;
	}
	
	oObj = null;
	
	return sColor;
}

/**
 * Gets the favicon of the page representation the state of the map
 *
 * @return	String	Path to the favicon
 * @author 	Lars Michelsen <lars@vertical-visions.de>
 */
function getFaviconImage(oObj) {
	var sFavicon;
	
	// Gather image on summary state of the object
	if(oObj.summary_in_downtime && oObj.summary_in_downtime == '1') {
		sFavicon = 'downtime';
	} else if(oObj.summary_problem_has_been_acknowledged && oObj.summary_problem_has_been_acknowledged == '1') {
		sFavicon = 'ack';
	} else {
		sFavicon = oObj.summary_state.toLowerCase();
	}
	
	oObj = null;
	
	// Set full path
	sFavicon = oGeneralProperties.path_htmlimages+'internal/favicon_'+sFavicon+'.png';
	
	return sFavicon;
}

/**
 * setPageBackgroundColor()
 *
 * Sets the background color of the page
 *
 * @param   String   Hex code
 * @author	Lars Michelsen <lars@vertical-visions.de>
 */
function setPageBackgroundColor(sColor) {
	document.body.style.backgroundColor = sColor;
}

/**
 * setMapBackgroundImage()
 *
 * Parses the background image to the map
 *
 * @param   String   Path to map images
 * @author	Lars Michelsen <lars@vertical-visions.de>
 */
function setMapBackgroundImage(sImage) {
	// Only work with the background image if some is configured
	if(sImage != 'none') {
		// Use existing image or create new
		if(document.getElementById('backgroundImage')) {
			var oImage = document.getElementById('backgroundImage');
		} else {
			var oImage = document.createElement('img');
			oImage.id = 'backgroundImage';
			oImage.style.zIndex = 0;
			document.body.appendChild(oImage);
		}
		
		oImage.src = sImage;
		oImage = null;
	}
}

/**
 * setPageFavicon()
 *
 * Sets the favicon of the pages
 *
 * @param   String   Path to the icon image
 * @author	Lars Michelsen <lars@vertical-visions.de>
 */
function setPageFavicon(sFavicon) {
	favicon.change(sFavicon);
}

/**
 * setPagePageTitle()
 *
 * Sets the title of the current page
 *
 * @param   String   Title
 * @author	Lars Michelsen <lars@vertical-visions.de>
 */
function setPageTitle(sTitle) {
	document.title = sTitle;
}

/**
 * setPageBasics()
 *
 * Sets basic information like favicon and page title
 *
 * @param   Object   Object with basic page properties
 * @author	Lars Michelsen <lars@vertical-visions.de>
 */
function setPageBasics(oProperties) {
	setPageFavicon(oProperties.favicon_image);
	setPageTitle(oProperties.page_title);
	setPageBackgroundColor(oProperties.background_color);
}

//--- Overview -----------------------------------------------------------------


/**
 * parseOverviewPage()
 *
 * Parses the static html code of the overview page 
 *
 * @param   Array    Array of objects to parse to the map
 * @author	Lars Michelsen <lars@vertical-visions.de>
 */
function parseOverviewPage() {
	var oContainer = document.getElementById('overview');
	
	var oTable = document.createElement('table');
	oTable.setAttribute('id', 'overviewMaps');
	
	var oTr = document.createElement('tr');
	
	var oTh = document.createElement('th');
	oTh.colSpan = oPageProperties.cellsperrow;
	oTh.appendChild(document.createTextNode(oPageProperties.lang_mapIndex));
	
	oTr.appendChild(oTh);
	oTable.appendChild(oTr);
	oContainer.appendChild(oTable);
	
	if(oPageProperties.showrotations && aInitialRotations.length > 0) {
		oTable = document.createElement('table');
		oTable.setAttribute('id', 'overviewRotations');
		oTable.setAttribute('class', 'infobox');
		oTable.setAttribute('className', 'infobox');
		
		oTr = document.createElement('tr');
		
		oTh = document.createElement('th');
		oTh.colSpan = 2;
		oTh.appendChild(document.createTextNode(oPageProperties.lang_rotationPools));
		
		oTr.appendChild(oTh);
		oTable.appendChild(oTr);
		oContainer.appendChild(oTable);
	}
	
	oTh = null;
	oTr = null;
	oTable = null;
	oContainer = null;
}

/**
 * parseOverviewMaps()
 *
 * Does initial parsing of maps on the overview page
 *
 * @param   Array    Array of objects to parse to the map
 * @author	Lars Michelsen <lars@vertical-visions.de>
 */
function parseOverviewMaps(aMapsConf) {
	eventlog("worker", "debug", "parseOverviewMaps: Start setting maps");
	
	var oTable = document.getElementById('overviewMaps');
	var oTr = document.createElement('tr');
	
	for(var i = 0, len = aMapsConf.length; i < len; i++) {
		var oObj;
		
		oObj = new NagVisMap(aMapsConf[i]);
		
		if(oObj != null) {
			// Save object to map objects array
			aMaps.push(oObj);
			
			// Parse child and save reference in parsedObject
			oObj.parsedObject = oTr.appendChild(oObj.parseOverview());
		}
		
		if((i+1) % oPageProperties.cellsperrow === 0) {
			oTable.appendChild(oTr);
			oTr = document.createElement('tr');
		}
	}
	
	// Fill table with empty cells if there are not enough maps to get the last 
	// row filled
	if(i % oPageProperties.cellsperrow !== 0) {
		for(var a = 0; a < (oPageProperties.cellsperrow - (i % oPageProperties.cellsperrow)); a++) {
			var oTd = document.createElement('td');
			oTr.appendChild(oTd);
		}
	}
	
	// Append last row
	oTable.appendChild(oTr);
	
	oTr = null;
	oTable = null;
	
	eventlog("worker", "debug", "parseOverviewMaps: End setting maps");
}


/**
 * setOverviewRotations()
 *
 * Does initial parsing of rotations on the overview page
 *
 * @param   Array    Array of objects to parse to the map
 * @author	Lars Michelsen <lars@vertical-visions.de>
 */
function setOverviewRotations(aRotationsConf) {
	eventlog("worker", "debug", "setOverviewObjects: Start setting rotations");
	
	for(var i = 0, len = aRotationsConf.length; i < len; i++) {
		var oObj;
		
		oObj = new NagVisRotation(aRotationsConf[i]);
		
		if(oObj != null) {
			// Save object to map objects array
			aRotations.push(oObj);
			
			// Parse object to overview
			oObj.parseOverview();
		}
	}
	
	eventlog("worker", "debug", "setOverviewObjects: End setting rotations");
}