// add your JavaScript/D3 to this file
// D3.js script

// Load the data
d3.csv('Rat_Sightings.csv').then(data => {
    // Parse the data
    data.forEach(d => {
        d['Created Date'] = new Date(d['Created Date']);
    });

    // Create filters
    const boroughs = Array.from(new Set(data.map(d => d.Borough))).sort();
    const buildingTypes = Array.from(new Set(data.map(d => d['Location Type']))).sort();

    // Add options to the borough filter
    d3.select('#borough-select')
      .selectAll('option.borough-option')
      .data(boroughs)
      .enter()
      .append('option')
      .classed('borough-option', true)
      .attr('value', d => d)
      .text(d => d);

    // Add options to the building type filter
    d3.select('#building-type-select')
      .selectAll('option.building-type-option')
      .data(buildingTypes)
      .enter()
      .append('option')
      .classed('building-type-option', true)
      .attr('value', d => d)
      .text(d => d);

    // Function to update the chart
    function updateChart(borough, buildingType) {
        // Filter data based on the current selection
        let filteredData = data;
        if (borough !== 'all') {
            filteredData = filteredData.filter(d => d.Borough === borough);
        }
        if (buildingType !== 'all') {
            filteredData = filteredData.filter(d => d['Location Type'] === buildingType);
        }

        // Aggregate data by year
        const sightingsByYear = d3.group(filteredData, d => d['Created Date'].getFullYear());
        const aggregatedData = Array.from(sightingsByYear, ([key, value]) => ({year: key, count: value.length}));

        // Sort the data by year
        aggregatedData.sort((a, b) => d3.ascending(a.year, b.year));

        // Set up the SVG dimensions and margins
        const margin = {top: 20, right: 20, bottom: 30, left: 50},
              width = 960 - margin.left - margin.right,
              height = 500 - margin.top - margin.bottom;

        // Remove the old svg if it exists
        d3.select('.chart').selectAll("*").remove();

        // Add the SVG element
        const svg = d3.select('.chart')
                      .attr('width', width + margin.left + margin.right)
                      .attr('height', height + margin.top + margin.bottom)
                    .append('g')
                      .attr('transform', `translate(${margin.left},${margin.top})`);

        // Set up the scales
        const x = d3.scaleLinear()
                    .domain(d3.extent(aggregatedData, d => d.year))
                    .range([0, width]);

        const y = d3.scaleLinear()
                    .domain([0, d3.max(aggregatedData, d => d.count)])
                    .range([height, 0]);

        // Draw the axes
        svg.append('g')
           .attr('transform', `translate(0,${height})`)
           .call(d3.axisBottom(x).tickFormat(d3.format('d')));

        svg.append('g')
           .call(d3.axisLeft(y));

        // Line generator
        const line = d3.line()
                       .x(d => x(d.year))
                       .y(d => y(d.count));

        // Draw the line
        svg.append('path')
           .datum(aggregatedData)
           .attr('fill', 'none')
           .attr('stroke', 'steelblue')
           .attr('stroke-width', 1.5)
           .attr('d', line);
    }

    // Initialize the chart
    updateChart('all', 'all');

    // Add event listeners for the filters
    d3.select('#borough-select').on('change', function() {
        updateChart(this.value, d3.select('#building-type-select').property('value'));
    });

    d3.select('#building-type-select').on('change', function() {
        updateChart(d3.select('#borough-select').property('value'), this.value);
    });
});
