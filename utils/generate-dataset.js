const { NovelCovid } = require('novelcovid');

const covid = new NovelCovid();

const mapData = (data, objectKeys, updateFunc = null) => {
    const results = {};

    data.forEach((item) => {
        const primaryKey = item.country || item.state;

        if (!results[primaryKey]) {
            results[primaryKey] = {};
            for (const curKey of objectKeys) {
                results[primaryKey][curKey] = 0;
            }
        }

        const countryObj = results[primaryKey];

        for (const curKey of objectKeys) {
            const key = curKey === 'confirmed' ? 'cases' : curKey;
            const curVal = item[key];
            countryObj[curKey] += isNaN(curVal) ? 0 : Number(curVal);
        }

        if (updateFunc) {
            updateFunc(countryObj);
        }
    });

    const final = Object.keys(results).reduce((obj, curKey) => {
        obj[curKey] = [results[curKey]];
        return obj;
    }, {});

    return final;
};

const parseNovelCountryData = (data) =>
    mapData(data, ['confirmed', 'active', 'deaths', 'recovered']);

const parseNovelStateData = (data) =>
    mapData(data, ['confirmed', 'active', 'deaths'], (countryObj) => {
        // calculate the recovered value given the active and deaths of all cases
        countryObj.recovered =
            countryObj.confirmed - countryObj.active - countryObj.deaths;

        return countryObj;
    });

module.exports = () => {
    return Promise.all([
        // retrieve the timestamp information
        covid.all().then((results) => results.updated),
        // retrieve latest up to date world data
        covid.countries().then(parseNovelCountryData),
        // latest up to date world data
        covid.states().then(parseNovelStateData),
    ])
        .then((data) => {
            const [timestamp, world, us] = data;

            return { timestamp, world, us };
        })
        .catch((err) => {
            console.error('error', err.message);
            throw new Error(err.message);
        });
};
