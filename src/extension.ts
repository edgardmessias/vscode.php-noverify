import * as vscode from "vscode";
import * as path from "path";
import {
  LanguageClient,
  LanguageClientOptions,
  RevealOutputChannelOn,
} from "vscode-languageclient";

// this method is called when your extension is activated
export function activate(context: vscode.ExtensionContext): void {
  const clientOptions: LanguageClientOptions = {
    documentSelector: [
      { scheme: "file", language: "php" },
      { scheme: "untitled", language: "php" },
    ],
    uriConverters: {
      code2Protocol: uri => uri.toString(true),
      protocol2Code: str => {
        // Fix URI for windows path
        return vscode.Uri.parse(str.replace(/(file:\/\/)([a-zA-Z]:)/, "$1/$2"));
      },
    },
    synchronize: {
      configurationSection: "php-noverify",
      fileEvents: vscode.workspace.createFileSystemWatcher("**/*.php"),
    },
    diagnosticCollectionName: "noverify",
    revealOutputChannelOn: RevealOutputChannelOn.Error,
    progressOnInitialization: true,
  };

  const configSection = vscode.workspace.getConfiguration("php-noverify");

  const command = configSection.get<string>("noverifyPath", "noverify");
  let stubsPath = configSection.get<string>("phpStubsPath");
  const extraArgs = configSection.get<string[]>("noverifyExtraArgs", []);

  const args = [];
  if (extraArgs) {
    args.push(...extraArgs);
  }

  if (stubsPath === null) {
    stubsPath = path.resolve(path.join(__dirname, "..", "stubs"));
  }
  if (stubsPath) {
    args.push("-stubs-dir", stubsPath);
  }

  args.push("-lang-server");

  const client = new LanguageClient(
    "NoVerify Language Server",
    {
      command,
      args,
    },
    clientOptions
  );

  client.outputChannel.appendLine(
    `Running command: ${command} ${args.join(" ")}`
  );

  client.registerProposedFeatures();

  context.subscriptions.push(client.start());
}

// this method is called when your extension is deactivated
export function deactivate(): void {
  // Nothing
}
