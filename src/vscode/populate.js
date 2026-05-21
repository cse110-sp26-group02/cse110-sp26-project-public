// imports
import * as vscode from 'vscode';

async function t2GetSidebarHtml(
    t2Webview,
    t2ExtensionUri
)
{

    const t2HtmlFileUri = vscode.Uri.joinPath(
        t2ExtensionUri,
        'src',
        'webview',
        'sidebar.html'
    );

    const t2HtmlBytes = await vscode.workspace.fs.readFile(
        t2HtmlFileUri
    );

    let t2Html = new TextDecoder().decode(
        t2HtmlBytes
    );

    const t2CssUri = t2Webview.asWebviewUri(
        vscode.Uri.joinPath(
            t2ExtensionUri,
            'src',
            'webview',
            'sidebar.css'
        )
    );

    const t2JsUri = t2Webview.asWebviewUri(
        vscode.Uri.joinPath(
            t2ExtensionUri,
            'src',
            'webview',
            'sidebar.js'
        )
    );

    t2Html = t2Html
        .replaceAll(
            '${t2CssUri}',
            String(
                t2CssUri
            )
        )
        .replaceAll(
            '${t2JsUri}',
            String(
                t2JsUri
            )
        );

    return t2Html;

}
