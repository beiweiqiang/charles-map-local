import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as mkdirp from 'mkdirp';
import * as rimraf from 'rimraf';

//#region Utilities

// 可以通过在 key 后面加版本号来控制用户本地 key 不与旧 key 冲突
const CHOOSE_FILES = 'CHOOSE_FILES';
const KEY_LOCAL_PATH = 'LAST_CHOOSE_LOCAL_PATH';
namespace _ {

	function handleResult<T>(resolve: (result: T) => void, reject: (error: Error) => void, error: Error | null | undefined, result: T): void {
		if (error) {
			reject(massageError(error));
		} else {
			resolve(result);
		}
	}

	function massageError(error: Error & { code?: string }): Error {
		if (error.code === 'ENOENT') {
			return vscode.FileSystemError.FileNotFound();
		}

		if (error.code === 'EISDIR') {
			return vscode.FileSystemError.FileIsADirectory();
		}

		if (error.code === 'EEXIST') {
			return vscode.FileSystemError.FileExists();
		}

		if (error.code === 'EPERM' || error.code === 'EACCESS') {
			return vscode.FileSystemError.NoPermissions();
		}

		return error;
	}

	export function checkCancellation(token: vscode.CancellationToken): void {
		if (token.isCancellationRequested) {
			throw new Error('Operation cancelled');
		}
	}

	export function normalizeNFC(items: string): string;
	export function normalizeNFC(items: string[]): string[];
	export function normalizeNFC(items: string | string[]): string | string[] {
		if (process.platform !== 'darwin') {
			return items;
		}

		if (Array.isArray(items)) {
			return items.map(item => item.normalize('NFC'));
		}

		return items.normalize('NFC');
	}

	export function readdir(path: string): Promise<string[]> {
		return new Promise<string[]>((resolve, reject) => {
			fs.readdir(path, (error, children) => handleResult(resolve, reject, error, normalizeNFC(children)));
		});
	}

	export function stat(path: string): Promise<fs.Stats> {
		return new Promise<fs.Stats>((resolve, reject) => {
			fs.stat(path, (error, stat) => handleResult(resolve, reject, error, stat));
		});
	}

	export function readfile(path: string): Promise<Buffer> {
		return new Promise<Buffer>((resolve, reject) => {
			fs.readFile(path, (error, buffer) => handleResult(resolve, reject, error, buffer));
		});
	}

	export function writefile(path: string, content: Buffer): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			fs.writeFile(path, content, error => handleResult(resolve, reject, error, void 0));
		});
	}

	export function exists(path: string): Promise<boolean> {
		return new Promise<boolean>((resolve, reject) => {
			fs.exists(path, exists => handleResult(resolve, reject, null, exists));
		});
	}

	export function rmrf(path: string): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			rimraf(path, error => handleResult(resolve, reject, error, void 0));
		});
	}

	export function mkdir(path: string): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			mkdirp(path, error => handleResult(resolve, reject, error, void 0));
		});
	}

	export function rename(oldPath: string, newPath: string): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			fs.rename(oldPath, newPath, error => handleResult(resolve, reject, error, void 0));
		});
	}

	export function unlink(path: string): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			fs.unlink(path, error => handleResult(resolve, reject, error, void 0));
		});
	}
}

export class FileStat implements vscode.FileStat {

	constructor(private fsStat: fs.Stats) { }

	get type(): vscode.FileType {
		return this.fsStat.isFile() ? vscode.FileType.File : this.fsStat.isDirectory() ? vscode.FileType.Directory : this.fsStat.isSymbolicLink() ? vscode.FileType.SymbolicLink : vscode.FileType.Unknown;
	}

	get isFile(): boolean | undefined {
		return this.fsStat.isFile();
	}

	get isDirectory(): boolean | undefined {
		return this.fsStat.isDirectory();
	}

	get isSymbolicLink(): boolean | undefined {
		return this.fsStat.isSymbolicLink();
	}

	get size(): number {
		return this.fsStat.size;
	}

	get ctime(): number {
		return this.fsStat.ctime.getTime();
	}

	get mtime(): number {
		return this.fsStat.mtime.getTime();
	}
}

interface Entry {
	uri: vscode.Uri;
	type: vscode.FileType;
}

//#endregion

export class FileSystemProvider implements vscode.TreeDataProvider<Entry>, vscode.FileSystemProvider {

	private _onDidChangeFile: vscode.EventEmitter<vscode.FileChangeEvent[]>;

	private _onDidChangeTreeData: vscode.EventEmitter<Entry | undefined | void> = new vscode.EventEmitter<Entry | undefined | void>();

	readonly onDidChangeTreeData: vscode.Event<Entry | undefined | void> = this._onDidChangeTreeData.event;

	private _entry: Entry;
	private _context: vscode.ExtensionContext;
	private _choose_files: string[];

	constructor(entry: Entry, context: vscode.ExtensionContext) {
		this._onDidChangeFile = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
		this._entry = entry;
		this._context = context;

		const chooseFilesString: string | undefined = context.globalState.get(CHOOSE_FILES);
		if (chooseFilesString) {
			try {
				this._choose_files = JSON.parse(chooseFilesString);
			} catch(e) {
				console.error(e);
				this._choose_files = [];
			}
		} else {
			this._choose_files = [];
		}
	}

	updateChooseFilesStorage(newUri: vscode.Uri) {
		if (this._choose_files.findIndex(i => i === newUri.fsPath) > -1) {
			return;
		}

		const dirPath = path.parse(newUri.fsPath).dir;
		const idx = this._choose_files.findIndex(i => i.startsWith(dirPath));

		if (idx > -1) {
			this._choose_files.splice(idx, 1, newUri.fsPath);
		} else {
			this._choose_files.push(newUri.fsPath);
		}

		this._context.globalState.update(CHOOSE_FILES, JSON.stringify(this._choose_files));
	}

	get onDidChangeFile(): vscode.Event<vscode.FileChangeEvent[]> {
		return this._onDidChangeFile.event;
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	watch(uri: vscode.Uri, options: { recursive: boolean; excludes: string[]; }): vscode.Disposable {
		const watcher = fs.watch(uri.fsPath, { recursive: options.recursive }, async (event: string, filename: string | Buffer) => {
			const filepath = path.join(uri.fsPath, _.normalizeNFC(filename.toString()));

			// TODO support excludes (using minimatch library?)

			this._onDidChangeFile.fire([{
				type: event === 'change' ? vscode.FileChangeType.Changed : await _.exists(filepath) ? vscode.FileChangeType.Created : vscode.FileChangeType.Deleted,
				uri: uri.with({ path: filepath })
			} as vscode.FileChangeEvent]);

			this._onDidChangeTreeData.fire();
		});

		return { dispose: () => watcher.close() };
	}

	stat(uri: vscode.Uri): vscode.FileStat | Thenable<vscode.FileStat> {
		return this._stat(uri.fsPath);
	}

	async _stat(path: string): Promise<vscode.FileStat> {
		return new FileStat(await _.stat(path));
	}

	readDirectory(uri: vscode.Uri): [string, vscode.FileType][] | Thenable<[string, vscode.FileType][]> {
		return this._readDirectory(uri);
	}

	async _readDirectory(uri: vscode.Uri): Promise<[string, vscode.FileType][]> {
		const children = await _.readdir(uri.fsPath);

		const result: [string, vscode.FileType][] = [];
		for (let i = 0; i < children.length; i++) {
			const child = children[i];
			const stat = await this._stat(path.join(uri.fsPath, child));
			result.push([child, stat.type]);
		}

		return Promise.resolve(result);
	}

	createDirectory(uri: vscode.Uri): void | Thenable<void> {
		return _.mkdir(uri.fsPath);
	}

	readFile(uri: vscode.Uri): Uint8Array | Thenable<Uint8Array> {
		return _.readfile(uri.fsPath);
	}

	writeFile(uri: vscode.Uri, content: Uint8Array, options: { create: boolean; overwrite: boolean; }): void | Thenable<void> {
		return this._writeFile(uri, content, options);
	}

	async _writeFile(uri: vscode.Uri, content: Uint8Array, options: { create: boolean; overwrite: boolean; }): Promise<void> {
		const exists = await _.exists(uri.fsPath);
		if (!exists) {
			if (!options.create) {
				throw vscode.FileSystemError.FileNotFound();
			}

			await _.mkdir(path.dirname(uri.fsPath));
		} else {
			if (!options.overwrite) {
				throw vscode.FileSystemError.FileExists();
			}
		}

		return _.writefile(uri.fsPath, content as Buffer);
	}

	delete(uri: vscode.Uri, options: { recursive: boolean; }): void | Thenable<void> {
		if (options.recursive) {
			return _.rmrf(uri.fsPath);
		}

		return _.unlink(uri.fsPath);
	}

	rename(oldUri: vscode.Uri, newUri: vscode.Uri, options: { overwrite: boolean; }): void | Thenable<void> {
		return this._rename(oldUri, newUri, options);
	}

	async _rename(oldUri: vscode.Uri, newUri: vscode.Uri, options: { overwrite: boolean; }): Promise<void> {
		const exists = await _.exists(newUri.fsPath);
		if (exists) {
			if (!options.overwrite) {
				throw vscode.FileSystemError.FileExists();
			} else {
				await _.rmrf(newUri.fsPath);
			}
		}

		const parentExists = await _.exists(path.dirname(newUri.fsPath));
		if (!parentExists) {
			await _.mkdir(path.dirname(newUri.fsPath));
		}

		return _.rename(oldUri.fsPath, newUri.fsPath);
	}

	// tree data provider ---------------

	async getChildren(element?: Entry): Promise<Entry[]> {
		if (element) {
			const children = await this.readDirectory(element.uri);
			return children.map(([name, type]) => ({
				uri: vscode.Uri.file(path.join(element.uri.fsPath, name)),
				type
			}));
		}

		if (this._entry) {
			const children = await this.readDirectory(this._entry.uri);
			children.sort((a, b) => {
				if (a[1] === b[1]) {
					return a[0].localeCompare(b[0]);
				}
				return a[1] === vscode.FileType.Directory ? -1 : 1;
			});
			return children.map(([name, type]) => ({ uri: vscode.Uri.file(path.join(this._entry.uri.fsPath, name)), type }));
		}

		return [];
	}

	getTreeItem(element: Entry): vscode.TreeItem {
		const treeItem = new vscode.TreeItem(element.uri, element.type === vscode.FileType.Directory ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None);
		if (element.type === vscode.FileType.File) {
			treeItem.command = {
				command: 'fileExplorer.openFile',
				title: "Open File",
				arguments: [element.uri],
			};
			treeItem.contextValue = 'file';

			if (this._choose_files?.findIndex(i => i === element.uri.fsPath) > -1) {
				treeItem.description = '✔️';
			}
		}
		if (element.type === vscode.FileType.Directory) {
			treeItem.contextValue = 'dir';
		}
		return treeItem;
	}
}

export class FileExplorer {
	private _uri: vscode.Uri | undefined;
	private _provider: FileSystemProvider | undefined;

	private refreshProvider(context: vscode.ExtensionContext, uri: vscode.Uri): void {
		this._uri = uri;
		this._provider = new FileSystemProvider({
			uri: this._uri,
			type: vscode.FileType.Directory
		}, context);

		context.subscriptions.push(vscode.window.createTreeView('fileExplorer', {
			treeDataProvider: this._provider
		}));

		this._provider?.watch(this._uri, { recursive: true, excludes: [] });
	}

	constructor(context: vscode.ExtensionContext) {
		// TODO clear
		// context.globalState.update(KEY_LOCAL_PATH, '');
		// return;

		const lastUriPath: string | undefined = context.globalState.get(KEY_LOCAL_PATH);
		if (lastUriPath) {
			this.refreshProvider(context, vscode.Uri.parse(lastUriPath));
			vscode.commands.registerCommand('fileExplorer.refresh', (entry) => this._provider?.refresh());
		} else {
			vscode.window.showOpenDialog({
				canSelectFolders: true
			}).then((uris: vscode.Uri[] | undefined) => {
				if (uris) {
					this.refreshProvider(context, uris[0]);
					vscode.commands.registerCommand('fileExplorer.refresh', (entry) => this._provider?.refresh());

					context.globalState.update(KEY_LOCAL_PATH, uris[0].path);
				}
			})
		}

		vscode.commands.registerCommand('fileExplorer.openFile', this.openResource.bind(this));
		vscode.commands.registerCommand('fileExplorer.replaceIndex', this.replaceIndex.bind(this));
		vscode.commands.registerCommand('fileExplorer.addFile', this.addFile.bind(this));
		vscode.commands.registerCommand('fileExplorer.addDir', this.addDir.bind(this));
		vscode.commands.registerCommand('fileExplorer.deleteFile', this.delete.bind(this));
		vscode.commands.registerCommand('fileExplorer.rename', this.rename.bind(this));
		vscode.commands.registerCommand('fileExplorer.deleteDir', this.delete.bind(this));
		vscode.commands.registerCommand('fileExplorer.pickFolder', this.pickFolder.bind(this, context));
	}

	private pickFolder(context: vscode.ExtensionContext):void {
		vscode.window.showOpenDialog({
			canSelectFolders: true
		}).then((uris: vscode.Uri[] | undefined) => {
			if (uris) {
				const uri = uris[0];

				this.refreshProvider(context, uri);
				context.globalState.update(KEY_LOCAL_PATH, uri.path);
			}
		});
	}

	private delete(entry: Entry): void {
		this._provider?.delete(entry.uri, { recursive: true });
	}

	private rename(entry: Entry): void {
		const p = path.parse(entry.uri.fsPath);

		vscode.window.showInputBox({
			value: p.base
		}).then(text => {
			if (text === undefined) { return; }

			const newUri = vscode.Uri.file(path.join(p.dir, text));
			vscode.workspace.fs.rename(entry.uri, newUri, { overwrite: true });
		});
	}

	private addDir(entry: Entry | undefined): void {
		vscode.window.showInputBox({ placeHolder: 'folder name' }).then(text => {
			if (text === undefined) { return; }

			let u: vscode.Uri | undefined = this._uri;
			if (entry) u = entry.uri;

			const newUri = vscode.Uri.file(path.join(u!.fsPath, text));
			(<Thenable<void>> this._provider?.createDirectory(newUri)).then(undefined, err => {
				console.log('fileExplorer.ts line:402 ->', err);
			});
		});
	}

	private addFile(entry: Entry | undefined): void {
		vscode.window.showInputBox({ placeHolder: 'file name' }).then(text => {
			if (text === undefined) { return; }

			let u: vscode.Uri | undefined = this._uri;
			if (entry) u = entry.uri;

			const newUri = vscode.Uri.file(path.join(u!.fsPath, text));
			this._provider?.writeFile(newUri, Buffer.from(''), { create: true, overwrite: true });
		})
		.then(undefined, err => {
			console.log('fileExplorer.ts line:415 ->', err);
		});
	}

	private openResource(uri: vscode.Uri): void {
		vscode.window.showTextDocument(uri);
	}

	private replaceIndex(entry: Entry): void {
		const pathParse = path.parse(entry.uri.fsPath);
		const newUri = vscode.Uri.file(path.join(pathParse.dir, 'index.json'));
		vscode.workspace.fs.copy(entry.uri, newUri, { overwrite: true });

		this._provider?.updateChooseFilesStorage(entry.uri);
	}
}