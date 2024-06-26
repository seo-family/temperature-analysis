// A tool to analyze temperature data.
const lineReader = require('line-reader');
const _ = require('lodash');
const moment = require('moment-timezone');
const fs = require('fs');

function writeFile(text, file) {
  fs.writeFileSync(file, text, 'utf8');
}

function getUnixTimeForDateString(dateString) {
  const dateTimeStringForUnix = `${dateString} 00:00:00 +09:00`;
  const dateTimeForUnix = moment(dateTimeStringForUnix, 'YYYY-MM-DD HH:mm:ss Z', true);
  return dateTimeForUnix.valueOf();
}

function analyzeRecords(recordList) {
  const minMap = new Map();
  const maxMap = new Map();
  const unixTimeMap = new Map();

  for (const item of recordList) {
    let min, max;

    const dateString = item.dateString;
    const unixTime = item.unixTime;
    min = max = item.temperature;
    if (minMap.has(dateString)) {
      min = Math.min(minMap.get(dateString), min);
    }
    minMap.set(dateString, min);
    if (maxMap.has(dateString)) {
      max = Math.max(maxMap.get(dateString), max);
    }
    maxMap.set(dateString, max);
    unixTimeMap.set(dateString, unixTime);
  }

  const dateStringList = [...minMap.keys()];
  const outputs = [];
  for (const dateString of dateStringList) {
    const min = minMap.get(dateString);
    const max = maxMap.get(dateString);
    const unixTime = unixTimeMap.get(dateString);
    outputs.push(`${dateString}, ${unixTime}, ${min}, ${max}`);
  }

  writeFile(outputs.join('\n'), 'output.csv');
  console.log(`Analyzed to ${outputs.length} data items.`)
}

function processCsv(inputFile) {
  const records = [];

  lineReader.eachLine(inputFile, function(line, last) {
    const splitted = _.split(line, ',').map((item) => _.trim(item));
    if (splitted.length === 3) {
      const dateTimeString = `${splitted[0]} ${splitted[1]} +09:00`;
      const dateTime = moment(dateTimeString, 'MM/DD/YYYY HH:mm:ss Z', true);
      // Adjustment for 2021 Winter B:
      // const dateTimeTemp = moment(dateTimeString, 'MM/DD/YYYY HH:mm:ss Z', true);
      // const unixTimeTemp = dateTimeTemp.valueOf() + 1649516400000 - 1644073200000;
      // const dateTime = moment(unixTimeTemp);
      // Adjustment for 2022 Winter B:
      // const dateTimeTemp = moment(dateTimeString, 'MM/DD/YYYY HH:mm:ss Z', true);
      // const unixTimeTemp = dateTimeTemp.valueOf() + 1668265200000 - 1669215600000;
      // const dateTime = moment(unixTimeTemp);
      if (dateTime.isValid()) {
        const temperature = Number(splitted[2]);
        const dateString = dateTime.format('YYYY-MM-DD');
        const unixTime = getUnixTimeForDateString(dateString);
        records.push({
          unixTime,
          dateString,
          temperature,
          line,
        });
      }
    }
    if (last) {
      console.log(`Collected ${records.length} records.`)
      analyzeRecords(records);
    }
  });
}

function main() {
  if (process.argv.length !== 3) {
    usage();
  }
  const inputFile = process.argv[2];
  if (!fs.existsSync(inputFile)) {
    console.log(`Non-existing file: ${inputFile}\n`);
    usage();
  }
  processCsv(inputFile);
}

function usage() {
  console.log("Usage:\n  node analyze.js < CSV File >\n");
  console.log("Example:\n  node analyze.js input.csv\n");
  process.exit(0);
}

main();
