import * as vscode from 'vscode';

import { EXTENSION_CONFIGURATION_PROPERTIES } from 'constants/extension.constants';
import type { TCommand, TCommandsQuickPickItem } from 'types/common.types';
import {
  buildCommandsVariablesData,
  execShell,
  parseCommandVariables,
  readConfig,
  showErrorMessage,
  sortCommandsByGroup,
} from 'utils/helpers';

export const runCommand = async () => {
  const commands = readConfig<TCommand[]>(EXTENSION_CONFIGURATION_PROPERTIES.commands);
  const taskPattern = readConfig<string>(EXTENSION_CONFIGURATION_PROPERTIES.taskPattern);
  const groupsOrder = readConfig<string[]>(EXTENSION_CONFIGURATION_PROPERTIES.groupsOrder);

  if (!Array.isArray(commands))
    return showErrorMessage(`${EXTENSION_CONFIGURATION_PROPERTIES.commands} must be an array`);

  if (!commands.length) return showErrorMessage('no commands were created');

  if (typeof taskPattern !== 'string')
    return showErrorMessage(`${EXTENSION_CONFIGURATION_PROPERTIES.taskPattern} must be a string`);

  if (!Array.isArray(groupsOrder))
    return showErrorMessage(`${EXTENSION_CONFIGURATION_PROPERTIES.groupsOrder} must be an array`);

  const commandsVariablesData = await buildCommandsVariablesData(taskPattern);
  if (!commandsVariablesData) return;

  const commandsSelectOptions = sortCommandsByGroup(commands, groupsOrder).reduce<
    TCommandsQuickPickItem[]
  >((acc, { name, code, group }) => {
    const parsedCommandName = parseCommandVariables(name, commandsVariablesData);
    const parsedCommandCode = parseCommandVariables(code, commandsVariablesData);

    if (!parsedCommandName || !parsedCommandCode) {
      return acc;
    }

    const prevCommand = acc.at(-1);

    if (group !== prevCommand?.group) {
      acc.push({
        label: group,
        kind: vscode.QuickPickItemKind.Separator,
        code: '',
        group,
      });
    }

    acc.push({
      label: parsedCommandName,
      description: parsedCommandCode,
      code: parsedCommandCode,
      group,
    });

    return acc;
  }, []);

  const selectedCommand = await vscode.window.showQuickPick(commandsSelectOptions, {
    matchOnDetail: true,
    placeHolder: 'Choose a command to execute',
  });
  if (!selectedCommand) return;

  try {
    const stdout = await execShell(selectedCommand.code);

    vscode.window.showInformationMessage(stdout);
  } catch (error) {
    vscode.window.showErrorMessage(`Command error: ${error}`);
    return;
  }
};
