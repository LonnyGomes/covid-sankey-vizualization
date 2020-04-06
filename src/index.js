// derived from https://www.d3-graph-gallery.com/graph/sankey_basic.html
import './main.scss';
import * as d3 from 'd3';
import { sankeyLinkHorizontal, sankey as sankeyInstance } from 'd3-sankey';
import { parseWorld } from './process-data';
import rawData from './raw-data.json';
import { GLOBALS } from './globals';
import generateData from '../utils/generate-dataset';

const moment = require('moment');

let currentThreshold = GLOBALS.THRESHOLD;
let isUSSelected = false;

const initServiceWorker = () => {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker
                .register('service-worker.js')
                .then(
                    (registration) => {
                        // Registration was successful
                        console.log(
                            '[Service Worker] registration successful with scope: ',
                            registration.scope
                        );
                    },
                    (err) => {
                        // registration failed :(
                        console.log(
                            '[Service Worker] registration failed: ',
                            err
                        );
                    }
                )
                .catch((err) => {
                    console.log(err);
                });
        });
    } else {
        console.log('service worker is not supported');
    }
};

const init = (covidData) => {
    initServiceWorker();

    // retrieve data
    const { sankey: sankeyData, countries, totals, leaderBoard } = parseWorld(
        covidData,
        null,
        GLOBALS.THRESHOLD,
        GLOBALS.US_THRESHOLD
    );

    // event handler for dropdown change
    const onDropdownChange = () => {
        const country =
            dropdownEl.value === GLOBALS.ALL_COUNTRIES
                ? null
                : dropdownEl.value;

        // track if United States is currently selected
        isUSSelected = country === GLOBALS.US_KEY ? true : false;

        currentThreshold =
            country === GLOBALS.US_KEY
                ? GLOBALS.US_THRESHOLD
                : GLOBALS.THRESHOLD;

        const {
            sankey: sankeyData,
            leaderBoard,
            totals: curTotals,
        } = parseWorld(
            covidData,
            country,
            GLOBALS.THRESHOLD,
            GLOBALS.US_THRESHOLD
        );
        updateLeaderBoard(leaderBoard);

        // update last updated with the current timestamp
        updateTimestamp(curTotals);

        // update dynamic footnotes
        updateFootnotes(country, currentThreshold);

        const graph = sankey(sankeyData);
        updateChart(graph, node, link, label);
    };

    // configure country dropdown
    const dropdownEl = genCountryDropdown(countries);
    dropdownEl.addEventListener('change', onDropdownChange);

    // configure methodology notes toggle
    const fullNotes = document.getElementById('full-methodology-notes');
    const notesToggleBtn = document.getElementById('notes-toggle-btn');
    notesToggleBtn.innerHTML = GLOBALS.TOGGLE_BTN_SHOW_MORE;
    notesToggleBtn.addEventListener('click', (evt) => {
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

    // init dynamic footnote
    updateFootnotes(null, currentThreshold);

    // update the worldwide totals in the body copy
    d3.select('#totals-worldwide')
        .data([GLOBALS.THRESHOLD])
        .text((d) => d.toLocaleString());

    // update the united states totals in the body copy
    d3.select('#totals-united-states')
        .data([GLOBALS.US_THRESHOLD])
        .text((d) => d.toLocaleString());

    // generate chart
    const { link, label, node, sankey } = genChart(sankeyData);
    updateChart(sankey(sankeyData), node, link, label);
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

const updateTimestamp = (results) => {
    d3.select('#timestamp-label')
        .data([results])
        .text((d) => `Last Updated: ${moment(d.timestamp).fromNow()}`);
};

const updateFootnotes = (country, threshold) => {
    const formatter = d3.format(',');
    const regionName = country === GLOBALS.US_KEY ? 'states' : 'countries';
    const groupNotes = {
        index: 'other',
        title: `Other*`,
        description: `This category represents all ${regionName} with
reported cases less than ${formatter(threshold)}`,
    };

    const footnotes = [
        {
            index: 'note',
            title: 'NOTE',
            description:
                'Totals are based on official government reporting and do not indicate the actual number of infections',
        },
    ];

    // only show group notes if country is worldwide (null) or US
    if (!country || country === GLOBALS.US_KEY) {
        footnotes.push(groupNotes);
    }

    // clear contents of notes
    //TODO: this shouldn't be necessary, something is up w/ the d3 data joins
    d3.select('#footnotes').text('');

    const selection = d3
        .select('#footnotes')
        .selectAll('.footnote')
        .data(footnotes, (d) => d.index);

    selection.text('').enter().append('div').attr('class', 'footnote');

    const elements = d3.select('#footnotes').selectAll('.footnote');
    elements
        .append('span')
        .attr('class', 'title')
        .text((d) => d.title);

    elements
        .append('span')
        .attr('class', 'description')
        .text((d) => d.description);

    elements.exit().remove();
};

const mapLabelName = (label) => GLOBALS.DROPDOWN_MAPPING[label] || label;

const formatNodeLabelLabel = (label, isUS = false) => {
    const mappedLabel = mapLabelName(label);
    const upperFormatter = (str) => `${str[0].toUpperCase()}${str.slice(1)}`;

    return label === 'other' ? `Other*` : upperFormatter(mappedLabel);
};

const genCountryDropdown = (countries) => {
    const dropdown = d3.select('#countries');
    const filteredCountries = countries.filter(
        (country) => country !== GLOBALS.US_KEY
    );
    // add all countries and us to the top of the list
    filteredCountries.unshift(GLOBALS.ALL_COUNTRIES, GLOBALS.US_KEY);

    dropdown
        .selectAll('option')
        .data(filteredCountries)
        .enter()
        .append('option')
        .text((data) => mapLabelName(data))
        .attr('value', (data) => data);

    return dropdown.node();
};

const genLeaderBoard = (leaderBoard) => {
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
        .text((d) => d.title);

    board
        .append('tr')
        .selectAll('td')
        .data(leaderBoard)
        .enter()
        .append('td')
        .attr('class', (d) => `leader-board-value ${d.key}`)
        .text((d) => (isNaN(d.value) ? d.value : formatter(d.value)));
};

const updateLeaderBoard = (leaderBoard) => {
    const formatter = d3.format(',');
    d3.select('#leader-board')
        .selectAll('.leader-board-value')
        .data(leaderBoard)
        .text((d) => (isNaN(d.value) ? d.value : formatter(d.value)));
};

const genChart = (data) => {
    const { width, height } = calcSize();
    const svg = d3
        .select('#chart')
        .text('')
        .append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .append('g');

    const sortFunc = (a, b) => {
        if (a === b) {
            return 0;
        }

        return b.value > a.value ? 1 : -1;
    };
    const sankey = sankeyInstance()
        .nodeId((d) => d.name)
        .nodeWidth(20)
        .nodePadding(10)
        .linkSort(sortFunc)
        .nodeSort(sortFunc)
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
    const t = d3.transition().duration(350).ease(d3.easeLinear);

    // nodes
    node.selectAll('rect')
        .data(graph.nodes, (data) => data.name)
        .join(
            (enter) => {
                enter
                    .append('rect')
                    .attr('x', (d) => d.x0 + 1)
                    .attr('y', (d) => d.y0)
                    .attr('height', (d) => Math.max(0.5, d.y1 - d.y0))
                    .attr('width', (d) => d.x1 - d.x0 - 2)
                    .attr('class', (d) => `node ${d.type} ${d.name}`)
                    .append('title')
                    .text(
                        (d) =>
                            `${formatNodeLabelLabel(
                                d.name,
                                isUSSelected
                            )}\n${d.value.toLocaleString()}`
                    );
            },
            (update) =>
                update
                    .transition(t)
                    .attr('y', (d) => d.y0)
                    .attr('height', (d) => Math.max(0.5, d.y1 - d.y0))
                    .select('title')
                    .text((d) => `${d.name}\n${d.value.toLocaleString()}`),
            (exit) => exit.remove()
        );

    // links
    link.selectAll('path')
        .data(
            graph.links,
            (data) => `${data.source.name}${data.target.name}${data.value}`
        )
        .join(
            (enter) => {
                enter
                    .append('path')
                    .attr('d', sankeyLinkHorizontal())
                    .attr('class', (data) => `${data.source.name} link`)
                    .attr('stroke-width', (d) => Math.max(1, d.width))
                    .append('title')
                    .text(
                        (d) =>
                            `${formatNodeLabelLabel(
                                d.source.name,
                                isUSSelected
                            )} → ${formatNodeLabelLabel(
                                d.target.name,
                                isUSSelected
                            )}\n${d.value.toLocaleString()}`
                    );
            },
            (update) =>
                update
                    .transition(t)
                    .attr('d', sankeyLinkHorizontal())
                    .attr('stroke-width', (d) => Math.max(1, d.width)),
            (exit) => exit.transition(t).attr('stroke-width', 0).remove()
        );

    // labels
    label
        .selectAll('text')
        .data(graph.nodes, (data) => data.name)
        .join(
            (enter) => {
                enter
                    .append('text')
                    .attr('x', (d) => (d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6))
                    .attr('y', (d) => (d.y1 + d.y0) / 2)
                    .attr('dy', '0.35em')
                    .attr('text-anchor', (d) =>
                        d.x0 < width / 2 ? 'start' : 'end'
                    )
                    .text((d) => formatNodeLabelLabel(d.name, isUSSelected))
                    .append('tspan')
                    .attr('fill-opacity', 0.7)
                    .text((d) => ` (${d.value.toLocaleString()})`);
            },
            (update) =>
                update
                    .transition(t)
                    .attr('x', (d) => (d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6))
                    .attr('y', (d) => (d.y1 + d.y0) / 2)
                    .attr('dy', '0.35em')
                    .attr('text-anchor', (d) =>
                        d.x0 < width / 2 ? 'start' : 'end'
                    )
                    // TODO: currently, this would overwrite the tspan
                    //.text(d => formatNodeLabelLabel(d.name, isUSSelected))
                    .select('tspan')
                    .text((d) => ` (${d.value.toLocaleString()})`),
            (exit) => exit.remove()
        );
};

// if data takes too long to retrieve, use the fallback dataset instead
const dataFallback = new Promise((resolve) =>
    setTimeout(resolve, GLOBALS.DATA_TIMEOUT, rawData)
);

Promise.race([generateData(), dataFallback])
    .then((data) => init(data))
    .catch((err) => {
        console.error(
            `Failed to retrieve latest data, using stale copy: ${err.message}`
        );
        init(rawData);
    });
