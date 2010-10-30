/*****************************************************************************
 *
 * hover.js - Function collection for handling the hover menu in NagVis
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

/**
 * Returns the HTML code of a hover template
 *
 * @author	Lars Michelsen <lars@vertical-visions.de>
 */

function getHoverTemplateChildCode(sTemplateCode) {
	var regex = new RegExp("<!--\\sBEGIN\\sloop_child\\s-->(.+?)<!--\\sEND\\sloop_child\\s-->");
	var results = regex.exec(sTemplateCode);
	regex = null;
	
	if(results !== null) 
		return results[1];
	else
		return '';
}

function replaceHoverTemplateChildMacros(oObj, sTemplateCode) {
	var mapName = '';
	var childsHtmlCode = '';
	
	if(typeof(oPageProperties) != 'undefined' && oPageProperties != null) {
		mapName = oPageProperties.map_name;
	}
	
	var rowHtmlCode = getHoverTemplateChildCode(sTemplateCode);
	
	if(rowHtmlCode != '' && oObj.members && oObj.members.length > 0) {
		// Loop all child objects until all looped or the child limit is reached
		for(var i = 0, len1 = oObj.conf.hover_childs_limit, len2 = oObj.members.length;
		    (len1 == -1 || (len1 >= 0 && i <= len1)) && i < len2; i++) {
			if(len1 == -1 || (len1 >= 0 && i < len1)) {
				// Try to catch some error
				if(!oObj.members[i].conf) {
					eventlog("hover-parsing", "critical",
					         "Problem while parsing child in hover template (t:" & oObj.conf.type & " n:" & oObj.conf.name &")");
				} else {
					if(oObj.members[i].conf.type !== 'textbox' && oObj.members[i].conf.type !== 'shape') {
						// Children need to know where they belong
						oObj.members[i].parent_type = oObj.conf.type;
						oObj.members[i].parent_name = oObj.conf.name;
						
						childsHtmlCode += replaceHoverTemplateMacros(true, oObj.members[i], rowHtmlCode);
					}
				}
			} else {
				// Create an end line which shows the number of hidden child items
				var numHiddenMembers = oObj.conf.num_members - oObj.conf.hover_childs_limit;
				
				var oMember = { 'conf': { 'type': 'host', 
																	'name': '', 
																	'summary_state': '', 
																	'summary_output': numHiddenMembers+' more items...', 
																	'<!--\\sBEGIN\\sservicegroup_child\\s-->.+?<!--\\sEND\\sservicegroup_child\\s-->': ''}};
				
				childsHtmlCode += replaceHoverTemplateMacros(true, oMember, rowHtmlCode);
			}
		}
		
		var regex = new RegExp('<!--\\sBEGIN\\sloop_child\\s-->(.+?)<!--\\sEND\\sloop_child\\s-->');
		sTemplateCode = sTemplateCode.replace(regex, childsHtmlCode);
		regex = null;
	}
	
	childsHtmlCode = null;
	rowHtmlCode = null;
	
	return sTemplateCode;
}

function replaceHoverTemplateDynamicMacros(replaceChild, oObj, sTemplateCode) {
	var oMacros = {};

	if(typeof(oPageProperties) != 'undefined' && oPageProperties != null 
	   && (oPageProperties.view_type === 'map' || oPageProperties.view_type === 'automap'))
		oMacros.map_name = oPageProperties.map_name;
	else
		oMacros.map_name = '';
	
	oMacros.last_status_refresh = date(oGeneralProperties.date_format, oObj.lastUpdate/1000);
	
	oMacros.obj_state = oObj.conf.state;
	oMacros.obj_summary_state = oObj.conf.summary_state;
	
	// FIXME: Need to use == instead of === cause there are some inconsistences
	// in the PHP code somewhere. This should be cleaned up
	if(oObj.conf.summary_problem_has_been_acknowledged && oObj.conf.summary_problem_has_been_acknowledged == 1)
		oMacros.obj_summary_acknowledged = '(Acknowledged)';
	else
		oMacros.obj_summary_acknowledged = '';
	
	// FIXME: Need to use == instead of === cause there are some inconsistences
	// in the PHP code somewhere. This should be cleaned up
	if(oObj.conf.problem_has_been_acknowledged && oObj.conf.problem_has_been_acknowledged == 1)
		oMacros.obj_acknowledged = '(Acknowledged)';
	else
		oMacros.obj_acknowledged = '';
	
	if(oObj.conf.summary_in_downtime && oObj.conf.summary_in_downtime == 1)
		oMacros.obj_summary_in_downtime = '(Downtime)';
	else
		oMacros.obj_summary_in_downtime = '';
	
	if(oObj.conf.in_downtime && oObj.conf.in_downtime == 1)
		oMacros.obj_in_downtime = '(Downtime)';
	else
		oMacros.obj_in_downtime = '';
	
	oMacros.obj_output = oObj.conf.output;
	oMacros.obj_summary_output = oObj.conf.summary_output;
	
	// Macros which are only for services and hosts
	if(oObj.conf.type === 'host' || oObj.conf.type === 'service') {
		oMacros.obj_last_check = oObj.conf.last_check;
		oMacros.obj_next_check = oObj.conf.next_check;
		oMacros.obj_state_type = oObj.conf.state_type;
		oMacros.obj_current_check_attempt = oObj.conf.current_check_attempt;
		oMacros.obj_max_check_attempts = oObj.conf.max_check_attempts;
		oMacros.obj_last_state_change = oObj.conf.last_state_change;
		oMacros.obj_last_hard_state_change = oObj.conf.last_hard_state_change;
		oMacros.obj_state_duration = oObj.conf.state_duration;
		oMacros.obj_perfdata = oObj.conf.perfdata;
	}
	
	// On a update the image url replacement is easier. Just replace the old
	// timestamp with the current
	if(oObj.firstUpdate !== null) {
		var regex = new RegExp('_t='+oObj.firstUpdate, 'g');
		// Search before matching - saves some time
		if(sTemplateCode.search(regex) !== -1)
			sTemplateCode = sTemplateCode.replace(regex, '_t='+oObj.lastUpdate);
		regex = null;
	}
	
	// Replace child macros
	// FIXME: Check if this can be moved to static hover template macro replacements
	if(replaceChild == true && oObj.conf.hover_childs_show
		 && oObj.conf.hover_childs_show == '1'
		 && typeof oObj.conf.num_members != 'undefined' && oObj.conf.num_members > 0)
		sTemplateCode = replaceHoverTemplateChildMacros(oObj, sTemplateCode);
	
	// Loop and replace all normal macros
	for (var key in oMacros) {
		var regex = new RegExp('\\['+key+'\\]', 'g');
		// Search before matching - saves some time
		if(sTemplateCode.search(regex) !== -1)
			sTemplateCode = sTemplateCode.replace(regex, oMacros[key]);
		regex = null;
	}
	oMacros = null;
	
	return sTemplateCode;
}

function replaceHoverTemplateStaticMacros(replaceChild, oObj, sTemplateCode) {
	var oMacros = {};
	var oSectionMacros = {};
	
	// Try to catch some error
	if(oObj.conf === null)
		eventlog("hover-parsing", "critical", "Problem while parsing hover template");
	
	if(oObj.conf.type && oObj.conf.type != '')
		oMacros.obj_type = oObj.conf.type;
	
	// Replace language strings
	oMacros.lang_obj_type = oObj.conf.lang_obj_type;
	oMacros.lang_name = oObj.conf.lang_name;
	oMacros.lang_child_name = oObj.conf.lang_child_name;
	oMacros.lang_child_name1 = oObj.conf.lang_child_name1;      
	
	// On child service objects in hover menu replace obj_name with 
	// service_description
	if(replaceChild == true && oObj.conf.type === 'service')
		oMacros.obj_name = oObj.conf.service_description;
	else
		oMacros.obj_name = oObj.conf.name;
	
	if(oObj.conf.alias && oObj.conf.alias !== '')
		oMacros.obj_alias = oObj.conf.alias;
	else
		oMacros.obj_alias = '';
	
	if(oObj.conf.display_name && oObj.conf.display_name !== '')
		oMacros.obj_display_name = oObj.conf.display_name;
	else
		oMacros.obj_display_name = '';
	
	if(oObj.conf.notes && oObj.conf.notes !== '')
		oMacros.obj_notes = oObj.conf.notes;
	else
		oMacros.obj_notes = '';
	
	if(replaceChild != '1' && oObj.conf.type !== 'map') {
		oMacros.obj_backendid = oObj.conf.backend_id;
		oMacros.obj_backend_instancename = oObj.conf.backend_instancename;
		oMacros.html_cgi = oObj.conf.htmlcgi;
		oMacros.custom_1 = oObj.conf.custom_1;
		oMacros.custom_2 = oObj.conf.custom_2;
		oMacros.custom_3 = oObj.conf.custom_3;
	} else {
		// Remove the macros in map objects
		oMacros.obj_backendid = '';
		oMacros.obj_backend_instancename = '';
		oMacros.html_cgi = '';
		oMacros.custom_1 = '';
		oMacros.custom_2 = ''; 
		oMacros.custom_3 = '';
	}
	
	// Macros which are only for services and hosts
	if(oObj.conf.type === 'host' || oObj.conf.type === 'service')
		oMacros.obj_address = oObj.conf.address;
	
	if(oObj.conf.type === 'service') {
		oMacros.service_description = oObj.conf.service_description;
		oMacros.pnp_hostname = oObj.conf.name.replace(/\s/g,'%20');
		oMacros.pnp_service_description = oObj.conf.service_description.replace(/\s/g,'%20');
	} else
		oSectionMacros.service = '<!--\\sBEGIN\\sservice\\s-->.+?<!--\\sEND\\sservice\\s-->';
	
	// Macros which are only for hosts
	if(oObj.conf.type === 'host')
		oMacros.pnp_hostname = oObj.conf.name.replace(' ','%20');
	else
		oSectionMacros.host = '<!--\\sBEGIN\\shost\\s-->.+?<!--\\sEND\\shost\\s-->';
	
	// Replace servicegroup sections when not servicegroup object
	if(oObj.conf.type !== 'servicegroup')
		oSectionMacros.servicegroup = '<!--\\sBEGIN\\sservicegroup\\s-->.+?<!--\\sEND\\sservicegroup\\s-->';
	
	// Replace hostgroup sections when not hostgroup object
	if(oObj.conf.type !== 'hostgroup')
		oSectionMacros.hostgroup = '<!--\\sBEGIN\\shostgroup\\s-->.+?<!--\\sEND\\shostgroup\\s-->';
	
	// Replace map sections when not map object
	if(oObj.conf.type !== 'map')
		oSectionMacros.map = '<!--\\sBEGIN\\smap\\s-->.+?<!--\\sEND\\smap\\s-->';
	
	// Macros which are only for servicegroup childs
	if(replaceChild == true && oObj.parent_type === 'servicegroup' && oObj.conf.type === 'service')
		oMacros.obj_name1 = oObj.conf.name;
	else if(replaceChild == false && oObj.conf.type !== 'servicegroup')
		oSectionMacros.servicegroupChild = '<!--\\sBEGIN\\sservicegroup_child\\s-->.+?<!--\\sEND\\sservicegroup_child\\s-->';
	
	// Replace child section when unwanted
	if((oObj.conf.hover_childs_show && oObj.conf.hover_childs_show != '1')
	   || typeof oObj.conf.num_members == 'undefined' || oObj.conf.num_members == 0)
		oSectionMacros.childs = '<!--\\sBEGIN\\schilds\\s-->.+?<!--\\sEND\\schilds\\s-->';
	
	// Replace child macros
	// FIXME: Check if this can be moved to static hover template macro replacements
	// FIXME: Childs can'not be replaced here at the moment (updates won't work when
	// everything is replaced here)
	/*if(replaceChild != '1' && oObj.conf.hover_childs_show
	 * && oObj.conf.hover_childs_show === '1' && typeof oObj.conf.num_members != 'undefined'
	 * && oObj.conf.num_members > 0) {
	 *sTemplateCode = replaceHoverTemplateChildMacros(oObj, sTemplateCode);
	}*/
	
	// Loop and replace all unwanted section macros
	for (var key in oSectionMacros) {
		var regex = new RegExp(oSectionMacros[key], 'gm');
		if(sTemplateCode.search(regex) !== -1)
			sTemplateCode = sTemplateCode.replace(regex, '');
		regex = null;
	}
	oSectionMacros = null;
	
	// Get loop child code for later replacing
	// FIXME: This is workaround is needed cause the obj_name macro is replaced
	// by the parent objects macro in current progress
	var sChildCode = getHoverTemplateChildCode(sTemplateCode);
	
	// Loop and replace all normal macros
	for (var key in oMacros) {
		var regex = new RegExp('\\['+key+'\\]', 'g');
		// Search before matching - saves some time
		if(sTemplateCode.search(regex) != -1)
			sTemplateCode = sTemplateCode.replace(regex, oMacros[key]);
		regex = null;
	}
	
	oMacros = null;
	iChildStart = null;
	iChildEnd = null;
	
	// Re-add the clean child code
	if(sChildCode != '') {
		var regex = new RegExp('<!--\\sBEGIN\\sloop_child\\s-->(.+?)<!--\\sEND\\sloop_child\\s-->', 'gm');
		
		if(sTemplateCode.search(regex) !== -1)
			sTemplateCode = sTemplateCode.replace(regex, '<!-- BEGIN loop_child -->'+sChildCode+'<!-- END loop_child -->');
		
		regex = null;
	}
	
	// Search for images and append current timestamp to src (prevent caching of
	// images e.a. when some graphs should be fresh)
	var regex = new RegExp("<img.*src=['\"]?([^>'\"]*)['\"]?", 'gi');
	var results = regex.exec(sTemplateCode);
	if(results !== null) {
		for(var i = 0, len = results.length; i < len; i=i+2) {
			var sTmp;
			
			// Replace src value
			sTmp = results[i].replace(results[i+1], results[i+1]+"&_t="+oObj.firstUpdate);
			
			// replace image code
			sTemplateCode = sTemplateCode.replace(results[i], sTmp);
			
			sTmp = null;
		}
	}
	results = null;
	regex = null;
	
	return sTemplateCode;
}

function replaceHoverTemplateMacros(replaceChild, oObj, sTemplateCode) {
	return replaceHoverTemplateDynamicMacros(replaceChild, oObj,
	           replaceHoverTemplateStaticMacros(replaceChild, oObj, sTemplateCode));
}

function displayHoverMenu(event, objId, iHoverDelay) {
	// IE is evil and doesn't pass the event object
	if (event === null || typeof event === 'undefined')
		event = window.event;
	
	// Only show up hover menu when no context menu is opened
	// and only handle the events when no timer is in schedule at the moment to
	// prevent strange movement effects when the timer has finished
	if(!contextOpen() && _hoverTimer === null)
		if(iHoverDelay && iHoverDelay != "0" && !hoverOpen())
			_hoverTimer = setTimeout('hoverShow('+event.clientX+', '+event.clientY+', '+objId+')', parseInt(iHoverDelay)*1000);
		else
			hoverShow(event.clientX, event.clientY, objId);
}
