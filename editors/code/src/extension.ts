import * as path from 'path';
import * as fs from 'fs';
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
    let serverPath = vscode.workspace.getConfiguration('hql').get<string>('server.path');
    
    if (!serverPath) {
        // 1. Check for bundled binary (Production)
        const bundledPath = context.asAbsolutePath(path.join('server', 'hql-ls'));
        if (fs.existsSync(bundledPath)) {
            serverPath = bundledPath;
        } 
        // 2. Check for local cargo build (Development)
        else {
             const devPath = context.asAbsolutePath(path.join('..', '..', 'target', 'release', 'hql-ls'));
             if (fs.existsSync(devPath)) {
                 serverPath = devPath;
             } else {
                 // Fallback to debug build
                 serverPath = context.asAbsolutePath(path.join('..', '..', 'target', 'debug', 'hql-ls'));
             }
        }
    }
    
    // Ensure executable permissions on Linux/Mac
    if (serverPath && (process.platform === 'linux' || process.platform === 'darwin')) {
        try {
            fs.chmodSync(serverPath, '755');
        } catch (e) {
            // Ignore if we can't chmod (might already be executable or read-only fs)
            console.warn('Failed to chmod server binary:', e);
        }
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
        documentSelector: [
            { scheme: 'file', language: 'hql' },
            { scheme: 'untitled', language: 'hql' }
        ],
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