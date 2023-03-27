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
  const taskPrefix = readConfig<string>(EXTENSION_CONFIGURATION_PROPERTIES.taskPrefix);
  const groupsOrder = readConfig<string[]>(EXTENSION_CONFIGURATION_PROPERTIES.groupsOrder);

  if (!Array.isArray(commands))
    return showErrorMessage(`${EXTENSION_CONFIGURATION_PROPERTIES.commands} must be an array`);

  if (!commands.length) return showErrorMessage('no commands were created');

  if (typeof taskPrefix !== 'string')
    return showErrorMessage(`${EXTENSION_CONFIGURATION_PROPERTIES.taskPrefix} must be a string`);

  if (!Array.isArray(groupsOrder))
    return showErrorMessage(`${EXTENSION_CONFIGURATION_PROPERTIES.groupsOrder} must be an array`);

  const commandsVariablesData = await buildCommandsVariablesData(taskPrefix);
  if (!commandsVariablesData) return;

  console.log(
    'sortCommandsByGroup(commands, groupsOrder): ',
    sortCommandsByGroup(commands, groupsOrder),
  );
  const commandsSelectOptions = sortCommandsByGroup(commands, groupsOrder).reduce<
    TCommandsQuickPickItem[]
  >((acc, { name, code, group }) => {
    const parsedCommandName = parseCommandVariables(name, commandsVariablesData);
    const parsedCommandCode = parseCommandVariables(code, commandsVariablesData);

    if (!parsedCommandName || !parsedCommandCode) {
      return acc;
    }

    const prevCommand = acc.at(-1);

    console.log('group: ', group);
    console.log('prevCommand?.group: ', prevCommand?.group);
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
  console.log('commandsSelectOptions: ', commandsSelectOptions);

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
