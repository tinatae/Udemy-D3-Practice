import * as d3 from 'd3';
import d3tip from 'd3-tip';
import jquery from 'jquery';
import * as jqueryui from 'jquery-ui-bundle';

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
var interval;
var workingData;

// TOOLTIP
    var tip = d3tip().attr('className', 'd3-tip').html(function(d) {
        var text = "<strong>Country:</strong> <span style='color:red'>" + d.country + "</span><br>";
        text += "<strong>Continent:</strong> <span style='color:red;text-transform:capitalize'>" + d.continent + "</span><br>";
        text += "<strong>Life Expectancy:</strong> <span style='color:red'>" + d3.format(".2f")(d.life_exp) + "</span><br>";
        text += "<strong>GDP Per Capita:</strong> <span style='color:red'>" + d3.format("$,.0f")(d.income) + "</span><br>";
        text += "<strong>Population:</strong> <span style='color:red'>" + d3.format(",.0f")(d.population) + "</span><br>";
        return text;
    })

    g.call(tip);

// SCALES
    var x = d3.scaleLog()
        .base(10)
        .range([0, width])
        .domain([142, 150000])

    var y = d3.scaleLinear()
        .range([height, 0])
        .domain([0, 90]);

    var area = d3.scaleLinear()
        .range([25*Math.PI, 1500*Math.PI])
        .domain([2000, 1400000000])

    var continentColor = d3.scaleOrdinal(d3.schemePastel1);

// LABELS
    var xLabel = g.append("text")
        // .attr("className", "x axis-label")
        .attr("x", width/2)
        .attr("y", height + 50)
        // .attr("y", height + 140)
        .attr("font-size", "20px")
        .attr("text-anchor", "middle")
        .text("GDP Per Capita ($)")

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

    var continents = ["europe", "asia", "americas", "africa"];

// LEGEND
    var legend = g.append("g")
        .attr("transform", "translate(" + (width - 10) + "," + (height - 125) + ")");

    continents.forEach(function(continent, i) {
        var legendRow = legend.append("g")
            .attr("transform", "translate(0, " + (i * 20) + ")")

        legendRow.append("rect")
            .attr("width", 10)
            .attr("height", 10)
            .attr("fill", continentColor(continent));

        legendRow.append("text")
            .attr("x", -10)
            .attr("y", 10)
            .attr("text-anchor", "end")
            .style("text-transform", "capitalize")
            .text(continent)
    });

// DATA SCRUB
    d3.json("data/data.json").then(function(data) {
        console.log(data)

        workingData = data.map(function(year) {                         // workingData IS NOW GLOBAL VARIABLE
            return year["countries"].filter(function(country) {
                var okCountry = (country.income && country.life_exp);
                return okCountry
            }).map(function(country) {
                country.income = +country.income;
                country.life_exp = +country.life_exp;
                return country;
            })
        })

        // RUNNING VIS FOR FIRST TIME
        update(workingData[0]);
    });

// JQUERY BUTTONS

    // if (typeof jQuery !== 'undefined') {
    //     console.log('jQuery Loaded');
    // } else { console.log('not loaded yet')}

    jquery("#play-button").on("click", function () {
        var button = $(this);
        if (button.text() == "Play") {
            button.text("Pause");
            interval = setInterval(step, 100);
        } else {
            button.text("Play");
            clearInterval(interval);
        }
    });

    jquery("#reset-button").on("click", function () {
        time = 0;
        update(workingData[0]);
    });

    jquery("#continent-select").on("change", function () {
        update(workingData[time]);
    });

    jquery("#date-slider").slider({
        max: 2014,
        min: 1800,
        step: 1,
        slide: function (event, ui) {
            time = ui.value - 1800;
            update(workingData[time]);
        },
    });



   

// ----------------------------------------------
function step() {
    time = (time < 214) ? time + 1 : 0      // ONCE GO THROUGH ALL DATA, LOOP BACK
    update(workingData[time]);
} 

function update(data) {
    var t = d3.transition()
        .duration(100)

    var continent = $("#continent-select").val();

    var data = data.filter(function(d) {
        if (continent == "all") {
            return true
        } else { return d.continent == continent}
    })

    // JOIN NEW DATA WITH OLD ELEMENTS 
    var circles = g.selectAll("circle")
        .data(data, function(d) {
            return d.country
        })

    // REMOVE OLD ELEMENTS NOT PRESENT IN NEW DATA
    circles.exit()
        .attr("className", "exit")
            .remove()             

    // CREATE NEW SVG FOR NEW ELEMENTS PRESENT IN NEW DATA
    circles.enter()
        .append("circle")
        .attr("className", "enter")
        .attr("fill", function(d) {
            return continentColor(d.continent)
        })
        .on('mouseover', tip.show)        // EVENT HANDLERS ADDED BEFORE UPDATE
        .on('mouseout', tip.hide)
        .merge(circles)                   // UPDATES OLD ELEMENTS PRESENT IN NEW DATA
        .transition(t)
        // .transition(d3.transition().duration(500))       // SWAP OUT FOR VARIABLE
            .attr("cy", function(d) {return y(d.life_exp)})
            .attr("cx", function(d) {return x(d.income)})
            .attr("r", function(d) { return Math.sqrt(area(d.population) / Math.PI)})

    timeLabel.text(+(time + 1800))
    jquery("#year")[0].innerHTML = +(time + 1800)

    jquery("#date-slider").slider("value", +(time + 1800))
}

