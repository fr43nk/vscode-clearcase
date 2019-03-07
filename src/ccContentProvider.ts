
import { Disposable, QuickDiffProvider, TextDocumentContentProvider, Uri, workspace } from 'vscode';
import { ClearCase } from './clearcase';
import { fromCcUri, toCcUri } from './uri';

export class CCContentProvider implements TextDocumentContentProvider, QuickDiffProvider {

  private m_ccHandler: ClearCase;
  private disposables: Disposable[] = [];

  constructor(private cc: ClearCase) {
    this.m_ccHandler = cc;
    this.disposables.push(
      workspace.registerTextDocumentContentProvider('cc', this),
      workspace.registerTextDocumentContentProvider('cc-orig', this)
    );
  }

  public async provideTextDocumentContent(uri: Uri): Promise<string> {

    if (uri.scheme === 'cc-orig') {
      uri = uri.with({ scheme: 'cc', path: uri.query });
    }

    const { path, version } = fromCcUri(uri);

    try {
      return await this.m_ccHandler.readFileAtVersion(path, version);
    } catch (err) {
      // no-op
    }

    return '';
  }

  public async provideOriginalResource(uri: Uri): Promise<Uri | undefined> {
    if (uri.scheme !== 'file') {
      return;
    }

    const current_version = await this.m_ccHandler.getVersionInformation(uri, false);
    const is_checked_out = current_version.match('\\b(CHECKEDOUT)\\b$');

    if (is_checked_out) {
      return toCcUri(uri, current_version.replace('CHECKEDOUT', 'LATEST'));
    }
    return;
  }

  public dispose(): void {
    this.disposables.forEach(d => d.dispose());
  }
}
