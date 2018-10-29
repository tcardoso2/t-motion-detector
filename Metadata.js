// TODO: Add custom messages here instead of main.js
let ent = require('./Entities')
let filters = require('./Filters')
let ext = require('./Extensions')
let utils = require('./utils')
utils.setLevel('debug')
let log = utils.log
let SystemEnvironment = ext.SystemEnvironment

let tempBag = {}

// Base classes metadata
ent.Environment.prototype._meta =
{
  description: () => {
    return ' (no description)'
  },
  reflectionHandler: classArgsHandler,
  handleParameterInput: handleParameterInput,
  resultBag: resultBag
}

ent.MotionDetector.prototype._meta =
{
  description: () => {
    return ' (no description)'
  },
  reflectionHandler: classArgsHandler,
  handleParameterInput: handleParameterInput,
  resultBag: resultBag
}

ent.BaseNotifier.prototype._meta =
{
  description: () => {
    return ' (no description)'
  },
  reflectionHandler: classArgsHandler,
  handleParameterInput: handleParameterInput,
  resultBag: resultBag
}

filters.BaseFilter.prototype._meta =
{
  description: () => {
    return ' (no description)'
  },
  reflectionHandler: classArgsHandler,
  handleParameterInput: handleParameterInput,
  resultBag: resultBag
}

SystemEnvironment.prototype._meta =
{
  description: () => {
    return 'An Environment entity which runs in the background' +
            ' and allows executing a command every interval.' +
            ' Use if you require any kind of system monitoring'
  },
  reflectionHandler: classArgsHandler,
  handleParameterInput: handleParameterInput,
  resultBag: resultBag
}

function resultBag () {
  return tempBag
}

function handleParameterInput (className, parameter, input) {
  log.info(`Wrote in ${className}: ${parameter} = ${input}`)
  tempBag[className][parameter]['answer'] = input
  log.debug('Current choices are')
  log.debug(tempBag)
  return input
  // For now lets everything pass
}

function classArgsHandler (literalClass, appendObj) {
  // Actual function, do not do anything here
  let args = utils.splitArgs(literalClass)
  log.debug(`Args of ${literalClass.name} are: `, args)
  tempBag[literalClass.name] = {}
  for (let i in args) {
    tempBag[literalClass.name][args[i]] = {
      message: 'Input your value:',
      type: 'input',
      filter: (input) => {
        return literalClass.prototype._meta.handleParameterInput(literalClass.name, args[i], input)
      },
      choices: {
        'confirm': (args) => { console.log(`TEST ${args}`) }
      }
    }
  }
  let classParametersChoices = tempBag[literalClass.name];
  if (appendObj) {
    utils.extend(classParametersChoices, appendObj)
  }

  return {
    message: 'Configure arguments',
    choices: classParametersChoices
  }
}
