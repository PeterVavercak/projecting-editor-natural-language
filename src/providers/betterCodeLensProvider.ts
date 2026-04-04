import { CancellationToken, CodeLens, CodeLensProvider, ProviderResult, Uri, TextDocument, TextEditor} from "vscode";
import ExtendedMap from "../extendedMap";
import { BetterFoldingRange } from "../types";
import BetterFoldingDecorator from "../decorators/betterFoldingDecorator";
import FoldingDecorator from "../decorators/foldingDecorator";


export default abstract class BetterCodeLensProvider implements CodeLensProvider {
    private documentToCodeLenses: ExtendedMap<Uri, Promise<CodeLens[]>>;

    constructor(){
        this.documentToCodeLenses = new ExtendedMap(async () => []);
          

    }

    provideCodeLenses(document: TextDocument): Promise<CodeLens[]> {
        return this.documentToCodeLenses.get(document.uri);
    }

    public updateRanges(editor: TextEditor, foldingDecorator:  FoldingDecorator) {
        this.documentToCodeLenses.set(editor.document.uri, this.calculateCodeLensesRanges(editor, foldingDecorator));
    }

    protected abstract calculateCodeLensesRanges(editor: TextEditor, foldingDecorator:  FoldingDecorator): Promise<CodeLens[]>;

    public restart() {
        this.documentToCodeLenses.clear();
    }

}