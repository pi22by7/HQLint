import * as path from 'path';
import * as vscode from 'vscode';
import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind,
    Executable
} from 'vscode-languageclient/node';

let client: LanguageClient;

export function activate(context: vscode.ExtensionContext) {
    // The server is a binary executable
    // For development, we assume it's built in target/debug/hql-ls
    // For production, it should be bundled or configured
    
    let serverPath = vscode.workspace.getConfiguration('hql').get<string>('server.path');
    
    if (!serverPath) {
         // Fallback to dev path or bundled path
         // This path resolution needs to be robust for different OS/environments
         // For now, assuming we are running in the monorepo structure
         serverPath = context.asAbsolutePath(path.join('..', '..', 'target', 'debug', 'hql-ls'));
    }

    const run: Executable = {
        command: serverPath,
        transport: TransportKind.stdio,
    };

    const serverOptions: ServerOptions = {
        run,
        debug: run,
    };

    const clientOptions: LanguageClientOptions = {
        documentSelector: [{ scheme: 'file', language: 'hql' }],
        synchronize: {
            fileEvents: vscode.workspace.createFileSystemWatcher('**/.clientrc')
        }
    };

    client = new LanguageClient(
        'hqlLanguageServer',
        'HQL Language Server',
        serverOptions,
        clientOptions
    );

    client.start();
}

export function deactivate(): Thenable<void> | undefined {
    if (!client) {
        return undefined;
    }
    return client.stop();
}