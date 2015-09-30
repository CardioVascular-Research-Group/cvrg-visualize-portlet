/**
 * Requires that 12Lead3.js be included earlier.
 * 
 * Called when the canvas of graph is clicked to dynamically call PrimeFaces
 * LightBox. Type:function to find the iframe and the widget name that spans
 * the Primefaces JSF lightBox
 */
/*PrimeFaces.widget.LightBox.prototype.show = function(url) {
	if (this.cfg.mode == 'iframe' && url) {
		var iframe = $(this.content).find("iframe");
		iframe.attr('src', url);
	}
	this.center();
	this.panel.css('z-index', ++PrimeFaces.zindex).show();
	this.enableModality();

	if (this.cfg.onShow) {
		this.cfg.onShow.call(this);
	}

	// execute onshowHandlers and remove successful ones
	this.onshowHandlers = $.grep(this.onshowHandlers, function(fn) {
		return !fn.call();
	});
};
*/

var leadNum = -1;
var leadName = "n/a";
var CVRG_getLeadNum = function() {
	return leadNum;
};
var CVRG_getLeadName = function() {
	return leadName;
};

/** Code common to all graph click callbacks **/
var CVRG_clickCallCommon = function(leadNumber){
	leadNum = leadNumber;
	leadName =  labelFull[leadNumber+1];
//	alert('Graph of lead #: "' + leadNumber + '" clicked. Lead Name: "' + leadName + '"');
	viewSingleGraph2Param([{name:'sLeadName', value:leadName},{name:'sLeadNumber', value:leadNum}]);
};


//onclick="jQuery('#form:hdnBtn').click();";
//***********
//document.getElementById("Frm1" + ":vendbtn").click();
//document.getElementById(namespaceGlobal + ":formNavigation:showSingleLead").click();
// if you want to make the button invisible you can do this

//<h:form id="Frm1">
//	<t:commandButton id="vendbtn" value="" action="#{poDetail.loadVendorAddresses}" immediate="true" style="visibility:hidden;" />
//</h:form> 
//
//
//
//function prepareRegister() {
//	document.getElementById("hiddenForm:singleLeadFrom12").click();
//	}
//	Here is my simple hidden form:
//	<h:form id="hiddenForm" style="display: none;">
//	<h:commandButton id="gotoRegButton" actionListener="#{participant.createSetup}" />
//	</h:form> 
//		
//	setLeadNameOneSelection();
	//lightbox_widget_lead_Annotation.show('singleLead.xhtml');
//};
/*
*//**
 * Called when the canvas of graph #0 (lead I) is clicked. Type: function(e, x,
 * points)
 * 
 * @param e:
 *            The event object for the click
 * @param x:
 *            The x value that was clicked (for dates, this is milliseconds
 *            since epoch)
 * @param points:
 *            The closest points along that date. See Point properties for
 *            details.
 *//*
var CVRG_clickCallback0 = function(e, x, points) {
	CVRG_clickCallCommon(0);
};

*//**
 * Called when the canvas of graph #1 (lead II) is clicked. Type: function(e, x,
 * points) *//*
var CVRG_clickCallback1 = function(e, x, points) {
	CVRG_clickCallCommon(1);
};

*//**
 * Called when the canvas of graph #2 (lead III) is clicked. Type: function(e,
 * x, points)*//*
var CVRG_clickCallback2 = function(e, x, points) {
	CVRG_clickCallCommon(2);
};


*//**
 * Called when the canvas of graph #3 (lead aVL) is clicked. Type: function(e,
 * x, points)*//*
var CVRG_clickCallback3 = function(e, x, points) {
	CVRG_clickCallCommon(3);
};


*//**
 * Called when the canvas of graph #4 (lead aVR) is clicked. Type: function(e,
 * x, points) *//*
var CVRG_clickCallback4 = function(e, x, points) {
	CVRG_clickCallCommon(4);
};


*//**
 * Called when the canvas of graph #5 (lead aVF) is clicked. Type: function(e,
 * x, points) *//*
var CVRG_clickCallback5 = function(e, x, points) {
	CVRG_clickCallCommon(5);
};

*//**
 * Called when the canvas of graph #6 (lead V1) is clicked. Type: function(e, x,
 * points) *//*
var CVRG_clickCallback6 = function(e, x, points) {
	CVRG_clickCallCommon(6);
};


*//**
 * Called when the canvas of graph #7 (lead V2) is clicked. Type: function(e, x,
 * points) *//*
var CVRG_clickCallback7 = function(e, x, points) {
	CVRG_clickCallCommon(7);
};


*//**
 * Called when the canvas of graph #8 (lead V3) is clicked. Type: function(e, x,
 * points) *//*
var CVRG_clickCallback8 = function(e, x, points) {
	CVRG_clickCallCommon(8);
};


*//**
 * Called when the canvas of graph #9 (lead V4) is clicked. Type: function(e, x,
 * points) *//*
var CVRG_clickCallback9 = function(e, x, points) {
	CVRG_clickCallCommon(9);
};


*//**
 * Called when the canvas of graph #10 (lead V5) is clicked. Type: function(e,
 * x, points) *//*
var CVRG_clickCallback10 = function(e, x, points) {
	CVRG_clickCallCommon(10);
};


*//**
 * Called when the canvas of graph #11 (lead V6) is clicked. Type: function(e,
 * x, points) *//*
var CVRG_clickCallback11 = function(e, x, points) {
	CVRG_clickCallCommon(11);
};

*/