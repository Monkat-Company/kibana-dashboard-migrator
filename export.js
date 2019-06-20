const fs = require('fs');
const common = require('./common.js');

let options = {};
let exportDashboard = (dashboard) => new Promise((resolve, reject) => {
    fs.writeFile(options.filename, JSON.stringify(dashboard, null, '\t'), function (err) {
        if (err) {
            reject(err);
        }

        console.log("File created:", options.filename);
        resolve();
    });

});

async function runit(host, auth, title, filename) {
    options.title = title;
    options.auth = auth;
    options.host = host;
    options.filename = filename;

    await common.findExistingDashboard(options)
        .then((id) => common.getExistingDashboard(options, id))
        .then(exportDashboard)
        .catch((error) => console.log(error));
}

module.exports.runit = runit;
