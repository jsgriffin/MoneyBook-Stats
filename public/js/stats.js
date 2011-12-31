var dateIdx = 0,
	categoryIdx = 1,
	amountIdx = 2,
	tagIdx = 3,
	typeIdx = 4,
	stats = [],
	charts = [
		{title: "Daily Totals", functionName: "renderDailyTotalsGraph"},
		{title: "Category Totals", functionName: "categoryTotalsPieChart"}
	];

$(document).ready(function(){
	
	$('.datepicker').datepicker({dateFormat: 'dd/mm/yy'});
	$('.datepicker').change(function(){
		filterByDate($('#date-start').val(), $('#date-end').val(), data);
	});
	
	for(var i = 0; i < charts.length; i++) {
		$('#graphs #types select').append('<option value="' + charts[i].functionName + '">' + charts[i].title + '</option>');
	}
	$('#graphs #types select').change(function(){ renderSelectedGraph(); });
	
	// Sort out the graph sizes
	$('#graphs .inner').width($('#graphs').width() - $('#totals').width());
	$('#graphs .inner').height($('#graphs').height() - $('#filters').height());
	
	renderStats(data);
});

function calculateStats(data) {
	var totalIncoming = 0,
		totalOutgoing = 0,
		days = 0,
		categoryTotals = {},
		dailyTotals = [],
		dailyTotalIdx = 0,
		currentDay = "";
	
	for(var i = 0; i < data.length; i++) {
		row = data[i];
		amount = parseInt(row[amountIdx], 10);
		
		if(dailyTotals[row[categoryIdx]] == null) dailyTotals[row[categoryIdx]] = [];
		
		if(row[dateIdx] != currentDay) {
			if(currentDay != "") dailyTotalIdx++;
			days++;
			currentDay = row[dateIdx];
			dailyTotals[dailyTotalIdx] = {date: currentDay, transactions: [], total: 0, parsedDate: parseUKDate(currentDay)};
		}		
		
		if(row[typeIdx] == "incoming") {
			totalIncoming += amount;			
		} else {
			totalOutgoing += amount;
			amount *= -1;
		}
		
		if(categoryTotals[row[categoryIdx]] == null) {
			categoryTotals[row[categoryIdx]] = 0;
		}
		
		categoryTotals[row[categoryIdx]] += amount;
		dailyTotals[dailyTotalIdx].total += amount;
		dailyTotals[dailyTotalIdx].transactions.push({amount: amount, category: row[categoryIdx]});
	}
		
	var dailyCatTotals = {};
	for(var category in categoryTotals) {
		dailyCatTotals[category] = [];
	}
	dailyCatTotals["Total"] = [];
	for(var i = 0; i < dailyTotals.length; i++) {
		for(var category in categoryTotals) {
			dailyCatTotals[category][i] = {date: dailyTotals[i].date, total: 0, parsedDate: parseUKDate(dailyTotals[i].date)};
		}
		dailyCatTotals["Total"][i] = {date: dailyTotals[i].date, total: 0, parsedDate: parseUKDate(dailyTotals[i].date)};
		
		for(var j = 0; j < dailyTotals[i].transactions.length; j++) {
			var trans = dailyTotals[i].transactions[j];
			dailyCatTotals[trans.category][i].total += trans.amount;
			dailyCatTotals["Total"][i].total += trans.amount;
		}
	}	
			
	var dailyAverage = Math.round(((totalIncoming - totalOutgoing) / days) * 100) / 100;
	
	return {
		numDays: days,
		categoryTotals: categoryTotals,
		dailyAverage: dailyAverage,
		totalIncoming: totalIncoming,
		totalOutgoing: totalOutgoing,
		profit: (totalIncoming - totalOutgoing),
		dailyTotals: dailyCatTotals
	};
}

function renderStats(data) {
	stats = calculateStats(data);
	
	displayAmount(stats.dailyAverage, '#daily-average-total');
	displayAmount(stats.totalIncoming, '#total-incoming');
	displayAmount(stats.totalOutgoing, '#total-outgoing');
	displayAmount(stats.profit, '#profit');

	$('#categories').empty();
	for(var category in stats.categoryTotals) {
		$('#categories').append(
			"<p>" + category + ": " + displayAmount(stats.categoryTotals[category]) + "</p>"
		);
	}
	
	$('#date-start').val(stats.dailyTotals["Total"][0].date);
	$('#date-end').val(stats.dailyTotals["Total"][stats.dailyTotals["Total"].length - 1].date);
	
	renderSelectedGraph();
}

function renderSelectedGraph() {
	var selectedChart = $('#graphs #types select option:selected').val(),
		title = $('#graphs #types select option:selected').text();
	
	$('#graphs #title h1').text(title);
	eval(selectedChart + '(stats)');
}

function filterByDate(startDate, endDate, data) {
	var filteredData = [],
		parsedStart = parseUKDate(startDate),
		parsedEnd = parseUKDate(endDate);
		
	for(var i = 0; i < data.length; i++) {
		itemDate = parseUKDate(data[i][dateIdx]);
		if(itemDate <= parsedEnd && itemDate >= parsedStart)
			filteredData.push(data[i]);
	}
	
	renderStats(filteredData);
}

function displayAmount(amount, element, htmlChar) {
	string = '';
	
	if(typeof htmlChar == "undefined")
		htmlChar = '&pound;';
	
	if(amount < 0) {
		string += '-';
		amount *= -1;
	}
	
	string += htmlChar + amount;
	
	if(element)
		$(element).html(string);
	else
		return string;
}

function parseUKDate(date) {
	var dateUSFormat = date.substring(3, 5) + "/" + date.substring(0, 2) + "/" + date.substring(6, 10);
	return new Date(dateUSFormat);
}

function valuesStringAtIndex(idx, data) {
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
	for(var category in data) {
		if(parseInt(data[category][mid].total, 10) != 0)
			string += category + ": " + displayAmount(data[category][mid].total, false, '£') + ", ";
	}
	return string;
}

function renderDailyTotalsGraph(stats) {
	var minDailyTotal = 100000,
		maxDailyTotal = -100000;
	
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
		.text(function(){ return valuesStringAtIndex(idx, stats.dailyTotals); });

	/* An invisible bar to capture events (without flickering). */
	vis.add(pv.Panel)
	    .events("all")
	    .event("mousemove", function() { idx = x.invert(vis.mouse().x); vis.render(); });

	vis.render();	
	
	// Render the legend
	renderLegend(col, categories);
}

function categoryTotalsPieChart(stats) {
	var graphData = [],
		categories = [],
		max = 0;

	for(var category in stats.categoryTotals) {
		categories.push(category);
		if(!categoryIsSelected(category))
			continue;
			
		graphData.push({category: category, value: stats.categoryTotals[category]});
		max += stats.categoryTotals[category];
	}
	
	var w = $('#top-graph').width(),
	    h = $('#top-graph').height(),
	    r = (h / 2) - 20,
	    a = pv.Scale.linear(0, Math.abs(max)).range(0, 2 * Math.PI),
		col = pv.Colors.category20();

	/* The root panel. */
	var vis = new pv.Panel()
		.canvas('top-graph')
	    .width(w)
	    .height(h)
	    .bottom(0)
	    .left(0)
	    .right(0)
	    .top(0);

	/* The wedge, with centered label. */
	vis.add(pv.Wedge)
	    .data(graphData)
	    .innerRadius(r - 40)
	    .outerRadius(r)
	    .angle(function(d){ return a(Math.abs(d.value)); })
		.fillStyle(function(d){ return col(d.category); })
	  .anchor("outer").add(pv.Label)
		.textAlign("center")
	    .text(function(d){ return displayAmount(d.value, false, '£'); });

	vis.render();
	
	renderLegend(col, categories);
}

function categoryIsSelected(category) {
	var categorySlug = category.replace(' ', '-');
	return ($('#category-' + categorySlug).length == 0 || $('#category-' + categorySlug).is(':checked') == true);
}

function renderLegend(colours, categories) {
	var checkboxes = [];
	for(var i = 0; i < categories.length; i++) {
		var checked = 'checked="checked"',
			categorySlug = categories[i].replace(' ', '-');
				
		if(!categoryIsSelected(categories[i])) {
			checked = "";
		}
		
		checkboxes.push(
			'<span style="color: ' + colours(categories[i]).color + '">' + 
			'<input class="legend-checkbox" type="checkbox" name="category-' + categorySlug + '"' + 
			' id="category-' + categorySlug + '" ' + checked + ' />' +
			'<label for="category-' + categorySlug + '">' + categories[i] + '</label>' +
			'</span>'
		);
	}
	
	$('#graphs #legend div').empty();
	for(var i = 0; i < checkboxes.length; i++) {
		$('#graphs #legend div').append(checkboxes[i]);
	}
	
	$('.legend-checkbox').click(function(){
		setTimeout("renderSelectedGraph()", 250);
	});
}