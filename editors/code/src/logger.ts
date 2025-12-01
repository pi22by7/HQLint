import * as vscode from 'vscode';

/* eslint-disable @typescript-eslint/naming-convention */
export enum LogLevel {
    Debug = 0,
    Info = 1,
    Warn = 2,
    Error = 3
}
/* eslint-enable @typescript-eslint/naming-convention */

export class Logger {
    private outputChannel: vscode.OutputChannel;
    private minLevel: LogLevel;

    constructor(channelName: string = 'HQL') {
        this.outputChannel = vscode.window.createOutputChannel(channelName);
        this.minLevel = this.getConfiguredLogLevel();
    }

    private getConfiguredLogLevel(): LogLevel {
        const config = vscode.workspace.getConfiguration('hql');
        const level = config.get<string>('logLevel', 'info');

        switch (level.toLowerCase()) {
            case 'debug':
                return LogLevel.Debug;
            case 'info':
                return LogLevel.Info;
            case 'warn':
                return LogLevel.Warn;
            case 'error':
                return LogLevel.Error;
            default:
                return LogLevel.Info;
        }
    }

    private log(level: LogLevel, message: string, data?: any): void {
        if (level < this.minLevel) {
            return;
        }

        const timestamp = new Date().toISOString();
        const levelName = LogLevel[level];
        const logMessage = `[${timestamp}] [${levelName}] ${message}`;

        this.outputChannel.appendLine(logMessage);

        if (data !== undefined) {
            if (data instanceof Error) {
                this.outputChannel.appendLine(`  Error: ${data.message}`);
                if (data.stack) {
                    this.outputChannel.appendLine(`  Stack: ${data.stack}`);
                }
            } else if (typeof data === 'object') {
                try {
                    this.outputChannel.appendLine(`  Data: ${JSON.stringify(data, null, 2)}`);
                } catch (e) {
                    this.outputChannel.appendLine(`  Data: [Unable to stringify]`);
                }
            } else {
                this.outputChannel.appendLine(`  Data: ${data}`);
            }
        }
    }

    public debug(message: string, data?: any): void {
        this.log(LogLevel.Debug, message, data);
    }

    public info(message: string, data?: any): void {
        this.log(LogLevel.Info, message, data);
    }

    public warn(message: string, data?: any): void {
        this.log(LogLevel.Warn, message, data);
    }

    public error(message: string, error?: any): void {
        this.log(LogLevel.Error, message, error);
    }

    public show(): void {
        this.outputChannel.show();
    }

    public dispose(): void {
        this.outputChannel.dispose();
    }
}
