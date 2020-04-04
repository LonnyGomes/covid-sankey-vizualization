const generateDataset = require('./generate-dataset');
const fs = require('fs');
const path = require('path');

const saveDataset = async (pathName) => {
    const outputPath = path.resolve(pathName);

    try {
        const data = await generateDataset();
        fs.writeFileSync(outputPath, JSON.stringify(data));
    } catch (error) {
        console.error(
            `Error while writing output file ${outputPath}: ${error.message}`
        );
    }
};

const [pathName] = process.argv.slice(2);

if (!pathName) {
    console.error(`Supply output path`);
} else {
    saveDataset(pathName);
}
