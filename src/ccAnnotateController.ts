'use strict';

import * as vscode from 'vscode';
import {CCConfigHandler} from './ccConfigHandler';
import {CCConfiguration} from './ccConfiguration';
import { CCScmProvider } from './ccScmProvider';

export class CCAnnotationController {
  private m_decorationType: vscode.TextEditorDecorationType;
  private m_isActive: boolean;
  private m_configuration: CCConfiguration;

  constructor(private cc: CCScmProvider,
              private editor: vscode.TextEditor,
              private context: vscode.ExtensionContext,
              private configHandler: CCConfigHandler) {
    this.m_isActive = false;
    vscode.window.onDidChangeActiveTextEditor(this.onActiveEditorChange, this, this.context.subscriptions);
    this.configHandler.onDidChangeConfiguration(this.onConfigurationChanged, this);
    const ro: vscode.DecorationRenderOptions = {
      isWholeLine: false,
      before: {
        margin: '0 1em 0 0'
      },
      after: {
        margin: '0 0 0 1em'
      }
    };
    this.m_decorationType = vscode.window.createTextEditorDecorationType(ro);
    this.m_configuration = this.configHandler.configuration;
  }

  public onActiveEditorChange(event: vscode.TextEditor) {
    if (event) {
      this.m_isActive = false;
      this.editor = event;
    }
  }

  public onConfigurationChanged() {
    this.m_configuration = this.configHandler.configuration;
  }

  public setAnnotationInText(annotationText: string) {
    let deco: vscode.DecorationOptions[] = [];
    let maxWidth: number = 0;
    if ( this.m_isActive === false ) {
      const textLines = annotationText.split(/[\n\r]+/);
      const textLineParts = textLines.map( l => {
        const parts = l.split(' | ');
        parts[0] = parts[0].replace(/\\/g, '/');
        if ( parts[0].length > maxWidth ) {
          maxWidth = parts[0].length;
        }
        return parts;
      });
      deco = this.getDecoration(textLineParts, maxWidth);
      this.m_isActive = true;
    } else {
      this.m_isActive = false;
    }
    this.editor.setDecorations(this.m_decorationType, deco);
  }

  public getDecoration(iLines: string[][], iMaxWidth: number): vscode.DecorationOptions[] {
    const max: number = 0;
    const deco: vscode.DecorationOptions[] = [];
    for ( let lineNr = 0; lineNr < iLines.length; lineNr++) {
      let line = iLines[lineNr][0].replace(/ /gi, '\u00A0');
      while ( line.length < iMaxWidth ) {
        line = line.concat('\u00A0');
      }
      deco.push(this.createLineDecoration(line, lineNr, 0, max));
    }
    return deco;
  }

  private createLineDecoration(iLinePart: string,
                               iLineNr: number,
                               iCharStart: number,
                               iWidth: number): vscode.DecorationOptions {
    const charLen = iLinePart.length;
    return {
      hoverMessage: '',
      range: vscode.window.activeTextEditor.document.validateRange(
        new vscode.Range(iLineNr, iCharStart, iLineNr, charLen)),
      renderOptions: {
        before: {
          color: this.m_configuration.AnnotationColor.Value,
          backgroundColor: this.m_configuration.AnnotationBackground.Value,
          contentText: iLinePart
        }
      }
    };
  }

  public dispose() {

  }
}
