'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
var appRoot = require('app-root-path');
var Allure = require('allure-js-commons');
var Runtime = require('allure-js-commons/runtime');
var fs = require('fs');
var saveHistory = require('./save-history.js');
var deleteAllureData = require('./delete-allure-data').deleteAllureData;
var generateConfig = require('./generateConfig').generateConfig;

var allureReporter = new Allure();

global.allure = new Runtime(allureReporter);
var reporterConfig = undefined;

try {
    reporterConfig = require(appRoot.path + '/doc-allure-config');
} catch (err) {
    reporterConfig = {};
}

// Default configuration
allure.docAllureConfig = generateConfig(reporterConfig);

if (allure.docAllureConfig.COPY_HISTORY) {
    saveHistory(appRoot.path, allure.docAllureConfig);
}

allureReporter.setOptions({ targetDir: '' + appRoot.path + allure.docAllureConfig.RESULT_DIR });
var labels = allure.docAllureConfig.labels;

var errorConfig = {
    beforeHook: '- Error in test.before hook -\n',
    assertionError: 'AssertionError',
    brokenError: 'BrokenTest',
    brokenErrorMessage: allure.docAllureConfig.labels.brokenTestMessage || 'This test has been broken',
    testSkipMessage: allure.docAllureConfig.labels.skippedTestMessage || 'This test has been skipped.',
    testPassMessage: allure.docAllureConfig.labels.passedTestMessage || 'This test has been passed.'
};

var testStatusConfig = {
    passed: 'passed',
    skipped: 'skipped',
    failed: 'failed',
    broken: 'failed'
};

exports['default'] = function () {
    return {
        noColors: true,
        currentFixture: null,

        report: {
            startTime: null,
            endTime: null,
            userAgents: null,
            passed: 0,
            total: 0,
            skipped: 0,
            fixtures: [],
            warnings: []
        },

        reportTaskStart: function reportTaskStart(startTime, userAgents, testCount) {
            console.log(labels.allureStartMessage);
            this.report.startTime = startTime;
            this.report.userAgents = userAgents;
            this.report.total = testCount;
            deleteAllureData(appRoot.path, allure.docAllureConfig);
        },

        reportFixtureStart: function reportFixtureStart(name, path, meta) {
            this.currentFixture = { name: name, path: path, tests: [], meta: meta };
            this.report.fixtures.push(this.currentFixture);
        },

        formatErrorObect: function formatErrorObect(errorText) {
            var errorMessage = undefined;
            var errorName = undefined;

            if (errorText.indexOf(errorConfig.assertionError) !== -1) {
                errorName = errorConfig.assertionError;
                errorMessage = errorText.substring(0, errorText.indexOf('\n\n'));
            } else if (errorText.indexOf(errorConfig.beforeHook) !== -1) {
                errorName = errorConfig.beforeHook;
                errorMessage = errorText.substring(errorConfig.beforeHook.length, errorText.indexOf('\n\n'));
            } else {
                errorName = errorConfig.brokenError;
                errorMessage = errorConfig.brokenErrorMessage;
            }
            return { errorName: errorName, errorMessage: errorMessage };
        },
        getTestEndTime: function getTestEndTime(testDuration, testStartTime) {
            var testEndTime = testDuration + testStartTime;

            return testEndTime;
        },
        addScreenshot: function addScreenshot(screenshotPath) {
            if (screenshotPath && fs.existsSync(screenshotPath)) {
                var img = fs.readFileSync(screenshotPath);

                allure.createAttachment(labels.screenshotLabel, new Buffer(img, 'base64'));
            }
        },
        addJiraLinks: function addJiraLinks(meta) {
            if (meta[allure.docAllureConfig.META.STORY_ID]) {
                var storyURL = allure.docAllureConfig.STORY_URL.replace('{{ID}}', meta[allure.docAllureConfig.META.STORY_ID]);

                if (storyURL) {
                    allure.addArgument(allure.docAllureConfig.STORY_LABEL, storyURL);
                }
            }

            if (meta[allure.docAllureConfig.META.TEST_ID]) {
                var testURL = allure.docAllureConfig.TEST_URL.replace('{{ID}}', meta[allure.docAllureConfig.META.TEST_ID]);

                if (testURL) {
                    allure.addArgument(allure.docAllureConfig.TEST_LABEL, testURL);
                }
            }
        },
        addFeatureInfo: function addFeatureInfo(meta, fixtureName) {
            var TEST_RUN = this.currentFixture.meta && this.currentFixture.meta[allure.docAllureConfig.META.TEST_RUN];

            if (!TEST_RUN) {
                TEST_RUN = meta && meta[allure.docAllureConfig.META.TEST_RUN];
            }
            var userAgent = this.report.userAgents[0];

            if (TEST_RUN) {
                allure.feature(TEST_RUN);
                allure.story(fixtureName);
                userAgent = TEST_RUN;
            }
            allure.addArgument(labels.userAgentLabel, userAgent);
        },
        reportTestDone: function reportTestDone(name, testRunInfo, meta) {
            var _this = this;

            allureReporter.startSuite(this.currentFixture.name);
            var testStartTime = Date.now();

            allureReporter.startCase(name, testStartTime);

            this.addFeatureInfo(meta, this.currentFixture.name);
            allure.severity(meta[allure.docAllureConfig.META.SEVERITY]);
            this.addJiraLinks(meta);

            var testEndTime = this.getTestEndTime(testRunInfo.durationMs, testStartTime);
            var formattedErrs = testRunInfo.errs.map(function (err) {
                return _this.formatError(err);
            });

            if (testRunInfo.skipped) {
                var testInfo = {
                    message: errorConfig.testSkipMessage,
                    stack: 'no error'
                };

                allureReporter.endCase(testStatusConfig.skipped, testInfo, testEndTime);
            } else if (!formattedErrs || !formattedErrs.length) {
                allureReporter.endCase(testStatusConfig.passed, null, testEndTime);
            } else if (formattedErrs && formattedErrs.length) {
                var _formatErrorObect = this.formatErrorObect(formattedErrs[0]);

                var errorName = _formatErrorObect.errorName;
                var errorMessage = _formatErrorObect.errorMessage;

                var errorMsg = {
                    name: errorName,
                    message: errorMessage,
                    stack: formattedErrs[0]
                };
                var testCafeErrorObject = testRunInfo.errs[0];

                this.addScreenshot(testCafeErrorObject.screenshotPath);
                var testStatus = testStatusConfig.failed;

                if (errorName !== errorConfig.assertionError) {
                    testStatus = testStatusConfig.broken;
                }
                allureReporter.endCase(testStatus, errorMsg, testEndTime);
            }
            allureReporter.endSuite();
        },

        reportTaskDone: function reportTaskDone(endTime, passed, warnings) {
            this.report.passed = passed;
            this.report.endTime = endTime;
            this.report.warnings = warnings;
            console.log(labels.allureClosedMessage);
        }
    };
};

module.exports = exports['default'];