[![Build Status](https://travis-ci.org/Colored-Coins/Errors.svg?branch=master)](https://travis-ci.org/Colored-Coins/Errors)
[![Coverage Status](https://coveralls.io/repos/github/Colored-Coins/Errors/badge.svg?branch=master)](https://coveralls.io/github/Colored-Coins/Errors?branch=master)
[![npm version](https://badge.fury.io/js/cc-errors.svg)](https://badge.fury.io/js/cc-errors)
# Errors
Errors assigned to Colored-Coins servers responses.<br>
This module allows servers reuse errors, acheiving more comprehensive and readable error responses,
and more importantly - enables better logging and tracing of errors by client applications or error analysis thanks to well-defined error codes.
## Usage
### Installation
```
$ npm install cc-errors
```
### Creating error messages
First, `require` the module like so:
```javascript
require('cc-errors')
```
Create specific Error instance of one of the supported error classes:
```javascript
console.log(new errors.InvalidAddressError().toJSON())
```
gives us:
```
{ code: 10001,
  status: 422,
  name: 'InvalidAddressError',
  message: 'Invalid address' }
```
Override messages on instantiation:
```javascript
console.log(new errors.InvalidAddressError({
	explanation: 'Address 123xyz is not a valid address',
	response: 'Change the argument \'fromAddress\' to be a valid address'
}).toJSON())
```
outputs:
```
{ explanation: 'Address 123xyz is not a valid address',
  response: 'Change the argument \'fromAddress\' to be a valid address',
  code: 10001,
  status: 422,
  name: 'InvalidAddressError',
  message: 'Invalid address' }
```
### Express Middleware
Express.js error handling middleware.

```javascript
var errorhandler = require('cc-errors').errorHandler()
```
#### errorhandler(options)
Create new error handling middleware.
##### options
###### env
'development' will include stack trace, and will accumulate original errors<br>
initiated from third party or separate servers. Default is undefined.
###### log
One of two types:<br>
boolean - a boolean for determining whether the error handler should log the error messages. `true` will use `console.error` by default for logging.<br>
function - a function to process an error, invoked with `err`.<br>
Default is `true`.

#### Example
As with any express error handling middleware, it should be put after the router middleware:
```javascript
var express = require('express')
var app = express()
var bodyParser = require('body-parser')
var errorHandler = require('cc-errors').errorHandler

app.use(bodyParser())
app.get('/error', function (req, res, next) {
  next('Something went wrong')
})
app.use(errorHandler())
```

## Development
### Defining error messages
Create a very barebones error - you must specify at least the error `name` and `code`.<br>
```javascript
errors.create({
  name: 'RuntimeError', // class name
  code: 20001, // error code
});
console.log(new errors.RuntimeError().toJSON());
```
outputs:
```
{ code: 20001,
  name: 'RuntimeError'}
```
Optionally, define default message, associated HTTP status code, explanation and response:
```javascript
// default status, explanation and response 
errors.create({
    name: 'FileNotFoundError',
    code: 30001,
    status: 500, // associated HTTP status
    defaultMessage: 'The requested file could not be found', // human readable, short and precise string
    defaultExplanation: 'The file /home/boden/foo could not be found',  // detailed information
    defaultResponse: 'Verify the file exists and retry the operation' // suggested action to user
});
console.log(new errors.FileNotFoundError().toJSON());
```
gives us:
```
{ explanation: 'The file /home/boden/foo could not be found',
  response: 'Verify the file exists and retry the operation',
  code: 30001,
  status: 500,
  name: 'FileNotFoundError',
  message: 'The requested file could not be found' }
```
### Running the tests
```
$ npm install
$ mocha
```



