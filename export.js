const program = require('commander')
const fs = require('fs');
const common = require('./common.js')
const prompt = require('prompt');
const async = require('async');

let options = {}

let exportDashboard = (dashboard) => new Promise((resolve, reject) => {
    fs.writeFile(options.filename, JSON.stringify(dashboard, null, '\t'), function (err) {
        if (err) {
            reject(err);
        }

        console.log("File created:", options.filename);
        resolve();
    });

})

async function run(host, auth, title, filename) {
    options.title = title
    options.auth = auth
    options.host = host
    options.filename = filename

    await common.findExistingDashboard(options)
        .then((id) => common.getExistingDashboard(options, id))
        .then(exportDashboard)
        .catch((error) => console.log(error))
}


program
    .version('1.2.0')
    .description('This program exports kibana templates. See https://github.com/Monkat-Company/kibana-dashboard-migrator for more details.')
    .option('-c, --config <config filename>', 'The configuration filename')

    .on('--help', () => {
        console.log(' Example:')
        console.log()
        console.log(
            '    $ import.js -c config/export-dev.json'
        )
        console.log()
    })
    .parse(process.argv)

program.parse(process.argv)

if (!program.config) {
    program.help()
    process.exit()
}

var schema = {
    properties: {
        username: {
            required: true
        },
        password: {
            hidden: true,
            required: true
        }
    }
};

prompt.start();

prompt.get(schema, function (err, result) {
    let auth = Buffer.from(result.username + ":" + result.password).toString('base64');

    let rawdata = fs.readFileSync(program.config);
    let importJson = JSON.parse(rawdata);
    async.eachSeries(importJson['dashboards'], async function (eachitem, next) {
        await run(importJson['host'], auth, eachitem['name'], eachitem['template']);
        next();
    }, function () {
        process.exit()
    })
});