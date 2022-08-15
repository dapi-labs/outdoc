import process from 'node:process';

import RequestHook from './RequestHook';

function init (): void {
  const requestHook = new RequestHook();
  requestHook.enable();
  handleProcessExitEvent();
}

function handleProcessExitEvent (): void {
  process.on('beforeExit', (code: number) => {
    if (code === 0) {

    }
  });
}

export default {
  init
};
