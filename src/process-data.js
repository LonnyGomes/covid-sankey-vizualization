// constants
const NODE_NAMES = {
    WORLD_WIDE: 'worldwide',
};
const NODE_TYPES = {
    GEO: 'geo',
    CASE: 'case',
};
const CASE_TYPES = ['active', 'deaths', 'recovered'];

export const parseWorld = (data, selectedCountry = null) => {
    const totals = {
        confirmed: 0,
        deaths: 0,
        recovered: 0,
        active: 0,
    };

    const nodes = [];

    // add case times as nodes
    CASE_TYPES.forEach(caseType => {
        nodes.push({
            name: caseType,
            type: NODE_TYPES.CASE,
        });
    });

    const links = [];

    const countries = selectedCountry
        ? [selectedCountry]
        : Object.keys(data).sort();

    countries.forEach((curCountry, idx) => {
        // add node for country
        nodes.push({
            name: curCountry,
            type: 'geo',
        });

        const latestStats = [...data[curCountry]].pop();

        latestStats.active =
            latestStats.confirmed - latestStats.deaths - latestStats.recovered;
        totals.confirmed += latestStats.confirmed;
        totals.deaths += latestStats.deaths;
        totals.recovered += latestStats.recovered;
        totals.active += latestStats.active;

        // link country to case types
        CASE_TYPES.forEach(caseType => {
            links.push({
                source: curCountry,
                target: caseType,
                value: latestStats[caseType],
            });
        });
    });

    return {
        totals,
        countries,
        sankey: {
            nodes,
            links,
        },
    };
};
