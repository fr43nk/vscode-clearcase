'use strict';

import * as vscode from 'vscode';
import {CCAnnotateLens} from './ccAnnotateLens';
import {CCConfigHandler} from './ccConfigHandler';
import { CCScmProvider } from './ccScmProvider';

export class CCCodeLensProvider implements vscode.CodeLensProvider {
  public static selector = {
    scheme: 'file'
  };

  public constructor(private m_context: vscode.ExtensionContext,
                     private m_cfg: CCConfigHandler,
                     private m_provider: CCScmProvider) {
  }

  public async provideCodeLenses(document: vscode.TextDocument,
                                 token: vscode.CancellationToken): Promise<vscode.CodeLens[]> {
    if ( !this.m_cfg.configuration.ShowAnnotationCodeLens.Value ) {
      return [];
    }

    const l_lenses: vscode.CodeLens[] = [];
    let l_isCcO: boolean;
    try {
      l_isCcO = await this.m_provider.ClearCase.isClearcaseObject(document.uri);
    } catch (error) {
      l_isCcO = error;
    }
    if ( document !== undefined && l_isCcO === true ) {
      l_lenses.push(new CCAnnotateLens(document, new vscode.Range(0, 0, 0, 1)));
    }
    return l_lenses;
  }

  public resolveCodeLens(codeLens: vscode.CodeLens, token: vscode.CancellationToken): Thenable<vscode.CodeLens> {
    if ( codeLens instanceof CCAnnotateLens ) {
      return this.ccAnnotationCommand(codeLens, token);
    }

    return Promise.reject<vscode.CodeLens>(undefined);
  }

  private ccAnnotationCommand(iLens: CCAnnotateLens, iToken: vscode.CancellationToken) {
    iLens.command = {
      title: 'Toggle annotations',
      command: 'extension.ccAnnotate',
      arguments: [iLens.document.uri]
    };
    return Promise.resolve(iLens);
  }
}
