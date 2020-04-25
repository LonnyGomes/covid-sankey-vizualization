import * as d3 from 'd3';
import { GLOBALS } from './globals';
const moment = require('moment');

export const initServiceWorker = () => {
    if ('serviceWorker' in navigator) {
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
                    console.log('[Service Worker] registration failed: ', err);
                }
            )
            .catch((err) => {
                console.log(err);
            });
    } else {
        console.log('service worker is not supported');
    }
};

//
// HTML generation functions
export const genCountryDropdown = (countries, callback = null) => {
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

    dropdown.on('change', (evt) => {
        if (callback) {
            callback(dropdown.node());
        }
    });

    return dropdown.node();
};

export const genLeaderBoard = (leaderBoard) => {
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

//
// D3 utility functions
export const calcSize = () => {
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

export const mapLabelName = (label) => GLOBALS.DROPDOWN_MAPPING[label] || label;

export const formatNodeLabelLabel = (label, isUS = false) => {
    const mappedLabel = mapLabelName(label);
    const upperFormatter = (str) => `${str[0].toUpperCase()}${str.slice(1)}`;

    return label === 'other' ? `Other*` : upperFormatter(mappedLabel);
};

export const initMethodologyToggle = () => {
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
};

export const populateBodyCopy = () => {
    // update the worldwide totals in the body copy
    d3.select('#totals-worldwide')
        .data([GLOBALS.THRESHOLD])
        .text((d) => d.toLocaleString());

    // update the united states totals in the body copy
    d3.select('#totals-united-states')
        .data([GLOBALS.US_THRESHOLD])
        .text((d) => d.toLocaleString());
};

export const updateFootnotes = (country, threshold) => {
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

export const updateLeaderBoard = (leaderBoard) => {
    const formatter = d3.format(',');
    d3.select('#leader-board')
        .selectAll('.leader-board-value')
        .data(leaderBoard)
        .text((d) => (isNaN(d.value) ? d.value : formatter(d.value)));
};

export const updateTimestamp = (results) => {
    const selection = d3.select('#timestamp-label').data([results]);

    // if a string is provided, the timestamp is a historical date
    if (isNaN(results.timestamp)) {
        selection.text((d) => `Time-lapse Date: ${d.timestamp}`);
    } else {
        selection.text((d) => `Last Updated: ${moment(d.timestamp).fromNow()}`);
    }
};

export const updateAnimateBtn = (isPlaying) => {
    d3.selectAll('.header .animate-icon')
        .data([isPlaying, isPlaying])
        .attr('class', (d) => `animate-icon ${d ? ' stop' : ' play'}`)
        .attr('aria-label', (d) => (d ? 'Stop' : 'Play'));
};

export const toggleAnimateBtnVisibility = (isVisible) => {
    d3.selectAll('.header')
        .data([isVisible])
        .attr('class', (d) => (d ? 'header worldwide' : 'header'));
};
