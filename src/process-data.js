// constants
const NODE_NAMES = {
    WORLD_WIDE: 'worldwide',
    OTHER: 'other',
};
const NODE_TYPES = {
    GEO: 'geo',
    CASE: 'case',
};
const CASE_TYPES = ['active', 'deaths', 'recovered'];

export const parseWorld = (data, selectedCountry = null, threshold = 5000) => {
    const totals = {
        confirmed: 0,
        deaths: 0,
        recovered: 0,
        active: 0,
    };

    const otherTotals = {
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

    const countries = Object.keys(data).sort();

    const selectedCountries = selectedCountry ? [selectedCountry] : countries;

    selectedCountries.forEach(curCountry => {
        const latestStats = [...data[curCountry]].pop();

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

        if (latestStats.confirmed <= threshold && !selectedCountry) {
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
                    source: curCountry,
                    target: caseType,
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
                source: NODE_NAMES.OTHER,
                target: caseType,
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
    };
};
