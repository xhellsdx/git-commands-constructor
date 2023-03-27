import type * as vscode from 'vscode';

import type { COMMANDS_VARIABLES } from 'constants/common.constants';

export type ValueOf<T> = T[keyof T];

export type TCommand = {
  group: string;
  name: string;
  code: string;
};

export type TCommandsVariablesData = Record<ValueOf<typeof COMMANDS_VARIABLES>, string>;

export type TCommandsQuickPickItem = vscode.QuickPickItem & Pick<TCommand, 'group' | 'code'>;

export type TExtensionRegisteredCommand = {
  name: string;
  callback: (context: vscode.ExtensionContext) => Promise<unknown>;
};
