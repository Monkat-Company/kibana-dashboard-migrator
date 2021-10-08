// Kibana Dashboard Importer

const request = require('request');
const common = require('./common.js');
const fs = require('fs');
const {forEach, find} = require('lodash');
const uuid = require('uuid/v4');

let options = {};

let deleteExistingDashboard = (dashboardJson) => new Promise((resolve, reject) => {

    if (dashboardJson == null) {
        resolve()
    }

    forEach(dashboardJson['objects'], (obj) => {
        let type = obj['type'];
        let id = obj['id'];
        if (type !== 'index-pattern') {
            deleteObject(id, type)
                .catch((error) => {
                    console.log('Could not delete:', error);
                    reject(error)
                })
        }
    });

    resolve();

});

let deleteObject = (id, type) => new Promise((resolve, reject) => {
    let deleteOptions = {
        headers: {
            'kbn-xsrf': 'reporting'
        },
        uri: options.host + '/_plugin/kibana/api/saved_objects/' + type + '/' + id,
        method: 'DELETE'
    };

    if (options.auth) {
        deleteOptions.headers['Authorization'] = 'Basic ' + options.auth;
    }

    console.log("deleting type: ", type, " ID:", id);

    request(deleteOptions, (error, response, body) => {
        if (error || response.statusCode !== 200) {
            console.log("Error deleting: ", body);
            reject(error)
        } else {
            console.log('Delete Successful.');
            resolve()
        }
    });
});


let findIndex = () => {
    return new Promise((resolve, reject) => {
        let getOptions = {
            headers: {
                'kbn-xsrf': 'reporting'
            },
            uri: options.host + '/_plugin/kibana/api/saved_objects/_find?type=index-pattern&search_fields=title&search="' + options.newIndex + '"',
            method: 'GET'
        };

        if (options.auth) {
            getOptions.headers['Authorization'] = 'Basic ' + options.auth;
        }

        console.log("Getting index: ID:", options.newIndex);

        request(getOptions, (error, response, body) => {
            if (error || response.statusCode !== 200) {
                console.log("Error getting: ", body);
                reject(error)
            } else {
                console.log('Index Successful.');
                let json = JSON.parse(response.body);
                options.newIndex = json['saved_objects'][0]['id'];
                resolve()
            }
        });
    });
};

let readFile = () => new Promise((resolve, reject) => {
    fs.readFile(options.filename, (error, data) => {
        if (error) {
            console.log("Cannot load file:", error);
            reject(error)
        } else {
            console.log('Read file:', options.filename);
            resolve(data.toString())
        }
    })
});


let findPreviousIndex = (template) => new Promise((resolve) => {

    forEach(JSON.parse(template)['objects'], (obj) => {
        let type = obj['type'];
        if (type === 'index-pattern') {
            options.oldIndex = obj['id'];
        }
    });

    resolve(template)
});


function replaceAll(str, find, replace) {
    return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

function escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

let modifyTemplate = (template) => new Promise((resolve, reject) =>{
    console.log('Replacing pattern : ', options.oldIndex, 'with', options.newIndex);
    let templateStrPart = replaceAll(template, options.oldIndex, options.newIndex);
    let templateStr = replaceAll(templateStrPart, options.pre, options.post);
    console.log('Creating dashboard');
    console.log(templateStr);
    resolve(templateStr);
});

let createDashboard = (template) => new Promise((resolve, reject) => {

    let requestOptions = {
        headers: {
            'kbn-xsrf': 'reporting'
        },
        uri: options.host + '/_plugin/kibana/api/kibana/dashboards/import?exclude=index-pattern',
        body: template,
        method: 'POST'
    };

    if (options.auth) {
        requestOptions.headers['Authorization'] = 'Basic ' + options.auth;
    }

    request(requestOptions, (error, response, body) => {
        if (error || response.statusCode !== 200) {
            console.log("Error creating dashboard: ", body);
            reject(error)
        } else {
            let dashJson = JSON.parse(body);
            let dashboard = find(dashJson['objects'], {'type': 'dashboard'});

            console.log('Dashboard created with ID:', dashboard['id']);
            resolve()
        }

    });
});

async function dashboard(host, auth, title, oldIndex, newIndex, filename, pre, post) {

    options.host = host;
    options.auth = auth;
    options.title = title;
    options.oldIndex = oldIndex;
    options.newIndex = newIndex;
    options.filename = filename;
    options.pre = pre;
    options.post = post;


    await findIndex().then(() => common.findExistingDashboard(options))
        .then((id) => common.getExistingDashboard(options, id))
        .then(deleteExistingDashboard)
        .then(readFile)
        .then(findPreviousIndex)
        .then(modifyTemplate)
        .then(createDashboard)
        .catch((error) => console.log(error))
}

module.exports.dashboard = dashboard;
