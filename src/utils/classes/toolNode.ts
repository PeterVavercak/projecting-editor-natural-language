import { TreeItem, TreeItemCollapsibleState } from "vscode";


export class ToolNode extends TreeItem {
  constructor(
    public readonly idValue: string,
    public readonly labelValue: string,
    public readonly kind: 'group' | 'action',
    public readonly children: ToolNode[] = [],
    public readonly commandId?: string,
    public readonly commandArgs: unknown[] = []
  ) {
    super(
      labelValue,
      kind === 'group'
        ? TreeItemCollapsibleState.Expanded
        : TreeItemCollapsibleState.None
    );

    this.id = idValue;
    this.label = labelValue;

    if (kind === 'group') {
      this.contextValue = 'group';
    } else {
      this.contextValue = 'action';
      if (commandId) {
        this.command = {
          command: commandId,
          title: labelValue,
          arguments: commandArgs
        };
      }
    }
  }
}