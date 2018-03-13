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
let main = require('../main.js');

//Chai will use promises for async events
chai.use(chaiAsPromised);

before(function(done) {
  done();
});

after(function(done) {
  // here you can clear fixtures, etc.
  main.Reset();
  done();
});

describe("When a MultiEnvironment is added, ", function() {
  it('it should inherit Environment type', function () {
    //Prepare
    main.Reset();
    ((new ext.MultiEnvironment()) instanceof ent.Environment).should.equal(true);
  });

  it('it should be possible to add Sub-environments via the addChange method', function () {
    //Prepare
    main.Reset();
    let e = new ext.MultiEnvironment();
    //Action
    e.addChange(new ent.Environment({name: "Environment 1"}));
    e.addChange(new ent.Environment({name: "Environment 2"}));
    //Assert
    Array.isArray(e.getCurrentState()).should.equal(false);
    (e.getCurrentState()["Environment 1"] instanceof ent.Environment).should.equal(true);
    e.getCurrentState()["Environment 1"].name.should.equal("Environment 1");
    e.getCurrentState()["Environment 2"].name.should.equal("Environment 2");
  });

  it('it should allow adding Changes of type Environment, only, everything else it ignores without an exception, but propagates via an ignoreChange event', function (done) {
    //Prepare
    main.Reset();
    let e = new ext.MultiEnvironment();
    //Assert
    e.on('changedState', (oldState, newState) => {
      should.fail();
    });

    let _done = 0;
    e.on('ignoredChange', (currentState, ignoredChange) => {
      if (currentState === {})
      {
        ignoredChange.should.equal("Some String");
      }
      if(_done < 3){
        _done++;
      }
      else{
        done();
      }
    });
    //Action
    e.addChange("Some String");
    e.addChange(1222);
    e.addChange([6,8]);
    e.addChange({"test": "Some sort of object"});
    e.getCurrentState().should.be.eql({});
  });

  it('ignored Changes should be propagated to sub-environments', function (done) {
      //Prepare
    main.Reset();
    let e = new ext.MultiEnvironment();
    //Assert
    let _countChanges = 0;
    let _countIgnores = 0;
    let _subChanges = 0;

    Array.isArray(e.getCurrentState()).should.equal(false);
    e.on('changedState', (oldState, newState) => {
      console.log("changedState called!");
      _countChanges++;
      if(_countChanges > 2){
        should.fail();
      }
      if(_countChanges == 2){
        e.getCurrentState()["Environment 1"].on('changedState', (oldState, newState) => { _subChanges++; });
        e.getCurrentState()["Environment 2"].on('changedState', (oldState, newState) => { _subChanges++; });
      }
    });

    e.on('ignoredChange', (currentState, ignoredChange) => {
      console.log("ignoredChange called!");
      _countIgnores++;
      if(_countIgnores > 2){
        should.fail();
      }
      if (_subChanges >= 2){
        //If more than 2 done is going to be called multiple times which will fail, hence I want only 2 subChanges
        done();
      }
    });

    //Action
    e.addChange(new ent.Environment({name: "Environment 1"}));
    e.addChange(new ent.Environment({name: "Environment 2"}));
    e.addChange("Some String");
    e.addChange(1222);
  });
  
  it('Changes from sub-environments should only propagate for the respective sub-environment', function (done) {
      //Prepare
    main.Reset();
    let e = new ext.MultiEnvironment();
    //Assert
    let _countChanges = 0;

    Array.isArray(e.getCurrentState()).should.equal(false);
    e.on('changedState', (oldState, newState) => {
      console.log("changedState called!");
      _countChanges++;
      if(_countChanges > 2){
        should.fail();
      }
      if(_countChanges == 2){
        e.getCurrentState()["Environment 1"].on('changedState', (oldState, newState) => { 
          newState.should.equal("Some sub-environment change");
          done(); 
        });
        e.getCurrentState()["Environment 2"].on('changedState', (oldState, newState) => { should.fail(); });
        e.getCurrentState()["Environment 1"].addChange("Some sub-environment change");
      }
    });

    //Action
    e.addChange(new ent.Environment({name: "Environment 1", state: ""}));
    e.addChange(new ent.Environment({name: "Environment 2"}));
  });

  it('should be possible to add detectors and notifiers to specific sub-environments and receive changes propagated to these.', function (done) {
    //Prepare
    let e = new ext.MultiEnvironment();
    main.Start({
      environment: e
    });
    e.addChange(new ent.Environment({name: "Environment 1"}));
    e.addChange(new ent.Environment({name: "Environment 2"}));

    main.AddDetector(new ent.MotionDetector("Detector 1"), false, e.getCurrentState()["Environment 2"]);
    main.AddNotifier(new ent.BaseNotifier("Notifier 1"), e.getCurrentState()["Environment 2"]);
    main.AddDetector(new ent.MotionDetector("Detector 2"), false, e.getCurrentState()["Environment 1"]);
    main.AddNotifier(new ent.BaseNotifier("Notifier 2"), e.getCurrentState()["Environment 1"]);

    e.getCurrentState()["Environment 2"].motionDetectors.length.should.equal(1);
    e.getCurrentState()["Environment 1"].motionDetectors.length.should.equal(1);
    (e.getCurrentState()["Environment 2"].motionDetectors[0] instanceof ent.MotionDetector).should.equal(true);

    main.GetMotionDetectors().length.should.equal(2);
    main.GetNotifiers().length.should.equal(2);
    (e.getCurrentState()["Environment 2"].motionDetectors[0] instanceof ent.MotionDetector).should.equal(true);

    let _resultCount = 0;
    let noti_function = function(message, text){
      //console.log("A new notification has arrived!", message, text);
      console.log("Notification received, _resultCount will be increased...");
      _resultCount++;
      if(_resultCount == 2) done();
    };

    main.GetNotifiers()[0].on('pushedNotification', noti_function);
    main.GetNotifiers()[1].on('pushedNotification', noti_function);
    e.addChange(1);
  });

  it('The constructor should allow taking state as an Array', function (done) {
    //Prepare
    main.Reset();
    //Assert
    try{
      new ext.MultiEnvironment({ state: 333 });
    } catch(e){
      e.message.should.equal("MultiEnvironment expects a state of type Array.");
    }
    should.fail();
  });

  it('The constructor should allow taking state as an Array of Environment types', function (done) {
    //Prepare
    main.Reset();
    //Assert
    try{
      new ext.MultiEnvironment({ state: ["a", "b"] });
    } catch(e){
      e.message.should.equal("MultiEnvironment expects a state of type Array of type Environment, found 'String'");
    }
    should.fail();
  });

  it('The constructor should allow taking Environment types as arguments via { state: [Environment]}', function (done) {
    //Prepare
    main.Reset();

    let args = [];
    args.push(new ent.Environment({name: "Environment 1"}));
    args.push(new ent.Environment({name: "Environment 2"}));
    //Assert
    let e = new ext.MultiEnvironment({ state: args });

    main.AddDetectorToSubEnvironment(new ent.MotionDetector("Detector 1"), false, e.getCurrentState()["Environment 2"]);
    main.AddNotifier(new ent.BaseNotifier("Notifier 1"), e.getCurrentState()["Environment 2"]);

    e.getCurrentState()["Environment 2"].motionDetectors.length.should.equal(1);
    (e.getCurrentState()["Environment 2"].motionDetectors[0] instanceof ent.MotionDetector).should.equal(true);

    main.GetMotionDetectors().length.should.equal(1);
    main.GetNotifiers().length.should.equal(1);
    (e.getCurrentState()["Environment 2"].motionDetectors[0] instanceof ent.MotionDetector).should.equal(true);

    let _resultCount = 0;
    let noti_function = function(message, text){
      //console.log("A new notification has arrived!", message, text);
      console.log("Notification received, _resultCount will be increased...");
      _resultCount++;
      if(_resultCount == 2) done();
    };

    main.GetNotifiers()[0].on('pushedNotification', noti_function);
    e.addChange(1);
  });
});

describe("When a MultiEnvironment is added via config file, ", function() {
});
