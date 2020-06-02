import * as vscode from "vscode";
import { registerLanguageFeatures } from "./languageServer";

// this method is called when your extension is activated
export function activate(context: vscode.ExtensionContext): void {
  registerLanguageFeatures(context);
}

// this method is called when your extension is deactivated
export function deactivate(): void {
  // Nothing
}
