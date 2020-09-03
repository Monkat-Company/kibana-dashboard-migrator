const request = require('request');
const fs = require('fs');

module.exports = {
    findExistingDashboard(options) {
        return new Promise((resolve, reject) => {
            let requestOptions = {
                headers: {
                    'kbn-xsrf': 'reporting'
                },
                uri: options.host + '/_plugin/kibana/api/saved_objects/_find?type=dashboard&search_fields=title&search="' + options.title + '"',
                method: 'GET'
            };

            if (options.auth) {
                requestOptions.headers['Authorization'] = 'Basic ' + options.auth;
            }

            request(requestOptions, (error, response, body) => {
                if (error || response.statusCode !== 200) {
                    console.log("Error find dashboard: ", body);
                    reject(error)
                } else {
                    let response = JSON.parse(body);
                    if (response['saved_objects'].length > 0) {
                        console.log("Found existing dashboard: ", response['saved_objects'][0]['id']);
                        resolve(response['saved_objects'][0]['id'])
                    } else {
                        console.log("Existing dashboard not found");
                        resolve(null)
                    }
                }
            })
        })
    },


    getExistingDashboard(options, dashboardId) {
        return new Promise((resolve, reject) => {
            if (dashboardId == null) {
                resolve(null)
            }

            const requestOptions = {
                headers: {
                    'kbn-xsrf': 'reporting'
                },
                url: options.host + '/_plugin/kibana/api/kibana/dashboards/export?dashboard=' + dashboardId,
                method: 'GET'
            };

            if (options.auth) {
                requestOptions.headers['Authorization'] = 'Basic ' + options.auth;
            }

            request(requestOptions, (error, response, body) => {

                if (error || response.statusCode !== 200) {
                    console.log("Error cannot get dashboard: ", body);
                    reject(error)
                } else {
                    let response = JSON.parse(body);
                    if (response['objects'][0]['error'] != null) {
                        resolve()
                    } else {
                        console.log("Obtained existing dashboard.");
                        resolve(JSON.parse(body))
                    }
                }
            })
        })
    },

    findExistingAlert(options) {
        return new Promise((resolve, reject) => {
            const requestOptions = {
                headers: {
                    'kbn-xsrf': 'reporting',
                    'content-type': 'application/json'
                },
                url: options.host + '/_opendistro/_alerting/monitors/_search',
                method: 'GET',
                body: JSON.stringify({
                    "query": {
                        "match": {
                            "monitor.name": options.title
                        }
                    }
                })
            };

            if (options.auth) {
                requestOptions.headers['Authorization'] = 'Basic ' + options.auth;
            }

            request(requestOptions, (error, response, body) => {

                if (error || response.statusCode !== 200) {
                    console.log("Error cannot get alert: ", body);
                    reject(error)
                } else {
                    let response = JSON.parse(body);
                    if (response['hits']['hits'].length > 0) {
                        console.log("Obtained existing alert.");
                        resolve(response['hits']['hits'][0]['_id'])
                    } else {
                        resolve();
                    }
                }
            })
        })
    },

    getExistingAlert(options, alertId) {
        return new Promise((resolve, reject) => {
            if (alertId == null) {
                resolve();
            }

            const requestOptions = {
                headers: {
                    'content-type': 'application/json',
                    'kbn-xsrf': 'reporting'
                },
                url: options.host + '/_opendistro/_alerting/monitors/' + alertId,
                method: 'GET'
            };

            if (options.auth) {
                requestOptions.headers['Authorization'] = 'Basic ' + options.auth;
            }

            request(requestOptions, (error, response, body) => {

                if (error || response.statusCode !== 200) {
                    console.log(`Error cannot get alert: ${body}`);
                    reject(error)
                } else {
                    let response = JSON.parse(body);
                    console.log(`Obtained existing alert.`);
                    resolve(JSON.parse(body))
                }
            })
        })
    },

    readFile(options) {
        return new Promise((resolve, reject) => {
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
    }


};

