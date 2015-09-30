/**************************
Functions used by 12Lead_D.html and 12Lead_GE.html
revision 0.1 : April 6, 2011 - initial version Michael Shipway
Revision 1.0 : August 19, 2013 - Updated for use in Waveform 3. .
Revision 1.0 : February 20, 2015 - Included the label box.
*************************/
	var namespaceGlobal = "";
	var isMultigraph=true;
	var graphSet = [];
	var graphCalSet = [];
	var xLineSet = [];
	var labelBoxSet = [];
	
	var blockRedraw = false; // prevents WAVEFORM_drawCallback from looping on events from other graphs.
	var initialized = false;
	var leadDurationMS = 1200;
    var displayMinV = -2000;
    var displayMaxV = +2000;
    var StartmSec = 0; // Starting time in the data, e.g. first point to display.
    var bInvertVoltageSlider=true; // quick fix to invert the values from the slider.

    var graphDivCalPrefix 	= "graphDivCal";
	var labelCalPrefix 		= "labelCal";
	var graphDivPrefix 		= "graphDiv";
	var labelDivPrefix 		= "labelDiv";
	var verticalXHairPrefix = "lineDiv";
	var labelBoxPrefix 		= "labelBoxDiv";
	
	var WF_minTime = 1, WF_maxTime = 5000;
	var dataJsonParse=[];
	var data =[];
	var saGraphTitle = [];
	var saGraphTitleArray=[];
	var calibrationCount = 3;
	var graphCount = 12;
	
	var graphHeight = 150;
	var graphWidth = 120;
	var callGraphWidth = 40;
	
	var labelBoxWidth = 130;
	
	function calculateGraphSizes() {
	
		var extraSpaceForVScroll = 25; 
		
		var graphFooter = 35;
		var graphHeader = 22;
		
		// lookup all the relevent widths
		var contentArea = WAVEFORM_getElementByIdEndsWith("div", "ecgGraphLayout");
		var contentWidth = parseInt(contentArea.clientWidth) - extraSpaceForVScroll;  // removes the "px" at the end
		
		var graphContainer = WAVEFORM_getElementByIdEndsWith("table", "Container_12LeadDivOutside");
		var gcWidth = parseInt(graphContainer.clientWidth);  // removes the "px" at the end
		
		var g0Width = graphWidth;
		var g0Height = graphHeight;
		
		var containerGraphZero = WAVEFORM_getElementByIdEndsWith("div", "ContainerDiv0");
		var cg0Width = parseInt(containerGraphZero.clientWidth);  // removes the "px" at the end
	
		var c0Width = callGraphWidth;
		
		var containerCalZero = WAVEFORM_getElementByIdEndsWith("div", "ContainerCal0");
		var cc0Width = parseInt(containerCalZero.clientWidth);  // removes the "px" at the end
		
		var yLabelZero = WAVEFORM_getElementByIdEndsWith("span", "yLabel0");
		var yl0Width = parseInt(yLabelZero.offsetWidth);  // removes the "px" at the end
		
		var graphColumns = graphCount;
		var callOverGraph = 0.3333;
		if(graphCount > 4){
			graphColumns = 4;
		}else{
			callOverGraph = callOverGraph / (4 - graphColumns);
		}
		
		// calculations
		var nonGraphWidth =(gcWidth -((g0Width+(cg0Width-g0Width))*graphColumns) - (c0Width+(cc0Width-c0Width-yl0Width)));
		var AvailableGraphWidth = contentWidth - nonGraphWidth;
		
		var gWidthNew = AvailableGraphWidth/(graphColumns+callOverGraph);
		var cWidthNew = gWidthNew*callOverGraph;
		
		var zoomRatio = (gWidthNew/g0Width);
		
		var height = g0Height*zoomRatio;
		
		if(height > (graphContainer.clientHeight-graphHeader-graphFooter)){
			height = graphContainer.clientHeight-graphHeader-graphFooter;
		}
		
		// Set graph sizes
		graphHeight = height;
		graphWidth = gWidthNew;
		callGraphWidth = cWidthNew;
	};
	
	
	function show12LeadData() {
		// Turning on the Dygrahs Display
		WAVEFORM_showGraphs();
		setGraphLabel();
	};

	// This function is kept on the .xhtml page, because it contains code specific to this layout. 
     var WAVEFORM_showGraphs = function(){
         var graphDurationMS = 1200;
         calculateGraphSizes();
         populateGraphsCalibrations(graphDurationMS, dataFull, calibrationCount);
     };
	
	var parseJSONdata = function(){					
		if(data.length>0){
			dataJsonParse = JSON.parse(data);
			WF_minTime = dataJsonParse.minTime;
			WF_maxTime = dataJsonParse.maxTime;
			dataFull = WAVEFORM_parseCSV(dataJsonParse.ECG);
			saGraphTitleArray = JSON.parse(saGraphTitle);
		}else{
			alert("parseJSONdata() data variable is empty.");
		}
	};

	var renderData =  function(){
		parseJSONdata();
		if(isMultigraph){
			show12LeadData();
		}else{
			renderSingleGraphAndAnnotations();
		}
	};

    /** Event handler for when the mouse is over any graph. 
	 * this callback gets called every time a new point is highlighted.
	 * 
	 * http://dygraphs.com/options.html#Callbacks
	 * 
	 * @param e - event: the JavaScript mousemove event
	 * @param x - the x-coordinate of the highlighted points
	 * @param pts - points: an array of highlighted points: [ {name: 'series', yval: y-value}, … ]
	 * @returns
	 */
    var CVRG_highlightCallbackAll = function(e, x, points){
		for (var i = 0; i < points.length; i++) {
			ptsName = points[i].name;
			var x=Math.floor(points[i].canvasx) + "px";
			var y=Math.floor(points[i].canvasy);
			
			var xval = points[i].xval;
			var yval = points[i].yval;
			
			
			for(var xL=0;xL < xLineSet.length;xL++){	
				var xLineTemp = xLineSet[xL];
				var labelBoxTemp = labelBoxSet[xL];
				
				
				var xLineID = xLineTemp.id; // should be the same as array index "xL"
				
				xLineTemp.style.left = x;
				
				var boxLeft = (Math.floor(points[i].canvasx) + 5);
				
				if((boxLeft + labelBoxWidth) > graphWidth){
					boxLeft = graphWidth - labelBoxWidth;
				}
					
				labelBoxTemp.style.left = boxLeft + "px";
				
				labelBoxTemp.style.top = ((graphHeight + graphHeight - y)*-1 + 5) + "px";
				
				for(var lab=0;lab<labelFull.length;lab++){
					if(ptsName == labelFull[lab]){
						lineID = verticalXHairPrefix +  (lab-1);
						break;
					};
				}

				// don't show the line on the graph the mouse is over.
				if(xLineID == lineID){
					xLineTemp.style.width = "0px";
					labelBoxTemp.style.visibility = "visible";
					labelBoxTemp.innerHTML = (xval/1000.0) + " sec x " + yval + " uV";
				}else{  
					xLineTemp.style.width = "3px";
					labelBoxTemp.style.visibility = "hidden";
				};
			};
		};
	};


	var CVRG_unhighlightCallback = function(e) {
		for (var xL = 0; xL < xLineSet.length; xL++) {
			xLineSet[xL].style.display = "none";
		};
	};

	
	/** When set, this callback gets called every time the dygraph is drawn. 
	 * This includes the initial draw, after zooming and repeatedly while panning.
	 * http://dygraphs.com/options.html#Callbacks
	 *  
	 * Type: function(dygraph, is_initial)
	 * @param   me - dygraph: The graph being drawn
	 * @param   initial - is_initial: True if this is the initial draw, false for subsequent draws.
	 * 
	 * Default: null
	 */
	var WAVEFORM_drawCallback = function(me, initial) {
		if (blockRedraw || initial) return;  // "blockRedraw" prevents WAVEFORM_drawCallback from looping on events from other graphs.
		blockRedraw = true;
		var range = me.xAxisRange();
		var yrange = me.yAxisRange();
		for (var j = 0; j < graphSet.length; j++) {
			if (graphSet[j] == me) continue;
			graphSet[j].updateOptions( {
				dateWindow: range,
				valueRange: yrange
			} );
		}
		blockRedraw = false;
	}; 
	
	/** Changes the dataWindow on all 12 leads. 
	 * @param   minTime - the earliest time displayed on the single lead graph
	 * @param   maxTime - The latest time displayed on the  single lead graphs.
	 * 
	 * Default: null
	 */
	var WAVEFORM_zoomGraphX = function(minTime, maxTime) {
		var range = [minTime,maxTime];
		for (var j = 0; j < graphSet.length; j++) {
			graphSet[j].updateOptions( {
				dateWindow: range
			} );
		}
	}; 

	var createXLine = function(lineIdName, graphHeightPx){
		var xlineX = document.createElement("div");
		xlineX.id = lineIdName;
		xlineX.className="crossHairVert";
		xlineX.style.display = ""; // "none";
		xlineX.style.width = "1px";
		xlineX.style.height = "100%";
		xlineX.style.top = "-"+graphHeightPx+"px";
		xlineX.style.left = "0px";
		xlineX.style.backgroundColor = "purple";
		xlineX.style.position = "relative";

		return xlineX;
	};
	
	var createLabelBox = function(boxIdName, graphHeightPx){
		var labelBox = document.createElement("div");
		labelBox.id = boxIdName;
		labelBox.className="labelBox";
		labelBox.style.display = ""; // "none";
		labelBox.style.width = labelBoxWidth + "px";
		labelBox.style.height = "20px";
		labelBox.style.top = "-"+graphHeightPx+"px";
		labelBox.style.left = "0px";
		labelBox.style.backgroundColor = "white";
		labelBox.style.position = "relative";
		labelBox.style.border = "solid 1px";
		labelBox.style.textAlign = "center";

		return labelBox;
	};

	
	/** Creates and populates all the data graphs(one lead per) and all the calibration graphs.
	 * 
	 */
	var populateGraphsCalibrations = function(graphDurationMS, dataFull, calibrationCount){
		
		makeCalibrationMarks(calibrationCount, callGraphWidth, graphHeight, graphDivCalPrefix, labelCalPrefix);
		populate12Graphs(graphDurationMS, graphWidth, graphHeight, dataFull, namespaceGlobal);
       
	};
	
	
	var populate12Graphs = function(graphDurationMS, graphWidthPx, graphHeightPx, dataFull, namespace){
		
		StartmSec = dataFull[1][0];  // Starting time in the data, e.g. first point to display.
		var labelDivName ="";

		leadDurationMS = graphDurationMS;
		graphSet = null;
		graphSet = [];
		xLineSet = null;
		xLineSet = [];
		labelBoxSet = null;
		labelBoxSet = [];
		
		// labelFull.length is one greater than the number of data columns 
		// because it includes the Timestamp column label "msec"
		for(var col=0;col<(labelFull.length-1); col++){ 
			lineIdName   = verticalXHairPrefix + col;
			graphDivName = graphDivPrefix + col;
			labelDivName = labelDivPrefix + col;
			
			blockRedraw=true;
			graphSet.push(getGraphCommon(labelFull[col+1],
										col, 
										graphDivName, 
										labelDivName,
										graphWidthPx, graphHeightPx));


			var xLine = createXLine(lineIdName, graphHeightPx); // document.getElementById(lineIdName); //
			var labelBox = createLabelBox((labelBoxPrefix + col), graphHeightPx);
			WAVEFORM_getElementByIdEndsWith("div", graphDivName).appendChild(xLine);
			WAVEFORM_getElementByIdEndsWith("div", graphDivName).appendChild(labelBox);
			xLineSet[col] = xLine;
			labelBoxSet[col] = labelBox;
		}
	};

	var getGraphCommon  = function (lead, leadNumber, graphDivName, labelDivName,
									graphWidthPx, graphHeightPx){
		var graphDiv = WAVEFORM_getElementByIdEndsWith("div", graphDivName);
		var labelDiv = WAVEFORM_getElementByIdEndsWith("div", labelDivName);

		var vis = Array(graphCount);
		for(var i=0;i<graphCount;i++){
			vis[i] = ((i)==leadNumber);
		}
		
		var graph = new Dygraph(
			graphDiv,
			dataFull,
			{
				width: graphWidthPx,
				height: graphHeightPx,
				clickCallback: function(e, x, points){
					CVRG_clickCallCommon(leadNumber);
				},
				highlightCallback: CVRG_highlightCallbackAll,
				unhighlightCallback: CVRG_unhighlightCallback,
				drawCallback: WAVEFORM_drawCallback, //called every time the dygraph is drawn. 			
				visibility: vis,
				dateWindow: [ WF_minTime, WF_maxTime],
				valueRange: [displayMinV, displayMaxV],
				labels: labelFull,
				labelsDiv: labelDiv,
				axes: { 
					x: { 
						valueFormatter: CVRG_xValueFormatter2,
						axisLabelFormatter: CVRG_xAxisLabelFormatter2,
						ticker: CVRG_xTickerMultiLead 
					}, 
					y: { 
						valueFormatter: CVRG_yValueFormatter2,
						axisLabelFormatter: CVRG_yAxisLabelFormatter2, 
						ticker: CVRG_yTickerMultiLead 
					} 
				},
				xAxisLabelWidth:0,
				yAxisLabelWidth:0,
				rollPeriod: 0,
				showRoller: false,
				errorBars: false,
				stepPlot: false,
				padding: {left: 0, right: 0, top: 0, bottom: 0},
				axisLabelFontSize: 0,
				gridLineColor: '#FF0000'
			}
		);
		return graph;
	};

	var makeCalibrationMarks = function(markCount, graphWidthPx, graphHeightPx, graphDivName, labelDivName){
		for (var i = 0; i < markCount; i++) {
			blockRedraw=true;
			var graphDiv = WAVEFORM_getElementByIdEndsWith("div", graphDivName + i);
			var labelDiv = WAVEFORM_getElementByIdEndsWith("div", labelDivName + i);
			var calibrationData = "mS,\n" +
			"0,0\n" +
			"100,0\n" +
			"100,1000\n" +
			"300,1000\n" +
			"300,0\n" +
			"400,0\n";
			
			var graphCal = new Dygraph(
				graphDiv,
				calibrationData,
				{
					height: graphHeightPx,
					width: graphWidthPx,
					dateWindow: [ 0, 400],
					colors: ["#000000"],
					labelsDiv: labelDiv,
					rollPeriod: 0,
					showRoller: false,
					errorBars: false,
					axes: { 
						x: { 
							axisLabelFormatter: CVRG_xAxisLabelFormatter2,
							ticker: CVRG_xTickerMultiLead 
						}, 
						y: { 
							valueFormatter: CVRG_yValueFormatter3,
							axisLabelFormatter: CVRG_yAxisLabelFormatter2, 
							ticker: CVRG_yTickerMultiLead 
						} 
					},
					xAxisLabelWidth:0,
					yAxisLabelWidth:0,
					padding: {left: 0, right: 0, top: 0, bottom: 0},
					axisLabelFontSize: 0,
					valueRange: [displayMinV, displayMaxV],
					gridLineColor: '#FF0000',
					unhighlightCallback: CVRG_unhighlightCallback,
					drawCallback: WAVEFORM_drawCallback // called every time the dygraph is drawn. 			 	
				}
			);
			
			graphCalSet[i] = graphCal;
		}
	};
	
	/** Calls Dygraph.prototype.resize() for each of the 12 graphs.
	 * Resizes the dygraph. If no parameters are specified, resizes to fill the
	 * containing div (which has presumably changed size since the dygraph was
	 * instantiated. If the width/height are specified, the div will be resized.
	 *
	 * This is far more efficient than destroying and re-instantiating a
	 * Dygraph, since it doesn't have to reparse the underlying data.
	 *
	 * @param {Number} [width] Width (in pixels)
	 * @param {Number} [height] Height (in pixels)
	 */
	var set12GraphSize = function(newWidth, newHeight){
		for(var i=0;i<graphCount;i++){
			graphSet[i].resize(newWidth, newHeight);
		}
		for(var i=0;i<3;i++){
			graphCalSet[i].resize(40, newHeight);
		}
	};
	
	 var zoomTime = function() {
		// the screen size in uses
		var zoomCoefficient = (2500 / 100);
		var startPositionLeft = 0;
		CVRG_zoomGraphX( timeMinInput.value*zoomCoefficient+startPositionLeft , timeMaxInput.value*zoomCoefficient+startPositionLeft  );
	};
	
    var zoomVoltage = function() {
        // the screen size in use
        var voltCoeff = (displayMaxV-displayMinV)/100; // converts percentage scroll bar to Voltage scale
    
        CVRG_zoomGraphY( (voltMinInput.value-50)*voltCoeff, (voltMaxInput.value-50)*voltCoeff);
    };
    
    var panVoltage = function(graphNumber, bPanSingle, namespace) {
        // the screen size in use
    	var voltCenterInputName = namespace + ":voltCenterInput" + graphNumber;
        var voltCoeff = (displayMaxV-displayMinV)/100; // converts percentage scroll bar to Voltage scale
		var voltCenterValue = (WAVEFORM_getElementByIdEndsWith("input", voltCenterInputName).value-50)*voltCoeff;

		// quick fix to invert the values from the slider.
		if(bInvertVoltageSlider){
			voltCenterValue = -voltCenterValue;
		}
		var minVolt = displayMinV+(voltCenterValue);
		var maxVolt = displayMaxV+(voltCenterValue);
		
		blockRedraw=bPanSingle;
		if(graphNumber=="ALL") {
			graphNumber = 0;
			for(var gs=0;gs<graphSet.length;gs++){
				graphSet[gs].updateOptions({
					valueRange: [minVolt, maxVolt]
				});
			}
		}else{
			graphSet[graphNumber].updateOptions({
				valueRange: [minVolt, maxVolt]
			});
		}
		blockRedraw=false;
		
    };
    
    /** Center and Scale the voltage axis of the Multi-lead view
     * 
     */
    var centerScaleVoltageMulti = function(){
		for(var gs=0;gs<graphSet.length;gs++){
	    	var ext = getDataMinMaxMulti(gs);
	    	var deltaV = (ext.dataMax-ext.dataMin);
	    	
			displayMinV2 = ext.dataMin-(deltaV*.05); // leave a 5% space at the bottom
			displayMaxV2 = ext.dataMax+(deltaV*.05); // leave a 5% space at the top
	    	
			graphSet[gs].updateOptions({
				valueRange: [displayMinV2, displayMaxV2]
			});
	
		}
    };
    
    /** Center the voltage axis on the average, set voltage scale to default +/- 2000uV.
     * 
     */
    var centerVoltageMulti = function(){
		for(var gs=0;gs<graphSet.length;gs++){
	    	var ext = getDataMinMaxMulti(gs);
	    	var centerV = (ext.dataMax+ext.dataMin)/2;
	    	
			displayMinV2 = centerV-2000; // same scale as default graph
			displayMaxV2 = centerV+2000; // same scale as default graph
	    	
			graphSet[gs].updateOptions({
				valueRange: [displayMinV2, displayMaxV2]
			});
	
    	}
    };
    
    /** Center the voltage axis on the Mode (not average) value, set voltage scale to default +/- 2000uV.
     * 
     */
    var centerVoltageMultiMode = function(){
		for(var gs=0;gs<graphSet.length;gs++){
	    	var ext = getDataMinMaxMulti(gs);
	    	var centerV = ext.mode;
	    	
			displayMinV2 = centerV-2000; // same scale as default graph
			displayMaxV2 = centerV+2000; // same scale as default graph
	    	
			graphSet[gs].updateOptions({
				valueRange: [displayMinV2, displayMaxV2]
			});
	
    	}
    };
    
    /** Find the minimum and maximum Voltage values in all of the samples for the specified graph.
     * Assumes that the graph number and lead number are the same value.
     */ 
    var getDataMinMaxMulti = function (graphNumber){
    	var ret = [];
        var modeMap = {};
        var maxEl = graphSet[graphNumber][0];
        var maxCount = 1;
        var modeRounder = 100;

    	var dataMin = graphSet[graphNumber].getValue(calPointCount+1,graphNumber+1);
    	var dataMax = graphSet[graphNumber].getValue(calPointCount+1,graphNumber+1);
    	var val = 0;
    	for(var row=calPointCount+2;row<(graphSet[graphNumber].numRows()/2);row++){
    		val = graphSet[graphNumber].getValue(row,graphNumber+1); // column zero is time, so lead zero's data is in column one.
    		if(dataMax < val) dataMax = val;
    		if(dataMin > val) dataMin = val;
    		
    		val = (val/modeRounder)|0; // bitwise OR to truncate floating point figures 
    		if(modeMap[val] == null)
        		modeMap[val] = 1;
        	else
        		modeMap[val]++;	
        	if(modeMap[val] > maxCount)
        	{
        		maxEl = val;
        		maxCount = modeMap[val];
        	}
    	}
    	ret = {
			dataMin: dataMin, // microVolts
			dataMax: dataMax, // microVolts
			mode: maxEl*modeRounder // mode (mode commonly occuring value
		};
    	
    	return ret;
    };
    
    function mode(array)
    {
        if(array.length == 0)
        	return null;
        var modeMap = {};
        var maxEl = array[0], maxCount = 1;
        for(var i = 0; i < array.length; i++)
        {
        	var val = array[i];
        	if(modeMap[val] == null)
        		modeMap[val] = 1;
        	else
        		modeMap[val]++;	
        	if(modeMap[val] > maxCount)
        	{
        		maxEl = val;
        		maxCount = modeMap[val];
        	}
        }
        return maxEl;
    }
    
    var setVoltageZoomMulti = function(newDisplayMinV, newDisplayMaxV){
		for(var gs=0;gs<graphSet.length;gs++){
			graphSet[gs].updateOptions({
				valueRange: [newDisplayMinV, newDisplayMaxV]
			});
		}
    };
    
    var resetMultiGraphDimensions = function(){
    	setVoltageZoomMulti(displayMinV, displayMaxV);
    	stretchToContentMulti();
    };
    
    var dataFull = [];
    var labelFull =[];
    /** Derived from the Dygraph method "Dygraph.prototype.parseCSV_(data)"
     * Also populates the "labelFull[]" array with the headers from the ecg CSV file.
     * The following is the documentation for Dygraphs:
     * @private
     * Parses a string in a special csv format.  We expect a csv file where each
     * line is a date point, and the first field in each line is the date string.
     * We also expect that all remaining fields represent series.
     * if the errorBars attribute is set, then interpret the fields as:
     * date, series1, stddev1, series2, stddev2, ...
     * @param {[Object]} data See above.
     *
     * @return [Object] An array with one entry for each row. These entries
     * are an array of cells in that row. The first entry is the parsed x-value for
     * the row. The second, third, etc. are the y-values. These can take on one of
     * three forms, depending on the CSV and constructor parameters:
     * 1. numeric value
     * 2. [ value, stddev ]
     * 3. [ low value, center value, high value ]
     */
    var WAVEFORM_parseCSV = function(data) {
    	dataFull = []; // clear data variable.
    	var lines = data.split("\n");
//  	Use the default delimiter or fall back to a tab if that makes sense.
    	var delim = ',';
    	var start = 0;
    	start = 1;
    	labelFull = lines[0].split(delim);  // NOTE: _not_ user_attrs_.

    	var expectedCols = labelFull.length;
    	var outOfOrder = false;
    	for (var i = start; i < lines.length; i++) {
    		var line = lines[i];
    		line_no = i;
    		if (line.length == 0) continue;  // skip blank lines
    		if (line[0] == '#') continue;    // skip comment lines
    		var inFields = line.split(delim);
    		if (inFields.length < 2) continue;

    		var fields = [];
    		// Time is always in  milliSeconds
    		fields[0] = parseFloat(inFields[0]);
    		// Values are just numbers
    		for (var j = 1; j < inFields.length; j++) {
    			fields[j] = parseFloat(inFields[j]);
    		}
    		if (dataFull.length > 0 && fields[0] < dataFull[dataFull.length - 1][0]) {
    			outOfOrder = true;
    		}

    		if (fields.length != expectedCols) {
    			alert("Number of columns in line " + i + " (" + fields.length +
    					") does not agree with number of labels (" + expectedCols +
    					") " + line);
    		}

    		dataFull.push(fields);
    		statusSuffix = ((i*100)/lines.length) + "% complete";
    	}

    	if (outOfOrder) {
    		this.warn("CSV is out of order; order it correctly to speed loading.");
    		dataFull.sort(function(a,b) { return a[0] - b[0]; });
    	}
    	
    	return dataFull;
    };
    
	
	var LO_Traditional = [[250,170], [240,150,2500,-2000,2000],
	                      [45,0],[45,175],[45,350],
	                      [290,0],[290,175],[290,350],
	                      [535,0],[535,175],[535,350],
	                      [780,0],[780,175],[780,350]];

	var LO_GE = [[120,100], [115,100,1200,-2000,2000],
	             [45,0],  [160,  0],[275,  0],[390,  0],[505,  0],[620,  0],
	             [45,175],[160,175],[275,175],[390,175],[505,175],[620,175]];

	var layOutList = [LO_Traditional,LO_GE];

	// rearrange the graphs into a different layout, not currently used.
	var moveGraphDivs = function(layoutNumber, namespace){
		// all graph containers are the same size.
		var newContainerWidth = layOutList[layoutNumber][0][0];
		var newContainerHeight= layOutList[layoutNumber][0][1];
		var newGraphWidth = layOutList[layoutNumber][1][0];
		var newGraphHeight= layOutList[layoutNumber][1][1];
		var newGraphmSecWidth= layOutList[layoutNumber][1][2];
		set12GraphSize(newGraphWidth, newGraphHeight);			
		WAVEFORM_zoomGraphX(StartmSec, StartmSec+newGraphmSecWidth);
		
		for(g=0;g<graphCount;g++){
			var graphContainerDivName = "ContainerDiv" + g;
			var graphContainerDiv = WAVEFORM_getElementByIdEndsWith("div", graphContainerDivName);
			var currentLeft = graphContainerDiv.style.left;
			var currentTop = graphContainerDiv.style.top;
			
			currentLeft = currentLeft.substr(0,currentLeft.indexOf("px"));
			currentTop = currentTop.substr(0,currentTop.indexOf("px"));

			// graph container positions start with the 3rd element of the layout array
			var newLeft=layOutList[layoutNumber][g+2][0];
			var newTop=layOutList[layoutNumber][g+2][1];
			
			//set graph container's sizes and positions
			graphContainerDiv.style.width = newContainerWidth+"px";
			graphContainerDiv.style.height = newContainerHeight+"px";
			moveGraphNow(g, newLeft, newTop);
			
		}
	};

	var moveGraphNow = function(graphNumber, newLeft, newTop, namespace){
		var graphContainerDivName = namespace + ":ContainerDiv" + graphNumber;
		var graphContainerDiv = document.getElementById(graphContainerDivName);
		graphContainerDiv.style.left=newLeft + "px";
		graphContainerDiv.style.top=newTop + "px";		
	};
	
	var moveSlowly = function(graphNumber, newLeft, newTop, incLeft, incTop, namespace){
		var graphContainerDivName = namespace + ":ContainerDiv" + graphNumber;
		var graphContainerDiv = document.getElementById(graphContainerDivName);
		var currentLeft = graphContainerDiv.style.left;
		var currentTop = graphContainerDiv.style.top;
		
		currentLeft = currentLeft.substr(0,currentLeft.indexOf("px"));
		currentTop = currentTop.substr(0,currentTop.indexOf("px"));

		if(currentLeft < newLeft) {
			currentLeft = currentLeft-incLeft;
			graphContainerDiv.style.left=currentLeft + "px";
		}
			
		if(currentTop < newTop){ 
			currentTop = currentTop-incTop;
			graphContainerDiv.style.top=currentTop + "px";		
		}
		
		if((currentLeft != newLeft) | (currentLeft != newTop)){
			setTimeout("moveSlowly(" + g + "," + newLeft + "," + newTop + "," + incLeft + "," + incTop + ")",5);
		}
	};	

	var setGraphLabel = function(){		
		for(var i=0;i<graphCount;i++){
	       	var title = WAVEFORM_getElementByIdEndsWith("span", "TitleDiv"+i);
        	title.innerHTML = saGraphTitleArray[i];
		}
	};
	
	var stretchToContentMulti = function(){
		
		calculateGraphSizes();
		
		// Set graph sizes
		resizeMultiGraphParts(graphWidth, graphHeight, callGraphWidth, graphHeight);

	};
	
	var resizeMultiGraphParts = function (graphWidth, graphHeight, calWidth, calHeight){
		// Set graph sizes
		resizeAllGraphs(graphWidth, graphHeight);
		resizeAllCallibrations(calWidth, calHeight);
		repositionAllCrosshairs();
		
		// uses the new graph container's height after graphs have been resized.
		var gcHeight = graphHeight * calibrationCount;
		WAVEFORM_getElementByIdEndsWith("div", "voltCenterALL").style.height = parseInt(gcHeight) + "px";
	};
	
	
//**************************** utility functions *******************************
	//** Resizing functions ********************
	/** Change the size of all graphs to the specified width & height. */
	var resizeAllGraphs = function(graphWidthPx, graphHeightPx){
		for(var gs=0;gs<graphSet.length;gs++){
			graphSet[gs].resize(graphWidthPx, graphHeightPx);
		}
	};
	
	/** Change the size of all Calibration graphs to the specified width & height. */
	var resizeAllCallibrations = function(graphWidthPx, graphHeightPx){
		for(var gcs=0;gcs<graphCalSet.length;gcs++){
			graphCalSet[gcs].resize(graphWidthPx, graphHeightPx);
		}
	};
	
	/** Change the height of all voltage position sliders to the specified height. */
	var resizeAllSliders = function(graphHeightPx){
		for (var s=0;s<graphSet.length;s++){
			var oSlider = WAVEFORM_getElementByIdEndsWith("div", slider + s);
			oSlider.style.height = parseInt(graphHeightPx) + "px";
		}
	};
	
	/** Change the vertical position of the cross-hairs relative to the graph containiner. 
	 * The crosshair's top starts at the bottom of the graphDiv, so it must be moved up by the height of the graphDiv **/
	var repositionAllCrosshairs = function(){
		var graphZero = WAVEFORM_getElementByIdEndsWith("div", "graphDiv0");
		var g0Height = parseInt(graphZero.clientHeight);  // removes the "px" at the end

		for(var xL=0;xL < xLineSet.length;xL++){	
			var xLineTemp = xLineSet[xL];
			xLineTemp.style.top = "-" + g0Height + "px";
		}
		
	};
	//** end of Resizing functions ********************
	
	
	function initDragDrop() {
    	
    	var leafs = $('.ui-treenode-leaf');
    	leafs.each(function(index){
    		$(this).children().first().draggable({
	           helper: function () {
	        	   var tmp = $(this).clone();
	        	   
	        	   $(this).find('.ui-treenode-label').attr('dd-type', 'leaf');
	        	   
	        	   tmp.appendTo('body').css('zIndex',1);
	        	   
	        	   tmp.children().first().remove();
	        	   tmp.addClass('wfdragitem');
	        	   
	        	   var icon = tmp.find('.ui-treenode-icon');
	        	   
	        	   icon.addClass('wfdragicon');
	        	   tmp.find('.ui-treenode-label').addClass('wfdraglabel');
	        	   
	        	   if(icon.hasClass( "ui-icon-alert" )){
	        		   tmp.addClass("wfdragInvalidItem");
	        	   }
	        	   
	        	   return tmp.show(); 
	           },
	           cursorAt: { top: 8, left: 30 },
	           scope: 'treetotable',
	           zIndex: ++PrimeFaces.zindex
	        });
    		
    		$(this).children().first().dblclick(function(){
    			var label = $(this).find('.ui-treenode-label');
    			var treeId = label.closest('li').attr('data-rowkey');
    			var type = label.closest('li').attr('data-nodetype');
    			
                treeToTable([
                     {name: 'property', value:  treeId}, {name: 'type', value: type}
                ]);
    		});
    	});
	
		var parents = $('.ui-treenode-parent');
		parents.each(function(index){
		    $(this).children().first().draggable({
		           helper: function () {
		        	   var tmp = $(this).clone();
		        	   
		        	   $(this).find('.ui-treenode-label').attr('dd-type', 'parent');
		        	   
		        	   tmp.appendTo('body').css('zIndex',1);
		        	   
		        	   tmp.children().first().remove();
		        	   tmp.addClass('wfdragitem');
		        	   
		        	   var icon = tmp.find('.ui-treenode-icon');
		        	   
		        	   icon.addClass('wfdragicon');
		        	   tmp.find('.ui-treenode-label').addClass('wfdraglabel');
		        	   
		        	   if(icon.hasClass( "ui-icon-alert" )){
		        		   tmp.addClass("wfdragInvalidItem");
		        	   }
		        	   
		        	   return tmp.show(); 
		           },
		           cursorAt: { top: 8, left: 30 },
		           scope: 'treetotable',
		           zIndex: ++PrimeFaces.zindex
		        });
		    
		    $(this).children().first().dblclick(function(){
    			var label = $(this).find('.ui-treenode-label');
    			var treeId = label.closest('li').attr('data-rowkey');
    			var type = label.closest('li').attr('data-nodetype');
    			
                treeToTable([
                     {name: 'property', value:  treeId}, {name: 'type', value: type}
                ]);
    		});
		});
	
		$('div.ui-layout-center div.ui-layout-unit-content').droppable({
           activeClass: 'wfdrop-active',
           hoverClass: 'wfdrop-highlight',
           tolerance: 'pointer',
           scope: 'treetotable',
           drop: function(event, ui) {
        	   var label = ui.draggable.find('.ui-treenode-label');
               var treeId = label.closest('li').attr('data-rowkey');
               
               treeToTable([
                    {name: 'property', value:  treeId}, {name: 'type', value: label.attr('dd-type')}
               ]);
           }
        });
		
	}
	