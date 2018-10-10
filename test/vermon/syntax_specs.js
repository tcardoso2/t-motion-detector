let vermon = require("./vermon");
let entities = vermon.Entities;
let logger = vermon.logger;
let chai = require('chai');
let should = chai.should();
let defaultConfig = require("../../config.js");

let errors = require('../../Errors');

before(function(done) {
  done();
});

after(function(done) {
  // here you can clear fixtures, etc.
  done();
});

describe("Basic new syntax, ", function() {

  it('configure (needs to be done before starting vernon)', function () {
		vermon.setLogLevel('info');
    vermon.configure();
		//No errors should happen
	});
	
	it('configure: If no custom config parameters are passed, the configured profile will fallback to default, which is whatever you have on the root config.js file', function () {
		vermon.reset();
		vermon.configure();
		vermon.profile().should.be.eql(defaultConfig.default);
	});

	it('configure: Can take a Config object as first parameter', function () {
		vermon.reset();
		vermon.configure(new vermon.Config());
		vermon.profile().should.be.eql(defaultConfig.default);
	});

	it('configure: Can take a string of the path for the config as first parameter', function () {
		vermon.reset();
		vermon.configure('test/config_test4.js');
		let testConfig4 = require("../config_test4.js");
		vermon.profile().should.be.eql(testConfig4.default);
	});

	it('watch (replacer for former StartWithConfig)', function (done) {
		vermon.reset();
		vermon.configure();
		vermon.watch().then((environment)=>{
	  	logger.info(`Watching environment ${environment.name}.`);
	  	done();
		}).catch((e)=>{
	  	should.fail();
		});
  });
  
  it('watch: No longer requires config as first argument, if configure is run before', function () {
		vermon.reset();
		vermon.configure();
		vermon.watch().then((environment, detectors)=>{
			logger.info(`Watching environment ${environment.name}, currently detecting:`);
			for(let d in detectors){
				logger.info(d.name);
			}
		}).catch((e)=>{
	  	should.fail();
		});
  });

  it('watch: returns an error promise if error happens', function (done) {
		//Cleanup, start fresh
		vermon.reset();
    vermon.watch().then((environment, detectors)=>{
	  	logger.info(`Watching environment ${environment.name}, currently detecting:`);
		}).catch((e)=>{
	  	logger.warn(`Some error happened: ${e}, ignoring...`);
	  	e.name.should.equal("MissingConfigError");
	  	done();
		});
	});
	
	it('watch: returns an error promise if error happens', function (done) {
		//Cleanup, start fresh
		vermon.reset();
    vermon.watch().then((environment, detectors)=>{
	  	logger.info(`Watching environment ${environment.name}, currently detecting:`);
		}).catch((e)=>{
	  	logger.warn(`Some error happened: ${e}, ignoring...`);
	  	e.name.should.equal("MissingConfigError");
	  	done();
		});
  });
})