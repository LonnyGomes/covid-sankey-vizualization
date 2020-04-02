const allCountriesEndpoint = 'https://corona.lmao.ninja/v2/jhucsse';
const axios = require('axios').default;
const moment = require('moment-timezone');
const GLOBALS = {
    US_KEY: 'US',
};

const covid = require('novelcovid');
const formatDate = dateStr => Number(moment.tz(dateStr, 'GMT').format('x'));

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
    // retrieve the timestamp information
    covid.getAll().then(results => results.updated),
    // retrieve latest up to date world data
    covid.getCountry().then(parseNovelCountryData),
    // latest up to date world data
    covid.getState().then(parseNovelStateData),
])
    .then(data => {
        const [timestamp, world, us] = data;

        const dataStr = JSON.stringify({ timestamp, world, us }, null, 2);
        console.log(dataStr);
    })
    .catch(err => {
        console.error('error', err.message);
    });
