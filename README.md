# testcafe-reporter-allure
This is the **allure** reporter plugin for [TestCafe](http://devexpress.github.io/testcafe). This is used to generate allure visual reports for testcafe test execution.

## Install

```
npm install EricVanEldik/testcafe-reporter-allure
```

## Usage

When you run tests from the command line, specify the reporter name by using the `--reporter` option:

```
testcafe chrome 'path/to/test/file.js' --reporter allure
```


When you use API, pass the reporter name to the `reporter()` method:

```js
testCafe
    .createRunner()
    .src('path/to/test/file.js')
    .browsers('chrome')
    .reporter('allure') // <-
    .run();
```


## Severities
The below severities are supported by this reporter.  
`blocker, critical, normal, minor, trivial`

## Test meta data
To specify test severity, test id, story id, or run id, use test meta options.

```js
test
    .meta({
        ID: 'test id',
        SEVERITY: 'blocker',
        STORY: 'story id',
        TEST_RUN: 'test run id or identifier'
    })
    .before(async t => {
        // before test code
    })('Test description', async t => {
        // Test code
    });
```

## Run id TEST_RUN in fixture meta  
Run id `TEST_RUN` can be specified in fixture meta. If run id is specified in fixture meta, it will discard the run id from test meta.


## Environment
To add information to environment widget, just create environment.xml file to allure-results directory before report generation.

```js
<environment>
    <parameter>
        <key>Browser</key>
        <value>Chrome</value>
    </parameter>
    <parameter>
        <key>Browser.Version</key>
        <value>63.0</value>
    </parameter>
    <parameter>
        <key>Stand</key>
        <value>Production</value>
    </parameter>
</environment>
```

## Executor
To add an information about your test executor create a file executor.json in your allure-results:

```js
{
  "name": "Jenkins",
  "type": "jenkins",
  "url": "http://example.org",
  "buildOrder": 1,
  "buildName": "allure-report_deploy#1", 
  "buildUrl": "http://example.org/build#1",
  "reportUrl": "http://example.org/build#1/AllureReport",
  "reportName": "Demo allure report"
}
```

## Configuration
To override default configurationn, create a doc-allure-config.js file in the root directory of your project and put below content in that file.

```js

const DOC_ALLURE_CONFIG = {
    CLEAN_REPORT_DIR: false,
    COPY_HISTORY: true,
    RESULT_DIR: '/allure/allure-results',
    REPORT_DIR: '/allure/allure-report',
    META: {
        STORY_ID: 'STORY',
        TEST_ID: 'ID',
        SEVERITY: 'SEVERITY',
        TEST_RUN: 'TEST_RUN'
    },
    STORY_LABEL: 'JIRA Story Link',
    STORY_URL: 'https://jira.example.ca/browse/{{ID}}',
    TEST_LABEL: 'JIRA Test Link',
    TEST_URL: 'https://jira.example.ca/secure/Tests.jspa#/testCase/{{ID}}',
    labels: {
        screenshotLabel: 'Screenshot',
        browserLabel: 'Browser',
        userAgentLabel: 'User Agent',
        allureStartMessage: 'Allure reporter started...',
        allureClosedMessage: 'Allure reporter closed...'
    }
};

module.exports = DOC_ALLURE_CONFIG;

```

## View report
After running testcafe tests, it should generate a folder `allure/allure-results` in your project root directory.  

Install allure-commandline module to your project.  

`npm install -g allure-commandline `

Run below command to view allure report.   

`allure generate allure/allure-results --clean -o allure/allure-report && allure open allure/allure-report`
