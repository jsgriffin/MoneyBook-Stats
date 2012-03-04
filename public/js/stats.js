var dateIdx = 0,
    categoryIdx = 1,
    amountIdx = 2,
    tagIdx = 3,
    typeIdx = 4,
    stats = [],
    charts = [];

$(document).ready(function(){
    
    $('.datepicker').datepicker({dateFormat: 'dd/mm/yy'});
    $('.datepicker').change(function(){
        filterByDate($('#date-start').val(), $('#date-end').val(), data);
    });
    
    $('#graphs #types select').change(function(){ renderSelectedGraph(); });
    
    // Sort out the graph sizes
    $('#graphs .inner').width($('#graphs').width() - $('#totals').width());
    $('#graphs .inner').height($('#graphs').height() - $('#filters').height());

    // Fix the height of the totals column. 
    $('#totals').css({
        height: $(window).height() - $('#filters').height(),
        top: $('#filters').height()
    })
    
});

function updateVisualisationsMenu() {
    $('#graphs #types select').html('');
    for(var i = 0; i < charts.length; i++) {
        $('#graphs #types select').append('<option value="' + charts[i].className + '">' + charts[i].title + '</option>');
    }
    renderStats(data);
}

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
            "<p>" + category + ': <span class="total-amount">' + displayAmount(stats.categoryTotals[category]) + "</span></p>"
        );
    }
    
    $('#date-start').val(stats.dailyTotals["Total"][0].date);
    $('#date-end').val(stats.dailyTotals["Total"][stats.dailyTotals["Total"].length - 1].date);
    
    renderSelectedGraph();
}

function renderSelectedGraph() {
    var selectedChart = $('#graphs #types select option:selected').val(),
        title = $('#graphs #types select option:selected').text();
    
    if (selectedChart == undefined) {
        return;
    }

    $('#graphs #title h1').text(title);
    eval('new ' + selectedChart + '().render(stats)');
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

function registerVisualisation(className, visName) {
    charts.push({title: visName, className: className});
    updateVisualisationsMenu();
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