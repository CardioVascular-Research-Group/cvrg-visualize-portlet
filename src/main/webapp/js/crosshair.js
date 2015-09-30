/**************************
Functions used by crosshair.html
revision 0.1 : 9/7/2012 - initial version Michael Shipway

 *************************/

var ylinesLeft = [];
var ylinesRight = [];
var yPadding = 40; //32;
var xPadding = 39; //28;
var lineThickness = "2px";
var xlineTop, xlineBottom;


var CVRG_InitHorizontalLines = function(iLeadCount, divID, namespace){
	for (var i = 0; i < iLeadCount; i++) {
		var divFullID = namespace + ":" + divID;
//		initialize horizontal ylinesLeft
		var lineL = document.createElement("div");
		lineL.style.display = "none";
		lineL.style.width = "20px";
		lineL.style.height = lineThickness;
		lineL.style.left = (yPadding + 25) + "px";
		lineL.style.backgroundColor = "black";// red
		lineL.style.position = "absolute";
		document.getElementById(divFullID).appendChild(lineL);
		ylinesLeft.push(lineL);

//		initialize horizontal ylinesRight
		var lineR = document.createElement("div");
		lineR.style.display = "none";
		lineR.style.width = "20px";
		lineR.style.height = lineThickness;
		lineR.style.right = "0px";
		lineR.style.backgroundColor = "black";//magenta
		lineR.style.position = "absolute";
		document.getElementById(divFullID).appendChild(lineR);
		ylinesRight.push(lineR);

	}
};

var CVRG_InitVerticalLines = function(divID, namespace){
	var divFullID = namespace + ":" + divID;
	xlineTop = document.createElement("div");
	xlineTop.style.display = "none";
	xlineTop.style.width = lineThickness;
	xlineTop.style.height = "50%";
	xlineTop.style.top = yPadding + "px";
	xlineTop.style.backgroundColor = "black"; // blue
	xlineTop.style.position = "absolute";
	document.getElementById(divFullID).appendChild(xlineTop);

	xlineBottom = document.createElement("div");
	xlineBottom.style.display = "none";
	xlineBottom.style.width = lineThickness;
	xlineBottom.style.height = "10px";
	xlineBottom.style.backgroundColor = "black"; // green
	xlineBottom.style.position = "absolute";
	document.getElementById(divFullID).appendChild(xlineBottom);
};

var WAVEFORM3_highlightCrosshairs = function(e, pts, bJustFirst) {
	var y=0, x=0, lineGap=10;
	var pointLen = 0;
	var parentCanvas = e.currentTarget;
	var canvasHeight = parentCanvas.height;
	var canvasWidth = parentCanvas.width;

	var rangeSelect = parentCanvas.nextElementSibling;
	var rangeHeight = rangeSelect.height;
	var graphHeight = canvasHeight-rangeHeight-20; // minus twenty to account for padding
	
	if(bJustFirst){ // how many horizontal lines to draw.
		pointLen = 1;
	}else{
		pointLen = pts.length;
	}
	for (var i = 0; i < pointLen; i++) {
		y = pts[i].canvasy+yPadding;
		x = pts[i].canvasx+xPadding;
		
		//red
		ylinesLeft[i].style.display = "";
		ylinesLeft[i].style.top = y + "px";
		ylinesLeft[i].style.width = (x-lineGap-70) + "px";
		

		//magenta
		ylinesRight[i].style.display = "";
		ylinesRight[i].style.top = y + "px";
		ylinesRight[i].style.left = (x+lineGap+10) + "px";
		
		ylinesRight[i].style.width = (canvasWidth-x+10) + "px";

		if (i == 0){
			xlineTop.style.left = x + "px";
			xlineBottom.style.left = x + "px";
		}
	}

	var yl=0;
	if(pts.length > 1){
		yl = e.layerY;
	}else{
		yl = y;
	}
	
	xlineTop.style.height = (yl-lineGap) +"px";  // blue
	xlineTop.style.display = "";// blue
	
	xlineBottom.style.top = (yl+lineGap+yPadding) +"px"; // green
	xlineBottom.style.height = (graphHeight-yl) + "px";// green
	xlineBottom.style.display = "";
};

var CVRG_unhighlightCrosshairs = function(iLeadCount) {
	for (var i = 0; i < iLeadCount; i++) {
		ylinesLeft[i].style.display = "none";
		ylinesRight[i].style.display = "none";
	}
};

var CVRG_unhighlightCallback = function(e, iLeadCount) {
	CVRG_unhighlightCrosshairs(iLeadCount);
};

