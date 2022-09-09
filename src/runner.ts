import { spawn } from 'child_process';
import fsPromises from 'fs/promises';
import { existsSync } from 'fs';

import {
  PREFIX_RESPONSE_BODY_DATA,
  PREFIX_SERVER_RESPONSE
} from './constants';

import RequestHook from './RequestHook';
import APICollector from './APICollector';
import APIGenerator from './APIGenerator';

const rmTmpFileAndGetOriginalBack = async (
  tmpFilePath: string,
  mainFilePath: string
) => {
  if (existsSync(tmpFilePath)) {
    await fsPromises.copyFile(tmpFilePath, mainFilePath);
    await fsPromises.rm(tmpFilePath);
  }
};

export async function runner (
  args: Array<string>,
  options: Record<string, string>
): Promise<void> {
  if (args.length === 0) {
    throw new Error('No arguments found');
  }

  const apiCollector = new APICollector();
  const requestHook = new RequestHook(apiCollector);
  let mainFileAbsolutePath: string;
  let tmpFileAbsoluteath: string;

  if (options.force) {
    const projectCWD = process.cwd();
    const packageJSONStr = await fsPromises.readFile(projectCWD + '/package.json', 'utf8');
    const packageJSON = JSON.parse(packageJSONStr);
    const mainFilePath = packageJSON?.outdoc?.main || packageJSON?.main;
    if (!mainFilePath) throw new Error('Please define main or outdoc.main in package.json');

    mainFileAbsolutePath = projectCWD + "/" + mainFilePath;
    tmpFileAbsoluteath = projectCWD + "/outdoc_tmp_file";

    const injectedCodes = RequestHook.getInjectedCodes();
    await fsPromises.copyFile(mainFileAbsolutePath, projectCWD + "/outdoc_tmp_file");
    await fsPromises.writeFile(mainFileAbsolutePath, injectedCodes, { flag: "a" });
    await fsPromises.appendFile(mainFileAbsolutePath, "// @ts-nocheck");
  }

  const childProcess = spawn(args[0], args.slice(1), {
    detached: true,
    stdio: ["inherit", "inherit", "pipe"]
  });

  childProcess.stderr.on('data', (data) => {
    data
      .toString()
      .split("\n")
      .filter((dataStr: string) => dataStr.trim())
      .forEach((dataStr: string) => {
        if (dataStr.startsWith(PREFIX_RESPONSE_BODY_DATA)) {
          try {
            const res = JSON.parse(dataStr.substr(PREFIX_RESPONSE_BODY_DATA.length));
            if (res.data?.encoding === 'buffer') {
              res.data.chunk = new Buffer(res.data.chunk);
            }
            requestHook.handleResponseBodyData(res);
          } catch (err) {
            if (err instanceof Error) {
              process.stdout.write(err.message)
            }
          }
          return;
        }

        if (dataStr.startsWith(PREFIX_SERVER_RESPONSE)) {
          try {
            const res = JSON.parse(dataStr.substr(PREFIX_SERVER_RESPONSE.length));
            if (res.data?.req?._readableState) {
              const headData = res.data.req._readableState.buffer.head.data;
              res.data.req._readableState.buffer.head.data = new Buffer(headData);
            }
            requestHook.handleServerResponse(res);
          } catch (err) {
            if (err instanceof Error) {
              process.stdout.write(err.message);
            }
          }
          return;
        }

        process.stderr.write(dataStr + "\n");
      })
  });

  childProcess.on('close', async (code) => {
    if (options.force) {
      await rmTmpFileAndGetOriginalBack(tmpFileAbsoluteath, mainFileAbsolutePath);
    }

    if (code === 0) {
      try {
        await APIGenerator.generate(
          apiCollector,
          {
            output: options.output,
            title: options.title,
            version: options.version,
            email: options.email
          }
        );
        console.log('Generate API document success');
      } catch (err) {
        let message = "";
        if (err instanceof Error) message = err.message;
        console.log('Generate API document failed: ', message);
      }
    }
  });

  process.on('SIGINT', async () => {
    if (options.force) {
      await rmTmpFileAndGetOriginalBack(tmpFileAbsoluteath, mainFileAbsolutePath);
    }
  });
}