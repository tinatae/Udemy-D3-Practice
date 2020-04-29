import * as d3 from 'd3';
import jquery from 'jquery';
import * as jqueryui from 'jquery-ui-bundle';

var margin = { left: 80, right: 100, top: 30, bottom: 70 };
var height = 400 - margin.top - margin.bottom;
var width = 1100 - margin.left - margin.right;

var svg = d3.select("#chart-area")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)

var g = svg.append("g")
  .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

var t = function() {return d3.transition().duration(1000)}
var filteredData = {};
var dataTimeFiltered = {};

// Time parser for x-scale
var parseTime = d3.timeParse("%d/%m/%Y");
var formatTime = d3.timeFormat("%m/%d/%Y");
// For tooltip
var bisectDate = d3.bisector(function(d) {
  return d.date }).left;

// ADD LINE FOR THE FIRST TIME
g.append("path")                
  .attr("class", "line")
  .attr("fill", "none")
  .attr("stroke", "grey")
  .attr("stroke-width", "3px")

// LABELS
  var xLabel = g.append("text")
    .attr("class", "x axisLabel")
    .attr("y", height + 60)
    .attr("x", width/2)
    .attr("font-size", "20px")
    .attr("text-anchor", "middle")
    .text("Time")

  var yLabel = g.append("text")
    .attr("class", "y axisLabel")
    .attr("transform", "rotate(-90)")
    .attr("y", -60)
    .attr("x", -170)
    .attr("font-size", "20px")
    .attr("text-anchor", "middle")
    .text("Price (USD)")


// Scales
var x = d3.scaleTime().range([0, width]);
var y = d3.scaleLinear().range([height, 0]);

// X AXIS
var xAxisCall = d3.axisBottom()
  .ticks(4);
var xAxis = g.append("g")
  .attr("class", "x axis")
  .attr("transform", "translate(0," + height + ")");

// Y AXIS
var yAxisCall = d3.axisLeft()

var yAxis = g.append("g")
  .attr("class", "y axis");

// JQUERY CHANGES
jquery("#coin-select").on("change", update)
jquery("#var-select").on("change", update)

jquery("#date-slider").slider({
  range: true,
  max: parseTime("10/31/2017").getTime(),
  min: parseTime("05/12/2013").getTime(),
  step: 86400000,
  values: [parseTime("05/12/2013").getTime(), parseTime("10/31/2017").getTime()],
  slide: function(event, ui) {
    $("#dateLabel1").text(formatTime(new Date(ui.values[0])));
    $("#dateLabel2").text(formatTime(new Date(ui.values[1])));
    update();
  }
});

d3.json("data/coins.json").then(function(data) {
  console.log(data);
  // var filteredData= {};

  for (let coin in data) {
      if (!data.hasOwnProperty(coin)) {
          continue
      }
      filteredData[coin] = data[coin].filter(function(d) {
        return !(d["price_usd"] == null)
      })

      filteredData[coin].forEach(function(d) {
        d["price_usd"] = +d["price_usd"];
        d["24h_vol"] = +d["24h_vol"];
        d["market_cap"] = +d["market_cap"];
        d["date"] = parseTime(d["date"]);
      })
  }
  console.log(filteredData);
  
    update();
});

function update() {
  var coin = jquery("#coin-select").val();
  var yValue = jquery("#var-select").val();
  var sliderValues = jquery("#date-slider").slider("values");

  var dataTimeFiltered = filteredData[coin].filter(function(d) {
    return ((d.date >= sliderValues[0]) && (d.date <= sliderValues[1]))
  })

  console.log(dataTimeFiltered);
  // Set scale domains
  x.domain(d3.extent(dataTimeFiltered, function(d) {
      return d.date })
  );

  y.domain([d3.min(dataTimeFiltered, function(d) {
      return d[yValue]}) / 1.005,
    d3.max(dataTimeFiltered, function(d) {
      return d[yValue]}) * 1.005]);

  var formatSi = d3.format(".2s")

  function formatAbbreviation(x) {
    var s = formatSi(x);

    switch (s[s.length - 1]) {
      case "G": return s.slice(0, -1) + "B";
      case "k": return s.slice(0, -1) + "K";
    }
    return s;
  }

// UPDATE AXES
xAxisCall.scale(x);
xAxis.transition(t()).call(xAxisCall);
yAxisCall.scale(y);
yAxis.transition(t()).call(yAxisCall.tickFormat(formatAbbreviation));

d3.select(".focus").remove();
d3.select(".overlay").remove();


  /******************************** Tooltip Code ********************************/

  var focus = g.append("g").attr("className", "focus").style("display", "none");

  focus.append("line")
    .attr("class", "x-hover-line hover-line")
    .attr("y1", 0)
    .attr("y2", height);

  focus.append("line")
    .attr("class", "y-hover-line hover-line")
    .attr("x1", 0)
    .attr("x2", width);

  focus.append("circle").attr("r", 5);

  focus.append("text").attr("x", 15).attr("dy", ".31em");

  svg
    .append("rect")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    // .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .attr("class", "overlay")
    // .attr("fill", "red")
    .attr("width", width)
    .attr("height", height)
    .on("mouseover", function() { focus.style("display", null)})
    .on("mouseout", function() { focus.style("display", "none")})
    .on("mousemove", mousemove);

  function mousemove() {
    var x0 = x.invert(d3.mouse(this)[0]),
      i = bisectDate(dataTimeFiltered, x0, 1),
      d0 = dataTimeFiltered[i - 1],
      d1 = dataTimeFiltered[i],

      d = (d1 && d0) ? (x0 - d0.date > d1.date - x0 ? d1 : d0) : 0;

    focus.attr("transform", "translate(" + x(d.date) + "," + y(d[yValue]) + ")");
    focus.select("text").text(function() {
      // var result = (d[yValue]) ? (d3.format("$, ")(d[yValue].toFixed(2))) : ("")
      return d3.format("$,")(d[yValue].toFixed(2))
    });
    focus.select(".x-hover-line").attr("y2", height - y(d[yValue]));
    focus.select(".y-hover-line").attr("x2", -x(d.date));
  }

  // PATH GENERATOR
  var line = d3.line()
    .x(function(d) { return x(d.date) })
    .y(function(d) { return y(d[yValue]) })

  g.select(".line")
    .attr("stroke", "white")
    .transition(t)
    .attr("d", line(dataTimeFiltered))

  var newText = (yValue === "price_usd") ? "Price (USD)" :
    ((yValue === "market_cap") ? "Market Capitalization (USD)" : "24 Hour Trading Volume (USD)")
  yLabel.text(newText);
}

