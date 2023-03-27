import * as vscode from 'vscode';

import { runCommand } from 'commands/runCommand';
import { EXTENSION_NAME } from 'constants/extension.constants';
import type { TExtensionRegisteredCommand } from 'types/common.types';

const EXTENSION_COMMANDS: TExtensionRegisteredCommand[] = [
  { name: 'runCommand', callback: runCommand },
];

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const commandsDisposable: vscode.Disposable[] = EXTENSION_COMMANDS.map(({ name, callback }) =>
    vscode.commands.registerCommand(`${EXTENSION_NAME}.${name}`, async () => {
      callback(context);
    }),
  );

  context.subscriptions.push(...commandsDisposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
