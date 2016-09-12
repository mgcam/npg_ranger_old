/* globals describe, it, expect, beforeAll, afterAll*/

"use strict";

const http    = require('http');
const fs      = require('fs');
const tmp     = require('tmp');
const md5     = require('js-md5');
const trailer = require('../../lib/server/http/trailer.js');

describe('Input validation', function() {
  it('declare - response object is not given - error', function() {
    expect( () => {trailer.declare();} ).toThrowError(ReferenceError,
    'HTTP response object is required');
  });
  it('setDataTruncation - response object is not given - error', function() {
    expect( () => {trailer.setDataTruncation();} ).toThrowError(
    ReferenceError, 'HTTP response object is required');
  });
  it('setDataTruncation - response object is not given - error', function() {
    expect( () => {trailer.setDataTruncation({});} ).toThrowError(
    ReferenceError, 'boolean flag indicating data truncation is required');
  });
  it('setDataTruncation - response object is not given - error', function() {
    expect( () => {trailer.setDataTruncation({}, 4);} ).toThrowError(
    ReferenceError, 'boolean flag indicating data truncation is required');
  });
});

describe('declaring, setting and removing a trailer', function() {
  // Create server HTTP server object.
  const server = http.createServer();
  // Generate synchronously a temporary file name.
  var socket = tmp.tmpNameSync();

  beforeAll(function() {
    // Start listening on a socket
    server.listen(socket, () => {
      console.log(`Server listening on socket ${socket}`);
    });
  });

  // This tidy-up callback is not called when the spec exits early
  // due to an error. Seems to be a bug in jasmine.
  afterAll(function() {
    server.close();
    try { fs.unlinkSync(socket); } catch (e) {}
  });

  it('Declare and set a trailer to mark data truncation', function(done) {

    server.removeAllListeners('request');
    server.on('request', (request, response) => {
      trailer.declare(response);
      expect(response.getHeader('Trailer')).toBe('data-truncated,checksum');
      response.write('useful payload');
      trailer.setDataTruncation(response, true, null);
      response.end();
    });

    http.get({socketPath: socket}, function(response) {
      response.on('data', function() {
        // not interested in data, but the end event is not called
        // unless the data is processed
      });
      response.on('end', function() {
        expect(response.rawTrailers).toEqual([ 'data-truncated', 'true', 'checksum', 'null' ]);
        done();
      });
    });
  });

  it('Declare and set a trailer to mark good data', function(done) {

    server.removeAllListeners('request');
    server.on('request', (request, response) => {
      let replyContent = 'useful payload';
      trailer.declare(response);
      expect(response.getHeader('Trailer')).toBe('data-truncated,checksum');
      response.write(replyContent);
      trailer.setDataTruncation(response, false, md5(replyContent));
      response.end();
    });

    http.get({socketPath: socket}, function(response) {
      response.on('data', function() {});
      response.on('end', function() {
        expect(response.rawTrailers).toEqual([ 'data-truncated', 'false', 'checksum', '5a1ca5a77b7eb8af83bf55483715b1ba' ]);
        done();
      });
    });

  });

  it('Declare and remove a trailer', function(done) {

    server.removeAllListeners('request');
    server.on('request', (request, response) => {
      trailer.declare(response);
      expect(response.getHeader('Trailer')).toBe('data-truncated,checksum');
      expect( () => {trailer.removeDeclaration(response);} ).not.toThrow();
      expect(response.getHeader('Trailer')).toBe(undefined);
      response.end();
      done();
    });

    http.get({socketPath: socket}, function(response) {
      response.on('data', function() {});
      response.on('end', function() {});
    });

  });

  it('Trailer has not been declared: no error removing declaration, error setting', function(done) {

    server.removeAllListeners('request');
    server.on('request', (request, response) => {
      expect( () => {trailer.removeDeclaration(response);} ).not.toThrow();
      response.write('useful payload');
      expect( () => {trailer.setDataTruncation(response, true, null);} )
        .toThrowError(Error,
        'Cannot set data truncation trailer because it has not been declared');
      response.end();
    });

    http.get({socketPath: socket}, function(response) {
      response.on('data', function() {});
      response.on('end', function() {
        expect(response.rawTrailers).toEqual([]);
        done();
      });
    });

  });

  it('If Transfer-Encoding header is not set, the trailer is not set', function(done) {

    server.removeAllListeners('request');
    server.on('request', (request, response) => {
      response.removeHeader('Transfer-Encoding');
      response.setHeader('Content-Type', 'application/json');
      trailer.declare(response);
      expect(response.getHeader('Trailer')).toBe('data-truncated,checksum');
      response.write('{"some": "property"}');
      trailer.setDataTruncation(response, true, null);
      response.end();
    });

    http.get({socketPath: socket}, function(response) {
      response.on('data', function() {});
      response.on('end', function() {
        expect(response.rawTrailers).toEqual([]);
        done();
      });
    });

  });

  it('Trailer cannot be declared after the headers have been sent', function(done) {

    server.removeAllListeners('request');
    server.on('request', (request, response) => {
      response.write('payload');
      expect( () => {trailer.declare(response);} ).toThrowError(Error,
        "Can't set headers after they are sent.");
      expect(response.getHeader('Trailer')).toBe(undefined);
      response.end();
      done();
    });

    http.get({socketPath: socket}, function(response) {
      response.on('data', function() {});
      response.on('end',  function() {});
    });

  });

});
