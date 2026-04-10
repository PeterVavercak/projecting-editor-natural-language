import { TreeDataProvider, TreeItem } from "vscode";
import { ToolNode } from "./toolNode";

export class ToolsProvider implements TreeDataProvider<ToolNode> {
  private readonly roots: ToolNode[];

  constructor() {
    this.roots = [
      new ToolNode(
        'group.Generating',
        'Generating',
        'group',
        [
          new ToolNode(
            'action.generateExplanations',
            'Generate Explanations',
            'action',
            [],
            'ProjectingNLEditor.writeNL'
          ),
          new ToolNode(
            'action.generateCodes',
            'Generate Code',
            'action',
            [],
            'ProjectingNLEditor.writeCode'
          ),
          new ToolNode(
            'action.generateRegions',
            'Generate Regions',
            'action',
            [],
            'ProjectingNLEditor.generateRegions'
          )
        ]
      ),

      new ToolNode(
        'group.display',
        'Display',
        'group',
        [
          new ToolNode(
            'action.ShowNL',
            'Show all explanations',
            'action',
            [],
            'ProjectingNLEditor.showNLRegions'
          ),
          new ToolNode(
            'action.showCodes',
            'Show codes',
            'action',
            [],
            'ProjectingNLEditor.showCodeRegions'
          )
        ]
      ),
    ];
  }

  getTreeItem(element: ToolNode): TreeItem {
    return element;
  }

  getChildren(element?: ToolNode): Thenable<ToolNode[]> {
    if (!element) {
      return Promise.resolve(this.roots);
    }
    return Promise.resolve(element.children);
  }
}