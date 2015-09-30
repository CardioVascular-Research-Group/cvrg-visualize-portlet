/**
 * Adds appropriate ticks on the y-axis.
 * @param {Number} minY The minimum Y value in the data set
 * @param {Number} maxY The maximum Y value in the data set
 * @private
 */

// Event handlers and callbacks for annotation demo, derived from http://danvk.org/dygraphs/tests/annotation.html
// Dygraph Annotations documentation: http://danvk.org/dygraphs/annotations.html      
//******************************************************
	var data=[];
	var CVRG_last_ann = 0; // counter: Last annotation added to this ecg chart.
	var CVRG_ecg_div_width = 30; // width of the 
	var ecg_graph = "not a graph";
	var CVRG_timeLabelPrefix = "Time";
	var CVRG_sSecondSuffix = "Sec";
	var CVRG_sampleRate = 1000; // samples per second, used to decide at which zoom level to draw dots
	var CVRG_isIE=false;
	
	var testJSNI = function(){
		alert('Testing JSNI with an alert box annotation.js');
	};

	var drawECGCallCount = 0;
	var leadVisibility = "";
	/** Creates a dygraph inside the div "ecg_div", with labels in the div "status_div" showing the data in the array "data".
	 * 
	 * @returns
	 */	

	// Highlight one portion out of line. RSA 041113
    var highlight_start = 0;          // 480 dataSX now - set to the Current X Start javascript Var
    var highlight_end = 0; 			  // 710  dataECoords[0] - now set to the Current X End javascript Var dataECoords[0] 
    var CenterArea = 0;
	
    var highlightQueue = [];
    var WAVEFORM_clearHighLightQueue = function(){
    	highlightQueue = [];
    };
    
    /** Queues an interval annotation for later highlighting. */
    var WAVEFORM_queueHighLightLocation = function (X1, Y1, flagHeight, XC ,X2){
		var highlight = {
			xStart: X1, // milliseconds
			yStart: Y1, // microvolts
			fhStart: flagHeight, 
			xCenter: XC, // milliseconds
			xEnd: X2 // milliseconds
		};

		highlightQueue.push(highlight);
    };
    
    var fillStyleList = [ 
    		"rgb(255, 255, 0)", 
    		"rgb(70, 230, 230)", 
    		"rgb(250, 190, 80)", 
    		"rgb(110, 240, 150)", 
    		"rgb(240, 50, 50)"];
    
    /** Draw a colored bar on the graph canvas to highlight each queued interval annotation. */
    var WAVEFORM_showHighLightQueue = function(canvas, area, g){
        canvas.strokeStyle= "#000000";
        canvas.shadowBlur = 0;
        canvas.shadowColor = '#82B4D2';
    	for(var h=0;h < highlightQueue.length;h++){
    		
    		if(highlightQueue[h].xEnd > dataSingle[calPointCount+1][0]){
	            var top_left = g.toDomCoords(highlightQueue[h].xStart, (highlightQueue[h].yStart - 400 -(h*50)) ); // + highlightQueue[h].fhStart ;
	            var bottom_right = g.toDomCoords(highlightQueue[h].xEnd, (highlightQueue[h].yStart - 600-(h*50)) );; // + highlightQueue[h].fhStart ;
	
	            var leftX = top_left[0];
	            var topY = top_left[1];
	            var rightX = bottom_right[0];
	            var bottomY = bottom_right[1];
	            
	            var width = rightX-leftX;
	            var height = bottomY-topY;
	            
	            canvas.fillStyle = fillStyleList[h%5];
	            canvas.shadowOffsetX = 2*h;
	            canvas.shadowOffsetY = 2*h;
	            if(h>2) canvas.shadowBlur = 5;
	            canvas.fillRect(leftX, topY, width, height);
    		}
    	};    	
        canvas.shadowOffsetX = 0;
        canvas.shadowOffsetY = 0;
        canvas.shadowBlur = 0;

    };


    // Set the Highlight on the interval
    var CVRG_underlayCallbackClicked = function(highlight_start, toCenterWithArea, highlight_end){
    	ecg_graph.updateOptions({
    		underlayCallback:   CVRG_underlayCallback
    	});
    };
	
	
    // Set the Highlight on the interval
	var CVRG_highlightStartEnd = function(){
    	alert(highlight_end - highlight_start / 2 );
    };
	    
	// Highlight one portion out of line. RSA 041113
	var CVRG_underlayCallback = function(canvas, area, g) {
        var bottom_left = g.toDomCoords(highlight_start, -20);
        var top_right = g.toDomCoords(highlight_end, +20);

        var left = bottom_left[0];
        var right = top_right[0];
        var centerLength = highlight_start;
        var toLineAreaFill = toCenterWithArea;
        
        canvas.fillStyle = "rgba(111, 242, 254, 0.8)";
        canvas.fillRect(left, area.y, right - left, area.h);
	};

	var CVRG_clearECGgraph = function(){
		drawECGCallCount = 0;
		ecg_graph = "not a graph";
	};

	var saveBg = '';
	var num = 0;

	// creates a unique name of a single annotation to be used as an Element Id.
	var nameAnnotation = function(ann) {
		return  ann.series + "_" + ann.x + "_" + ann.y;
	};

	var CVRG_setAxisFormatters = function(){
		ecg_graph.updateOptions({
			axes: { 
				x: { 
					valueFormatter: CVRG_xValueFormatter2, // function(val, opts, series_name, dygraph) { ... }, 
					axisLabelFormatter: CVRG_xAxisLabelFormatter2, // function(val, granularity, opts, dygraph) { ... } 
					ticker: CVRG_xTicker  // function(minTms, maxTms, pixels, axis_props, self, forced_vals)  
				}, 
				y: { 
					valueFormatter: CVRG_yValueFormatter2, // function(val, opts, series_name, dygraph) { ... }, 
					axisLabelFormatter: CVRG_yAxisLabelFormatter2, // function(val, granularity, opts, dygraph) { ... } 
					ticker: CVRG_yTicker // function(minTms, maxTms, pixels, axis_props, self, forced_vals) 
				} 
			}  			
		});
	};
	
	// Scott Alger Mike Shipway 030713
	var CVRG_ontologyTreeSelectionChanged = function(nodeID, nodeName) {

		// MOVED TO ontologyTreeAPI
		
		//	alert("ID " + nodeID + "Name" + nodeName);
		// CVRG_ontologyTreeSelectionChangedJSF(nodeID, nodeName);

	};
	
	
	// called by treeSelectionChanged in ontologyTreeAPI.js when the tree selection changes.
	var CVRG_ontologyTreeSelectionChanged_Old = function(nodeID, nodeName) {
		CVRG_ontologyTreeSelectionChangedJSNI(nodeID, nodeName);
	};

	var CVRG_annotationClickHandler = function(ann, point, dg, event) {
		alert("CVRG_annotationClickHandler() called.");
	};
	var CVRG_annotationDblClickHandler = function(ann, point, dg, event) {
		alert("CVRG_annotationDblClickHandler() called.");

    };
    

    //Sends a selected interval to the Java code for creating an annotation.
	var CVRG_annotationIntervalSelected = function(mSecStart, mVoltStart, mSecEnd, mVoltEnd) {
		alert("CVRG_annotationIntervalSelected() called.");
	};
    
    
	// Highlight the annotation in the list when the square is moused over.
	var CVRG_annotationMouseOverHandler = function(ann, point, dg, event) {
//		CVRG_annotationMouseOverHandlerJSNI(nameAnnotation(ann), point.xval, point.yval);
		document.getElementById(nameAnnotation(ann)).style.fontWeight = 'bold';
		saveBg = ann.div.style.backgroundColor;
		ann.div.style.backgroundColor = '#ddd';
	};
	// un-Highlight the annotation in the list when the square is moused out.
	var CVRG_annotationMouseOutHandler = function(ann, point, dg, event) {
		//CVRG_annotationMouseOutHandlerJSNI(point.xval, point.yval);
		document.getElementById(nameAnnotation(ann)).style.fontWeight = 'normal';
		ann.div.style.backgroundColor = saveBg;
	};
		
	//event -  the event object for the click 
	// p  - a point on one of the graphs that was clicked.
	var CVRG_pointClickCallback = function(event, p) {
		// Check if the point is already annotated.
		if (p.annotation){
			alert("CVRG Message: " + p.name + " already has an annotation at: " + p.xval + " seconds.");
//			return;
		}	

		// If not, add one.
		alert("CVRG Message: " + p.name + " Add an annotation at: " + p.xval + " seconds.");
		
		num++;
	};
	
	//event -  the event object for the click 
	// p  - a point on one of the graphs that was clicked.
	var CVRG_pointClickCallback2 = function(event, p) {
		CVRG_unhighlightCrosshairs(12);
		// Check if the point is already annotated.
		// RSA 4/10/13/ 3:58pm 
		if (p.annotation){
			alert("CVRG Message: " + p.name + " already has an annotation at: " + p.xval + " seconds.");
		}
		
		bar.show();  // Scott Alger Primefaces dropdown menu SA 1/17/2013

		// off for testing SA 012213
		
		num++;
	
	};
	
	
	var tempAnnotations=[]; // temporarily holds the annotation data between CVRG_addAnnotation and CVRG_setLeadVisibility calls.
	var CVRG_step = true;
	
	// Adds the annotation's details to the list.  Also generates a unique ID for each annotation so that Javascript can bold/unbold. 
	var CVRG_drawCallback = function(ecg_graph) {
		var leadCount = ecg_graph.rawData_[0].length-1;
	};
//-------------------------
	var CVRG_resetAnnotations = function(){
		tempAnnotations=[];
		CVRG_last_ann = 0;
		
	};
	

	var CVRG_addAnnotationHeight = function(series, x, y, flagLabel, ontologyId, fullAnnotation, height, uniqueID){
		var ann = {
			series: series,  // series, // lead name
			x: x, // milliseconds
			y: y, // microvolts,  CVRG extra data, not used by dygraphs, displayed when mousing over annotation list.
			shortText: flagLabel, // text to show in the flag
			text: ontologyId, // will appear when mouse hovers over flag
			fullAnnotation: fullAnnotation, // CVRG extra data, not used by dygraphs, displayed when mousing over annotation list.
			tickHeight: height, 
			annotationID: uniqueID // Unique annotation ID (primary key) as found in the database.  
		};
		
		tempAnnotations.push(ann);
		
		CVRG_last_ann++; // redundent counter

		return CVRG_last_ann;
	};


	// Marking the Middle of The Interval Annotation
	
	var CVRG_addAnnotationInterval = function(series, x, y, flagLabel, ontologyId, fullAnnotation, height, width, uniqueID){
		var ann = {
			series: series,  // series, // lead name
			x: x, // milliseconds
			y: y, // millivolts,  CVRG extra data, not used by dygraphs, displayed when mousing over annotation list.
			shortText: flagLabel, // text to show in the flag
			text: ontologyId, // will appear when mouse hovers over flag
			fullAnnotation: fullAnnotation, // CVRG extra data, not used by dygraphs, displayed when mousing over annotation list.
			tickHeight: height,
			width: width,  // CVRG extra width to the Flag - RSA 
			annotationID: uniqueID // Unique annotation ID (primary key) as found in the database.  
		};
	
		tempAnnotations.push(ann);
		
		CVRG_last_ann++; // redundent counter

		return CVRG_last_ann;
	};

	
	
	var CVRG_addAnnotation = function(series, x, y, flagLabel, ontologyId, fullAnnotation){
		return CVRG_addAnnotationHeight(series, x, y, flagLabel, ontologyId, fullAnnotation, 10);
	};

	// set the visibility of one lead and show the associated annotations.
	var CVRG_setLeadVisibility = function(lead, bVisible){
		if(ecg_graph != "not a graph"){
			ecg_graph.setVisibility(lead, bVisible);
			ecg_graph.setAnnotations(tempAnnotations);
		}
	};
	
	//------------------------ formatting --------------------
    
	/** formats a number to be the coefficient(mantissa) for Exponential notation.
	 * @param num - number to format
	 * @param exponent - power of 10 which the return value will be multiplied by.
	 * @param digitsAfterDecimal - number of digits to preserve after the decimal point, the last digit being rounded.
	 */ 
	var CVRG_formatExponential = function(num, exponent, digitsAfterDecimal){
		var label = "foo";
		var coefficient = num/Math.pow(10, exponent);
		
		// Round up to the requested number of decimal places.
		label = Dygraph.round_(coefficient, digitsAfterDecimal);
		
		return label;
	};

	/** controls the display of numbers on the axes (i.e. tick marks).
	 * 
	 * @param val = the value
	 * @param granularity = How fine- or coarse-grained the axis is (i.e. hourly, daily, weekly, ...) 
	 * @param opts = a function which maps options to their values
	 * @param dygraph = the dygraph object
	 */
	var CVRG_yValueFormatter2 = function(val, granularity, opts, dygraph) {
		return CVRG_yValueFormatter(val);  // calling the function written for the older dygraphs library.
	};

	// Function to provide a custom display format for the Y value for mouseover. 
	// parameter:
	//     y - value of the sample in millivolts.
	var CVRG_yValueFormatter = function(y) {
		var shift = Math.pow(10, 5);
		return "<br> Amplitude (μV)  " +  Math.round(y * shift) / shift;
	};
	
	
	/** controls the display of numbers on the axes (i.e. tick marks).
	 * 
	 * @param val = the value
	 * @param granularity = How fine- or coarse-grained the axis is (i.e. hourly, daily, weekly, ...) 
	 * @param opts = a function which maps options to their values
	 * @param dygraph = the dygraph object
	 */
	var CVRG_yAxisLabelFormatter2 = function(val, granularity, opts, dygraph) {
		return CVRG_yAxisLabelFormatter(val);  // calling the function written for the older dygraphs library.
	};

	// Function used to format values along the Y axis. By default it uses the same as the yValueFormatter unless specified.
	// parameter:
	//     y - value of the sample in millivolts.
	var CVRG_yAxisLabelFormatter = function(y) {
		var mvRemainder = 0;

		var shift = Math.pow(10, 5);
		var mv = Math.round(y * shift) / shift;

		if ( (Math.floor(mv/500)*500) == mv ){ // Large GridSquare
			result = mv/1000;
		}else
		{
			var volts = Math.floor(mv/1000);
			mvRemainder = mv - volts*1000;
			
			result = mvRemainder/1000;
		}		
		
		return mv;
	};
	
	
	/**
	 * Add ticks when the x axis has numbers on it (instead of dates)
	 * @param minV - minimum value of the window on this axis
	 * @param maxV - maximum value of the window on this axis
	 * @param self
	 * @param axis_props - properties array of this axis, if any.
	 * @param vals - Array of {label, value} tuples.
	 * @param pixelsPerLabelAttribute - either "pixelsPerXLabel" or "pixelsPerYLabel"
	 * @param msecLargeTime=500; // time span between the dark grid lines 1/5 second (5 millimeter)on paper ECG, equal to 5 small time blocks
	 * @param msecSmallTime=100; // time span between the light grid lines 1/25 second (1 mm) on paper ECG
	 * 
	 * @return - Array of {label, value} tuples.
	 * @public
	 */
	var CVRG_TickerCommon = function(minV, maxV, pixels, axis_props, self, forced_vals, pixelsPerTick, msecLargeTime, msecSmallTime) {
		var msecWidth = maxV-minV; // values spanned by the graph area (voltage or time).
		var pixLargeTime = (pixels*msecLargeTime)/msecWidth; // pixels spanned by the dark grid lines (1/5 second)
		var msPerPixel = msecWidth/pixels; // milliseconds between one pixel and then next
		var pixSmallTime = (pixels*msecSmallTime)/msecWidth; // pixels spanned by the light grid lines (1/25 second)
		var pixMinSmallTime = 1;  // small time blocks must be at least this many pixels wide.
		
		var ticks = [];
		
		CVRG_setTimeExponent(minV,self);
		CVRG_setMsPerPixel(msPerPixel, self);
		
		if (forced_vals) {
			for (var i = 0; i < forced_vals.length; i++) {
				ticks.push({v: forced_vals[i]});
			}
		} else {
			// ticks.length won't be 0 if the log scale function finds values to insert.
			if (ticks.length == 0) {
				// Basic idea:
				// Try labels every 1, 2, 5, 10, 20, 50, 100, etc.
				// Calculate the resulting tick spacing (i.e. this.height_ / nTicks).
				// The first spacing greater than pixelsPerYLabel is what we use.
				var mults = [1, 2, 5];
				var scale, low_val, high_val, nTicks;
				
				if (pixLargeTime < pixelsPerTick){	
					// default tick spacing
					for (var i = -10; i < 50; i++) {
						var base_scale = Math.pow(10, i);
						for (var j = 0; j < mults.length; j++) {
							scale = base_scale * mults[j];
							low_val = Math.floor(minV / scale) * scale;
							high_val = Math.ceil(maxV / scale) * scale;
							nTicks = Math.abs(high_val - low_val) / scale;
							var spacing = self.height_ / nTicks;
							// wish I could break out of both loops at once...
							if (spacing > pixelsPerTick) break;
						}
						if (spacing > pixelsPerTick) break;
					}
					for (var i = 0; i < nTicks; i++) {
						var tickV = low_val + i * scale;
						ticks.push( {v: tickV} );
					}

				}else{
					// draw thick and thin grid line as are seen in paper ECGs.
					if(pixSmallTime >= pixMinSmallTime){
						scale = msecSmallTime;
					}else {
						scale = msecLargeTime;
					}
					low_val = Math.floor(minV / scale) * scale;				
					high_val = Math.ceil(maxV / scale) * scale;
					nTicks = Math.abs(high_val - low_val) / scale;

					spacing = self.height_ / nTicks;
					
					// Construct the set of ticks.
					for (var i = 0; i < nTicks; i++) {
						var tickV = low_val + i * scale;
						var sec = Math.floor(tickV/1000); // integer seconds portion of tick time
						var msSubSec= tickV-(sec*1000); // milliseconds portion of tick time
						
						// dark grid lines are made up of a label on the value plus an unlabeled "darkening line" one pixel to either side.
						if(msSubSec==0){ // dark grid lines on whole seconds
							ticks.push( {label: "", v: tickV-msPerPixel} ); // don't label darking lines.
							ticks.push( {v: tickV} ); //  use default label on whole seconds
							ticks.push( {label: "", v: tickV+msPerPixel} ); // don't label darking lines.
						}else{
							if(msSubSec%msecLargeTime > 1){// light grid lines on 25ths of a second, if between 5ths of a second lines.
								if (pixSmallTime > pixelsPerTick){
									ticks.push( {v: tickV} ); // use default label on fractional seconds
								}else{
									ticks.push( {label: "", v: tickV} ); // don't label small squares, overrides default label.
								}
							}else{ // dark grid lines on whole 5ths of a second
								ticks.push( {label: "", v: tickV-msPerPixel} );// don't label darking lines.
								ticks.push( {v: tickV} ); // use default label on fractional seconds
								ticks.push( {label: "", v: tickV+msPerPixel} );	// don't label darking lines.		
							}
						}
					}
				}
			}
		}

		// Get the formatter's name from properties.
		var formatter = axis_props('axisLabelFormatter');

		// Add default labels to the ticks which don't yet have labels defined.
		for (var i = 0; i < ticks.length; i++) {
			// create label if no text is found.
			if (ticks[i].label !== undefined)
				continue;  // Use current label.
			else{
				var tickV = ticks[i].v;
				var label = formatter(tickV, self);
				ticks[i].label = label;
			}
		}

		return ticks;
	};

	// centers the graph on specified coordinates, leaving scales the same.
	// x - milliseconds
	// y - microvolts,
	var CVRG_CenterGraph = function(x, y){
		var extremes = ecg_graph.xAxisExtremes();
		var min = extremes[0];
		var max = extremes[1];
		if( (x > min) & (x < max) ){ // new center is within currently loaded data range.			
	        // Pull an initial values for calculating ranges.
			var minX = ecg_graph.xAxisRange()[0];
			var maxX = ecg_graph.xAxisRange()[1];
			var minY = ecg_graph.yAxisRange()[0];
			var maxY = ecg_graph.yAxisRange()[1];
	
			var xWidth =  (maxX - minX)/2;
			var yHeight = (maxY - minY)/2;
			
			// calculate new ranges
			minX = x - xWidth;
			maxX = x + xWidth;
			minY = y - yHeight;
			maxY = y + yHeight;
	
			CVRG_zoomGraphX(minX, maxX);
			CVRG_zoomGraphY(minY, maxY);
		}else{
			alert("Annotation is at " + x + " milliseconds, which is outside of the currently loaded data range. (" + min + " - " + max + ")");
		}
	};

	function CVRG_zoomGraphX(minTime, maxTime) {
		var bDots = CVRG_bShowDots();
		var newTimeLabel = CVRG_getnewTimeLabel();
		
		ecg_graph.updateOptions({
			dateWindow: [minTime, maxTime],
			drawPoints: bDots,
			xlabel: newTimeLabel
		});
	};

	function CVRG_zoomGraphY(minValue, maxValue) {
		ecg_graph.updateOptions({
			valueRange: [minValue, maxValue]
		});
	};



	/** A function to call when the zoom window is changed (either by zooming in or out). minDate and maxDate are milliseconds since epoch. yRanges is an array of [bottom, top] pairs, one for each y-axis.
	 * 
	 * @param minDate
	 * @param maxDate
	 * @param yRanges
	 * @returns
	 */
	var CVRG_zoomCallback = function (minDate, maxDate, yRanges) {
		var bDots = CVRG_bShowDots();
		var newTimeLabel = CVRG_getnewTimeLabel();
		ecg_graph.updateOptions({
			valueRange: [yRanges[0][0], yRanges[0][1]],
			drawPoints: bDots,
			xlabel: newTimeLabel
		});
	};

	/** Initializes the axis labels, y-axis range and dot visibility.
	 * x-label is constructed from previously set values of CVRG_timeLabelPrefix, CVRG_TimeExponent and CVRG_sSecondSuffix.
	 * 
	 * @param dMinV - smallest voltage to display
	 * @param dMaxV - largest voltage to display
	 * @param yLabel - voltage label
	 * @returns void
	 */
	var CVRG_setLabels = function (dMinV, dMaxV, yLabel){
		var bDots = CVRG_bShowDots();
		var newTimeLabel = CVRG_getnewTimeLabel();
		ecg_graph.updateOptions({
			valueRange: [dMinV, dMaxV],
			drawPoints: bDots,
			xlabel: newTimeLabel,
			ylabel: yLabel
		});
	};
	
	
	function CVRG_bShowDots(){
		var bDots=false;
		var msPerSample = 1000/CVRG_sampleRate;
		var pixelsPerSample = msPerSample/CVRG_MsPerPixel;
		if(pixelsPerSample > 5){
			bDots = true;
		}

		return bDots;
	}