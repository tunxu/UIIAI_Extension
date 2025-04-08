// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "uiiai" is now active!');

	const provider1 = new UIIAIViewProvider(context.extensionUri);
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	context.subscriptions.push(vscode.window.registerWebviewViewProvider(UIIAIViewProvider.viewType, provider1))
	};

class UIIAIViewProvider implements vscode.WebviewViewProvider {
	public static readonly viewType = 'uiiai.view';

	private _view?: vscode.WebviewView;
	private typingTimeout: NodeJS.Timeout | undefined;
	private currentStatus: 'typing' | 'idle' = 'idle';  // Store the current image state

	constructor(
		private readonly _extensionUri: vscode.Uri,
	) {}





	public resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext, token: vscode.CancellationToken){
		this._view = webviewView;
		webviewView.webview.options = {enableScripts: true, localResourceRoots: [this._extensionUri]};

		// Set initial image (idle image)
		this._setImageInWebview(webviewView, 'idle');
	
		vscode.workspace.onDidChangeTextDocument((event) => {
			this._onEditorContentChanged(webviewView, event);
		});

		webviewView.webview.html = this.getWebviewContent();
	}
	
	  
  // Method to handle editor content changes
  private _onEditorContentChanged(webviewView: vscode.WebviewView, event: vscode.TextDocumentChangeEvent) {
    // Clear the previous timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    if (this.currentStatus !== 'typing') {
      this._setImageInWebview(webviewView, 'typing');
      this.currentStatus = 'typing';  // Update current state to 'typing'
    }

    this.typingTimeout = setTimeout(() => {
      if (this.currentStatus !== 'idle') {
        this._setImageInWebview(webviewView, 'idle');
        this.currentStatus = 'idle';
      }
    }, 200); 
  }
	private _setImageInWebview(webviewView: vscode.WebviewView, status: 'typing' | 'idle') {
		const imageUri = this._getImageUri(status);
		// Send the updated image URI to the webview
		webviewView.webview.postMessage({ type: 'updateImage', imageUri: imageUri.toString() });
	}

  // Helper method to get the URI of an image based on typing or idle status
	private _getImageUri(status: 'typing' | 'idle'): vscode.Uri {
		let imagePath = '';
		switch (status) {
		case 'typing':
			imagePath = path.join(this._extensionUri.fsPath, 'media', 'typing_cat.gif');
			break;
		case 'idle':
			imagePath = path.join(this._extensionUri.fsPath, 'media', 'idle_cat.gif');
			break;
		}
		const imageUri = vscode.Uri.file(imagePath);
		return this._view?.webview.asWebviewUri(imageUri) ?? imageUri;
	}

	public getWebviewContent(): string {
		return `
		  <!DOCTYPE html>
		  <html lang="en">
		  <head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>UIIAI Webview</title>
		  </head>
		  <body>
			<img id="image" src="" alt="UIIAI Image"/>
			<script>
			  window.addEventListener('message', event => {
				const message = event.data;
				if (message.type === 'updateImage') {
				  document.getElementById('image').src = message.imageUri;
				}
			  });
			</script>
		  </body>
		  </html>
		`;
	  }

}

// This method is called when your extension is deactivated
export function deactivate() {}