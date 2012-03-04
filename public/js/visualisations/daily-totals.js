var DailyTotals = function() {};

DailyTotals.prototype.render = function(stats) {
    var minDailyTotal = 100000,
        maxDailyTotal = -100000;
    var _this = this;

    var graphData = [],
        categories = [];
    for(var category in stats.dailyTotals) {
        categories.push(category);
        if(!categoryIsSelected(category))
            continue;
        
        for(var i = 0; i < stats.dailyTotals[category].length; i++) {
            stats.dailyTotals[category][i].category = category;
            var day = stats.dailyTotals[category][i];
            if(day.total > maxDailyTotal) maxDailyTotal = day.total;
            if(day.total < minDailyTotal) minDailyTotal = day.total;
        }
            
        graphData.push({category: category, values: stats.dailyTotals[category]});
    }
            
    var w = $('#top-graph').width(),
        h = $('#top-graph').height(),
        minDate = stats.dailyTotals["Total"][0].parsedDate,
        maxDate = stats.dailyTotals["Total"][stats.dailyTotals["Total"].length - 1].parsedDate,
        x = pv.Scale.linear(minDate, maxDate).range(0, w),
        y = pv.Scale.linear(minDailyTotal, maxDailyTotal).range(0, h),
        col = pv.Colors.category20(),
        idx = Math.floor((maxDate - minDate)/2) - 1;

    var vis = new pv.Panel()
        .def("i", -1)
        .canvas('top-graph')
        .width(w)
        .height(h)
        .bottom(20)
        .left(40)
        .right(40)
        .top(20);

    /* X-axis ticks. */
    vis.add(pv.Rule)
        .data(x.ticks())
        .visible(function(d){ return d > 0; })
        .left(x)
        .strokeStyle("#eee")
      .add(pv.Rule)
        .bottom(-5)
        .height(5)
        .strokeStyle("#000")
      .anchor("bottom").add(pv.Label)
        .text(x.tickFormat);

    /* Y-axis ticks. */
    vis.add(pv.Rule)
        .data(y.ticks(5))
        .bottom(y)
        .strokeStyle(function(d){ return d ? "#eee" : "#000"})
      .anchor("left").add(pv.Label)
        .text(y.tickFormat);

    /* The lines. */
    vis.add(pv.Panel)
        .data(graphData)
        .add(pv.Line)
        .strokeStyle(function(d){ return col(d.category); })
        .data(function(d){ return d.values; })
        .interpolate("linear")
        .left(function(d){ return x(d.parsedDate); })
        .bottom(function(d){ return y(d.total); })
        .lineWidth(function(d){ return 2; });

    /* Current index line. */
    var line = vis.add(pv.Rule)
        .visible(function(){ return idx >= 0 && idx != vis.i(); })
        .left(function(){ return x(idx); })
        .top(-4)
        .bottom(-4)
        .strokeStyle("red");
    
    line.anchor("top").add(pv.Label)
        .text(function(){ d = new Date(idx); return d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear() });
    line.anchor("left").add(pv.Label)
        .text(function(){ return _this.valuesStringAtIndex(idx, stats.dailyTotals).join(', '); });

    /* An invisible bar to capture events (without flickering). */
    vis.add(pv.Panel)
        .events("all")
        .event("mousemove", function() { idx = x.invert(vis.mouse().x); vis.render(); });

    vis.render();   
    
    // Render the legend
    renderLegend(col, categories);
};

DailyTotals.prototype.valuesStringAtIndex = function(idx, data) {
    var start = 0,
        end = data["Total"].length,
        mid = 0;
        
    // Find index for the given parsedDate idx
    while(start != end - 1) {
        mid = start + Math.floor((end - start) / 2);
        if(data["Total"][mid].parsedDate == idx) {
            break;
        }
        if(data["Total"][mid].parsedDate < idx) {
            start = mid;
        } else {
            end = mid;
        }
    }
    
    var string = "";
    var categoryTotals = [];
    for(var category in data) {
        if(parseInt(data[category][mid].total, 10) != 0) {
            categoryTotals.push(category + ": " + displayAmount(data[category][mid].total, false, '£'));
        }
    }
    return categoryTotals;
};

$(document).ready(function() {
    registerVisualisation("DailyTotals", "Daily Totals");
});
