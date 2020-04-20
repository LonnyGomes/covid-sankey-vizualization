const { NovelCovid } = require('novelcovid');

const covid = new NovelCovid();

const parseNovelHistoricData = (data) => {
    const histData = new Map();

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
            if (histData.has(curDateKey)) {
                curDateData = histData.get(curDateKey);
            } else {
                curDateData = {};
                histData.set(curDateKey, curDateData);
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

    for (const [histKey, histValue] of histData) {
        // console.log('histData', histValue);
        //for (const )
    }
    return data;
};

module.exports = () => {
    covid
        .historical()
        .then(parseNovelHistoricData)
        .then((historical) => {
            console.log('historical', historical);
            return { historical };
        })
        .catch((err) => {
            console.error('error', err.message);
            throw new Error(err.message);
        });
};
