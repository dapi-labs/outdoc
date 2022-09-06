import { spawn } from 'child_process';
import fsPromises from 'fs/promises';
import { existsSync } from 'fs';
import async_hooks from 'async_hooks';

import {
  PREFIX_RESPONSE_BODY_DATA,
  PREFIX_SERVER_RESPONSE
} from './constants';
import RequestHook from './RequestHook';
import APICollector from './APICollector';
import APIGenerator from './APIGenerator';

import type {
  ObjectForResBodyArg,
  ServerResponseArg,
  ObjectForResBodyBufferItem
} from './types/asyncEventTypes';

type resBodyType = {
  asyncId: number,
  data: ObjectForResBodyBufferItem
}

type serverResType = {
  triggerAsyncId: number,
  data: ServerResponseArg | {
    req: {
      _readableState?: {
        buffer: {
          head: {
            data: string
          }
        }
      }
    }
  }
}

const rmTmpFileAndGetOriginalBack = async (
  tmpFilePath: string,
  mainFilePath: string
) => {
  if (existsSync(tmpFilePath)) {
    await fsPromises.copyFile(tmpFilePath, mainFilePath);
    await fsPromises.rm(tmpFilePath);
  }
};

export class OutDoc {
  public static init (): void {
    const asyncHook = async_hooks.createHook({
      init: (
        asyncId: number,
        type: string,
        triggerAsyncId: number,
        resource:  {
          args: Array<ObjectForResBodyArg | ServerResponseArg>
        }
      ) => {
        if (type === "TickObject" && resource.args) {
          const className = resource.args?.[0]?.constructor.name;

          // Response body data
          if (className === "Object") {
            const arg = resource.args[0] as ObjectForResBodyArg;
            if (arg?.stream?.server && arg?.state?.buffered) {
              const dataItem = arg.state.buffered.find(item => {
                if (!item) return false;
                return ['buffer', 'utf-8'].includes(item.encoding);
              });
              if (dataItem) {
                const chunk = dataItem.encoding === 'buffer'
                  ? dataItem.chunk.toString()
                  : dataItem.chunk;
                const res: resBodyType = {
                  asyncId,
                  data: {
                    encoding: dataItem.encoding,
                    chunk
                  }
                };
                console.log(PREFIX_RESPONSE_BODY_DATA + JSON.stringify(res));
              }
            }
          }

          // Server response
          if (className === "ServerResponse") {
            const arg = resource.args[0] as ServerResponseArg;
            const res: serverResType = {
              triggerAsyncId,
              data: {
                _header: arg._header,
                statusCode: arg.statusCode,
                statusMessage: arg.statusMessage,
                req: {
                  rawHeaders: arg.req.rawHeaders,
                  url: arg.req.url,
                  method: arg.req.method,
                  params: arg.req.params,
                  query: arg.req.query,
                  baseUrl: arg.req.baseUrl,
                  originalUrl: arg.req.originalUrl,
                  body: arg.req.body
                }
              }
            };
            if (arg.req._readableState?.buffer?.head?.data) {
              res.data.req._readableState = {
                buffer: {
                  head: {
                    data: arg.req._readableState.buffer.head.data.toString()
                  }
                }
              };
            }
            console.log(PREFIX_SERVER_RESPONSE + JSON.stringify(res));
          }
        }
      }
    });
    asyncHook.enable();
  }
}

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
    stdio: ["inherit", "pipe", "inherit"]
  });

  childProcess.stdout.on('data', (data) => {
    const dataStr = data.toString();

    if (dataStr.startsWith(PREFIX_RESPONSE_BODY_DATA)) {
      try {
        const res = JSON.parse(dataStr.substr(PREFIX_RESPONSE_BODY_DATA.length));
        if (res.data?.encoding === 'buffer') {
          res.data.chunk = new Buffer(res.data.chunk);
        }
        requestHook.handleResponseBodyData(res);
      } catch (err) {
        if (err instanceof Error) {
          process.stderr.write(err.message);
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
          process.stderr.write(err.message);
        }
      }
      return;
    }

    process.stdout.write(data.toString());
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
