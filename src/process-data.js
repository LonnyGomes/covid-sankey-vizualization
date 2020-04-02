import { GLOBALS } from './globals';

// constants
const NODE_NAMES = {
    US: GLOBALS.US_KEY,
    OTHER: 'other',
};
const NODE_TYPES = {
    GEO: 'geo',
    CASE: 'case',
};
const LEADER_BOARD_TITLES = {
    DEATHS: 'Total\nDeaths',
    ACTIVE: 'Active \nCases',
    CONFIRMED: 'Total\nConfirmed',
    RECOVERED: 'Total\nRecovered',
    RATE: 'Death\nRate',
};
const CASE_TYPES = ['active', 'deaths', 'recovered'];

export const parseWorld = (
    data,
    selectedCountry = null,
    threshold = 5000,
    us_threshold = 1000
) => {
    const { world: worldData, us: usData, timestamp } = data;
    const totals = {
        confirmed: 0,
        deaths: 0,
        recovered: 0,
        active: 0,
        rate: 0,
        timestamp,
    };

    const otherTotals = {
        confirmed: 0,
        deaths: 0,
        recovered: 0,
        active: 0,
        rate: 0,
    };

    const curThreshold =
        selectedCountry === NODE_NAMES.US ? us_threshold : threshold;

    const nodes = [];

    // add case times as nodes
    CASE_TYPES.forEach(caseType => {
        nodes.push({
            name: caseType,
            type: NODE_TYPES.CASE,
        });
    });

    const links = [];

    const countries = Object.keys(worldData).sort();
    const states = Object.keys(usData).sort();

    // we want to group countries into thresholds if a selected country
    // is not defined or if one is defined and it is the US
    const shouldGroup =
        !selectedCountry ||
        (selectedCountry && selectedCountry === NODE_NAMES.US)
            ? true
            : false;

    // define selected region based on if US is selected
    const selectedRegion =
        selectedCountry === NODE_NAMES.US ? states : [selectedCountry];

    // determine if the region or the countries should be used in the iteration
    const selectedCountries = selectedCountry ? selectedRegion : countries;

    // determine if we will use the US or World dataset
    const dataset = selectedCountry === NODE_NAMES.US ? usData : worldData;

    selectedCountries.forEach(curCountry => {
        const latestStats = [...dataset[curCountry]].pop();

        Object.keys(totals).forEach(curItemKey => {
            if (!latestStats[curItemKey]) {
                latestStats[curItemKey] = 0;
            }
        });

        latestStats.active =
            latestStats.confirmed - latestStats.deaths - latestStats.recovered;
        totals.confirmed += latestStats.confirmed;
        totals.deaths += latestStats.deaths;
        totals.recovered += latestStats.recovered;
        totals.active += latestStats.active;
        totals.rate = `${Math.round((totals.deaths / totals.confirmed) * 1000) /
            10}%`;

        if (latestStats.confirmed <= curThreshold && shouldGroup) {
            otherTotals.confirmed += latestStats.confirmed;
            otherTotals.deaths += latestStats.deaths;
            otherTotals.recovered += latestStats.recovered;
            otherTotals.active += latestStats.active;
        } else {
            // add node for country
            nodes.push({
                name: curCountry,
                type: 'geo',
            });

            // link country to case types
            CASE_TYPES.forEach(caseType => {
                links.push({
                    source: caseType,
                    target: curCountry,
                    value: latestStats[caseType],
                });
            });
        }
    });

    if (otherTotals.confirmed > 0) {
        nodes.push({
            name: NODE_NAMES.OTHER,
            type: 'geo',
        });

        CASE_TYPES.forEach(caseType => {
            links.push({
                source: caseType,
                target: NODE_NAMES.OTHER,
                value: otherTotals[caseType],
            });
        });
    }

    return {
        totals,
        countries,
        sankey: {
            nodes,
            links,
        },
        leaderBoard: [
            {
                title: LEADER_BOARD_TITLES.ACTIVE,
                value: totals.active,
                key: 'active',
            },
            {
                title: LEADER_BOARD_TITLES.RECOVERED,
                value: totals.recovered,
                key: 'recovered',
            },
            {
                title: LEADER_BOARD_TITLES.DEATHS,
                value: totals.deaths,
                key: 'deaths',
            },
            {
                title: LEADER_BOARD_TITLES.RATE,
                value: totals.rate,
                key: 'deaths',
            },
            {
                title: LEADER_BOARD_TITLES.CONFIRMED,
                value: totals.confirmed,
                key: 'confirmed',
            },
        ],
    };
};
