# npg_ranger project

[![Build Status](https://travis-ci.org/wtsi-npg/npg_ranger.svg?branch=master)](https://travis-ci.org/wtsi-npg/npg_ranger)
[![CI checks](https://github.com/wtsi-npg/npg_ranger/actions/workflows/ci.yml/badge.svg)](https://github.com/wtsi-npg/npg_ranger/actions/workflows/ci.yml)
[![NPM dependencies](https://david-dm.org/wtsi-npg/npg_ranger.svg)](https://david-dm.org/wtsi-npg/npg_ranger)

## Update

Active development is indefinitely suspended.

## Introduction

This project is a contribution towards development of the streaming API under the
[GA4GH](http://ga4gh.org) initiative (GA4GH Directory API and Streaming). The project has
a server and a compatible command-line http client; both conform to [GA4GH API](https://github.com/samtools/hts-specs/blob/master/htsget.md)

## Package structure

```
 bin - node.js scripts, server and client
 lib - application libraries
 test - tests
 docker - scripts for deploying a server in docker containers in a cloud 
 docs - technical manuals
 docs/api - generated API (run "grunt doc" to generate)
 package.json - npm package definition
 Gruntfile.js - grunt runner specification
```

## File merging pipeline

We are using a light version of our samtools pipeline for merging by default, but the heavy version is available in the code, located inside `lib/server/model.js`.
This is because most of our data can work with the light pipeline, and the heavy version may be considerably more computationally taxing due to collating, fixmate, and sorting.

# Related projects

 - OAuth2 authorization server https://github.com/wtsi-npg/npg_sentry
 - GA4GH-compatible genome browser (biodalliance) extension https://github.com/wtsi-npg/dalliance
