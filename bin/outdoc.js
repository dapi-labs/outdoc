#!/usr/bin/env node

'use strict';

const { Command } = require('commander');
const { runner }  = require('../lib/index');

const main = async () => {
  const program = new Command();
  // TODO: more options or config in package.json
  program
    .name('outdoc')
    .description('Generate OpenAPI document from local testing')
    .usage("[command running test] [options]")
    .option('-o, --output', 'file path of the generated doc, format supports json and yaml, default: api.yaml')
    .option('-t, --title <string>', 'title of the api document, default: API Document')
    .option('-v, --version <string>', 'version of the api document, default: 1.0.0')
    .option('-e, --email <string>', 'contact information')
    .parse();

  const args = program.args;
  const opts = program.opts();

  await runner(args, opts);
};

main();
