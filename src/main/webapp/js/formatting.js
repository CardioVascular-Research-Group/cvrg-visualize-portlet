	var CVRG_TimeExponent = 0;
	/** Sets the global variable CVRG_TimeExponent for the exponent used on the time axis labels.
	 * Will be used to modify the time axis label.
	 * 
	 * @param msMinTime - time, in milliseconds to calculate the Seconds' exponent from.
	 * @param chart - the dygraph chart object which the value refers to.
	 * @returns void
	 */
	var CVRG_setTimeExponent = function(msMinTime, chart){
		var secMinTime = msMinTime/1000;
		var temp_TimeExponent=-1;
		for (var i = 0; i < 10; i++) {
			if(secMinTime/Math.pow(10, i) < 10){
				temp_TimeExponent = i;
				break;
			}
		}
		
		// runs only once per scale change to avoid infinate recursion loop.
		if(temp_TimeExponent != CVRG_TimeExponent){
			CVRG_TimeExponent = temp_TimeExponent;
		}
	};
	
	var CVRG_MsPerPixel = 1 ;
	/** Sets the global valiable CVRG_MsPerPixel for the number of millisecond between one pixel and the next.
	 * Will be used to decide when to display the data points as dots on the line (e.g. when zoomed in far enough)
	 * 
	 * @param msPerPixel - value to be persisted.
	 * @param chart - the dygraph chart object which the value refers to.
	 * @returns void
	 */
	var CVRG_setMsPerPixel = function(msPerPixel, chart){
		//TODO: call Java code to adjust the display
		if (CVRG_MsPerPixel != msPerPixel){
			CVRG_MsPerPixel = msPerPixel;
		}
	};
	
	/**
	 * Add ticks when the x axis has numbers on it (instead of dates)
	 * @param minTms - {Number} startDate Start of the date window (millis since epoch)
	 * @param  maxTms -{Number} endDate End of the date window (millis since epoch)
	 * @param pixels - the length of the axis in pixels.
	 * @param axis_props - provides access to chart- and axis-specific options. 
	 *       It can be used to access number/date formatting code/options, check for a log scale, etc.
	 * @param self - the Dygraph object for which an axis is being constructed.
	 * @param forced_vals - used for secondary y-axes.
	 * @return "tick list" {Array.<Object>} Array of {label, value} tuples.
	 * @public
	 */
	var CVRG_xTickerMultiLead = function(minTms, maxTms, pixels, axis_props, self, forced_vals) {
		var pixelsPerTick = 6; 
		var msecLargeTime = 200; 
		var msecSmallTime = 40;

		return CVRG_TickerCommonFormatting(minTms, maxTms, pixels, axis_props, self, forced_vals, 
				pixelsPerTick, msecLargeTime, msecSmallTime);
	};
	
	var CVRG_yTickerMultiLead = function(minV, maxV, pixels, axis_props, self, forced_vals) {
		var pixelsPerTick = 3;
		var msecLargeTime = 500; 
		var msecSmallTime = 100;
		return CVRG_TickerCommonFormatting(minV, maxV, pixels, axis_props, self, forced_vals, 
				pixelsPerTick, msecLargeTime, msecSmallTime);
	};	

	var CVRG_xTickerSingle = function(minTms, maxTms, pixels, axis_props, self, forced_vals) {
		var pixelsPerTick = 30; 
		var msecLargeTime = 200; 
		var msecSmallTime = 40;

		return CVRG_TickerCommonFormatting(minTms, maxTms, pixels, axis_props, self, forced_vals, 
				pixelsPerTick, msecLargeTime, msecSmallTime);
	};
	
	var CVRG_yTickerSingle = function(minV, maxV, pixels, axis_props, self, forced_vals) {
		var pixelsPerTick = 20;
		var msecLargeTime = 500; 
		var msecSmallTime = 100;
		return CVRG_TickerCommonFormatting(minV, maxV, pixels, axis_props, self, forced_vals, 
				pixelsPerTick, msecLargeTime, msecSmallTime);
	};	

	var CVRG_highlightCallbackSingle = function(e, x, pts) {
		WAVEFORM3_highlightCrosshairs(e, pts, true);
	};
	/**
	 * Add ticks when the x axis has numbers on it (instead of dates)
	 * @param minV - minimum value of the window on this axis
	 * @param maxV - maximum value of the window on this axis
	 * @param pixels - the length of the axis in pixels.
	 * @param axis_props - properties array of this axis, if any. 
	 *             Provides access to chart- and axis-specific options. 
	 *             It can be used to access number/date formatting code/options, check for a log scale, etc.
	 * @param self - the Dygraph object for which an axis is being constructed.
	 * @param vals - Array of {label, value} tuples.
	 * @param pixelsPerTick - either "pixelsPerXLabel" or "pixelsPerYLabel"
	 * @param msecLargeTime=500; // time span between the dark grid lines 1/5 second (5 millimeter)on paper ECG, equal to 5 small time blocks
	 * @param var msecSmallTime=100;  // time span between the light grid lines 1/25 second (1 mm) on paper ECG
	 * 
	 * @return - Array of {label, value} tuples.
	 * @public
	 */
	var CVRG_TickerCommonFormatting = function(minV, maxV, pixels, axis_props, self, forced_vals, pixelsPerTick, msecLargeTime, msecSmallTime) {
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
	

	/** controls the display of numbers on the axes (i.e. tick marks).
	 * 
	 * @param val = the value
	 * @param granularity = How fine- or coarse-grained the axis is (i.e. hourly, daily, weekly, ...) 
	 * @param opts = a function which maps options to their values
	 * @param dygraph = the dygraph object
	 */
	var CVRG_xAxisLabelFormatter2 = function(val, granularity, opts, dygraph) {
		return CVRG_xAxisLabelFormatter(val);  // calling the function written for the older dygraphs library.
	};
	
	// Function to call to format values along the x axis. 
	// parameter:
	//     ms - time in milliseconds.
	var CVRG_xAxisLabelFormatter = function(ms) {
		var label = "";
		if(ms < WF_minTime){
			ms = (ms + 400.0) - (WF_minTime/1);// so the calibration pulse will have it's own zero time reference.
		}else{
			var shift = Math.pow(10, 5);
			var intMS = Math.round(ms * shift) / shift;
			var dSec = intMS/1000;
			label = CVRG_formatExponential(dSec,CVRG_TimeExponent,3);
		}
		return label;
	};

	/** Controls the display of numbers in the legend, formatted for the limited space under the calibration marks.
	 * (i.e. the text that appears when you hover on the chart).
	 * 
	 * @param val = the value
	 * @param opts = a function which maps options to their values
	 * @param series_name = the name of the relevant series
	 * @param dygraph = the dygraph object
	 */ 
	var CVRG_xValueFormatterCalibration = function(val, opts, series_name, dygraph){
		var result = "";		
		result = formatMsecToExponent(val);
		return result;
	};
			

	/** Controls the display of numbers in the legend 
	 * (i.e. the text that appears when you hover on the chart).
	 * 
	 * @param val = the value
	 * @param opts = a function which maps options to their values
	 * @param series_name = the name of the relevant series
	 * @param dygraph = the dygraph object
	 */ 
	var CVRG_xValueFormatter2 = function(val, opts, series_name, dygraph){
		if(val < WF_minTime){
			var calTime = (val + 400.0) - (WF_minTime/1);// so the calibration pulse will have it's own zero time reference.
			var temp = "Calibration Pulse " + calTime + "mSec"; 
			return temp;
		}else{
			return WAVEFORM3_xValueFormatter(val); // calling the function written for the older dygraphs library.
		}
	};

	
    /** Function to provide a custom display format the X value for mouseover. 
	 * @param x - time in milliseconds.
	 * 
	 * @returns - time in HH:MM:SS.sss format.
	 */
	var WAVEFORM3_xValueFormatter = function(x) {
//		return x;
		var result = "";		
		result = formatMsecToExponent(x);
//		return "Time (seconds):" + result + " ";
		return result + " Sec";
	};
	
	/** controls the display of numbers on the axes (i.e. tick marks).
	 * 
	 * @param val = the value
	 * @param granularity = How fine- or coarse-grained the axis is (i.e. hourly, daily, weekly, ...) 
	 * @param opts = a function which maps options to their values
	 * @param dygraph = the dygraph object
	 */
	var CVRG_yValueFormatter2 = function(val, granularity, opts, dygraph) {
		return CVRG_yValueFormatter(val) + " uV";  // calling the function written for the older dygraphs library.
	};

	// Function to provide a custom display format for the Y value for mouseover. 
	// parameter:
	//     y - value of the sample in millivolts.
	var CVRG_yValueFormatter = function(y) {
		var shift = Math.pow(10, 5);
		return Math.round(y * shift) / shift;
	};
	
	/** controls the display of numbers on the axes (i.e. tick marks).
	 * 
	 * @param val = the value
	 * @param granularity = How fine- or coarse-grained the axis is (i.e. hourly, daily, weekly, ...) 
	 * @param opts = a function which maps options to their values
	 * @param dygraph = the dygraph object
	 */
	var CVRG_yValueFormatter3 = function(val, granularity, opts, dygraph) {
		return val;  // calling the function written for the older dygraphs library.
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
	
	/** formats a number to be the coefficient(mantissa) for Exponential notation.
	 * @param num - number to format
	 * @param exponent - power of 10 which the return value will be multiplied by.
	 * @param digitsAfterDecimal - number of digits to preserve after the decimal point, the last digit being rounded.
	 */ 
	var CVRG_formatExponential = function(num, exponent, digitsAfterDecimal){
		var label = -99999;//unlikely to be a real time value
		var coefficient = num/Math.pow(10, exponent);
		
		// Round up to the requested number of decimal places.
		label = Dygraph.round_(coefficient, digitsAfterDecimal);
		
		return label;
	};

	/** Formats the label for the time axis based on the current decade of the data being displayed.
	 * 
	 * @returns {String}
	 */
	function CVRG_getnewTimeLabel(){
		return CVRG_timeLabelPrefix + " ( X 10^" + CVRG_TimeExponent + " " + CVRG_sSecondSuffix +")";
	};
	
	function formatMsecToExponent(x){
		var decimalMult = ( Math.pow(10,(CVRG_TimeExponent+3)) ); // e.g. 1, 10, 100, 1000 or 10000 ect.
		var s = x/decimalMult;
		return s + " X 10^" + CVRG_TimeExponent;
	};
