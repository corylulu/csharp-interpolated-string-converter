import * as vscode from "vscode";

type QuoteChar = `$"` | `"`;
type QuoteType = "single" |"double" | "both";

export function activate(context: vscode.ExtensionContext) {
  vscode.workspace.onDidChangeTextDocument(async (e) => {
    let configuration = vscode.workspace.getConfiguration();
    let quoteType = configuration.get<QuoteType>(
      "template-string-converter.quoteType"
    );
    let enabled = configuration.get<{}>("template-string-converter.enabled");
    let changes = e.contentChanges[0];
    let validLanguages = configuration.get<string[]>(
      "template-string-converter.validLanguages"
    );
    if (
      enabled &&
      quoteType &&
      changes &&
      validLanguages?.includes(e.document.languageId)
    ) {
      try {
        let lineNumber = changes.range.start.line;
        let currentChar = changes.range.start.character;
        let lineText = e.document.lineAt(lineNumber).text;

        let startPosition = new vscode.Position(lineNumber, currentChar - 1);
        let endPosition = new vscode.Position(lineNumber, currentChar);

        let startQuoteIndex = getStartQuote(
          lineText.substring(0, currentChar),
          `"`
        );
        let endQuoteIndex =
          getEndQuote(
            lineText.substring(currentChar + 1, lineText.length),
            `"`
          ) +
          currentChar +
          1;

        let openingQuotePosition = new vscode.Position(
          lineNumber,
          startQuoteIndex
        );
        let endQuotePosition = new vscode.Position(lineNumber, endQuoteIndex);

        let priorChar = e.document.getText(
          new vscode.Range(startPosition, endPosition)
        );
        let nextChar = e.document.getText(
          new vscode.Range(
            startPosition.translate(undefined, 2),
            endPosition.translate(undefined, 2)
          )
        );
        if (
          notAComment(lineText, currentChar, startQuoteIndex, endQuoteIndex) &&
          !withinInterpolater(lineText, currentChar) &&
          lineText.charAt(startQuoteIndex) === lineText.charAt(endQuoteIndex)
        ) {
          if (changes.text === "{" && priorChar === "$") {
            let edit = new vscode.WorkspaceEdit();
            edit.replace(
              e.document.uri,
              new vscode.Range(
                openingQuotePosition,
                openingQuotePosition.translate(undefined, 1)
              ),
              "$\""
            );
            edit.replace(
              e.document.uri,
              new vscode.Range(
                new vscode.Position(lineNumber, currentChar - 1),
                new vscode.Position(lineNumber, currentChar)
              ),
              ""
            );
            edit.insert(
              e.document.uri,
              endPosition.translate(undefined, 1),
              "}"
            );
            edit.replace(
              e.document.uri,
              new vscode.Range(
                endQuotePosition,
                endQuotePosition.translate(undefined, 1)
              ),
              "\""
            );
            await vscode.workspace.applyEdit(edit);
            if (vscode.window.activeTextEditor) {
              vscode.window.activeTextEditor.selection = new vscode.Selection(
                lineNumber,
                currentChar + 1,
                lineNumber,
                currentChar + 1
              );
            }
          } else if (changes.text === "$" && nextChar === "{") {
            let edit = new vscode.WorkspaceEdit();
            edit.replace(
              e.document.uri,
              new vscode.Range(
                openingQuotePosition,
                openingQuotePosition.translate(undefined, 1)
              ),
              "$\""
            );
            edit.replace(
              e.document.uri,
              new vscode.Range(
                new vscode.Position(lineNumber, currentChar),
                new vscode.Position(lineNumber, currentChar + 1)
              ),
              ""
            );
            edit.insert(
              e.document.uri,
              endPosition.translate(undefined, 2),
              "}"
            );
            await vscode.workspace.applyEdit(edit);
            if (vscode.window.activeTextEditor) {
              vscode.window.activeTextEditor.selection = new vscode.Selection(
                lineNumber,
                currentChar + 2,
                lineNumber,
                currentChar + 2
              );
            }
          }
        }
        else if (
          notAComment(lineText, currentChar, startQuoteIndex, endQuoteIndex) &&
          withinInterpolater(lineText, currentChar) &&
          lineText.charAt(startQuoteIndex) === lineText.charAt(endQuoteIndex)
        ) {
          if (changes.text === "}" && nextChar === "}") {
            var m = lastBracketOpen.exec(lineText.substring(0, currentChar));
            if (m && lineText[m.index - 1] !== "{") {
              let edit = new vscode.WorkspaceEdit();
              
              edit.replace(
                e.document.uri,
                new vscode.Range(
                  new vscode.Position(lineNumber, currentChar),
                  new vscode.Position(lineNumber, currentChar + 1)
                ),
                ""
              );
              await vscode.workspace.applyEdit(edit);
              if (vscode.window.activeTextEditor) {
                vscode.window.activeTextEditor.selection = new vscode.Selection(
                  lineNumber,
                  currentChar + 1,
                  lineNumber,
                  currentChar + 1
                );
              }
            }
          }
        }
      } catch (e) {}
    }
  });
}

let notAComment = (
  line: string,
  charIndex: number,
  startQuoteIndex: number,
  endquoteIndex: number
) => {
  if (line.substring(0, charIndex).includes("//")) {
    return (
      line.substring(0, charIndex).indexOf("//") > startQuoteIndex &&
      line.substring(0, charIndex).indexOf("//") < endquoteIndex
    );
  } else {
    return true;
  }
};

let withinInterpolater = (line: string, currentCharIndex: number) => {
  
  var m = startQuote.exec(line.substring(0, currentCharIndex).toString());
  return (
    m && line[m.index - 1] === "$" &&
    //line.substring(0, currentCharIndex).includes("$\"") &&
    line.substring(currentCharIndex + 1, line.length).includes("\"")
  );
};

let lastBracketOpen = new RegExp(/\{(?=[^\{]*$)/);
let startQuote = new RegExp(/(?<!\\)(?:\\{2})*"(?=[^"]*$)/);
let endQuote = new RegExp(/(?<!\\)(?:\\{2})*"/);
let getStartQuote = (line: string, quoteChar: QuoteChar): number => {
    var m = startQuote.exec(line.toString());
    if(m) {
      return m.index;
    }
    else {
      return -1;
    }
};

let getEndQuote = (line: string, quoteChar: QuoteChar): number => {
  var m = endQuote.exec(line.toString());
    if(m) {
      return m.index;
    }
    else {
      return -1;
    }
};

export function deactivate() {}
