/**************************
Functions used by singleLead.xhtml
revision 0.1 : May 29, 2013 - initial version Michael Shipway

*************************/
var dataSingle = [];
var labelSingle = [];
var sSecondSuffix       = leadName;
var timeLabelPrefix     = "Time (Sec) 2.5 * 10^0";
var yLabel              = "Amplitude (μV)";
var minTime = parent.WF_minTime;
var maxTime = parent.WF_maxTime;
var displayMinV2 = parent.displayMinV;
var displayMaxV2 = parent.displayMaxV;
var singleLeadNamespace = "";
var calPointCount = 300;
CVRG_sSecondSuffix = sSecondSuffix;
CVRG_timeLabelPrefix = timeLabelPrefix; 


	var SINGLELEAD_getSingleLeadData = function(leadNum2){
		var singleDataCol = [];
		var fields = [];
		
		labelSingle[0] = labelFull[0];
		labelSingle[1] = labelFull[leadNum2+1];
		labelSingle[2] = "";
		
		var minTime = dataFull[0][0];
		
		for(var cal=0; cal<=calPointCount;cal++){
			var point = [];
			
			// calibration mark is offset -400 msec from the start of data
			point[0] = minTime+cal-400; // column zero is time in milliseconds 
			point[1] = null;

			if((cal >= 50) & (cal <= 250)){ // 200 msec wide plus, 1000uV high.
				point[2] = 1000; // 1000 micro-Volts (uV).
			}else{
				point[2] = 0;
			}

			singleDataCol.push(point);
		}
		
		for(var samp=0; samp < dataFull.length ;samp++){
			var point = [];
		
			fields = dataFull[samp];
			point[0] = fields[0]; // column zero is time in milliseconds
			point[1] = fields[leadNum2+1]; // add 1 because column zero is time
			point[2] = null;
			singleDataCol.push(point);
		}
		return singleDataCol;
	};


	/** Single Lead Dygraph Display Mike Shipway 6/4/2013.
	 * 
	 * @returns
	 */	
	var SINGLELEAD_drawECGgraph = function(divName, namespace, dateStartMS, dateWidthMS){
		
		singleLeadNamespace = namespace;
		dataSingle = SINGLELEAD_getSingleLeadData(CVRG_getLeadNum());
		
		var newWidth = 800; 
		var newHeight= 400;
		
		var oneEm = 16; //correlative 1em = +/- 16px (using this for the actual css style)
		
		var cWidth = WAVEFORM_getElementByIdEndsWith("div", "graphContainerDiv_content").clientWidth;
		var sWidth = WAVEFORM_getElementByIdEndsWith("div", "sliderVoltCenterSingle").clientWidth;
		
		var lHeight = WAVEFORM_getElementByIdEndsWith("div", "ecgGraphLayout").clientHeight;
		var c1Height = WAVEFORM_getElementByIdEndsWith("div", "graphContainerDiv").clientHeight;
		var c2Height = WAVEFORM_getElementByIdEndsWith("div", "graphContainerDiv_content").clientHeight;
		
		var sHeight = WAVEFORM_getElementByIdEndsWith("div", "status_div").clientHeight;
		var tHeight = WAVEFORM_getElementByIdEndsWith("div", "title_div").clientHeight;
		
		newWidth = cWidth - (sWidth) - (2*oneEm); 
		newHeight= (lHeight - ((c1Height - c2Height) + sHeight + tHeight) - oneEm) * 0.98;
		
		CVRG_setTimeExponent(dataSingle[0][0]); //set the right timescale
		
		var bDots = CVRG_bShowDots();
		var newTimeLabel = CVRG_getnewTimeLabel();
		
		ecg_graph = new Dygraph( 
				WAVEFORM_getElementByIdEndsWith("div",divName),
				dataSingle,
				{
					valueRange: [displayMinV2, displayMaxV2],
					drawPoints: bDots,
					xlabel: newTimeLabel,
					ylabel: yLabel,
					width: newWidth,
					height: newHeight,
					
					stepPlot: false,
					labels: labelSingle,
					labelsDiv: WAVEFORM_getElementByIdEndsWith("div","status_div"),
					labelsDivStyles: { border: '1px solid black' },
					labelsSeparateLines: false,
					gridLineColor: '#FA8C8C',
					labelsKMB: true,
					axes: { 
						x: { 
							valueFormatter: CVRG_xValueFormatter2, //format the text that appears when you hover on the chart
							axisLabelFormatter: CVRG_xAxisLabelFormatter2, // format the numbers on the axes (i.e. tick marks)
							ticker: CVRG_xTickerSingle // Draws grid lines and draws numbers on the axis
						}, 
						y: { 
							valueFormatter: CVRG_yValueFormatter2, //format the text that appears when you hover on the chart
							axisLabelFormatter: CVRG_yAxisLabelFormatter2, // format the numbers on the axes (i.e. tick marks)
							ticker: CVRG_yTickerSingle  // Draws grid lines and draws numbers on the axis
						} 
					},
					annotationClickHandler:    SINGLELEAD_annotationClickHandler, 
					annotationDblClickHandler: CVRG_annotationDblClickHandler, 
					drawCallback:              SINGLELEAD_drawCallback, 
					pointClickCallback:        SINGLELEAD_pointClickCallback,
					zoomCallback:              SINGLELEAD_zoomCallback,
					underlayCallback:          SINGLELEAD_underlayCallback,  // Shows a colored bar to highlight each interval 

					highlightCallback: CVRG_highlightCallbackSingle,
					unhighlightCallback: function(e){
						CVRG_unhighlightCrosshairs(1);
					},
					highlightCircleSize: 5,
					strokeWidth: 1,

					padding: {left: 1, right: 1, top: 5, bottom: 5},
		            showRangeSelector: true,
		            rangeSelectorPlotStrokeColor: 'black',
		            rangeSelectorPlotFillColor: 'lightblue',
		            connectSeparatedPoints: false,
		            drawGapEdgePoints: true,
					interactionModel : {  // custom interation model definition parameter (Implemented in interval.js)
						'mousedown' : CVRG_mousedown2,
						'mousemove' : CVRG_mousemove2,
						'mouseup' : WAVEFORM3_mouseup
					}
				}
			);
		
		CVRG_InitHorizontalLines(1, divName, singleLeadNamespace);
		CVRG_InitVerticalLines(divName, namespace);
		
		if(bDots != CVRG_bShowDots()){
			ecg_graph.updateOptions({
				drawPoints: CVRG_bShowDots()
			});
		}
	};

	/** Sets the annotations of the single lead graph object to the values transferred from the backing bean.
	 * 
	 */
	var SINGLELEAD_ShowAnnotationSingle = function() {
		var auxIndex = 0;
		var auxArray = [];
		for(var i =0; i < tempAnnotations.length;i++){
		    if(parseInt(tempAnnotations[i].x) >= dataSingle[calPointCount+1][0] && parseInt(tempAnnotations[i].x) <= dataSingle[dataSingle.length-1][0]){
		    	auxArray[auxIndex] = tempAnnotations[i];
		    	auxIndex++;
		    }
		}
		if(auxIndex > 0){
			ecg_graph.setAnnotations(auxArray);
		}
	};

	/** SINGLELEAD_pointClickCallback(); 
	//event -  the event object for the click 
	// p  - a point on one of the graphs that was clicked. 
	**/
	var SINGLELEAD_pointClickCallback = function(event, p) {
		CVRG_unhighlightCrosshairs(1);
		// Check if the point is already annotated.
		if (p.annotation){
			alert("CVRG Message: " + p.name + " already has an annotation at: " + p.xval + " seconds.");
		}
		num++;
	};
	
	/** SINGLELEAD_pointClickCallback(); 
	//event -  the event object for the click 
	// p  - a point on one of the graphs that was clicked. 
	**/
	var SINGLELEAD_FineTune_pointClickCallback = function(event, p) {
		setFineTuneTemp(p.name ,p.xval, p.yval);
		SINGLELEAD_ShowAnnotationSingle();	
	};
	
	var setFineTuneTemp = function (series, x,y){
		var ann = {
			series: series,  // series, // lead name
			x: x, // milliseconds
			y: y, // microvolts,  CVRG extra data, not used by dygraphs, displayed when mousing over annotation list.
			shortText: "*", // text to show in the flag
			text: "new point", // will appear when mouse hovers over flag
			fullAnnotation: "Click Update to keep.", // CVRG extra data, not used by dygraphs, displayed when mousing over annotation list.
			tickHeight: 15, 
			annotationID: "New point" // Unique annotation ID (primary key) as found in the database.  			
		};
		
		var selectedPointIndex =  tempAnnotations.length;
		if(singlePoint){
			selectedPointIndex = 1;
		}else{
			selectedPointIndex = 2;
		}
			
		tempAnnotations[selectedPointIndex] = ann;
		
		CVRG_last_ann++; // redundent counter
	};
	
	var fineTuningPoint = -1;
	var singlePoint = false;
	var updateFineTuning = function(){
		if(singlePoint){
			if(tempAnnotations.length == 2){
				updateOnsetOffset();
			}
		}else{
			if(tempAnnotations.length == 3){
				updateOnsetOffset();
			}
		}
	};
	
	function updateOnsetOffset(){
		if(fineTuningPoint >= 0){
			tempAnnotations[fineTuningPoint].x = tempAnnotations[tempAnnotations.length-1].x;
			tempAnnotations[fineTuningPoint].y = tempAnnotations[tempAnnotations.length-1].y;
			
			updateSelectedPoint([{name:'fineTuningPoint', value:fineTuningPoint},
						              {name:'X', value:tempAnnotations[fineTuningPoint].x}, 
						              {name:'Y', value:tempAnnotations[fineTuningPoint].y}]);
			
		}
		tempAnnotations.pop();
	}
	
	var discardFineTuning = function(){
		if(singlePoint){
			if(fineTuningPoint >= 0){
				discardSelectedPoint([{name:'fineTuningPoint', value:fineTuningPoint}]);
				if(tempAnnotations.length == 2){
					tempAnnotations.pop();
				}
			}
		}else{
			if(fineTuningPoint >= 0){
				discardSelectedPoint([{name:'fineTuningPoint', value:fineTuningPoint}]);
				if(tempAnnotations.length == 3){
					tempAnnotations.pop();
				}
			}
		}
	};
	
	var zoomTime = function() {
		CVRG_unhighlightCrosshairs(1);
		// the screen size in uses
		var zoomCoefficient = (2500 / 100);
		var startPositionLeft = 0;
		CVRG_zoomGraphX( timeMinInput.value*zoomCoefficient+startPositionLeft , timeMaxInput.value*zoomCoefficient+startPositionLeft  );
	};
	
    var zoomVoltageOld = function() {
    	CVRG_unhighlightCrosshairs(1);
        // the screen size in uses
        var voltCoeff = (displayMaxV2-displayMinV2)/100; // converts percentage scroll bar to Voltage scale
    
        CVRG_zoomGraphY( (WAVEFORM_getElementById('voltMinInput').value-50)*voltCoeff, (WAVEFORM_getElementById('voltMaxInput').value-50)*voltCoeff);
    };
    
    var zoomVoltage = function(){
    	CVRG_unhighlightCrosshairs(1);
// the screen size in use
		var deltaV = (displayMaxV2-displayMinV2);
		var voltCoeff = deltaV/100; // converts percentage scroll bar to Voltage scale
		var dataCenter = deltaV/2 + displayMinV2;
		var voltCenterOffset = (WAVEFORM_getElementById('voltCenterInput').value)*voltCoeff;
		var minVolt = ((WAVEFORM_getElementById('voltMinInput').value-50)*voltCoeff);
		var maxVolt = ((WAVEFORM_getElementById('voltMaxInput').value-50)*voltCoeff);

		dataCenter -= voltCenterOffset;
		minVolt += dataCenter;
		maxVolt += dataCenter;

		ecg_graph.updateOptions({
			valueRange: [minVolt, maxVolt]
		});
    };
    
    var centerVoltage = function(){
    	CVRG_unhighlightCrosshairs(1);
    	var ext = getDataMinMax();
    	var centerV = (ext.dataMax+ext.dataMin)/2;
    	
		displayMinV2 = centerV-2000; 
		displayMaxV2 = centerV+2000;
    	
		ecg_graph.updateOptions({
			valueRange: [displayMinV2, displayMaxV2]
		});

		WAVEFORM_getElementById('voltCenterInput').value = 0; // center the slider
    };
    
    var centerScaleVoltage = function(){
    	CVRG_unhighlightCrosshairs(1);
    	var ext = getDataMinMax();
    	var deltaV = (ext.dataMax-ext.dataMin);
    	
		displayMinV2 = ext.dataMin-(deltaV*.05); // leave a 5% space at the bottom
		displayMaxV2 = ext.dataMax+(deltaV*.05); // leave a 5% space at the top
    	
		ecg_graph.updateOptions({
			valueRange: [displayMinV2, displayMaxV2]
		});

		WAVEFORM_getElementById('voltCenterInput').value = 0;
    };
    
    var getDataMinMax = function (){
    	var col = 1; // column zero is time, 1 is data, 2 is calibration.
    	var dataMin = ecg_graph.getValue(calPointCount+1,col);
    	var dataMax = ecg_graph.getValue(calPointCount+1,col);
    	var val = 0;
    	for(var row=calPointCount+2;row<ecg_graph.numRows();row++){
    		val = ecg_graph.getValue(row,col);
    		if(dataMax < val) dataMax = val;
    		if(dataMin > val) dataMin = val;
    	}
    	var ret = {
    				dataMin: dataMin, // microVolts
		    		dataMax: dataMax // microVolts
    			};
    	
    	return ret;
    };
    
    var centerTime = function(){
    	CVRG_unhighlightCrosshairs(1);
    	ecg_graph.updateOptions({
    		 dateWindow: null
    	});
    };
    
    
    var setVoltageZoom = function(newDisplayMinV, newDisplayMaxV){
		ecg_graph.updateOptions({
			valueRange: [newDisplayMinV, newDisplayMaxV]
		});
    };

	// Adds the annotation's details to the list.  Also generates a unique ID for each annotation so that Javascript can bold/unbold. 
	var SINGLELEAD_drawCallback = function(ecg_graph) {
		
		var ann = ecg_graph.annotations(); 


		var html = "";
		for (var i = 0; i < ann.length; i++) {
			var name = nameAnnotation(ann[i]); // formats the summary of a single annotation for display.
			html += "<span id='" + name + "' title='" + ann[i].fullAnnotation  + "'>";
			html += "<a href='javascript:CVRG_CenterGraph(" + ann[i].x + "," + ann[i].y + ");'>"; // center graph on click
			html += "["   + ann[i].shortText       + "]";    // text to show in the flag
			html += "</a>";    // end of hyperlink
			html += " "   + ann[i].text            + ""; // will appear when mouse hovers over flag
			html += "</span><br/>";
		}
		WAVEFORM_getElementById("list_div").innerHTML = html;
		
	};
	
	/** A function to call when the zoom window is changed (either by zooming in or out). minDate and maxDate are milliseconds since epoch. yRanges is an array of [bottom, top] pairs, one for each y-axis.
	 * 
	 * @param minDate
	 * @param maxDate
	 * @param yRanges
	 * @returns
	 */
	var SINGLELEAD_zoomCallback = function (minDate, maxDate, yRanges) {
		var bDots = CVRG_bShowDots();
		ecg_graph.updateOptions({
			drawPoints: bDots
		});
	};
	
	/** Called whenever the user clicks on an annotation.
	 * 
	 * Type: function(annotation, point, dygraph, event)
	 * annotation: the annotation left
	 * point: the point associated with the annotation
	 * dygraph: the reference graph
	 * event: the mouse event
	 * Default: null
	**/
	var SINGLELEAD_annotationClickHandler = function(ann, point, dg, event) {

		viewCurrentAnnotationNoEdit([{name:'annotationID', value:ann.annotationID}]);

	};
	
	/** Shows a colored bar to highlight each interval **/
	var SINGLELEAD_underlayCallback = function(canvas, area, g){
		WAVEFORM_showHighLightQueue(canvas, area, g);		
	};

	/** Prepends the namespace from the portlet environment to the element's ID, then returns the element thus found.
	 *  @param  elementID
	 *  
	 *  @returns - the DOM element
	 */
	var WAVEFORM_getElementById = function(elementID){
		return document.getElementById(singleLeadNamespace + ":" + elementID);
	};
	
	var WAVEFORM_getIdwNamespace = function(elementID){
		return singleLeadNamespace + ":" + elementID;
	};

	
	/** Copied from example on Tom Puleo's July 31,2008 blog at:
	 * http://www.tompuleo.com/2008/07/aspnet-getelementbyid-for-server.html 
	 * @param tagName - The tagname of the element you want e.g. "div" or "input"
	 * @param endsWith - The assigned id of the element, without the crud JSF prepends it with. e.g. "TitleDiv5".
	 * 					example with JSF crud:"A1576:j_idt12:TitleDiv5" 
	 * **/
	var WAVEFORM_getElementByIdEndsWith = function(tagName,endsWith)
	{
		var elements = document.getElementsByTagName(tagName);
		for(var i = 0; i < elements.length; i++)
		{
			if (elements[i].id.endsWith(endsWith))
			{
				return elements[i];
			}
		}
		alert("WAVEFORM_getElementByIdEndsWith() failed to find:" + tagName + ", " + endsWith);
		return null;
	};
	String.prototype.endsWith = function(txt,ignoreCase)
	{
		var rgx;
		if(ignoreCase)
		{
			rgx = new RegExp(txt+"$","i");
		}
		else
		{
			rgx = new RegExp(txt+"$");
		}
		return this.match(rgx)!=null;       
	};
	/** End of code from Tom Puleo **/
	
	/** Single Lead Dygraph Display Mike Shipway 6/4/2013.
	 * 
	 * @returns
	 */	
	var SINGLELEAD_drawFineTuner = function(divName,dateStartMS, dateWidthMS){
		dataSingle = SINGLELEAD_getSingleLeadData(CVRG_getLeadNum());
		var graphDiv = WAVEFORM_getElementByIdEndsWith("div",divName);
		var labelDiv = WAVEFORM_getElementByIdEndsWith("div","status_div");
		
		var newWidth = 600; 
		var newHeight= 300;
		
		var bDots = CVRG_bShowDots();
		var newTimeLabel = CVRG_getnewTimeLabel();
		
		if((graphDiv!=null)&(labelDiv!=null)){
			ecg_graph = null;
			ecg_graph = new Dygraph( 
				graphDiv,
				dataSingle,
				{
					valueRange: [displayMinV2, displayMaxV2],
					drawPoints: bDots,
					xlabel: newTimeLabel,
					ylabel: yLabel,
					width: newWidth,
					height: newHeight,
					
					stepPlot: false,
					labels: labelSingle,
					labelsDiv: labelDiv,
					labelsDivStyles: { border: '1px solid black' },
					labelsSeparateLines: false,
					gridLineColor: '#FA8C8C',
					labelsKMB: true,
					axes: { 
						x: { 
							valueFormatter: CVRG_xValueFormatter2, //format the text that appears when you hover on the chart
							axisLabelFormatter: CVRG_xAxisLabelFormatter2, // format the numbers on the axes (i.e. tick marks)
							ticker: CVRG_xTickerSingle // Draws grid lines and draws numbers on the axis
						}, 
						y: { 
							valueFormatter: CVRG_yValueFormatter2, //format the text that appears when you hover on the chart
							axisLabelFormatter: CVRG_yAxisLabelFormatter2, // format the numbers on the axes (i.e. tick marks)
							ticker: CVRG_yTickerSingle  // Draws grid lines and draws numbers on the axis
						} 
					},
					annotationClickHandler:    SINGLELEAD_annotationClickHandler, 
					annotationDblClickHandler: CVRG_annotationDblClickHandler,
					pointClickCallback:        SINGLELEAD_FineTune_pointClickCallback,
					zoomCallback:              SINGLELEAD_zoomCallback,
					underlayCallback:          SINGLELEAD_underlayCallback,
			
					highlightCallback: CVRG_highlightCallbackSingle,
					unhighlightCallback: function(e){
						CVRG_unhighlightCrosshairs(1);
					},
					highlightCircleSize: 5,
					strokeWidth: 1,

					padding: {left: 1, right: 1, top: 5, bottom: 5},
			        connectSeparatedPoints: false,
			        drawGapEdgePoints: true,
					dateWindow: [dateStartMS, (dateStartMS+dateWidthMS)] // Start and End times in milliseconds
				}
			);
		}

		if(bDots != CVRG_bShowDots()){
			ecg_graph.updateOptions({
				drawPoints: CVRG_bShowDots()
			});
		}

	};
	

	/** Draws the fine tuning dygraph of the data 15 points before and after the center point.
	 * @param centerPoint - specific data point that is being fine tuned.
	 * @param bShowGraph - Boolean if false don't draw the graph after all.
	 * @param termName - aka conceptName, sets the concept name in the ontologyTreeAPI so that it can be used by the ontology tree Flash program.
	 */
	var renderSingleGraphFineTuner = function(centerPoint, bShowGraph, termName){
		isMultigraph=false;

		if(bShowGraph){
			
			var firstPoint = dataSingle[calPointCount+1][0];
			var lastPoint = dataSingle[dataSingle.length-1][0];
			centerPoint = parseFloat(centerPoint);
			
			var startMS = centerPoint - 15.0;
			var endMS = centerPoint + 15.0;
			
			if(endMS >= lastPoint){
				var dif = endMS - lastPoint;
				startMS = startMS - dif;
				endMS = lastPoint;
			}
			
			if(startMS <= firstPoint){
				var dif = firstPoint - startMS;
				endMS = endMS + dif;
				startMS = firstPoint;
			}
			
			var widthMS = endMS - startMS;
			SINGLELEAD_drawFineTuner("fineTune_div", startMS, widthMS);	
			centerFineScaleVoltage(startMS, endMS);

			SINGLELEAD_ShowAnnotationSingle();	
		}
	};
	
	var renderSingleGraphFullAnnotation = function(startMS, endMS, bShowGraph){
		if(bShowGraph){
			var firstPoint = dataSingle[calPointCount+1][0];
			var lastPoint = dataSingle[dataSingle.length-1][0];
			
			startMS = parseFloat(startMS);
			endMS = parseFloat(endMS);
			var offsetMS = startMS - 5.0;
			var widthMS = (endMS - startMS) + 10.0;
				
			fineTuningPoint==-1;
			SINGLELEAD_drawFineTuner("fineTune_div", offsetMS, widthMS);	
			centerFineScaleVoltage(startMS, endMS);
			
			SINGLELEAD_ShowAnnotationSingle();	
		}				
	};

	  var centerFineScaleVoltage = function(startTime,endTime){
	    	CVRG_unhighlightCrosshairs(1);
	    	var ext = getFineDataMinMax(startTime,endTime);
	    	var deltaV = (ext.dataMax-ext.dataMin);
	    	
			var fineDisplayMinV2 = ext.dataMin-(deltaV*.1); // leave a 10% space at the bottom
			var fineDisplayMaxV2 = ext.dataMax+(deltaV*.1); // leave a 10% space at the top
	    	
			ecg_graph.updateOptions({
				valueRange: [fineDisplayMinV2, fineDisplayMaxV2]
			});

	    };
	    
	    var getFineDataMinMax = function (startTime, endTime){
	    	var col = 0; // column zero is time, 1 is data, 2 is calibration.
	    	var startRow=0;endRow=0;
	    	for(var row=calPointCount+2;row<ecg_graph.numRows();row++){
	    		val = ecg_graph.getValue(row,col);
	    		val1 = ecg_graph.getValue(row,1);
	    		val2 = ecg_graph.getValue(row,2);
	    		if (val<=startTime){
	    			startRow=row;
	    			endRow=row;
	    		};
	    		if (val>=endTime){
	    			endRow=row;
	    			break;
	    		};
	    	}
	    	col = 1; 
	    	var dataMin = ecg_graph.getValue(startRow,col);// initialize 
	    	var dataMax = dataMin;
	    	var val = 0;
	    	for(var row=startRow+1;row<endRow;row++){
	    		val = ecg_graph.getValue(row,col);
	    		if(dataMax < val) dataMax = val;
	    		if(dataMin > val) dataMin = val;
	    	}
	    	var ret = {
	    				dataMin: dataMin, // microVolts
			    		dataMax: dataMax // microVolts
	    			};
	    	
	    	return ret;
	    };

    var showManualGraphPanel = function(){
    	$(".fineTuningGraph").css('display', 'block');
    	$(".fineTuningGraph").animate({width:'49%'}, {queue: false });
    	$(".annotationData").animate({width:'50%'}, {queue: false });
    };
    
    var hideManualGraphPanel = function(){
    	$(".fineTuningGraph").animate({width:'0%'}, {queue: false });
    	$(".annotationData").animate({width:'99.9%'}, {queue: false });
    	$(".fineTuningGraph").css('display', 'none');
    };
