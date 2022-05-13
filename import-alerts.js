// Kibana Dashboard Importer

const request = require('request');
const common = require('./common.js');
const {forEach} = require('lodash');
const fs = require('fs');
let options = {};


let deleteAlert = (id) => new Promise((resolve, reject) => {
    if (id === undefined) {
        console.log('No alert to delete - skipping');
        return resolve();
    }
    let deleteOptions = {
        headers: {
            'content-type': 'application/json',
            'kbn-xsrf': 'reporting'
        },
        uri: options.host + '/_opendistro/_alerting/monitors/' + id,
        method: 'DELETE'
    };

    if (options.auth) {
        deleteOptions.headers['Authorization'] = 'Basic ' + options.auth;
    }

    console.log("deleting ID:", id);

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

function replaceAll(str, find, replace) {
    return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

function escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}


let createAlert = (template) => new Promise((resolve, reject) => {

    let templateStr = replaceAll(JSON.stringify(template), options.oldIndex, options.newIndex);

    console.log('Creating Alert');

    console.log(templateStr);

    let requestOptions = {
        headers: {
            'content-type': 'application/json',
            'kbn-xsrf': 'reporting'
        },
        uri: options.host + '/_opendistro/_alerting/monitors',
        body: templateStr,
        method: 'POST'
    };

    if (options.auth) {
        requestOptions.headers['Authorization'] = 'Basic ' + options.auth;
    }

    request(requestOptions, (error, response, body) => {
        if (error || response.statusCode !== 201) {
            console.log("Error creating Alert: ", body);
            reject(error)
        } else {
            let alertJson = JSON.parse(body);
            console.log('Alert created with ID:', alertJson['_id']);
            resolve()
        }

    });
});

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

    delete template['_version'];
    delete template['_seq_no'];
    delete template['_primary_term'];
    delete template['_id'];
    template['monitor']['name'] = template['monitor']['name'].replace(options.pre, options.post)
//template['monitor']['inputs'][0]['search']['indices'][0]
    forEach(template['monitor']['inputs'], (input, i) => {
        forEach(input['search']['indices'], (indices, j) => {
            template['monitor']['inputs'][i]['search']['indices'][j] = indices.replace(options.pre, options.post)
        });
    });

    let currentDashboard;
    forEach(template['monitor']['triggers'], (obj) => {
        delete obj['id'];
        obj['name'] = obj['name'].replace(options.pre, options.post)
        forEach(obj['actions'], (actionobj) => {
            delete actionobj['id'];
            actionobj['name'] = actionobj['name'].replace(options.pre, options.post);
            actionobj['destination_id'] = options.alertDestinationId;
            actionobj['subject_template']['source'] = actionobj['subject_template']['source'].replace(options.pre, options.post);
            actionobj['message_template']['source'] = actionobj['message_template']['source'].replace(options.pre, options.post);
            for (let i=0; i < options.replaceMessageSource.length; i=i+2) {
                actionobj['message_template']['source'] = replaceAll(actionobj['message_template']['source'], options.replaceMessageSource[i], options.replaceMessageSource[i+1])
            }
        });

    });

    resolve(template['monitor'])
});


async function alert(host, auth, title, oldIndex, newIndex, filename, pre, post, replaceMessageSource, destinationId) {

    options.host = host;
    options.auth = auth;
    options.title = title;
    options.oldIndex = oldIndex;
    options.alertDestinationId = destinationId;
    options.newIndex = newIndex;
    options.filename = filename;
    options.pre = pre;
    options.post = post;
    options.replaceMessageSource = replaceMessageSource;

    console.log(`Looking for ${options.title}`);

    await common.findExistingAlert(options)
        .then(deleteAlert)
        .then(readFile)
        .then((template) => modifyTemplate(template))
        .then(createAlert)
        .catch((error) => console.log(error))
}

module.exports.alert = alert;
