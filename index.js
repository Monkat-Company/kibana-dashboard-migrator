const importer = require('./import.js');
const exporter = require('./export.js');
const prompt = require('prompt');
const program = require('commander');
const async = require('async');
const fs = require('fs');

program
    .version('1.3.0')
    .description('Import an export dashboard templates with Kibana. See https://github.com/Monkat-Company/kibana-dashboard-migrator for more details.')
    .option('-c, --config <config filename>', 'The configuration filename')

    .on('--help', () => {
        console.log(' Example:');
        console.log();
        console.log(
            '    $ kibanaDashboard -c my-config.json'
        );
        console.log()
    })
    .parse(process.argv);

program.parse(process.argv);

if (!program.config) {
    program.help();
    process.exit()
}

let schema = {
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
    let importJson = JSON.parse(fs.readFileSync(program.config));

    async.eachSeries(importJson['dashboards'], async function (eachitem, next) {
        if (importJson['type'] === 'import') {
            await importer.runit(importJson['host'], auth, eachitem['name'], importJson['oldIndex'], importJson['newIndex'], eachitem['template'], importJson['findInName'], importJson['replaceInName']);
        } else if (importJson['type'] === 'export') {
            await exporter.runit(importJson['host'], auth, eachitem['name'], eachitem['template']);
        }
        next();
    }, function () {
        process.exit()
    });

});

