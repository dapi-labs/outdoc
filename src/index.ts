import { spawn } from 'child_process'
import { Command } from 'commander'

import { version } from '../package.json'
import RequestHook from './RequestHook';
import APIGenerator from './APIGenerator';

const program = new Command()
program
  .name('outdoc')
  .description('Generate OpenAPI document from local testing')
  .version(version)
  .argument('<args...>')
  .action((args: Array<string>): void => {
    if (args.length === 0) {
      throw new Error('No arguments found')
    }

    const requestHook = new RequestHook();
    requestHook.enable();

    const processRunningTest = spawn(args[0], args.slice(1))
    processRunningTest.stdout.on('data', (data) => {
      console.log(data.toString());
    });
    processRunningTest.on('close', (code) => {
      if (code === 0) {
        const apiGenerator = new APIGenerator()
        apiGenerator.generate()
      }
    })
  })
  .parse();
