// Code for a variety of interaction models. Used in interaction.html, but split out from
// that file so they can be tested in isolation.

var dataOnsetX=0, dataOnsetY=0;

var CVRG_mousedown = function(event, g, context) {
  context.initializeMouseDown(event, g, context);
  if (event.altKey || event.shiftKey) {
    Dygraph.startPan(event, g, context);
  } else {
	var eventDomCoord = g.eventToDomCoords(event);
	var stackedP = g.findStackedPoint(eventDomCoord[0], eventDomCoord[1]);
	dataOnsetX = stackedP.point.xval;
	dataOnsetY = stackedP.point.yval;
    Dygraph.startZoom(event, g, context);
  }
};

var CVRG_mousemove = function(event, g, context) {
  if (context.isPanning) {
    Dygraph.movePan(event, g, context);
  } else if (context.isZooming) {
    Dygraph.moveZoom(event, g, context);
  }
};

var CVRG_mouseup = function(event, g, context) {
  if (context.isPanning) {
    Dygraph.endPan(event, g, context);
  } else if (context.isZooming) {
	if(event.ctrlKey){
		Dygraph.endZoom(event, g, context);
	}else{
		var xE = context.dragEndX;
		var yE = context.dragEndY;

		var labels = g.getLabels();
		var lastX = g.lastx_;
		var dataECoords = g.toDataCoords(xE, yE, 0);
		
		var eventDomCoord = g.eventToDomCoords(event);
		var stackedP = g.findStackedPoint(eventDomCoord[0], eventDomCoord[1]);
		dataECoords[0] = stackedP.point.xval;
		dataECoords[1] = stackedP.point.yval;
		
		
		if(dataOnsetX>dataECoords[0]){
			var dummy = dataOnsetX;
			dataOnsetX = dataECoords[0];
			dataECoords[0] = dummy;
		}
		if(dataOnsetY>dataECoords[1]){
			var dummy2 = dataOnsetY;
			dataOnsetY = dataECoords[1];
			dataECoords[1] = dummy2;
		}
		var xDelta = dataECoords[0]-dataOnsetX;
		var yDelta = dataECoords[1]-dataOnsetY;

		if(xDelta<4){
			CVRG_pointClickHandlerJSNI(dataOnsetX,dataOnsetY);
			num++;
		}else{
			CVRG_annotationIntervalSelected(dataOnsetX,dataOnsetY, dataECoords[0],dataECoords[1]);
			num++;
		}
	}
  }
};

// tweeked versions for using with Scott's UI code.
var CVRG_mousedown2 = function(event, g, context) {
  context.initializeMouseDown(event, g, context);
  if (event.altKey || event.shiftKey) {
    Dygraph.startPan(event, g, context);
  } else {
	var eventDomCoord = g.eventToDomCoords(event);
	var stackedP = g.findStackedPoint(eventDomCoord[0], eventDomCoord[1]);
	dataOnsetX = stackedP.point.xval;
	dataOnsetY = stackedP.point.yval;
    Dygraph.startZoom(event, g, context);
  }
};

var CVRG_mousemove2 = function(event, g, context) {
  if (context.isPanning) {
    Dygraph.movePan(event, g, context);
  } else if (context.isZooming) {
    Dygraph.moveZoom(event, g, context);
  }
};

var WAVEFORM3_mouseup = function(event, g, context) {
	var isInterval = false;
  if (context.isPanning) {
    Dygraph.endPan(event, g, context);
  } else if (context.isZooming) {
	if(event.ctrlKey){
		Dygraph.endZoom(event, g, context);
	}else{
		var xE = context.dragEndX;
		var yE = context.dragEndY;

		var dataECoords = g.toDataCoords(xE, yE, 0);
		
		var eventDomCoord = g.eventToDomCoords(event);
		var stackedP = g.findStackedPoint(eventDomCoord[0], eventDomCoord[1]);
		dataECoords[0] = stackedP.point.xval;
		dataECoords[1] = stackedP.point.yval;

		// Swap start and end points if start is later time value
		if(dataOnsetX>dataECoords[0]){
			var dummyX = dataOnsetX;
			dataOnsetX = dataECoords[0];
			dataECoords[0] = dummyX;
			
			var dummyY = dataOnsetY;
			dataOnsetY = dataECoords[1];
			dataECoords[1] = dummyY;
		}
		var xDelta = dataECoords[0]-dataOnsetX;
		var yDelta = dataECoords[1]-dataOnsetY;

		// treat this as a single point click, just like CVRG_pointClickCallbackSingle()
		if(xDelta<4){
			isInterval = false;
			Dygraph.endZoom(event, g, context);
	        // CLEAR Y Duration point send to the input to submit to the backing bean
			viewAnnotationPointEdit([{name:'DataOnsetX', value:dataOnsetX},
			                         {name:'DataOnsetY', value:dataOnsetY}]);

			num++;
		}else{
			isInterval = true;
			viewAnnotationIntervalEdit([{name:'DataOnsetX', value:dataOnsetX},
			                            {name:'DataOnsetY', value:dataOnsetY}, 
			                            {name:'DataOffsetX', value:dataECoords[0]},
			                            {name:'DataOffsetY', value:dataECoords[1]},
			                            {name:'DeltaX', value:xDelta},
			                            {name:'DeltaY', value:yDelta}]);
			num++;
		}
	}
  }
};

var CVRG_mousedblClick = function(event, g, context) {
  // Reducing by 20% makes it 80% the original size, which means
  // to restore to original size it must grow by 25%

  if (!(event.offsetX && event.offsetY)){
    event.offsetX = event.layerX - event.target.offsetLeft;
    event.offsetY = event.layerY - event.target.offsetTop;
  }

  var percentages = offsetToPercentage(g, event.offsetX, event.offsetY);
  var xPct = percentages[0];
  var yPct = percentages[1];

  if (event.ctrlKey) {
    CVRG_zoom(g, -.25, xPct, yPct);
  } else {
    CVRG_zoom(g, +.2, xPct, yPct);
  }
};

var lastClickedGraph = null;

var CVRG_mouseclick = function(event, g, context) {
  lastClickedGraph = g;
  Dygraph.cancelEvent(event);
};

var CVRG_mousescroll = function(event, g, context) {
  if (lastClickedGraph != g) {
    return;
  }
  var normal = event.detail ? event.detail * -1 : event.wheelDelta / 40;
  // For me the normalized value shows 0.075 for one click. If I took
  // that verbatim, it would be a 7.5%.
  var percentage = normal / 50;

  if (!(event.offsetX && event.offsetY)){
    event.offsetX = event.layerX - event.target.offsetLeft;
    event.offsetY = event.layerY - event.target.offsetTop;
  }

  var percentages = offsetToPercentage(g, event.offsetX, event.offsetY);
  var xPct = percentages[0];
  var yPct = percentages[1];

  CVRG_zoom(g, percentage, xPct, yPct);
  Dygraph.cancelEvent(event);
};

// Adjusts [x, y] toward each other by zoomInPercentage%
// Split it so the left/bottom axis gets xBias/yBias of that change and
// tight/top gets (1-xBias)/(1-yBias) of that change.
//
// If a bias is missing it splits it down the middle.
var CVRG_zoom = function(g, zoomInPercentage, xBias, yBias) {
  xBias = xBias || 0.5;
  yBias = yBias || 0.5;
  function adjustAxis(axis, zoomInPercentage, bias) {
    var delta = axis[1] - axis[0];
    var increment = delta * zoomInPercentage;
    var foo = [increment * bias, increment * (1-bias)];
    return [ axis[0] + foo[0], axis[1] - foo[1] ];
  }
  var yAxes = g.yAxisRanges();
  var newYAxes = [];
  for (var i = 0; i < yAxes.length; i++) {
    newYAxes[i] = adjustAxis(yAxes[i], zoomInPercentage, yBias);
  }

  g.updateOptions({
    dateWindow: adjustAxis(g.xAxisRange(), zoomInPercentage, xBias),
    valueRange: newYAxes[0]
    });
};

var CVRG_restorePositioning = function(g) {
  g.updateOptions({
    dateWindow: null,
    valueRange: null
  });
};
