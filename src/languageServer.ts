import * as path from "path";
import * as vscode from "vscode";
import {
  HandleDiagnosticsSignature,
  LanguageClient,
  Middleware,
  ProvideCompletionItemsSignature,
  ProvideDocumentLinksSignature,
  RevealOutputChannelOn,
} from "vscode-languageclient";
import { getNoverifyConfig } from "./util";

import deepEqual = require("deep-equal");

interface LanguageServerConfig {
  serverName: string;
  path: string;
  enabled: boolean;
  phpStubsPath: string;
  extraArgs: string[];
  features: {
    diagnostics: boolean;
    documentLink: boolean;
  };
}

// Global variables used for management of the language client.
// They are global so that the server can be easily restarted with
// new configurations.
let languageClient: LanguageClient;
let languageServerDisposable: vscode.Disposable;
let latestConfig: LanguageServerConfig;
let serverOutputChannel: vscode.OutputChannel;

// startLanguageServer starts the language server (if enabled), returning
// true on success.
export async function registerLanguageFeatures(
  ctx: vscode.ExtensionContext
): Promise<boolean> {
  // Subscribe to notifications for changes to the configuration of the language server.
  ctx.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(e =>
      watchLanguageServerConfiguration(e)
    )
  );

  // Support a command to restart the language server, if it's enabled.
  ctx.subscriptions.push(
    vscode.commands.registerCommand(
      "php-noverify.languageserver.restart",
      () => {
        return startLanguageServer(ctx, parseLanguageServerConfig());
      }
    )
  );

  const config = parseLanguageServerConfig();
  if (!config.enabled) {
    return false;
  }
  // This function handles the case when the server isn't started yet,
  // so we can call it to start the language server.
  return startLanguageServer(ctx, config);
}

async function startLanguageServer(
  ctx: vscode.ExtensionContext,
  config: LanguageServerConfig
): Promise<boolean> {
  // If the client has already been started, make sure to clear existing
  // diagnostics and stop it.
  if (languageClient) {
    if (languageClient.diagnostics) {
      languageClient.diagnostics.clear();
    }
    await languageClient.stop();
    if (languageServerDisposable) {
      languageServerDisposable.dispose();
    }
  }

  // Check if we should recreate the language client. This may be necessary
  // if the user has changed settings in their config.
  if (!deepEqual(latestConfig, config)) {
    // Track the latest config used to start the language server.
    latestConfig = config;

    // If the user has not enabled or installed the language server, return.
    if (!config.enabled || !config.path) {
      return false;
    }
    buildLanguageClient(config);
  }

  languageServerDisposable = languageClient.start();
  ctx.subscriptions.push(languageServerDisposable);

  return true;
}

function buildLanguageClient(config: LanguageServerConfig) {
  // Reuse the same output channel for each instance of the server.
  if (!serverOutputChannel) {
    serverOutputChannel = vscode.window.createOutputChannel(config.serverName);
  }

  const args = [];
  if (config.extraArgs) {
    args.push(...config.extraArgs);
  }

  if (config.phpStubsPath) {
    args.push("-stubs-dir", config.phpStubsPath);
  }

  args.push("-lang-server");

  const command = config.path;

  languageClient = new LanguageClient(
    config.serverName,
    {
      command,
      args: args,
    },
    {
      initializationOptions: {},
      documentSelector: [
        { scheme: "file", language: "php" },
        { scheme: "untitled", language: "php" },
      ],
      uriConverters: {
        code2Protocol: uri => uri.toString(true),
        protocol2Code: str => {
          // Fix URI for windows path
          return vscode.Uri.parse(
            str.replace(/(file:\/\/)([a-zA-Z]:)/, "$1/$2")
          );
        },
      },
      synchronize: {
        configurationSection: "php-noverify",
        fileEvents: vscode.workspace.createFileSystemWatcher("**/*.php"),
      },
      diagnosticCollectionName: "noverify",
      progressOnInitialization: true,
      outputChannel: serverOutputChannel,
      revealOutputChannelOn: RevealOutputChannelOn.Never,
      middleware: getMiddleware(config),
    }
  );

  languageClient.outputChannel.appendLine(
    `Running command: ${command} ${args.join(" ")}`
  );

  languageClient.onReady().then(() => {
    const capabilities =
      languageClient.initializeResult &&
      languageClient.initializeResult.capabilities;
    if (!capabilities) {
      return vscode.window.showErrorMessage(
        "The language server is not able to serve any features at the moment."
      );
    }
  });
}

function watchLanguageServerConfiguration(e: vscode.ConfigurationChangeEvent) {
  if (!e.affectsConfiguration("php-noverify")) {
    return;
  }

  const config = parseLanguageServerConfig();
  let message: string | undefined;
  let button: string = "Restart";

  // If the user has disabled or enabled the language server.
  if (e.affectsConfiguration("php-noverify.useLanguageServer")) {
    if (config.enabled) {
      message = "Start NoVerify to enable the use of language server";
      button = "Start";
    } else {
      message = "Stop NoVerify to disable the use of language server";
      button = "Stop";
    }
  }

  if (
    e.affectsConfiguration("php-noverify.noverifyPath") ||
    e.affectsConfiguration("php-noverify.phpStubsPath") ||
    e.affectsConfiguration("php-noverify.noverifyExtraArgs")
  ) {
    message =
      "Restart NoVerify for the changes in language server settings to take effect";
  }

  // If there was a change in the configuration of the language server,
  // then ask the user to reload VS Code.
  if (message) {
    vscode.window.showInformationMessage(message, button).then(selected => {
      if (selected === button) {
        vscode.commands.executeCommand("php-noverify.languageserver.restart");
      }
    });
  }
}

export function parseLanguageServerConfig(): LanguageServerConfig {
  const noverifyConfig = getNoverifyConfig();

  let phpStubsPath = noverifyConfig["phpStubsPath"];
  if (phpStubsPath === null) {
    phpStubsPath = path.resolve(path.join(__dirname, "..", "stubs"));
  }

  return {
    serverName: "NoVerify Language Server",
    path: noverifyConfig["noverifyPath"],
    enabled: noverifyConfig["useLanguageServer"],
    phpStubsPath,
    extraArgs: noverifyConfig["noverifyExtraArgs"] || [],
    features: {
      // TODO: We should have configs that match these names.
      // Ultimately, we should have a centralized language server config rather than separate fields.
      diagnostics: noverifyConfig["features.diagnostics"],
      documentLink: noverifyConfig["features.documentLink"],
    },
  };
}

function getMiddleware(config: LanguageServerConfig): Middleware {
  return {
    handleDiagnostics: (
      uri: vscode.Uri,
      diagnostics: vscode.Diagnostic[],
      next: HandleDiagnosticsSignature
    ) => {
      if (!config.features.diagnostics) {
        return null;
      }
      return next(uri, diagnostics);
    },
    provideDocumentLinks: (
      document: vscode.TextDocument,
      token: vscode.CancellationToken,
      next: ProvideDocumentLinksSignature
    ) => {
      if (!config.features.documentLink) {
        return null;
      }
      return next(document, token);
    },
    provideCompletionItem: (
      document: vscode.TextDocument,
      position: vscode.Position,
      context: vscode.CompletionContext,
      token: vscode.CancellationToken,
      next: ProvideCompletionItemsSignature
    ) => {
      const editorParamHintsEnabled = vscode.workspace.getConfiguration(
        "editor.parameterHints",
        document.uri
      )["enabled"];
      const phpParamHintsEnabled = vscode.workspace.getConfiguration(
        "[php]",
        document.uri
      )["editor.parameterHints.enabled"];

      let paramHintsEnabled: boolean = false;
      if (typeof phpParamHintsEnabled === "undefined") {
        paramHintsEnabled = editorParamHintsEnabled;
      } else {
        paramHintsEnabled = phpParamHintsEnabled;
      }
      let cmd: vscode.Command;
      if (paramHintsEnabled) {
        cmd = {
          title: "triggerParameterHints",
          command: "editor.action.triggerParameterHints",
        };
      }

      function configureCommands(
        r: vscode.CompletionItem[] | vscode.CompletionList | null | undefined
      ): vscode.CompletionItem[] | vscode.CompletionList | null | undefined {
        if (r) {
          (Array.isArray(r) ? r : r.items).forEach(
            (i: vscode.CompletionItem) => {
              i.command = cmd;
            }
          );
        }
        return r;
      }
      const ret = next(document, position, context, token);

      const isThenable = <T>(
        obj: vscode.ProviderResult<T>
      ): obj is Thenable<T> => obj && (<any>obj)["then"];
      if (
        isThenable<
          vscode.CompletionItem[] | vscode.CompletionList | null | undefined
        >(ret)
      ) {
        return ret.then(configureCommands);
      }
      return configureCommands(ret);
    },
  };
}
