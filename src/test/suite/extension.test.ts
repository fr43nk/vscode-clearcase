import * as assert from "assert";
import * as path from "path";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import { CCConfigHandler } from "../../ccConfigHandler";
import { CCScmProvider } from "../../ccScmProvider";
import { mkdirSync, rmdirSync, unlinkSync, writeFileSync } from "fs";
import { after, before, beforeEach } from "mocha";
import SuiteOutputChannel from "../mock/SuiteOutputChannel";
// import * as myExtension from '../../extension';

//const WS_ROOT = process.env["WS_ROOT"] ? process.env["WS_ROOT"] : "";
const TEST_HOME = process.env["HOME"] ? process.env["HOME"] : "-";
const TEST_USER = process.env["USER"] ? process.env["USER"] : "-";

suite("Extension Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");
  let extensionContext: vscode.ExtensionContext;
  let outputChannel: SuiteOutputChannel;
  let configHandler: CCConfigHandler;
  let provider: CCScmProvider;
  let testDir: string;

  before(async () => {
    await vscode.extensions.getExtension("vscode-clearcase")?.activate();
    /* eslint-disable */
    extensionContext = (global as any).testExtensionContext;
    /* eslint-enable */
    outputChannel = new SuiteOutputChannel("Clearcase SCM");

    testDir = path.join(__dirname, "testfiles");
    try {
      mkdirSync(testDir);
      console.log(`Directory ${testDir} created`);
    } catch (e) {
      return console.error(e);
    }
    writeFileSync(path.join(testDir, "simple01.txt"), "");
    writeFileSync(path.join(testDir, "simple02.txt"), "");
    writeFileSync(path.join(testDir, "simple03.txt"), "");
    writeFileSync(path.join(testDir, "simple04.txt"), "");
  });

  after(() => {
    unlinkSync(path.join(testDir, "simple01.txt"));
    unlinkSync(path.join(testDir, "simple02.txt"));
    unlinkSync(path.join(testDir, "simple03.txt"));
    unlinkSync(path.join(testDir, "simple04.txt"));
    rmdirSync(testDir);
  });

  beforeEach(async () => {
    configHandler = new CCConfigHandler();
    configHandler.configuration.executable.value = path.join(__dirname, "../../../src/test/", "bin/cleartool.sh");
    provider = new CCScmProvider(extensionContext, outputChannel, configHandler);
    await provider.init();
    outputChannel.clear();
  });

  test("Cleartool change executable", () => {
    assert.strictEqual(
      configHandler.configuration.executable.value,
      path.join(__dirname, "../../../src/test/", "bin/cleartool.sh")
    );
  });

  test("Cleartool checkin file", async () => {
    configHandler.configuration.useClearDlg.value = false;
    configHandler.configuration.checkinCommand.value = "-nc ${filename}";

    const file = vscode.Uri.parse(path.resolve(__dirname, "testfiles/simple01.txt"));
    await provider.clearCase?.checkinFile([file]);
    assert.strictEqual(outputChannel.getLine(0), `ci,-nc,${path.join(testDir, "simple01.txt")}\n`);
    assert.strictEqual(
      outputChannel.getLastLine(),
      `Checked in "${path.join(testDir, "simple01.txt")}" version "/main/dev_01/2".\n`
    );
  });

  test("Cleartool checkout file", async () => {
    configHandler.configuration.useClearDlg.value = false;
    configHandler.configuration.checkoutCommand.value = "-nc ${filename}";

    const file = vscode.Uri.parse(path.resolve(__dirname, "testfiles/simple01.txt"));
    await provider.clearCase?.checkoutFile([file]);
    assert.strictEqual(outputChannel.getLine(0), `co,-nc,${path.join(testDir, "simple01.txt")}\n`);
    assert.strictEqual(
      outputChannel.getLastLine(),
      `Checked out "${path.join(testDir, "simple01.txt")}" from version "/main/dev_01/1".\n`
    );
  });

  test("Cleartool undo checkout file (keep)", async () => {
    configHandler.configuration.useClearDlg.value = false;

    const file = vscode.Uri.parse(path.resolve(__dirname, "testfiles/simple01.txt"));
    await provider.clearCase?.undoCheckoutFile([file]);
    assert.strictEqual(outputChannel.getLine(0), `unco,-keep,${path.join(testDir, "simple01.txt")}\n`);
    assert.strictEqual(
      outputChannel.getLastLine(),
      `Checkout cancelled for "${path.join(testDir, "simple01.txt")}".\n`
    );
  });

  test("Cleartool undo checkout file (delete)", async () => {
    configHandler.configuration.useClearDlg.value = false;
    configHandler.configuration.uncoKeepFile.value = false;

    const file = vscode.Uri.parse(path.resolve(__dirname, "testfiles/simple01.txt"));
    await provider.clearCase?.undoCheckoutFile([file]);
    assert.strictEqual(outputChannel.getLine(0), `unco,-rm,${path.join(testDir, "simple01.txt")}\n`);
    assert.strictEqual(
      outputChannel.getLastLine(),
      `Checkout cancelled for "${path.join(testDir, "simple01.txt")}".\n`
    );
  });

  test("Cleartool checkout file already checked out", async () => {
    configHandler.configuration.useClearDlg.value = false;
    configHandler.configuration.checkoutCommand.value = "-nc ${filename}";

    const file = path.join(testDir, "simple04.txt");

    const fileUri = vscode.Uri.parse(file);
    await provider.clearCase?.checkoutFile([fileUri]);
    assert.strictEqual(outputChannel.getLine(0), `co,-nc,${file}\n`);
    assert.strictEqual(
      outputChannel.getLastLine(),
      `cleartool: Error: Element "${file}" is already checked out to view "myview".\n`
    );
  });

  test("Extension: Path names with environment variable", async () => {
    configHandler.configuration.tempDir.value = "${env:HOME}/tmp";
    assert.strictEqual(`${TEST_HOME}/tmp`, configHandler.configuration.tempDir.value);
  });

  test("Extension: Path names with multiple environment variables", async () => {
    configHandler.configuration.tempDir.value = "${env:HOME}/tmp/${env:USER}";
    assert.strictEqual(`${TEST_HOME}/tmp/${TEST_USER}`, configHandler.configuration.tempDir.value);
  });

  test("Extension: Path names with invalid variable 1", async () => {
    configHandler.configuration.tempDir.value = "${HOME}/tmp";
    assert.strictEqual('${HOME}/tmp', configHandler.configuration.tempDir.value);
  });

  test("Extension: Path names with invalid variable 2", async () => {
    configHandler.configuration.tempDir.value = "{HOME}/tmp";
    assert.strictEqual('{HOME}/tmp', configHandler.configuration.tempDir.value);
  });

  test("Extension: Path names with invalid variable 3", async () => {
    configHandler.configuration.tempDir.value = "{env:}/tmp";
    assert.strictEqual('{env:}/tmp', configHandler.configuration.tempDir.value);
  });

  test("Extension: Path names with invalid variable 4", async () => {
    configHandler.configuration.tempDir.value = "${env:}/tmp";
    assert.strictEqual('${env:}/tmp', configHandler.configuration.tempDir.value);
  });

  test("Extension: Path names with invalid variable 5", async () => {
    configHandler.configuration.tempDir.value = "${env:}/tmp/${env:USER}";
    assert.strictEqual('${env:}/tmp' + `/${TEST_USER}`, configHandler.configuration.tempDir.value);
  });

});
