const allCountriesEndpoint = 'https://corona.lmao.ninja/v2/jhucsse';
const axios = require('axios').default;
const moment = require('moment-timezone');
const GLOBALS = {
    US_KEY: 'US',
};
const formatDate = dateStr => Number(moment.tz(dateStr, 'GMT').format('x'));

const parseData = data => {
    const OBJECT_KEYS = ['confirmed', 'deaths', 'recovered'];
    const results = {};
    const usaResults = {};

    data.forEach(item => {
        if (!results[item.country]) {
            results[item.country] = {};
            for (const curKey of OBJECT_KEYS) {
                results[item.country][curKey] = 0;
            }
            results[item.country]['date'] = formatDate(item.updatedAt);
        }

        // handle USA data
        if (item.country === GLOBALS.US_KEY) {
            usaResults[item.province] = [
                {
                    date: formatDate(item.updatedAt),
                },
            ];
        }

        const countryObj = results[item.country];

        for (const curKey of OBJECT_KEYS) {
            const curVal = item.stats[curKey];
            countryObj[curKey] += isNaN(curVal) ? 0 : Number(curVal);

            if (item.country === GLOBALS.US_KEY) {
                usaResults[item.province][0][curKey] = isNaN(curVal)
                    ? 0
                    : Number(curVal);
            }
        }
    });

    //console.log('usaResults', usaResults);
    const final = Object.keys(results).reduce((obj, curKey) => {
        obj[curKey] = [results[curKey]];
        return obj;
    }, {});

    return { world: final, us: usaResults };
};

axios
    .get(allCountriesEndpoint)
    .then(response => response.data)
    .then(data => {
        const results = parseData(data);
        console.log(JSON.stringify(results, null, 2));
    });
