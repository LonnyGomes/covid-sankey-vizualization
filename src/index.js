// derived from https://www.d3-graph-gallery.com/graph/sankey_basic.html
// import classes from './main.css';
import * as d3 from 'd3';
import { sankeyLinkHorizontal, sankey as sankeyInstance } from 'd3-sankey';
import { parseWorld } from './process-data';
import rawData from './raw-data.json';
import processedData from './data.json';

const dataURL = 'https://pomber.github.io/covid19/timeseries.json';
const margin = { top: 10, right: 10, bottom: 10, left: 10 };
const width = 700 - margin.left - margin.right;
const height = 2000 - margin.top - margin.bottom;
const color = '#ccc';
const colorMap = d3.scaleOrdinal(d3.schemeSet3);

const init = () => {
    const d = parseWorld(rawData);
    genChart(d);
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

const genChart = data => {
    const svg = d3
        .select('#chart')
        .append('svg')
        // .style('width', '100%')
        // .style('height', 'auto');
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    const sankey = sankeyInstance()
        .size([width, height])
        .nodeId(d => d.name)
        .nodeWidth(20)
        .nodePadding(10)
        .linkSort((a, b) => {
            return b.value > a.value ? 1 : -1;
        })
        //.nodeAlign(sankeyLinkHorizontal)
        .extent([
            [0, 5],
            [width, height - 5],
        ]);

    const { nodes, links } = sankey(data);

    // build nodes
    svg.append('g')
        .selectAll('rect')
        .data(nodes)
        .join('rect')
        .attr('x', d => d.x0 + 1)
        .attr('y', d => d.y0)
        .attr('height', d => d.y1 - d.y0)
        .attr('width', d => d.x1 - d.x0 - 2)
        .attr('class', 'node')
        .attr('fill', d => {
            let c;
            if (d.type) {
                switch (d.type) {
                    case 'geo':
                        c = '#008fa8';
                        break;
                    case 'case':
                        c = '#7337d3';
                        break;
                    default:
                        c = 'grey';
                        break;
                }
            }

            return d3.color(c);

            // //        return 'red';
            // for (const link of d.sourceLinks) {
            //     if (c === undefined) c = link.color;
            //     else if (c !== link.color) c = null;
            // }
            // if (c === undefined)
            //     for (const link of d.targetLinks) {
            //         if (c === undefined) c = link.color;
            //         else if (c !== link.color) c = null;
            //     }
            // return (d3.color(c) || d3.color(color)).darker(0.5);
        })
        .append('title')
        .text(d => `${d.name}\n${d.value.toLocaleString()}`);

    // generate links
    const link = svg
        .append('g')
        .attr('fill', 'none')
        .selectAll('g')
        .data(links)
        .join('g')
        .attr('stroke', d => d3.color(d.color) || color)
        .style('mix-blend-mode', 'multiply');

    link.append('path')
        .attr('d', sankeyLinkHorizontal())
        .attr('class', 'link')
        .attr('stroke-width', d => Math.max(1, d.width));

    link.append('title').text(
        d => `${d.source.name} → ${d.target.name}\n${d.value.toLocaleString()}`
    );

    svg.append('g')
        .style('font', '10px sans-serif')
        .selectAll('text')
        .data(nodes)
        .join('text')
        .attr('x', d => (d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6))
        .attr('y', d => (d.y1 + d.y0) / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', d => (d.x0 < width / 2 ? 'start' : 'end'))
        .text(d => d.name)
        .append('tspan')
        .attr('fill-opacity', 0.7)
        .text(d => ` (${d.value.toLocaleString()})`);
};

init();
