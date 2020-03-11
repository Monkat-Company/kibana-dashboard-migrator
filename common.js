const request = require('request');

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
    }
};

