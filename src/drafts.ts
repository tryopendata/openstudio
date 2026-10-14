import { parseProject, type StudioProject, serializeProject } from './project';

export const DRAFT_KEY = 'openchart.studio.draft.v1';
const RECOVERY_PREFIX = `${DRAFT_KEY}.recovery.`;
const BLOCKED_MESSAGE =
  'Automatic saving is disabled to protect the original draft. Download your current Studio project to keep new edits.';

type DraftStorage = Pick<Storage, 'length' | 'key' | 'getItem' | 'setItem'>;
export interface RecoveryDraft {
  key: string;
  raw: string;
}
interface DraftLoad {
  project: StudioProject | null;
  recoveries: RecoveryDraft[];
  autosaveBlocked: boolean;
  message: string;
}

function recoveryDrafts(storage: DraftStorage): RecoveryDraft[] {
  const keys: string[] = [];
  for (let index = 0; index < storage.length; index++) {
    const key = storage.key(index);
    if (key?.startsWith(RECOVERY_PREFIX)) keys.push(key);
  }
  return keys.sort().flatMap((key) => {
    const raw = storage.getItem(key);
    return raw === null ? [] : [{ key, raw }];
  });
}

/** One owner gates every write, including delayed saves and page-hide flushes. */
export function createDraftSession(getStorage: () => DraftStorage = () => localStorage) {
  let canSave = false;
  return {
    open(restore = true): DraftLoad {
      canSave = false;
      let raw: string | null = null;
      let recoveries: RecoveryDraft[] = [];
      let storage: DraftStorage;
      try {
        storage = getStorage();
        raw = storage.getItem(DRAFT_KEY);
        recoveries = recoveryDrafts(storage);
      } catch {
        return {
          project: null,
          recoveries: raw === null ? [] : [{ key: DRAFT_KEY, raw }],
          autosaveBlocked: true,
          message: `This browser could not read its saved drafts. ${BLOCKED_MESSAGE}`,
        };
      }

      let project: StudioProject | null = null;
      let unreadable = false;
      if (restore && raw !== null) {
        try {
          project = parseProject(raw);
        } catch {
          unreadable = true;
        }
      }
      const needsRecovery = raw !== null && (!restore || unreadable);
      const context = unreadable
        ? 'The saved draft could not be opened.'
        : 'The editor restarted with an example.';
      if (needsRecovery && raw !== null && !recoveries.some((draft) => draft.raw === raw)) {
        try {
          // Separate slots retain earlier failures without rewriting their bytes.
          let key: string;
          do {
            key = `${RECOVERY_PREFIX}${Date.now()}.${crypto.randomUUID()}`;
          } while (storage.getItem(key) !== null);
          storage.setItem(key, raw);
          if (storage.getItem(key) !== raw) throw new Error('Recovery copy was not retained.');
          recoveries = [...recoveries, { key, raw }];
        } catch {
          return {
            project: null,
            recoveries: [...recoveries, { key: DRAFT_KEY, raw }],
            autosaveBlocked: true,
            message: `${context} This browser could not preserve a recovery copy. The original remains in its saved-draft slot. ${BLOCKED_MESSAGE}`,
          };
        }
      }
      canSave = true;
      return {
        project,
        recoveries,
        autosaveBlocked: false,
        message: needsRecovery
          ? `${context} Its original data is preserved in this browser. Use Download recovery draft to retrieve it.`
          : '',
      };
    },
    save(project: StudioProject): void {
      if (!canSave) throw new Error(BLOCKED_MESSAGE);
      try {
        getStorage().setItem(DRAFT_KEY, serializeProject(project));
      } catch (cause) {
        throw new Error(
          'This browser could not save the draft. Download the Studio project to keep your source data and preparation.',
          { cause },
        );
      }
    },
  };
}
