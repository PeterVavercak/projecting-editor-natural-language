import { Disposable, Progress, ProgressLocation, window } from 'vscode';

export class ActionMutex implements Disposable {
  private locked = false;
  private currentActionName?: string;

  public isRunning(): boolean {
    return this.locked;
  }

  public getCurrentActionName(): string | undefined {
    return this.currentActionName;
  }

  public async runExclusive<T>(
    actionName: string,
    action: (progress: Progress<{ message?: string; increment?: number }>) => Promise<T>
  ): Promise<T | undefined> {
    if (this.locked) {
      const runningAction = this.currentActionName ?? 'Another action';
      void window.showInformationMessage(
        `${runningAction} is currently running. Please wait until it finishes.`
      );
      return undefined;
    }

    this.locked = true;
    this.currentActionName = actionName;

    try {
      return await window.withProgress(
        {
          location: ProgressLocation.Notification,
          title: actionName,
          cancellable: false
        },
        async (progress) => {
          progress.report({ message: 'Working...' });
          return await action(progress);
        }
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      void window.showErrorMessage(`${actionName} failed: ${message}`);
      throw error;
    } finally {
      this.locked = false;
      this.currentActionName = undefined;
    }
  }

  public dispose(): void {}
}

export const actionMutex = new ActionMutex();