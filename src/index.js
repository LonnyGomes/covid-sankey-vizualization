// derived from https://www.d3-graph-gallery.com/graph/sankey_basic.html
import classes from './main.scss';
import * as d3 from 'd3';
import { sankeyLinkHorizontal, sankey as sankeyInstance } from 'd3-sankey';
import { parseWorld } from './process-data';
import rawData from './raw-data.json';

const GLOBALS = {
    ALL_COUNTRIES: 'Overall Worldwide Totals',
    LANDSCAPE_WIDTH: 900,
    LANDSCAPE_HEIGHT: 500,
    PORTRAIT_WIDTH: 450,
    PORTRAIT_HEIGHT: 500,
    THRESHOLD: 5000,
    TOGGLE_BTN_SHOW_MORE: 'Show Details',
    TOGGLE_BTN_HIDE: 'Hide Details',
};

const dataURL = 'https://pomber.github.io/covid19/timeseries.json';
const color = '#ccc';

const init = () => {
    // retrieve data
    const { sankey: sankeyData, countries, totals, leaderBoard } = parseWorld(
        rawData,
        null,
        GLOBALS.THRESHOLD
    );

    // event handler for dropdown change
    const onDropdownChange = () => {
        const country =
            dropdownEl.value === GLOBALS.ALL_COUNTRIES
                ? null
                : dropdownEl.value;

        const { sankey: sankeyData, leaderBoard } = parseWorld(
            rawData,
            country,
            GLOBALS.THRESHOLD
        );
        updateLeaderBoard(leaderBoard);

        const graph = sankey(sankeyData);
        updateChart(graph, node, link, label);
        //sankey.update(graph);
    };

    // configure country dropdown
    countries.unshift(GLOBALS.ALL_COUNTRIES); // add all countries option
    const dropdownEl = genCountryDropdown(countries);
    dropdownEl.addEventListener('change', onDropdownChange);

    const notesToggleBtn = document.getElementById('notes-toggle-btn');
    notesToggleBtn.innerHTML = GLOBALS.TOGGLE_BTN_SHOW_MORE;
    const fullNotes = document.getElementById('full-methodology-notes');
    notesToggleBtn.addEventListener('click', evt => {
        fullNotes.classList.toggle('hidden');
        evt.target.innerHTML =
            evt.target.innerHTML === GLOBALS.TOGGLE_BTN_SHOW_MORE
                ? GLOBALS.TOGGLE_BTN_HIDE
                : GLOBALS.TOGGLE_BTN_SHOW_MORE;
    });

    // set last updated timestamp
    updateTimestamp(totals);

    // generate leader board
    genLeaderBoard(leaderBoard);

    // generate chart
    const { link, label, node, sankey } = genChart(sankeyData);
    updateChart(sankey(sankeyData), node, link, label);

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

const calcSize = () => {
    const frameWidth = window.innerWidth;
    const frameHeight = window.innerHeight;

    // set width/height ratio for landscape
    let width = GLOBALS.LANDSCAPE_WIDTH;
    let height = GLOBALS.LANDSCAPE_HEIGHT;

    // change ratios if we are in portrait mode
    if (frameHeight > frameWidth) {
        width = GLOBALS.PORTRAIT_WIDTH;
        height = GLOBALS.PORTRAIT_HEIGHT;
    }

    return {
        width,
        height,
    };
};

const updateTimestamp = results => {
    d3.select('#timestamp-label')
        .data([results])
        .text(d => `Last Updated: ${d.timestamp} GMT`);
};

const formatNodeLabelLabel = (label, threshold = GLOBALS.THRESHOLD) => {
    const formatter = d3.format(',');
    const upperFormatter = str => `${str[0].toUpperCase()}${str.slice(1)}`;

    return label === 'other'
        ? `< ${formatter(threshold)} cases`
        : upperFormatter(label);
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

const genLeaderBoard = leaderBoard => {
    const formatter = d3.format(',');
    const board = d3
        .select('#leader-board')
        .append('table')
        .attr('class', 'leader-board-table');

    board
        .append('tr')
        .selectAll('th')
        .data(leaderBoard)
        .enter()
        .append('th')
        .attr('class', 'leader-board-title')
        .text(d => d.title);

    board
        .append('tr')
        .selectAll('td')
        .data(leaderBoard)
        .enter()
        .append('td')
        .attr('class', d => `leader-board-value ${d.key}`)
        .text(d => (isNaN(d.value) ? d.value : formatter(d.value)));
};

const updateLeaderBoard = leaderBoard => {
    const formatter = d3.format(',');
    d3.select('#leader-board')
        .selectAll('.leader-board-value')
        .data(leaderBoard)
        .text(d => (isNaN(d.value) ? d.value : formatter(d.value)));
};

const genChart = data => {
    const { width, height } = calcSize();
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
            [10, 10],
            [width - 10, height - 10],
        ]);

    // build nodes
    const node = svg.append('g');

    // generate links
    const link = svg.append('g').attr('fill', 'none');

    // generate labels
    const label = svg.append('g');

    return {
        sankey,
        node,
        link,
        label,
    };
};

const updateChart = (graph, node, link, label) => {
    const { width, height } = calcSize();
    const t = d3
        .transition()
        .duration(350)
        .ease(d3.easeLinear);

    // nodes
    node.selectAll('rect')
        .data(graph.nodes, data => data.name)

        .join(
            enter => {
                enter
                    .append('rect')
                    .attr('x', d => d.x0 + 1)
                    .attr('y', d => d.y0)
                    .attr('height', d => Math.max(0.5, d.y1 - d.y0))
                    .attr('width', d => d.x1 - d.x0 - 2)
                    .attr('class', d => `node ${d.type} ${d.name}`)
                    .append('title')
                    .text(
                        d =>
                            `${formatNodeLabelLabel(
                                d.name
                            )}\n${d.value.toLocaleString()}`
                    );
            },
            update =>
                update
                    .transition(t)
                    .attr('y', d => d.y0)
                    .attr('height', d => Math.max(0.5, d.y1 - d.y0))
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
                    .attr('class', data => `${data.source.name} link`)
                    .attr('stroke-width', d => Math.max(1, d.width))
                    .append('title')
                    .text(
                        d =>
                            `${formatNodeLabelLabel(
                                d.source.name
                            )} → ${formatNodeLabelLabel(
                                d.target.name
                            )}\n${d.value.toLocaleString()}`
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
                    .text(d => formatNodeLabelLabel(d.name))
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
