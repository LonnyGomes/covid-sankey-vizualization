const { NovelCovid } = require('novelcovid');
const axios = require('axios').default;

const URLS = {
    HISTORICAL_ALL_DATA: 'https://corona.lmao.ninja/v2/historical?lastdays=all',
};

const covid = new NovelCovid();

const parseNovelHistoricData = (data) => {
    const histData = {};

    data.forEach((curCountryData) => {
        const { country, timeline } = curCountryData;
        const {
            cases: casesHash,
            deaths: deathsHash,
            recovered: recoveredHash,
        } = timeline;

        for (const curDateKey of Object.keys(casesHash)) {
            const cases = casesHash[curDateKey] || 0;
            const deaths = deathsHash[curDateKey] || 0;
            const recovered = recoveredHash[curDateKey] || 0;

            let curDateData = null;
            // set/retrieve date map
            if (histData[curDateKey]) {
                curDateData = histData[curDateKey];
            } else {
                curDateData = {};
                histData[curDateKey] = curDateData;
            }

            let curCountryData = null;
            if (curDateData[country]) {
                curCountryData = curDateData[country][0];
            } else {
                curCountryData = {
                    confirmed: 0,
                    active: 0,
                    deaths: 0,
                    recovered: 0,
                };
                curDateData[country] = [curCountryData];
            }

            curCountryData.confirmed += isNaN(+cases) ? 0 : +cases;
            curCountryData.deaths += isNaN(+deaths) ? 0 : +deaths;
            curCountryData.recovered += isNaN(+recovered) ? 0 : +recovered;
            curCountryData.active =
                curCountryData.confirmed -
                curCountryData.deaths -
                curCountryData.recovered;
        }
    });

    // for (const histKey of Object.keys(histData)) {
    //     const dateData = histData[histKey];
    //     histData[histKey] = Object.keys(dateData).map((countryKey) => ({
    //         [countryKey]: dateData[countryKey],
    //     }));
    // }

    return histData;
};

module.exports = () => {
    return Promise.all([
        axios
            .get(URLS.HISTORICAL_ALL_DATA)
            .then((results) => results.data)
            .then(parseNovelHistoricData),
        covid.historical(null, 'us'),
    ])
        .then(([world, us]) => {
            return { world };
        })
        .catch((err) => {
            console.error('error', err.message);
            throw new Error(err.message);
        });
};
