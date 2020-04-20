const generateDataset = require('./generate-dataset');
const generateHistorical = require('./generate-historical');
const fs = require('fs');
const path = require('path');

const saveDataset = async (pathName, data) => {
    const outputPath = path.resolve(pathName);

    try {
        fs.writeFileSync(outputPath, JSON.stringify(data));
    } catch (error) {
        console.error(
            `Error while writing output file ${outputPath}: ${error.message}`
        );
    }
};

const [dataPathName, historicalPathName] = process.argv.slice(2);

if (!dataPathName || !historicalPathName) {
    console.error(`Supply output path for current data and historic dataset`);
} else {
    Promise.all([generateDataset(), generateHistorical()]).then(
        async (results) => {
            const [dataset, historicalDataset] = results;

            saveDataset(dataPathName, dataset);
            saveDataset(historicalPathName, historicalDataset);
        }
    );
}
