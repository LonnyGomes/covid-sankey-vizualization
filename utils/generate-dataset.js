const allCountriesEndpoint = 'https://corona.lmao.ninja/v2/jhucsse';
const axios = require('axios').default;
const GLOBALS = {
    US_KEY: 'US',
};

const covid = require('novelcovid');

const parseJHUeData = data => {
    const OBJECT_KEYS = ['confirmed', 'deaths', 'recovered'];
    const results = {};
    const usaResults = {};

    data.forEach(item => {
        if (!results[item.country]) {
            results[item.country] = {};
            for (const curKey of OBJECT_KEYS) {
                results[item.country][curKey] = 0;
            }
            results[item.country]['date'] = item.updatedAt;
        }

        // handle USA data
        if (item.country === GLOBALS.US_KEY) {
            usaResults[item.province] = [
                {
                    date: item.updatedAt,
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

const parseNovelData = data => {
    const OBJECT_KEYS = ['confirmed', 'active', 'deaths', 'recovered'];
    const results = {};

    data.forEach(item => {
        const primaryKey = item.country || item.state;

        if (!results[primaryKey]) {
            results[primaryKey] = {};
            for (const curKey of OBJECT_KEYS) {
                results[primaryKey][curKey] = 0;
            }
            results[primaryKey]['date'] = item.updated;
        }

        const countryObj = results[primaryKey];

        for (const curKey of OBJECT_KEYS) {
            const key = curKey === 'confirmed' ? 'cases' : curKey;
            const curVal = item[key];
            countryObj[curKey] += isNaN(curVal) ? 0 : Number(curVal);
        }
    });

    const final = Object.keys(results).reduce((obj, curKey) => {
        obj[curKey] = [results[curKey]];
        return obj;
    }, {});

    return final;
};

Promise.all([
    // retrieve latest up to date world data
    covid.getCountry().then(parseNovelData),
    // retrieve JHU data for the US
    axios
        .get(allCountriesEndpoint)
        .then(response => response.data)
        .then(parseJHUeData),
])
    .then(data => {
        const [world, { us }] = data;

        const dataStr = JSON.stringify({ world, us }, null, 2);
        console.log(dataStr);
    })
    .catch(err => {
        console.error(err.message);
    });
