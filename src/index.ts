import { spawn } from 'child_process';
import fsPromises from 'fs/promises';

import {
  PREFIX_RESPONSE_BODY_DATA,
  PREFIX_SERVER_RESPONSE
} from './constants'
import RequestHook from './RequestHook';
import APICollector from './APICollector';
import APIGenerator from './APIGenerator';

/**
 * 1. Copy origin server file to be a temporary file
 * 2. Inject async_hook to the new server file
 * 3. Spawn a child process to run the test
 * 4. In child process.stdout to get the req/res data
 * 5. Save these req/res data into APICollector
 * 6. In child process close, get original server file back and generate api doc
 */
export async function runner (
  args: Array<string>,
  options: Record<string, string>
): Promise<void> {
  if (args.length === 0) {
    throw new Error('No arguments found');
  }

  const projectCWD = process.cwd();
  const packageJSONStr = await fsPromises.readFile(projectCWD + '/package.json', 'utf8')
  const packageJSON = JSON.parse(packageJSONStr)
  const mainFilePath = packageJSON?.outdoc?.main || packageJSON?.main
  if (!mainFilePath) throw new Error('Please define main or outdoc.main in package.json')

  const mainFileAbsolutePath = `${projectCWD}/${mainFilePath}`
  const apiCollector = new APICollector();
  const requestHook = new RequestHook(apiCollector);

  const injectedCodes = RequestHook.getInjectedCodes()
  await fsPromises.copyFile(mainFileAbsolutePath, projectCWD + "/outdoc_tmp_file")
  await fsPromises.writeFile(mainFileAbsolutePath, injectedCodes, { flag: "a" })
  await fsPromises.appendFile(mainFileAbsolutePath, "// @ts-nocheck")

  const childProcess = spawn(args[0], args.slice(1), { stdio: ["inherit", "pipe", "inherit"] });

  childProcess.stdout.on('data', (data) => {
    const dataStr = data.toString()
    if (dataStr.startsWith(PREFIX_RESPONSE_BODY_DATA)) {
      try {
        const res = JSON.parse(dataStr.substr(PREFIX_RESPONSE_BODY_DATA.length))
        if (res.data?.encoding === 'buffer') {
          res.data.chunk = new Buffer(res.data.chunk)
        }
        requestHook.handleResponseBodyData(res)
      } catch (err) {
        if (err instanceof Error) {
          process.stderr.write(err.message)
        }
      }
      return
    }

    if (dataStr.startsWith(PREFIX_SERVER_RESPONSE)) {
      try {
        const res = JSON.parse(dataStr.substr(PREFIX_SERVER_RESPONSE.length))
        if (res.data?.req?._readableState) {
          const headData = res.data.req._readableState.buffer.head.data
          res.data.req._readableState.buffer.head.data = new Buffer(headData)
        }
        requestHook.handleServerResponse(res)
      } catch (err) {
        if (err instanceof Error) {
          process.stderr.write(err.message)
        }
      }
      return
    }

    process.stdout.write(data.toString())
  })

  childProcess.on('close', async (code) => {
    await fsPromises.copyFile(projectCWD + "/outdoc_tmp_file", mainFileAbsolutePath)
    await fsPromises.rm(projectCWD + "/outdoc_tmp_file")

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
}
