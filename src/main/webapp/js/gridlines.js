/**
 * Adds appropriate ticks on the y-axis
 * @param {Number} minY The minimum Y value in the data set
 * @param {Number} maxY The maximum Y value in the data set
 * @private
 */
Dygraph.prototype.addYTicks_ = function(minY, maxY) {
  // Set the number of ticks so that the labels are human-friendly.
  // TODO(danvk): make this an attribute as well.
  var formatter = this.attr_('yAxisLabelFormatter') ? this.attr_('yAxisLabelFormatter') : this.attr_('yValueFormatter');
  var ticks = Dygraph.numericTicks(minY, maxY, this, formatter);
  this.layout_.updateOptions( { yAxis: [minY, maxY],
                                yTicks: ticks } );
};


/**
 * Add ticks on the x-axis representing years, months, quarters, weeks, or days
 * @private
 */
Dygraph.prototype.addXTicks_ = function() {
  // Determine the correct ticks scale on the x-axis: quarterly, monthly, ...
  var startDate, endDate;
  if (this.dateWindow_) {
    startDate = this.dateWindow_[0];
    endDate = this.dateWindow_[1];
  } else {
    startDate = this.rawData_[0][0];
    endDate   = this.rawData_[this.rawData_.length - 1][0];
  }

  var xTicks = this.attr_('xTicker')(startDate, endDate, this);
  this.layout_.updateOptions({xTicks: xTicks});
};