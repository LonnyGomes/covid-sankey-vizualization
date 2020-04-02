const allCountriesEndpoint = 'https://corona.lmao.ninja/v2/jhucsse';
const axios = require('axios').default;
const moment = require('moment-timezone');
const GLOBALS = {
    US_KEY: 'US',
};

const covid = require('novelcovid');
const formatDate = dateStr => Number(moment.tz(dateStr, 'GMT').format('x'));

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

const parseNovelCountryData = data => {
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

const parseNovelStateData = data => {
    const OBJECT_KEYS = ['confirmed', 'active', 'deaths'];
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

        // calculate the recovered value given the active and deaths of all cases
        countryObj.recovered =
            countryObj.confirmed - countryObj.active - countryObj.deaths;
    });

    const final = Object.keys(results).reduce((obj, curKey) => {
        obj[curKey] = [results[curKey]];
        return obj;
    }, {});

    return final;
};

Promise.all([
    // retrieve latest up to date world data
    covid.getCountry().then(parseNovelCountryData),
    // latest up to date world data
    covid.getState().then(parseNovelStateData),
])
    .then(data => {
        const [world, us] = data;

        const dataStr = JSON.stringify({ world, us }, null, 2);
        console.log(dataStr);
    })
    .catch(err => {
        console.error('error', err.message);
    });
