import { TreeDataProvider, TreeItem } from "vscode";
import { ToolNode } from "../utils/classes/toolNode";
import { CREATE_GEN_CODE_COMMAND, CREATE_GEN_NL_COMMAND, CREATE_GEN_REGIONS_COMMAND, CREATE_PROJECT_ALL_COMMAND, CREATE_PROJECT_CODE_COMMAND, CREATE_PROJECT_NL_COMMAND } from "../constants";

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
            'Generate Natural Language',
            'action',
            [],
            CREATE_GEN_NL_COMMAND
          ),
          new ToolNode(
            'action.generateCodes',
            'Generate Source Code',
            'action',
            [],
            CREATE_GEN_CODE_COMMAND
          ),
          new ToolNode(
            'action.generateRegions',
            'Generate Regions',
            'action',
            [],
            CREATE_GEN_REGIONS_COMMAND
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
            'Show All Natural Language',
            'action',
            [],
            CREATE_PROJECT_NL_COMMAND
          ),
          new ToolNode(
            'action.showCodes',
            'Show All Source Code',
            'action',
            [],
            CREATE_PROJECT_CODE_COMMAND
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