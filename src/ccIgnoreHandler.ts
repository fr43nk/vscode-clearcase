import { existsSync, readFileSync } from 'fs';
import ignore from 'ignore';
import { dirname, join } from 'path';
import { EventEmitter, Uri, workspace, WorkspaceFolder } from 'vscode';
import { Model, ModelHandler } from './model';

export class CCIgnoreHandler {
  private fileIgnores: FileIgnore[];
  private m_onFilterRefreshed: EventEmitter<void>;

  constructor(private m_fsWatch: ModelHandler) {
    this.m_onFilterRefreshed = new EventEmitter<void>();
    this.init();
  }

  get OnFilterRefreshed(): EventEmitter<void> {
    return this.m_onFilterRefreshed;
  }

  public init() {
    this.fileIgnores = [];
    workspace.workspaceFolders.forEach((folder: WorkspaceFolder) => {
      const l_m = this.m_fsWatch.addWatcher(join(folder.uri.fsPath, '.ccignore'));
      l_m.onWorkspaceChanged(this.refreshFilter, this);
      l_m.onWorkspaceCreated(this.refreshFilter, this);
      l_m.onWorkspaceDeleted(this.removeFilter, this);
      this.fileIgnores.push(new FileIgnore(folder.uri));
    });
  }

  public getFolderIgnore(path: Uri | string): FileIgnore | null {
    for (const fileIgnore of this.fileIgnores) {
      if (typeof path === 'string') {
        if (path.indexOf(fileIgnore.Path.fsPath) === 0 && fileIgnore.HasIgnore === true) {
          return fileIgnore;
        }
      } else {
        if (path.fsPath.indexOf(fileIgnore.Path.fsPath) === 0 && fileIgnore.HasIgnore === true) {
          return fileIgnore;
        }
      }
    }
    return null;
  }

  public refreshFilter(fileObj: Uri) {
    const dir = dirname(fileObj.fsPath);
    for (let i = 0; i < this.fileIgnores.length; i++) {
      if (this.fileIgnores[i].Path.fsPath === dir) {
        this.fileIgnores[i] = new FileIgnore(Uri.file(dir));
        this.m_onFilterRefreshed.fire();
        return;
      }
    }
    this.fileIgnores.push(new FileIgnore(Uri.file(dir)));
    this.m_onFilterRefreshed.fire();
  }

  public removeFilter(fileObj: Uri) {
    const dir = dirname(fileObj.fsPath);
    for (let i = 0; i < this.fileIgnores.length; i++) {
      if (this.fileIgnores[i].Path.fsPath === dir) {
        this.fileIgnores.splice(i, 1);
        this.m_onFilterRefreshed.fire();
        return;
      }
    }
  }
}

export class FileIgnore {
  private path: Uri;
  private hasIgnore: boolean = false;
  private ignore: any = null;
  constructor(path: Uri) {
    this.init(path);
  }

  public init(path: Uri) {
    this.ignore = ignore();
    this.path = path;
    const p = join(path.fsPath, '.ccignore');
    if (existsSync(p) === true) {
      this.hasIgnore = true;
      this.ignore.add(readFileSync(p).toString());
    }
  }

  public get Path(): Uri {
    return this.path;
  }

  public get Ignore(): any {
    return this.ignore;
  }

  public get HasIgnore(): boolean {
    return this.hasIgnore;
  }
}
