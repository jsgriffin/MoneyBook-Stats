var Categories = function() {};
    
Categories.prototype.render = function categoryTotalsPieChart(stats) {
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
};

$(document).ready(function() {
    registerVisualisation("Categories", "Category Totals");
});
