  /*****************************************************
 * Internal tests
 * What are internal tests?
 * As this is a npm package, it should be tested from
 * a package context, so I'll use "interal" preffix
 * for tests which are NOT using the npm tarball pack
 * For all others, the test should obviously include
 * something like:
 * var md = require('t-motion-detector');
 *****************************************************/

let chai = require('chai');
let chaiAsPromised = require("chai-as-promised");
let should = chai.should();
let fs = require('fs');
let ent = require('../Entities.js');
let ext = require('../Extensions.js');
let filters = require('../Filters.js');
let main = require('../main.js');
let events = require('events');

before(function(done) {
  done();
});

after(function(done) {
  // here you can clear fixtures, etc.
  main = require('../main.js');
  ent = require('../Entities.js');
  done();
});

describe("When a new filter is applied to one motion detector,", function() {
  it('if the default filter is implemented (pass-all) the notifier should still receive signals.', function (done) {
    //Prepare
    main.Reset();
    let alternativeConfig = new main.Config("/test/config_test3.js");
    main.StartWithConfig(alternativeConfig);

    let d = main.GetMotionDetectors();
    d[0].applyFilter(new filters.BaseFilter());
    
    let n = main.GetNotifiers();
    let _done = false;
    n[0].on('pushedNotification', function(message, text, data){
      if(!_done){
        data.newState.should.equal(20);
        done();
        _done = true;
      }
    });

    //Act
    let e = main.GetEnvironment();    
    e.addChange(20);
  });

  it('filter must inherit BaseFilter class.', function () {
    //Prepare
    main.Reset();
    let alternativeConfig = new main.Config("/test/config_test3.js");
    main.StartWithConfig(alternativeConfig);

    let d = main.GetMotionDetectors();
    try{
      d[0].applyFilter("Some other parameter");
    } catch (e) {
      e.message.should.equal("Filter object not of type BaseFilter.");
      return;
    }
    should.fail();
  });

  it('if a BlockAll filter is implemented the notifier should not receive signals.', function () {
    //Prepare
    main.Reset();
    let alternativeConfig = new main.Config("/test/config_test3.js");
    main.StartWithConfig(alternativeConfig);

    let d = main.GetMotionDetectors();
    d[0].applyFilter(new filters.BlockAllFilter());
    
    let n = main.GetNotifiers();
    n[0].on('pushedNotification', function(message, text, data){
      should.fail("Should not have received a signal, Received signal");
    });

    //Act
    let e = main.GetEnvironment();    
    e.addChange(10);
  });

  it('if a ValueFilter filter is implemented the notifier should not receive signals with the given value.', function (done) {
    //Prepare
    main.Reset();
    let alternativeConfig = new main.Config("/test/config_test3.js");
    main.StartWithConfig(alternativeConfig);

    let d = main.GetMotionDetectors();
    d[0].applyFilter(new filters.ValueFilter(10));

    let n = main.GetNotifiers();
    n[0].on('pushedNotification', function(message, text, data){
      data.newState.should.not.equal(10);
      //States stack up, because they belong to the Environment despite the 10 being filtered
      data.newState.should.equal(40);
      done();
    });

    //Act
    let e = main.GetEnvironment();    
    e.addChange(10);
    e.addChange(30);
  });

  it('if a NameFilter filter is implemented the notifier should not receive signals with the given name.', function () {
    //Prepare
    main.Reset();
    let alternativeConfig = new main.Config("/test/config_test3.js");
    main.StartWithConfig(alternativeConfig);

    let d = main.GetMotionDetectors();
    d[0].applyFilter(new filters.NameFilter("unnamed detector."));

    let n = main.GetNotifiers();
    n[0].on('pushedNotification', function(message, text, data){
      data.detector.name.should.not.equal("unnamed detector.");
      message.should.not.equal("Default Base Notifier");
    });

    //Act
    let e = main.GetEnvironment();    
    e.addChange(10);
  });

  it('if a HighPassFilter filter is implemented the notifier should not receive signals above the given value.', function (done) {
    //Prepare
    main.Reset();
    let alternativeConfig = new main.Config("/test/config_test3.js");
    main.StartWithConfig(alternativeConfig);

    let d = main.GetMotionDetectors();
    d[0].applyFilter(new filters.HighPassFilter(10));

    let n = main.GetNotifiers();
    n[0].on('pushedNotification', function(message, text, data){
      data.newState.should.not.equal(8);
      //States stack up, because they belong to the Environment despite the 10 being filtered
      data.newState.should.equal(38);
      done();
    });

    //Act
    let e = main.GetEnvironment();    
    e.addChange(8);
    e.addChange(30);
  });
  
  it('if a LowPassFilter filter is implemented the notifier should not receive signals above the given value.', function (done) {
    //Prepare
    main.Reset();
    let alternativeConfig = new main.Config("/test/config_test3.js");
    main.StartWithConfig(alternativeConfig);

    let d = main.GetMotionDetectors();
    d[0].applyFilter(new filters.LowPassFilter(10));

    let n = main.GetNotifiers();
    n[0].on('pushedNotification', function(message, text, data){
      data.newState.should.equal(8);
      //States stack up, because they belong to the Environment despite the 10 being filtered
      data.newState.should.not.equal(38);
      done();
    });

    //Act
    let e = main.GetEnvironment();    
    e.addChange(8);
    e.addChange(30);
  });

  it('if a LowPassFilter filter AND a HighPassFilter is implemented the notifier should only receive signals in the mid-range.', function (done) {
    //Prepare
    main.Reset();
    let alternativeConfig = new main.Config("/test/config_test3.js");
    main.StartWithConfig(alternativeConfig);

    let d = main.GetMotionDetectors();

    d[0].applyFilter(new filters.HighPassFilter(10));
    d[0].applyFilter(new filters.LowPassFilter(40));

    let n = main.GetNotifiers();
    n[0].on('pushedNotification', function(message, text, data){
      data.newState.should.equal(33);
      done();
    });

    //Act
    let e = main.GetEnvironment();    
    e.addChange(8);
    e.addChange(25);
    e.addChange(32);
  });
});

describe("When a Filter is declared in the Config file,", function() {
  it('as parameter of the Environment constructor it should apply to the environments', function () {
    //Prepare
    main.Reset();
    let alternativeConfig = new main.Config("/test/config_test5.js");
    main.StartWithConfig(alternativeConfig);
    
    let n = main.GetNotifiers();
    n[0].on('pushedNotification', function(message, text, data){
      data.newState.should.equal(20);
    });

    //Act
    let e = main.GetEnvironment();    
    e.addChange(20);
    should.fail();
  });
  it('as parameter of the Motion Detector constructors it should apply to detectors individually', function () {
    //Prepare
    main.Reset();
    let alternativeConfig = new main.Config("/test/config_test3.js");
    main.StartWithConfig(alternativeConfig);

    let d = main.GetMotionDetectors();
    d[0].applyFilter(new filters.BaseFilter());
    
    let n = main.GetNotifiers();
    let _done = false;
    n[0].on('pushedNotification', function(message, text, data){
      if(!_done){
        data.newState.should.equal(20);
        _done = true;
      }
    });

    //Act
    let e = main.GetEnvironment();    
    e.addChange(20);
    should.fail();
  });
});

describe("When a new filter is applied to the whole Environment,", function() {
  it('it should prevent any motion detector from processing signals.', function (done) {
    main.Reset();
    let alternativeConfig = new main.Config("/test/config_test4.js");
    main.StartWithConfig(alternativeConfig);

    let n = main.GetNotifiers();
    n[0].on('pushedNotification', function(message, text, data){
      //Contrary to Motion Detector Filters, Environment filters prevent state to change
      data.newState.should.equal(15);
      done();
    });
    //Act
    let e = main.GetEnvironment(); 
    e.applyFilter(new filters.HighPassFilter(10));
    e.addChange(5);
    e.addChange(15);
  });
});

//Create tests removing Detectors and notifiers.