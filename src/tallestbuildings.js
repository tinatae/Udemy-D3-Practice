// NOTE FOR THIS TO RUN, NEED MAKE IT index.js FILE
import * as d3 from 'd3';

// ADD THESE AT TOP
const margin = { left: 100, right: 10, top: 100, bottom: 150 };
const width = 600 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

const g = d3.select("#chart-area")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

// X LABEL
g.append("text")
    .attr("className", "x axis-label")
    .attr("x", width / 2)
    .attr("y", -30)
    // .attr("y", height + 140)
    .attr("font-size", "20px")
    .attr("text-anchor", "middle")
    .text("World's Tallest Buildings")

// Y LABEL
g.append("text")
    .attr("className", "y axis-label")
    .attr("x", - (height / 2))
    .attr("y", -60)
    .attr("font-size", "20px")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .text("Height (m)")


d3.json("data/buildings.json").then(function (data) {
    console.log(data)

    data.forEach(function (d) {
        d.height = +d.height
    })

    const x = d3.scaleBand()
        .domain(data.map(function (d) {
            return d.name
        }))
        // .domain(["Burj Khalifa", "Shanghai Tower", "Abraj Al-Bait Clock Tower", "Ping An Finance Center", "Lotte World Tower", "One World Trade Center", "Guangzhou CTF Finance Center"])
        .range([0, width])
        .paddingInner(0.3)
        .paddingOuter(0.3)

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, function (d) {
            return d.height;
        })])
        // .domain([0, 828])
        .range([height, 0]);  // REVERSED


    const xAxisCall = d3.axisBottom(x);
    g.append("g")
        .attr("className", "x axis")
        .attr("transform", "translate(0, " + height + ")")
        .call(xAxisCall)
        .selectAll("text")
        .attr("y", "10")
        .attr("x", "-5")
        .attr("text-anchor", "end")
        .attr("transform", "rotate(-40)")

    const yAxisCall = d3
        .axisLeft(y)
        .ticks(3)
        .tickFormat(function (d) {
            return d + "m";
        });
    g.append("g")
        .attr("className", "y-axis")
        // .attr("transform", "translate(0, " + height + ")")
        .call(yAxisCall);

    // ACTUAL BARS
    const rects = g
        .selectAll("rect")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", function (d, i) {
            return x(d.name);
        })
        // .attr("x", function(d, i) {      // THIS IS HARD-CODED WIDTH FROM EARLIER
        //     return i * 50
        // })
        .attr("y", function (d) {
            return y(d.height)
        })
        // .attr("y", 20)
        .attr("width", x.bandwidth)
        // .attr("width", 20)               // HARD-CODED FROM EARLIER
        .attr("height", function (d) {
            return height - y(d.height)     // NOTE THIS ADJUSTMENT
        })
        .attr("fill", function (d) {
            return "blue"
        })
})   