const dashimporter = require('./import-dashboard.js');
const alertimporter = require('./import-alerts.js');
const exporter = require('./export.js');
const prompt = require('prompt');
const program = require('commander');
const async = require('async');
const fs = require('fs');
const optimist = require('optimist');
const pjson = require('./package.json');

program
    .version(pjson.version)
    .description('Import an export dashboard templates with Kibana. See https://github.com/Monkat-Company/kibana-dashboard-migrator for more details.')
    .option('-c, --config <config filename>', 'The configuration filename')
    .option('--username <username>', 'Kibana username')
    .option('--password <password>', 'Kibana password')

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
            required: false
        },
        password: {
            hidden: true,
            required: false
        }
    }
};

prompt.override = optimist.argv;

prompt.start();

prompt.get(schema, function (err, result) {
    let auth = Buffer.from(result.username + ":" + result.password).toString('base64');
    if (auth === 'Og==') {
        auth = undefined;
    }
    let importJson = JSON.parse(fs.readFileSync(program.config));

    let dashboards = importJson['dashboards'];

    if (dashboards == null) {
        dashboards = [];
    }

    async.eachSeries(dashboards, async function (eachItem, next) {
        console.log(eachItem)
        if (importJson['type'] === 'import') {
            await dashimporter.dashboard(importJson['host'], auth, eachItem['name'], importJson['oldIndex'], importJson['newIndex'], eachItem['template'], importJson['findInName'], importJson['replaceInName']);
        } else if (importJson['type'] === 'export') {
            await exporter.dashboard(importJson['host'], auth, eachItem['name'], eachItem['template']);
        }
        next();
    }, function () {

        if (importJson['alerts'] == null) {
            process.exit();
        }

        async.eachSeries(importJson['alerts'], async function (eachItem, next) {
            console.log(eachItem)
            if (importJson['type'] === 'import') {
                await alertimporter.alert(importJson['host'], auth, eachItem['name'], importJson['oldIndex'], importJson['newIndex'], eachItem['template'], importJson['findInName'], importJson['replaceInName'], eachItem['replaceMessageSource'], eachItem['alertDestinationId']);
            } else if (importJson['type'] === 'export') {
                await exporter.alert(importJson['host'], auth, eachItem['name'], eachItem['template']);
            }
            next();
        }, function () {
            process.exit()
        });

    });

});

