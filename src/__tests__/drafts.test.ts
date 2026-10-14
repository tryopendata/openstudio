import { describe, expect, it } from 'vitest';
import { createDraftSession, DRAFT_KEY } from '../drafts';
import { revenueSpec } from '../patterns';
import { newProject } from '../project';

function storageWithDraft(raw: string) {
  const values = new Map([[DRAFT_KEY, raw]]);
  return {
    rejectRecoveryWrites: false,
    get length() {
      return values.size;
    },
    key(index: number) {
      return [...values.keys()][index] ?? null;
    },
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      if (this.rejectRecoveryWrites && key !== DRAFT_KEY)
        throw new DOMException('Storage quota exceeded', 'QuotaExceededError');
      values.set(key, value);
    },
  };
}

const replacement = newProject({ ...revenueSpec, chrome: { title: 'New work' } });

describe('draft recovery before automatic saving', () => {
  it('retains the exact unreadable original after editing and opening a new session', () => {
    const raw = '  { "broken": true }\n';
    const storage = storageWithDraft(raw);
    const session = createDraftSession(() => storage);
    const opened = session.open();
    expect(opened.project).toBeNull();
    expect(opened.autosaveBlocked).toBe(false);
    expect(opened.recoveries.map((draft) => draft.raw)).toEqual([raw]);
    expect(storage.getItem(DRAFT_KEY)).toBe(raw);
    session.save(replacement);
    const reopened = createDraftSession(() => storage).open();
    expect(reopened.project?.spec.chrome?.title).toBe('New work');
    expect(reopened.recoveries.map((draft) => draft.raw)).toEqual([raw]);
    expect(storage.getItem(opened.recoveries[0].key)).toBe(raw);
  });

  it('preserves a valid saved document before restarting with an example after a runtime failure', () => {
    const raw = `\n${JSON.stringify(replacement, null, 2)}\n`;
    const storage = storageWithDraft(raw);
    const session = createDraftSession(() => storage);
    expect(session.open(false)).toMatchObject({
      project: null,
      autosaveBlocked: false,
      recoveries: [{ raw }],
    });
    session.save(newProject(revenueSpec));
    expect(
      createDraftSession(() => storage)
        .open()
        .recoveries.map((draft) => draft.raw),
    ).toEqual([raw]);
  });

  it('keeps both originals and disables every save if a later recovery cannot fit', () => {
    const first = '{ first broken draft';
    const second = '{ second broken draft';
    const storage = storageWithDraft(first);
    const firstRecovery = createDraftSession(() => storage).open().recoveries[0];
    storage.setItem(DRAFT_KEY, second);
    // Replacing the active slot would succeed; only creating a backup fails.
    storage.rejectRecoveryWrites = true;
    const session = createDraftSession(() => storage);
    const opened = session.open();
    expect(opened.autosaveBlocked).toBe(true);
    expect(opened.message).toContain('could not preserve a recovery copy');
    expect(opened.recoveries.map((draft) => draft.raw)).toEqual([first, second]);
    expect(() => session.save(replacement)).toThrow('Automatic saving is disabled');
    expect(() => session.save(replacement)).toThrow('Automatic saving is disabled');
    expect(storage.getItem(DRAFT_KEY)).toBe(second);
    expect(storage.getItem(firstRecovery.key)).toBe(first);
    const reloaded = createDraftSession(() => storage);
    expect(reloaded.open().autosaveBlocked).toBe(true);
    expect(() => reloaded.save(replacement)).toThrow('Automatic saving is disabled');
    expect(storage.getItem(DRAFT_KEY)).toBe(second);
    storage.rejectRecoveryWrites = false;
    expect(reloaded.open().recoveries.map((draft) => draft.raw)).toEqual([first, second]);
    reloaded.save(replacement);
    expect(
      new Set(
        createDraftSession(() => storage)
          .open()
          .recoveries.map((draft) => draft.raw),
      ),
    ).toEqual(new Set([first, second]));
    expect(storage.getItem(firstRecovery.key)).toBe(first);
  });

  it('reuses an identical recovery without needing more storage', () => {
    const storage = storageWithDraft('{ invalid');
    const session = createDraftSession(() => storage);
    const first = session.open().recoveries;
    storage.rejectRecoveryWrites = true;
    expect(session.open()).toMatchObject({ autosaveBlocked: false, recoveries: first });
    session.save(replacement);
    expect(storage.length).toBe(2);
  });

  it('protects a runtime-failure draft when preserving it fails', () => {
    const raw = JSON.stringify(replacement);
    const storage = storageWithDraft(raw);
    storage.rejectRecoveryWrites = true;
    const session = createDraftSession(() => storage);
    expect(session.open(false)).toMatchObject({
      project: null,
      autosaveBlocked: true,
      recoveries: [{ key: DRAFT_KEY, raw }],
    });
    expect(() => session.save(newProject(revenueSpec))).toThrow('Automatic saving is disabled');
    expect(storage.getItem(DRAFT_KEY)).toBe(raw);
  });

  it('blocks writes until storage has been read and treats an empty saved draft as recoverable', () => {
    const storage = storageWithDraft('');
    const session = createDraftSession(() => storage);
    expect(() => session.save(replacement)).toThrow('Automatic saving is disabled');
    expect(session.open().recoveries.map((draft) => draft.raw)).toEqual(['']);
    const inaccessible = createDraftSession(() => {
      throw new Error('Storage disabled');
    });
    expect(inaccessible.open()).toMatchObject({ autosaveBlocked: true, project: null });
    expect(() => inaccessible.save(replacement)).toThrow('Automatic saving is disabled');
  });
});
