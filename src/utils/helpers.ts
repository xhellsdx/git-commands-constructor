import type { ExecOptions } from 'child_process';
import * as cp from 'child_process';

import * as vscode from 'vscode';

import { DEFAULT_EXEC_OPTIONS } from 'constants/common.constants';
import { COMMANDS_VARIABLES } from 'constants/common.constants';
import { EXTENSION_NAME } from 'constants/extension.constants';
import type { TCommand, TCommandsVariablesData, ValueOf } from 'types/common.types';

export const execShell = (cmd: string, options: ExecOptions = DEFAULT_EXEC_OPTIONS) =>
  new Promise<string>((resolve, reject) => {
    cp.exec(cmd, options, (err, out, stderr) => {
      const message = stderr || out;

      return err ? reject(message) : resolve(message);
    });
  });

export const buildCommandsVariablesData = async (
  tasksPrefix: string,
): Promise<TCommandsVariablesData | undefined> => {
  const clipboardText = await vscode.env.clipboard.readText();
  const hasTasksPrefix = Boolean(tasksPrefix);

  let currentBranchName = '';

  try {
    const stdout = await execShell('git rev-parse --abbrev-ref HEAD');

    currentBranchName = stdout.trim();
  } catch (error) {
    vscode.window.showErrorMessage(`Active branch error: ${error}`);
    return;
  }

  const taskRegExp = new RegExp(`^${tasksPrefix}-\\d+$`);
  const isCurrentBranchTask = hasTasksPrefix && taskRegExp.test(currentBranchName);

  const releaseBranchTaskRegExp = new RegExp(`^release\\/(${tasksPrefix}-\\d+)$`);
  const releaseBranchTask = hasTasksPrefix
    ? currentBranchName.match(releaseBranchTaskRegExp)?.[1]
    : '';

  const releaseBranchTagRegExp = new RegExp(`^release\\/(\\d+\\.\\d+\\.\\d+)$`);
  const releaseBranchTag = currentBranchName.match(releaseBranchTagRegExp)?.[1];

  const isClipboardTask = taskRegExp.test(clipboardText || '');

  const clipboardTagRegExp = new RegExp(`^\\d+\\.\\d+\\.\\d+$`);
  const isClipboardTag = clipboardTagRegExp.test(clipboardText || '');

  return {
    [COMMANDS_VARIABLES.branchName]: currentBranchName || '',
    [COMMANDS_VARIABLES.branchTask]: isCurrentBranchTask ? currentBranchName : '',
    [COMMANDS_VARIABLES.clipboardTag]: isClipboardTag ? clipboardText : '',
    [COMMANDS_VARIABLES.clipboardTask]: isClipboardTask ? clipboardText : '',
    [COMMANDS_VARIABLES.releaseBranchTag]: releaseBranchTag || '',
    [COMMANDS_VARIABLES.releaseBranchTask]: releaseBranchTask || '',
  };
};

export const parseCommandVariables = (
  commandCode: string,
  commandsVariablesData: TCommandsVariablesData,
): string => {
  let parsedCommandCode = commandCode;

  for (const variableName in commandsVariablesData) {
    const variableValue = commandsVariablesData[variableName as ValueOf<typeof COMMANDS_VARIABLES>];

    const variable = `$${variableName}`;

    if (commandCode.includes(variable) && !variableValue) {
      return '';
    }

    parsedCommandCode = parsedCommandCode.replaceAll(variable, variableValue);
  }

  return parsedCommandCode;
};

export const sortCommandsByGroup = (commands: TCommand[], groups: string[]): TCommand[] => {
  const groupsOrder = groups.reduce<{ [key: string]: number }>(
    (acc, string, i) => Object.assign(acc, { [string]: i + 1 }),
    {},
  );

  return [...commands].sort((c1, c2) => {
    if (!groupsOrder[c1.group]) return 1;
    if (!groupsOrder[c2.group]) return -1;

    return groupsOrder[c1.group] - groupsOrder[c2.group];
  });
};

export const readConfig = <T>(key: string) => {
  const config = vscode.workspace.getConfiguration(EXTENSION_NAME);
  return config.get<T>(key);
};

export const showErrorMessage = (message: string = '') => {
  vscode.window.showErrorMessage('Error from Git Commands Constructor: ' + message);
};
