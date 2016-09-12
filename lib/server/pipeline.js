"use strict";

/**
 * pipeline module.
 * @module server/pipeline
 * @param {Array} processes an array of child processes
 * @param {Function} onSuccessClbk function to call if all processes succeed
 * @param {Function} onFailureClbk function to call if one of processes fails
 *
 * @description Pipes input processes into each other and into destination.
 *              Sets up callbaks to inform the caller on the success or
 *              failure of the pipeline. Schedules to start the pipeline on
 *              the next event loop iteration with nextTick(). The pipeline is
 *              run asynchronously. Promises are used to get feedback.
 *
 * @example <caption>Example usage of the pipeline module.</caption>
 *   const pipeline = require('../lib/server/pipeline.js');
 *   const cat = spawn('cat', ['file']);
 *   const wc = spawn('wc', ['-l']);
 *   var success = function() {console.log('Success')};
 *   var failure = function() {console.log('Failed')};
 *   var pline = pipeline([cat, wc], success, failure);
 *   pline.run(process.stdout);
 *
 * @author Marina Gourtovaia
 * @copyright Genome Research Limited 2016
 */

const EventEmitter = require('events');
const assert       = require('assert');
const net          = require('net');
const LOGGER       = require('winston');
const crypto       = require('crypto');

// TODO: Possibly we can remove one of the callbacks from this signature?
module.exports = (processes, onSuccessClbk, onFailureClbk) => {
  let _result = {
    truncated: false,
    checksum: null
  };
  let hash = crypto.createHash('md5');
  let hashDigest;

  function _getHashDigest() {
    if ( !hashDigest ) {
      hashDigest = hash.digest('hex');
    }
    return hashDigest;
  }

  function createPromise(p, nextP) {

    return new Promise(
      function(resolve, reject) {
        p.once('close', function(code, signal) {
          if (code || signal) {
            reject(code || signal);
            if (nextP) {
              LOGGER.debug('Killing ' + nextP.title);
              nextP.kill();
            }
          } else {
            resolve();
          }
        });
        p.on('error',        (err) => {
          reject(err);
        });
        p.stdin.on('error',  (err) => {
          reject(err);
        });
        p.stdout.on('error', (err) => {
          reject(err);
        });
      }
    );
  }

  function registerOutcomes() {

    var promises = processes.map(
      function(process, i, array) {
        let next_index = i + 1;
        let next = (next_index == array.length) ? null : array[next_index];
        return createPromise(process, next);
      });

    promises.forEach(function(promise, i) {
      var title = processes[i].title || 'process_' + i;
      // To get better insight into failures, capture
      // error stream for processes
      processes[i].stderr.on('data', function(data) {
        LOGGER.error('STDERR FOR ' + title + ': ' + data);
      });

      promise.then(
        function() { // Report success
          LOGGER.debug('SUCCESS ' + title);
        }
      )
      .catch(
        function(code) { // Log the rejection reason
          LOGGER.error('ERROR ' + title + ' ' + code);
        }
      );
    });

    Promise.all(promises).then(
      () => {
        _result.truncated = false;
        _result.checksum = _getHashDigest();

        onSuccessClbk();
      },
      () => {
        _result.truncated = true;
        onFailureClbk();
      }
    );
  }

  function schedule(destination) {

    try {
      // Not every stream type has a socket, http response does.
      let socket = destination.socket;
      assert.ok(socket instanceof net.Socket);
      // The socket close event is fired when response is closed.
      // If it happend after client disconnect, had_error is false.
      socket.on('close', (had_error) => {
        if (had_error) {
          let p = processes[0];
          LOGGER.error(
            'Transmission error - response socket closed - killing ' + p.title);
          // The client might have disconnected, but the processes are still
          // running (status changes to sleeping). Each of the processes is
          // associated with up to three sockets, which will persist.
          // Kill the first process in the array, it will kill the next, etc.
          p.kill();
        }
      });
    } catch (e) {}

    /* On the next iteration of the main event loop,
     * prior to processing any IO,
     * wire the pipeline thus implicitly starting computation.
     */
    var numProcesses = processes.length;

    process.nextTick(() => {
      if (destination.finished) {
        LOGGER.info('Destination is closed, not starting the pipeline');
        return;
      }
      processes.forEach(function(current, index, array) {
        // For each process but the last one,
        if (index < numProcesses - 1) {
          // pipe the optput of the current one
          // to the input of the next one.
          current.stdout.pipe(array[index + 1].stdin);
        }
      });
      // Pause stream to set up listeners otherwise data can be read immediately
      // in first listener.
      processes[numProcesses - 1].stdout.pause();
      // The last process' output is piped to the destination
      processes[numProcesses - 1].stdout.pipe(destination, {end: false});
      processes[numProcesses - 1].stdout.on('data', (chunk) => {
        hash.update(chunk);
      });
      processes[numProcesses - 1].stdout.on('end', () => {
        LOGGER.debug('md5: ' + _getHashDigest());

      });
      // Resume stream after listerners are set up
      processes[numProcesses - 1].stdout.resume();
    });
  }

  function validateInput() {
    if (!processes) {
      throw new ReferenceError('Array of processes should be defined');
    }
    if (processes instanceof Array === false) {
      throw new TypeError('processes should be an array');
    }
    if (processes.length === 0) {
      throw new RangeError('processes array cannot be empty');
    }
    processes.forEach(function(p, index) {
      if (!p) {
        throw new ReferenceError(`Undefined process at index ${index}`);
      }
      if (p instanceof EventEmitter === false) {
        throw new TypeError(`Not an event emitter at index ${index}`);
      }
    });

    if (!onSuccessClbk) {
      throw new ReferenceError('Success callback should be defined');
    }
    if (onSuccessClbk instanceof Function === false) {
      throw new TypeError('Success callback should be a function');
    }
    if (!onFailureClbk) {
      throw new ReferenceError('Failure callback should be defined');
    }
    if (onFailureClbk instanceof Function === false) {
      throw new TypeError('Failure callback should be a function');
    }
  }

  return {
    /**
     * Contains reference to checksum and truncated - used in http/trailer
     */
    result: _result,
    /**
     * Set up and run the pipeline.
     * @param destination - a writable stream
     */
    run: (destination) => {
      if (!destination) {
        throw new ReferenceError('Destination stream is not defined');
      }
      validateInput();
      registerOutcomes();
      schedule(destination);
    },
  };
};
