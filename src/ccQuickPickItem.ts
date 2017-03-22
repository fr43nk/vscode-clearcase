'use strict'

import * as vscode from 'vscode';

export class ccQuickPickItem implements vscode.QuickPickItem
{
	public label: string;
	public description: string;

	public constructor(iLabel, iDesc)
	{
		this.label = iLabel;
		this.description = iDesc;
	}
}