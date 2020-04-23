// NOTE FOR THIS TO RUN, NEED MAKE IT index.js FILE
// THIS SLICES RESULTS & HAS SLIGHT TRANSITION
import * as d3 from 'd3';

var margin = { left: 80, right: 20, top: 50, bottom: 100 };
var width = 600 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

var flag = true;

var t = d3.transition().duration(750);                      // NOTE IT'S IMPORTANT TO KEEP MS LOWER THAN LOOP'S DELAY

var g = d3.select("#chart-area")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

var xAxisGroup = g.append("g")
    .attr("className", "x axis")
    .attr("transform", "translate(0," + height + ")");

var yAxisGroup = g.append("g")
    .attr("className", "y axis");

// X SCALE
var x = d3.scaleBand()
    .range([0, width])
    // .paddingInner(0.3)
    // .paddingOuter(0.3)
    .padding(0.2);

// Y SCALE
var y = d3.scaleLinear()
    .range([height, 0]);            // REVERSED

// X LABEL
g.append("text")
    // .attr("className", "x axis-label")
    .attr("x", width / 2)
    .attr("y", height + 50)
    // .attr("y", height + 140)
    .attr("font-size", "20px")
    .attr("text-anchor", "middle")
    .text("Month")

// Y LABEL
var yLabel = g.append("text")
    // .attr("className", "y axis-label")
    .attr("x", - (height / 2))
    .attr("y", -60)
    .attr("font-size", "20px")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .text("Revenue ($)")


d3.json("data/revenues.json").then(function (data) {
    console.log(data)

    data.forEach(function (d) {
        d.revenue = +d.revenue;
        d.profit = +d.profit;
    })

    d3.interval(function () {
        var newData = flag ? data : data.slice(1);
        update(newData);
        flag = !flag
    }, 1000);

    // RUNNING VIS FOR FIRST TIME
    update(data);
});

function update(data) {
    var value = flag ? "revenue" : "profit";

    x.domain(data.map(function (d) { return d.month }))
    y.domain([0, d3.max(data, function (d) { return d[value] })])

    // X AXIS
    var xAxisCall = d3.axisBottom(x);
    xAxisGroup.transition(t).call(xAxisCall);
    // xAxisGroup.call(xAxisCall);


    // Y AXIS
    var yAxisCall = d3.axisLeft(y)
        // .ticks(10)
        .tickFormat(function (d) { return "$" + d });
    yAxisGroup.transition(t).call(yAxisCall);
    // yAxisGroup.call(yAxisCall);

    // JOIN NEW DATA WITH OLD DATA  
    var rects = g.selectAll("rect")
        .data(data, function (d) {
            return d.month
        })

    rects.exit()
        .attr("fill", "red")
        .transition(t)
        .attr("y", y(0))
        .attr("height", 0)
        .remove()                   // JUST A SIDE-NOTE, BUT DON'T TRY TO CHAIN EVERYTHING TOGETHER

    // rects.attr("y", function(d) {return y(d[value])})
    //     .attr("x", function(d) {return x(d.month)})
    //     .attr("height", function(d) {return height - y(d[value])})
    //     .attr("width", x.bandwidth)

    rects.enter()
        .append("rect")
        .attr("x", function (d) { return x(d.month) })
        .attr("y", y(0))
        .attr("width", x.bandwidth)
        .attr("height", 0)
        .attr("fill", "brown")
        // .attr("fill-opacity", 0)
        .merge(rects)                                       // UPDATES OLD ELEMENTS PRESENT IN NEW DATA
        .transition(t)
        // .transition(d3.transition().duration(500))       // SWAP OUT FOR VARIABLE
        .attr("y", function (d) { return y(d[value]) })
        .attr("x", function (d) { return x(d.month) })
        .attr("width", x.bandwidth)
        .attr("height", function (d) { return height - y(d[value]) })
    // .attr("fill-opacity", 1)

    var label = flag ? "Revenue" : "Profit"
    yLabel.text(label)
}