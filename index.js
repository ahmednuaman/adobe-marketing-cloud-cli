#!/usr/bin/env node

const PREFIX = 'https://api.omniture.com/admin/1.4/rest/?method=Report.'
const REPORT_NOT_READY = 'report_not_ready'

const colors = require('colors')
const request = require('request')
const wsse = require('wsse')

const {
  r: reportSuiteID,
  s: password,
  u: username
} = require('yargs')
    .usage('Usage: $0 -u [username] -s [secret] -r [report suite ID]')
    .demandOption(['r', 's', 'u'])
    .argv

const base64 = (str) => new Buffer(str).toString('base64')

const handleError = (error) => {
  console.log(colors.red.bold('🚨 Woops! An error! 😱'))
  console.log(jsonPretty(error))

  return process.exit(1)
}

const jsonPretty = (json) => JSON.stringify(json, false, 2)

const getReport = (reportID) =>
  request({
    headers: headers(),
    json: { reportID },
    method: 'POST',
    url: `${PREFIX}Get`
  }, (error, response, body) => {
    if (error || (body.error && body.error !== REPORT_NOT_READY)) {
      return handleError(error || body)
    }

    if (body.error === REPORT_NOT_READY) {
      return setTimeout(getReport, 1000, reportID)
    }

    console.log(jsonPretty(body))
  })

const headers = () => ({
  'X-WSSE':
    wsse({
      password,
      username
    })
      .getWSSEHeader({
        nonceBase64: true
      })
})

request({
  headers: headers(),
  json: {
    reportDescription: { reportSuiteID }
  },
  method: 'POST',
  url: `${PREFIX}Queue`
}, (error, response, body) => {
  if (error || body.error || !body.reportID) {
    return handleError(error || body)
  }

  getReport(body.reportID)
})
