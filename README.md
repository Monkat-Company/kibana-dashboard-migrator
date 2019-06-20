# Kibana Dashboard - Migrator

A tool to export and import dashboards from Kibana.

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

You only need to create one version of your dashboard to be exported.  In general using the 'dev' naming convention for environment is
recommended but you are free to use anything.

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
  ]
}
```
|variable|Description|
|---|----|
|type| The type of configuration file - either import or export|
|host|The hostname of the kibana instance|
|dashboards/name| The name of the dashboard to export - must be exact match!|
|dashboards/template| The template file to generate|

#### Run

```bash
node export.js -c <config file>
```

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
  "dashboards": [
    {
      "name": "My Application Alerts (int)",
      "template": "templates/alerts-template.json"
    },
    {
      "name": "My Application Workflow (int) - Form Trace",
      "template": "templates/workflow-template.json"
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
|replaceInName| The string to replace the 'findInName' with.  Typically its the environment part (e.g. -int-)  
|dashboards/name| The name of the dashboard to create|
|dashboards/template| The template file to use|


#### Run

```bash
kibanaDashboard -c <config file>
```

## Kibana Version

Kibana goes through quite big changes especially around the visualisations and dashboards.

This code was tested against ```Version: 6.3.1```

## Building the executable

Install  [nexe](https://github.com/nexe/nexe)

```npm install -g nexe```

Build executable

```cat index.js | nexe -o dist/kibanaDashboard -t 8.10.0```

