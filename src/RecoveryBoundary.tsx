import { Component, type ReactNode } from 'react';
import { DRAFT_KEY } from './drafts';

/** Keep an unexpected rendering failure recoverable without erasing the local draft. */
export class RecoveryBoundary extends Component<
  { children: (restoreDraft: boolean) => ReactNode },
  { failed: boolean; restoreDraft: boolean; message: string }
> {
  state = { failed: false, restoreDraft: true, message: '' };
  static getDerivedStateFromError() {
    return { failed: true };
  }

  private downloadDraft = () => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw === null) {
        this.setState({ message: 'No saved draft is available in this browser.' });
        return;
      }
      const url = URL.createObjectURL(new Blob([raw], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'openchart-recovery.json';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      this.setState({ message: 'This browser could not read the saved draft.' });
    }
  };

  render() {
    if (!this.state.failed) return this.props.children(this.state.restoreDraft);
    return (
      <main className="studio-recovery">
        <h1>The editor could not display this document</h1>
        <p>
          Download the saved draft for recovery, or restart with an example. Restarting preserves a
          recovery copy before automatic saving resumes. If the browser cannot preserve it,
          automatic saving stays disabled and you can download your new project.
        </p>
        <button type="button" onClick={this.downloadDraft}>
          Download saved draft
        </button>
        <button
          type="button"
          onClick={() => this.setState({ failed: false, restoreDraft: false, message: '' })}
        >
          Restart with an example
        </button>
        <output>{this.state.message}</output>
      </main>
    );
  }
}
