// add your JavaScript/D3 to this file
// Define width, height, and projection for the map
const width = 960, height = 600;
const projection = d3.geoMercator().center([-74, 40.7]).scale(50000).translate([width / 2, height / 2]);
const path = d3.geoPath().projection(projection);

// Create SVG element
const svg = d3.select("#map").append("svg").attr("width", width).attr("height", height);

// Create a tooltip div that is hidden by default
const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

// Load and process data
d3.csv("Rat_Sightings.csv").then(data => {
    // Parse date and extract year
    data.forEach(d => {
        const date = new Date(d['Created Date']);
        d.extractedYear = date.getFullYear();
    });

    // Populate filter dropdowns
    populateFilters(data);

    d3.json("nyc.geojson").then(nyc => {
        // Draw the NYC map
        svg.selectAll(".borough")
            .data(nyc.features)
            .enter().append("path")
            .attr("d", path)
            .attr("class", "borough");

        // Initial plot of rat sightings
        updateMap(null, null, null);
    });
});

// Populate filter dropdowns with unique values
function populateFilters(data) {
    const years = Array.from(new Set(data.map(d => d.extractedYear))).sort();
    const boroughs = Array.from(new Set(data.map(d => d['Borough']))).sort();
    const types = Array.from(new Set(data.map(d => d['Location Type']))).sort();

    populateDropdown('year-filter', years);
    populateDropdown('borough-filter', boroughs);
    populateDropdown('building-type-filter', types);
}

// Helper function to populate a dropdown
function populateDropdown(id, values) {
    const select = document.getElementById(id);
    values.forEach(val => {
        const option = document.createElement('option');
        option.value = val;
        option.text = val;
        select.appendChild(option);
    });
}

// Function to update the map based on filters
function updateMap(year, borough, locationType) {
    // Filter data based on the selected criteria
    d3.csv("rat_sightings.csv").then(data => {
        const filteredData = data.filter(d =>
            (year === null || d.extractedYear.toString() === year) &&
            (borough === null || d['Borough'] === borough) &&
            (locationType === null || d['Location Type'] === locationType)
        );

        // Update the map with the filtered data
        const sightings = svg.selectAll(".sighting")
            .data(filteredData, d => d.id);

        sightings.enter()
            .append("circle")
            .attr("class", "sighting")
            .attr("cx", d => projection([d['Longitude'], d['Latitude']])[0])
            .attr("cy", d => projection([d['Longitude'], d['Latitude']])[1])
            .attr("r", 3)
            .on("mouseover", d => {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html("Date: " + d['Created Date'] + "<br/>Borough: " + d['Borough'] + "<br/>Location: " + d['Location Type'])
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY - 28) + "px");
            })
            .on("mouseout", d => {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            })
            .merge(sightings)
            .attr("cx", d => projection([d['Longitude'], d['Latitude']])[0])
            .attr("cy", d => projection([d['Longitude'], d['Latitude']])[1]);

        sightings.exit().remove();
    });
}

// Event listeners for the filters
document.getElementById('year-filter').addEventListener('change', function() {
    updateMap(this.value, document.getElementById('borough-filter').value, document.getElementById('building-type-filter').value);
});

document.getElementById('borough-filter').addEventListener('change', function() {
    updateMap(document.getElementById('year-filter').value, this.value, document.getElementById('building-type-filter').value);
});

document.getElementById('building-type-filter').addEventListener('change', function() {
    updateMap(document.getElementById('year-filter').value, document.getElementById('borough-filter').value, this.value);
});
