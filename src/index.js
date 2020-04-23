import * as d3 from 'd3';

// ADD THESE AT TOP
var margin = { left: 80, right: 20, top: 50, bottom: 100};
var width = 600 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;


var g = d3.select("#chart-area")
    .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
    .append("g")
        .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

var time = 0;   // NOTE IT'S IMPORTANT TO KEEP MS LOWER THAN LOOP'S DELAY

// X SCALE
var x = d3.scaleLog()
    .base(10)
    .range([0, width])
    .domain([142, 150000])

// Y SCALE
var y = d3.scaleLinear()
    .range([height, 0])
    .domain([0, 90]);

var area = d3.scaleLinear()
    .range([25*Math.PI, 1500*Math.PI])
    .domain([2000, 1400000000])

var continentColor = d3.scaleOrdinal(d3.schemePastel1);

// X LABEL
var xLabel = g.append("text")
    // .attr("className", "x axis-label")
    .attr("x", width/2)
    .attr("y", height + 50)
    // .attr("y", height + 140)
    .attr("font-size", "20px")
    .attr("text-anchor", "middle")
    .text("GDP Per Capita ($)")

// Y LABEL
var yLabel = g.append("text")
    // .attr("className", "y axis-label")
    .attr("x", -170)
    .attr("y", -40)
    .attr("font-size", "20px")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .text("Life Expectancy (Years)")

var timeLabel = g.append("text")
    .attr("y", height - 10)
    .attr("x", width - 40)
    .attr("font-size", "40px")
    .attr("opacity", "0.4")
    .attr("text-anchor", "middle")
    .text("1800");

  // X AXIS
    var xAxisCall = d3.axisBottom(x)
        .tickValues([400, 4000, 40000])
        .tickFormat(d3.format("$"))
    g.append("g")
        .attr("className", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxisCall);

    // Y AXIS  
    var yAxisCall = d3.axisLeft(y)
        .tickFormat(function(d) {return +d});
    g.append("g")
        .attr("className", "y axis")
        .call(yAxisCall);

d3.json("data/data.json").then(function(data) {
    console.log(data)

    const workingData = data.map(function(year) {
        return year["countries"].filter(function(country) {
            var okCountry = (country.income && country.life_exp);
            return okCountry
        }).map(function(country) {
            country.income = +country.income;
            country.life_exp = +country.life_exp;
            return country;
        })
    })

    // console.log(workingData)

    d3.interval(function() {
        time = (time < 214) ? time + 1  : 0;
        update(workingData[time]);
    }, 100);

    // RUNNING VIS FOR FIRST TIME
    update(workingData[0]);
});

function update(data) {
    var t = d3.transition()
        .duration(100)

    // x.domain(data.map(function(d) {return d.month}))
    // y.domain([0, d3.max(data, function(d) {return d[value]})])

    // JOIN NEW DATA WITH OLD DATA  
    var circles = g.selectAll("circle")
        .data(data, function(d) {
            return d.country
        })

    circles.exit()
        .attr("className", "exit")
            .remove()             

    circles.enter()
        .append("circle")
        .attr("className", "enter")
        .attr("fill", function(d) {
            return continentColor(d.continent)
        })
        // .attr("fill-opacity", 0)
        .merge(circles)                   // UPDATES OLD ELEMENTS PRESENT IN NEW DATA
        .transition(t)
        // .transition(d3.transition().duration(500))       // SWAP OUT FOR VARIABLE
            .attr("cy", function(d) {return y(d.life_exp)})
            .attr("cx", function(d) {return x(d.income)})
            .attr("r", function(d) { return Math.sqrt(area(d.population) / Math.PI)})

    timeLabel.text(+(time + 1800))
}

