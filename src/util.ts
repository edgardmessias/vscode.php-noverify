import * as vscode from "vscode";

export function getNoverifyConfig(
  uri?: vscode.Uri
): vscode.WorkspaceConfiguration {
  if (!uri) {
    if (vscode.window.activeTextEditor) {
      uri = vscode.window.activeTextEditor.document.uri;
    } else {
      uri = undefined;
    }
  }
  return vscode.workspace.getConfiguration("php-noverify", uri);
}
