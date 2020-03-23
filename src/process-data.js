// constants
const NODE_NAMES = {
    WORLD_WIDE: 'worldwide',
};
const NODE_TYPES = {
    GEO: 'geo',
    CASE: 'case',
};
const CASE_TYPES = ['confirmed', 'deaths', 'recovered'];

export const parseWorld = data => {
    const totals = {
        confirmed: 0,
        deaths: 0,
        recovered: 0,
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

    const countries = Object.keys(data);

    countries.forEach((curCountry, idx) => {
        // add node for country
        nodes.push({
            name: curCountry,
            type: 'geo',
        });

        const latestStats = [...data[curCountry]].pop();

        totals.confirmed += latestStats.confirmed;
        totals.deaths += latestStats.deaths;
        totals.recovered += latestStats.recovered;

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
        nodes,
        links,
    };
};
