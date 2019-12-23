import * as vscode from 'vscode'
import { spawnSync } from 'child_process'
import commandExists from 'command-exists'
import path from 'path'

export const command = 'ocamlformat'

const getFullRange = (document: vscode.TextDocument) => {
    const firstLine = document.lineAt(0)
    const lastLine = document.lineAt(document.lineCount - 1)
    return new vscode.Range(0, firstLine.range.start.character, document.lineCount - 1, lastLine.range.end.character)
}

const format = (filename: string, text: string) => {
    console.log(filename, text)
    const config = vscode.workspace.getConfiguration('ocamlformat')
    const args = ['-', `--name=${path.basename(filename)}`]
    return spawnSync(command, args, { input: text, encoding: 'utf8', cwd: path.dirname(filename) })
}

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "ocamlformat" is now active!')

    context.subscriptions.push(
        vscode.commands.registerCommand('extension.ocamlformat', () => {
            const { activeTextEditor } = vscode.window
            if (!activeTextEditor || !commandExists.sync(command)) return

            const { document } = activeTextEditor
            const text = document.getText()
            const { stderr, stdout } = format(document.fileName, text)
            if (stderr) return console.error('err', stderr)
            console.log(text, stdout)

            const edit = new vscode.WorkspaceEdit()
            const range = getFullRange(document)
            edit.replace(document.uri, range, stdout)
            return vscode.workspace.applyEdit(edit)
        })
    )

    const formatter = {
        provideDocumentFormattingEdits: (
            document: vscode.TextDocument,
            options: vscode.FormattingOptions
        ): vscode.ProviderResult<vscode.TextEdit[]> =>
            new Promise((resolve, reject) => {
                const text = document.getText()
                console.log(commandExists.sync(command))
                if (!commandExists.sync(command)) return reject(new Error('command not in path'))
                const { stderr, stdout } = format(document.fileName, text)
                if (stderr) return reject(stderr)

                const range = getFullRange(document)
                return resolve([vscode.TextEdit.replace(range, stdout)])
            })
    }

    context.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider({ pattern: '**/*.ml' }, formatter))
    context.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider({ pattern: '**/*.mli' }, formatter))
}

export function deactivate() { }
