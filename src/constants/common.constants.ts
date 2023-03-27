import type { ExecOptions } from 'child_process';

import * as vscode from 'vscode';

export const ROOT_PATH = vscode.workspace.workspaceFolders?.[0].uri.fsPath;

export const DEFAULT_EXEC_OPTIONS: ExecOptions = { cwd: ROOT_PATH };

export const COMMANDS_VARIABLES = {
  branchTask: 'BRANCH_TASK',
  branchName: 'BRANCH_NAME',
  clipboardTag: 'CLIPBOARD_TAG',
  clipboardTask: 'CLIPBOARD_TASK',
  releaseBranchTag: 'RELEASE_BRANCH_TAG',
  releaseBranchTask: 'RELEASE_BRANCH_TASK',
} as const;
