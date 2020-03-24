// derived from https://www.d3-graph-gallery.com/graph/sankey_basic.html
import classes from './main.css';
import * as d3 from 'd3';
import { sankeyLinkHorizontal, sankey as sankeyInstance } from 'd3-sankey';
import { parseWorld } from './process-data';
import rawData from './raw-data.json';

const GLOBALS = {
    ALL_COUNTRIES: 'Overall Worldwide Totals',
};
const dataURL = 'https://pomber.github.io/covid19/timeseries.json';
const width = 900;
const height = 500;
const color = '#ccc';
const colorMap = d3.scaleOrdinal(d3.schemeSet3);

const init = () => {
    const results = parseWorld(rawData);
    let sankeyData = results.sankey;
    // add all countries option
    results.countries.unshift(GLOBALS.ALL_COUNTRIES);
    const dropdownEl = genCountryDropdown(results.countries);

    // generate chart
    const { link, label, node, sankey } = genChart(sankeyData);
    const graph = sankey(sankeyData);
    updateChart(graph, node, link, label);

    dropdownEl.addEventListener('change', evt => {
        const country =
            dropdownEl.value === GLOBALS.ALL_COUNTRIES
                ? null
                : dropdownEl.value;

        const newResults = parseWorld(rawData, country);
        const graph = sankey(newResults.sankey);
        updateChart(graph, node, link, label);
        //sankey.update(graph);
    });
    // try {
    //     fetch(dataURL)
    //         .then(response => response.json())
    //         .then(results => {
    //             console.log(results);
    //         })
    //         .catch(err => {
    //             console.error(
    //                 `Error encountered while retrieve data: ${err.message}`
    //             );
    //         });
    // } catch (error) {}
};

const genCountryDropdown = countries => {
    const dropdown = d3.select('#countries');

    dropdown
        .selectAll('option')
        .data(countries)
        .enter()
        .append('option')
        .text(data => data)
        .attr('value', data => data);

    return dropdown.node();
};

const genChart = data => {
    const svg = d3
        .select('#chart')
        .append('svg')
        //.attr('width', width + margin.left + margin.right)
        //.attr('height', height + margin.top + margin.bottom)
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .append('g');
    // .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    const sortFunc = (a, b) => {
        if (a === b) {
            return 0;
        }

        return b.value > a.value ? 1 : -1;
    };
    const sankey = sankeyInstance()
        //.size([width, height])
        .nodeId(d => d.name)
        .nodeWidth(20)
        .nodePadding(10)
        .linkSort(sortFunc)
        .nodeSort(sortFunc)
        //.nodeAlign(sankeyLinkHorizontal)
        .extent([
            [0, 5],
            [width, height - 5],
        ]);

    // build nodes
    const node = svg.append('g');

    // generate links
    const link = svg.append('g').attr('fill', 'none');

    // generate labels
    const label = svg.append('g').style('font', '10px sans-serif');

    return {
        sankey,
        node,
        link,
        label,
    };
};

const updateChart = (graph, node, link, label) => {
    const t = d3
        .transition()
        .duration(350)
        .ease(d3.easeLinear);

    const calcNodeClr = d => {
        let c;
        if (d.type) {
            switch (d.type) {
                case 'geo':
                    c = '#008fa8';
                    break;
                case 'case':
                    if (d.name === 'deaths') {
                        c = '#7c1515';
                    } else if (d.name === 'recovered') {
                        c = 'green';
                    } else {
                        c = '#bbb';
                    }
                    break;
                default:
                    c = 'red';
                    break;
            }
        }

        return d3.color(c);
    };
    // nodes
    node.selectAll('rect')
        .data(graph.nodes, data => data.name)

        .join(
            enter => {
                enter
                    .append('rect')
                    .attr('x', d => d.x0 + 1)
                    .attr('y', d => d.y0)
                    .attr('height', d => d.y1 - d.y0)
                    .attr('width', d => d.x1 - d.x0 - 2)
                    .attr('class', 'node')
                    .attr('fill', calcNodeClr)
                    .append('title')
                    .text(d => `${d.name}\n${d.value.toLocaleString()}`);
            },
            update =>
                update
                    .transition(t)
                    .attr('y', d => d.y0)
                    .attr('height', d => d.y1 - d.y0)
                    .select('title')
                    .text(d => `${d.name}\n${d.value.toLocaleString()}`),
            exit => exit.remove()
        );

    // links
    link.selectAll('g')
        .data(graph.links, data => {
            //console.log('data', data);
            return `${data.source.name}${data.target.name}`;
        })
        .join(
            enter => {
                enter
                    .append('g')
                    .attr('stroke', d => d3.color(d.color) || color)
                    .style('mix-blend-mode', 'multiply')
                    .append('path')
                    .attr('d', sankeyLinkHorizontal())
                    .attr('class', data => `${data.target.name} link`)
                    .attr('stroke-width', d => Math.max(1, d.width))
                    .append('title')
                    .text(
                        d =>
                            `${d.source.name} → ${
                                d.target.name
                            }\n${d.value.toLocaleString()}`
                    );
            },
            update => update,
            exit => exit.remove()
        );

    // labels
    label
        .selectAll('text')
        .data(graph.nodes, data => data.name)
        .join(
            enter => {
                enter
                    .append('text')
                    .attr('x', d => (d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6))
                    .attr('y', d => (d.y1 + d.y0) / 2)
                    .attr('dy', '0.35em')
                    .attr('text-anchor', d =>
                        d.x0 < width / 2 ? 'start' : 'end'
                    )
                    .text(d => d.name)
                    .append('tspan')
                    .attr('fill-opacity', 0.7)
                    .text(d => ` (${d.value.toLocaleString()})`);
            },
            update =>
                update
                    .transition(t)
                    .attr('x', d => (d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6))
                    .attr('y', d => (d.y1 + d.y0) / 2)
                    .attr('dy', '0.35em')
                    .attr('text-anchor', d =>
                        d.x0 < width / 2 ? 'start' : 'end'
                    )
                    .select('tspan')
                    .text(d => ` (${d.value.toLocaleString()})`),
            exit => exit.remove()
        );
};

init();
