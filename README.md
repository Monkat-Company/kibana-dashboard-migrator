# Kibana Dashboard and Alert - Migrator

A tool to export and import dashboards and alert monitors from Kibana.

*This tool is far from perfect and hacked together! - use at your own risk (but it appears to work well)*

*Also it lacks tests - sorry!*

## Kibana Searches and Visualizations - Naming Conventions

In general its good to have naming conventions to distinguish your visualizations and searches from others.

The recommended naming convention is:

[systemIdentifier]-[env]-[name]

*Note: lower/camelCase format*

|variable| example(s) | explanation|
|----|----|---|
|systemIdentifier| hub-policy-service, ahd-ocs, hub-bff-service| Also known as a system code.  This is a unique identifier for your system.|
| env| local, dev, int, prod | The environment - This is also important for templating explained further down.|
| name| support, health, customerSubmits| The unique name for the visualization/search.|

Typical examples:

```ahd-ocs-dev-fileUploads```

```ahd-ocs-dev-customerSubmits```

```ahd-ocs-dev-anotherExample```

## Kibana Dashboards

You are free to name the dashboard as you like. 

You only need to create one version of your dashboard to be exported.  In general using the 'dev' or 'ci' naming convention for environment is
recommended but you are free to use anything.

## Kibana Alerts

You are free to name your alerts as you like.

You only need to create one version of your alert to be exported.  In general using the 'dev' or 'ci' naming convention for environment is recommended but
you are free to use anything.

## Usage

### Exporting

#### Configuration file

Example:

```json
{
  "type": "export",
  "host": "https://my-dev-kibana-service.example.com",
  "dashboards": [
    {
      "name": "My Application Alerts (dev)",
      "template": "templates/alerts-template.json"
    },
    {
      "name": "My Application Workflow (dev) - Form Trace",
      "template": "templates/workflow-template.json"
    }
  ],
  "alerts": [
   {
      "name": "My Alert name",
      "template": "templates/alert-template.json"
   }
  ] 
}
```
|variable|Description|
|---|----|
|type| The type of configuration file - either import or export|
|host|The hostname of the kibana instance|
|dashboards/name| The name of the dashboard to export - must be exact match!|
|dashboards/template| The template file to generate|
|alerts/name| The name of the alert to export - must be exact match!|
|alerts/template| The template file to generate|


### Importing

#### Configuration

```json
{
  "type": "import",
  "host": "https://my-dev-kibana-service.example.com",
  "oldIndex": "my-application-dev*",
  "newIndex": "my-application-int*",
  "findInName": "-dev-",
  "replaceInName": "-int-",
  "alertDestinationId": "A5Yf8XIB6hkUUzf6gcwn",
  "dashboards": [
    {
      "name": "My Application Alerts (int)",
      "template": "templates/alerts-template.json"
    },
    {
      "name": "My Application Workflow (int) - Form Trace",
      "template": "templates/workflow-template.json"
    }
  ],
  "alerts": [
    {
      "name": "My Alert name",
      "template": "templates/alert-template.json",
      "alertDestinationId": "A5Yf8XIB6hkUUzf6gcwn",
      "replaceMessageSource": [ ".ci.", ".int.", "\"CI\"", "\"INT\""]
   }
  ] 
}
```

|variable|Description|
|---|----|
|type| The type of configuration file - either import or export|
|host|The hostname of the kibana instance|
|oldIndex| The index name in the template to replace|
|newIndex| The index name for the new dashboard to use - must already exist!|
|findInName| The string to find within the titles of the visualizations and searches of the exported template file.  Typically its the environment part (e.g. -dev-).|
|replaceInName| The string to replace the 'findInName' with.  Typically its the environment part (e.g. -int-)  |
|dashboards/name| The name of the dashboard to create|
|dashboards/template| The template file to use|
|alerts/name| The name of the alert to create|
|alerts/template| The template file to to use|
|alerts/alertDestinationId"| You will have had to setup a new destination in the target environment, obtain its ID and set it here|
|alerts/replaceMessageSource| Provides the option to replace text within the message source|

## Kibana Version

Kibana goes through quite big changes especially around the visualisations and dashboards.

This code was tested against ```Version: 7.4.2```

## Building the executable

Install  [nexe](https://github.com/nexe/nexe)

```npm install -g nexe```

Build executable

```nexe index.js -o dist/kibanaDashboard-mac -t mac-x64-8.10.0```
```nexe index.js -o dist/kibanaDashboard-linux -t linux-x64-8.10.0```


Note: See [nexe](https://github.com/nexe/nexe) for available targets.

## Usage

Pick the correct binary from the dist folder and rename to kibanaDashboard.  Then run:

```
kibanaDashboard -c <config file>
```

## Legacy Binary

The dist folder contains the legacy Kibana 6.x binaries - code can be found on the branch named ```version6```
