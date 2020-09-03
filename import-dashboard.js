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
            resolve(JSON.parse(data.toString()))
        }
    })
});


let modifyTemplate = (template) => new Promise((resolve) => {

    let currentDashboard;
    forEach(template['objects'], (obj) => {
        let type = obj['type'];
        if (type === 'dashboard') {
            obj['id'] = uuid();
            obj['attributes']['title'] = options.title;
            currentDashboard = obj;
        } else if (type === 'visualization') {
             handleReference(obj, currentDashboard);
        } else if (type === 'search') {
            handleReference(obj, currentDashboard);
        } else if (type === 'index-pattern') {
            console.log('Updated index-pattern to', options.newIndex);
            options.oldIndex = obj['id'];
            obj['id'] = options.newIndex;
            obj['attributes']['title'] = obj['attributes']['title'].replace(options.pre, options.post)
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

let createDashboard = (template) => new Promise((resolve, reject) => {

    let templateStr = replaceAll(JSON.stringify(template), options.oldIndex, options.newIndex);

    console.log('Creating dashboard');

    console.log(templateStr);

    let requestOptions = {
        headers: {
            'kbn-xsrf': 'reporting'
        },
        uri: options.host + '/_plugin/kibana/api/kibana/dashboards/import?exclude=index-pattern',
        body: templateStr,
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

function handleReference(obj, currentDashboard) {
    let dashRef = find(currentDashboard['references'], {'id': obj.id});
    obj['id'] = uuid();
    dashRef['id'] = obj['id'];
    if(obj['attributes'] && obj['attributes']['title'] ) {
        obj['attributes']['title'] = obj['attributes']['title'].replace(options.pre, options.post);
    }
    if(obj['attributes'] && obj['attributes']['visState'] ) {
        obj['attributes']['visState'] = obj['attributes']['visState'].replace(options.pre, options.post);
    }
    obj['references'].forEach(ref => {
        if(ref.type==='index-pattern'){
            ref['id'] = options.newIndex;
        }
    });

    console.log('Updated visualization to',  obj['id']);
    return obj['id'];
}

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
        .then(modifyTemplate)
        .then(createDashboard)
        .catch((error) => console.log(error))
}

module.exports.dashboard = dashboard;
