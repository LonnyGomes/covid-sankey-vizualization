// derived from https://www.d3-graph-gallery.com/graph/sankey_basic.html
import './main.scss';
import * as d3 from 'd3';
import { sankeyLinkHorizontal, sankey as sankeyInstance } from 'd3-sankey';
import { parseWorld } from './process-data';
import rawData from './raw-data.json';
import historicData from './historic-data.json';
import { GLOBALS } from './globals';
import generateData from '../utils/generate-dataset';
import {
    calcSize,
    genCountryDropdown,
    genLeaderBoard,
    formatNodeLabelLabel,
    initServiceWorker,
    initAnimateButtons,
    initMethodologyToggle,
    updateTimestamp,
    updateAnimateBtn,
    updateFootnotes,
    updateLeaderBoard,
    populateBodyCopy,
    toggleAnimateBtnVisibility,
} from './helpers';

let isUSSelected = false;

const init = (initialData) => {
    let isAnimating = false;
    let country = null;
    let covidData = initialData;
    let animateInterval = null;

    initServiceWorker();

    // retrieve data
    const { countries, sankeyData, leaderBoard } = updateView(
        country,
        covidData
    );

    // retrieve latest data and update the UI
    const updateWithLatestData = () =>
        retrieveData().then((updatedData) => updateWithData(updatedData));

    // update UI with supplied covid data
    const updateWithData = (updatedData) => {
        if (isAnimating) {
            // we currently are animating, don't update data!
            return updatedData;
        }

        const { sankeyData: updatedSankeyData } = updateView(
            country,
            updatedData
        );
        const graph = sankey(updatedSankeyData);
        updateChart(graph, node, link, label);

        return updatedData;
    };

    const startAnimation = () => {
        const { world } = historicData;
        const dates = Object.keys(world).reverse();

        let animateThreshold = 100;
        animateInterval = setInterval(() => {
            isAnimating = true;
            updateAnimateBtn(isAnimating);

            const dateKey = dates.pop();
            if (!dateKey) {
                stopAnimation();
                updateWithLatestData();
                animateThreshold = 100;
                return;
            }

            switch (dateKey) {
                case '2/20/20':
                    animateThreshold = 1000;
                    break;
                case '3/10/20':
                    animateThreshold = 5000;
                    break;
                case '4/1/20':
                    animateThreshold = 10000;
                    break;
                case '4/10/20':
                    animateThreshold = 15000;
                    break;
                case '4/15/20':
                    animateThreshold = 25000;
                    break;
            }

            const updatedData = {
                world: world[dateKey],
                us: world[dateKey],
                timestamp: dateKey,
            };

            const { sankeyData: updatedSankeyData } = updateView(
                null,
                updatedData,
                animateThreshold
            );
            const graph = sankey(updatedSankeyData);
            updateChart(graph, node, link, label);
        }, GLOBALS.ANIMATION_DELAY);
    };

    const stopAnimation = () => {
        isAnimating = false;
        if (animateInterval) {
            clearInterval(animateInterval);
            animateInterval = null;
        }
        updateAnimateBtn(isAnimating);
    };

    // configure country dropdown
    genCountryDropdown(countries, (dropdownEl) => {
        // if an animation is happening, stop it
        stopAnimation();

        // event handler for dropdown change
        country =
            dropdownEl.value === GLOBALS.ALL_COUNTRIES
                ? null
                : dropdownEl.value;

        // track if United States is currently selected
        isUSSelected = country === GLOBALS.US_KEY ? true : false;

        // if worldwide is selected, show time-lapse buttons
        // otherwise, they should be hidden
        toggleAnimateBtnVisibility(country === null ? true : false);

        const { sankeyData } = updateView(country, covidData);

        const graph = sankey(sankeyData);
        updateChart(graph, node, link, label);
    });

    // configure methodology notes toggle
    initMethodologyToggle();

    // generate leader board
    genLeaderBoard(leaderBoard);

    // populate body copy for totals
    populateBodyCopy();

    // generate chart
    const { link, label, node, sankey } = genChart(sankeyData);
    updateChart(sankey(sankeyData), node, link, label);

    // initialize time-lapse animate buttons
    initAnimateButtons(() => {
        if (isAnimating) {
            stopAnimation();
            updateWithData(covidData);
        } else {
            startAnimation();
        }
    });

    // update data periodically
    setInterval(() => {
        updateWithLatestData().then((updatedData) => {
            // update the data we reference
            covidData = updatedData;
        });
    }, GLOBALS.REFRESH_INTERVAL);
};

const updateView = (country, covidData, thresholdOverride = -1) => {
    const globalThreshold =
        thresholdOverride > -1 ? thresholdOverride : GLOBALS.THRESHOLD;
    // track if United States is currently selected
    const threshold =
        country === GLOBALS.US_KEY ? GLOBALS.US_THRESHOLD : globalThreshold;

    const {
        sankey: sankeyData,
        leaderBoard,
        totals: curTotals,
        countries,
    } = parseWorld(covidData, country, globalThreshold, GLOBALS.US_THRESHOLD);

    // update leader board with latest totals
    updateLeaderBoard(leaderBoard);

    // update last updated with the current timestamp
    updateTimestamp(curTotals);

    // update dynamic footnotes
    updateFootnotes(country, threshold);

    return { sankeyData, countries, leaderBoard };
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
    const t = d3
        .transition()
        .duration(GLOBALS.ANIMATION_DELAY - 20)
        .ease(d3.easeLinear);

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
        .data(graph.links, (data) => `${data.source.name}${data.target.name}`)
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

const retrieveData = () => {
    // if data takes too long to retrieve, use the fallback dataset instead
    const dataFallback = new Promise((resolve) =>
        setTimeout(resolve, GLOBALS.DATA_TIMEOUT, rawData)
    );

    return Promise.race([generateData(), dataFallback]).catch((err) => {
        console.error(
            `Failed to retrieve latest data, using stale copy: ${err.message}`
        );
        return rawData;
    });
};

retrieveData().then((data) => init(data));
