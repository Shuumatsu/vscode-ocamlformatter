import * as vscode from 'vscode'
import { spawnSync } from 'child_process'

export const command = 'ocamlformat'

const getFullRange = (document: vscode.TextDocument) => {
    const firstLine = document.lineAt(0)
    const lastLine = document.lineAt(document.lineCount - 1)
    return new vscode.Range(0, firstLine.range.start.character, document.lineCount - 1, lastLine.range.end.character)
}

const format = (filename: string, text: string) => {
    const config = vscode.workspace.getConfiguration('ocamlformat')
    const args = ['-', `--name=${filename}`]
    return spawnSync(command, args, { input: text, encoding: 'utf8' })
}

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "ocamlformat" is now active!')

    context.subscriptions.push(
        vscode.commands.registerCommand('extension.ocamlformat', () => {
            const { activeTextEditor } = vscode.window

            if (!activeTextEditor) return

            const { document } = activeTextEditor
            const text = document.getText()
            const { stderr, stdout } = format(document.fileName, text)
            if (stderr) return console.error('err', stderr)

            const edit = new vscode.WorkspaceEdit()
            const range = getFullRange(document)
            edit.replace(document.uri, range, stdout)
            console.log(text, stdout)
            return vscode.workspace.applyEdit(edit)
        })
    )

    const formatter = vscode.languages.registerDocumentFormattingEditProvider(
        { pattern: '**/*.ml[i]' },
        {
            provideDocumentFormattingEdits: (
                document: vscode.TextDocument,
                options: vscode.FormattingOptions
            ): vscode.ProviderResult<vscode.TextEdit[]> =>
                new Promise((resolve, reject) => {
                    const text = document.getText()
                    const { stderr, stdout } = format(document.fileName, text)
                    if (stderr) return reject(stderr)

                    const range = getFullRange(document)
                    return resolve([vscode.TextEdit.replace(range, stdout)])
                })
        }
    )
    context.subscriptions.push(formatter)
}

export function deactivate() {}
