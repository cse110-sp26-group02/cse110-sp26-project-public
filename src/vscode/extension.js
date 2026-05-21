// imports
import * as vscode from 'vscode';

/* consts */
const T2_VIEW_CONTAINER_ID = 'aitActivitybarViewContainer';
const T2_VIEW_ID = 'aitView';
const T2_LAUNCH_COMMAND_ID = 'ait.launchUI';
const T2_PING_COMMAND_ID = 'ait.ping';

class T2SidebarProvider
{

    t2ExtensionUri;
    t2WebviewView;

    constructor(
        t2ExtensionUri
    )
    {

        this.t2ExtensionUri = t2ExtensionUri;
        this.t2WebviewView = undefined;

    }

    async resolveWebviewView(
        t2WebviewView
    )
    {
    
        this.t2WebviewView = t2WebviewView;
    
        t2WebviewView.webview.options = {
    
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(
                    this.t2ExtensionUri,
                    'src',
                    'webview'
                )
            ]
    
        };
    
        t2WebviewView.webview.html = await t2GetSidebarHtml(
            t2WebviewView.webview,
            this.t2ExtensionUri
        );
    
        t2WebviewView.webview.onDidReceiveMessage(
            (t2Message) =>
            {
    
                this.t2OnMessage(
                    t2Message
                );
    
            }
        );
    
    }

    t2OnMessage(
        t2Message
    )
    {

        if (t2Message.command === 'ping')
        {

            vscode.window.showInformationMessage(
                'AIT Sidebar UI is working.'
            );

        }

    }

    t2Reveal()
    {

        this.t2WebviewView?.show?.(
            false
        );

    }

}

let t2ProviderInstance;

/**
  * @human none
  *
  * @agent none
  * @automation none
  *
  * @file none
  * 
  * @date YYYY-MM-DD
  * @time HH:MM PST
  *
  * @since 0.0.1
  *
  * @duplicates none
  * @related none
  * @similar none
  *
  * @brief A brief summary.
  * 
  * @detail none
  * 
  * @edge none
  *
  * @calls none
  *
  * @declares none
  *
  * @listens none
  *
  * @param {string} param ...
  *
  * @returns {boolean} object ...
  *
  * @example none
  *
  * @todo none
 **/
export function activate(
    t2Context
)
{

    console.log(
        'AIT extension activated'
    );

    t2ProviderInstance = new T2SidebarProvider(
        t2Context.extensionUri
    );

    const t2ViewRegistration = vscode.window.registerWebviewViewProvider(
        T2_VIEW_ID,
        t2ProviderInstance
    );

    const t2LaunchCommand = vscode.commands.registerCommand(
        T2_LAUNCH_COMMAND_ID,
        async () =>
        {

            await vscode.commands.executeCommand(
                `workbench.view.extension.${T2_VIEW_CONTAINER_ID}`
            );

            await vscode.commands.executeCommand(
                `${T2_VIEW_ID}.focus`
            );

            t2ProviderInstance.t2Reveal();

        }
    );

    const t2PingCommand = vscode.commands.registerCommand(
        T2_PING_COMMAND_ID,
        t2Ping
    );

    t2Context.subscriptions.push(
        t2ViewRegistration,
        t2LaunchCommand,
        t2PingCommand
    );

}

function t2Ping()
{

    vscode.window.showInformationMessage(
        'AIT command is working.'
    );

}

function t2GetSidebarHtml()
{

    return `
<!DOCTYPE html>
<html>
<body>

    <h2>Agentic Issue Tracker</h2>

    <p>
        AIT sidebar loaded successfully.
    </p>

    <button id="t2PingButton">
        Test sidebar message
    </button>

    <script>
        const vscode = acquireVsCodeApi();

        document.getElementById('t2PingButton').addEventListener('click', () => {
            vscode.postMessage({
                command: 'ping'
            });
        });
    </script>

</body>
</html>
`;

}
