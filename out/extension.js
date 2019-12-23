"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = __importStar(require("vscode"));
const child_process_1 = require("child_process");
const command_exists_1 = __importDefault(require("command-exists"));
const path_1 = __importDefault(require("path"));
exports.command = 'ocamlformat';
const getFullRange = (document) => {
    const firstLine = document.lineAt(0);
    const lastLine = document.lineAt(document.lineCount - 1);
    return new vscode.Range(0, firstLine.range.start.character, document.lineCount - 1, lastLine.range.end.character);
};
const format = (filename, text) => {
    console.log(filename, text);
    const config = vscode.workspace.getConfiguration('ocamlformat');
    const args = ['-', `--name=${path_1.default.basename(filename)}`];
    return child_process_1.spawnSync(exports.command, args, { input: text, encoding: 'utf8', cwd: path_1.default.dirname(filename) });
};
function activate(context) {
    console.log('Congratulations, your extension "ocamlformat" is now active!');
    context.subscriptions.push(vscode.commands.registerCommand('extension.ocamlformat', () => {
        const { activeTextEditor } = vscode.window;
        if (!activeTextEditor || !command_exists_1.default.sync(exports.command))
            return;
        const { document } = activeTextEditor;
        const text = document.getText();
        const { stderr, stdout } = format(document.fileName, text);
        if (stderr)
            return console.error('err', stderr);
        console.log(text, stdout);
        const edit = new vscode.WorkspaceEdit();
        const range = getFullRange(document);
        edit.replace(document.uri, range, stdout);
        return vscode.workspace.applyEdit(edit);
    }));
    const formatter = {
        provideDocumentFormattingEdits: (document, options) => new Promise((resolve, reject) => {
            const text = document.getText();
            console.log(command_exists_1.default.sync(exports.command));
            if (!command_exists_1.default.sync(exports.command))
                return reject(new Error('command not in path'));
            const { stderr, stdout } = format(document.fileName, text);
            if (stderr)
                return reject(stderr);
            const range = getFullRange(document);
            return resolve([vscode.TextEdit.replace(range, stdout)]);
        })
    };
    context.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider({ pattern: '**/*.ml' }, formatter));
    context.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider({ pattern: '**/*.mli' }, formatter));
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map