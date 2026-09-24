import { HouseholdAggregate, isHouseholdAggregate } from '../domain/household';

export const HOUSEHOLD_STORAGE_KEY = 'cashflow.household.current';
const CURRENT_STORAGE_VERSION = 1;

type HouseholdEnvelope = {
  version: typeof CURRENT_STORAGE_VERSION;
  data: HouseholdAggregate;
};

export type HouseholdLoadResult =
  | { status: 'missing' }
  | { status: 'ready'; aggregate: HouseholdAggregate }
  | { status: 'corrupted' };

export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export interface HouseholdRepository {
  load(): Promise<HouseholdLoadResult>;
  save(aggregate: HouseholdAggregate): Promise<void>;
  reset(): Promise<void>;
}

export class HouseholdStorageUnavailableError extends Error {
  constructor(
    readonly operation: 'read' | 'reset' | 'write',
    options?: { cause?: unknown },
  ) {
    super(`Household storage ${operation} failed.`, options);
    this.name = 'HouseholdStorageUnavailableError';
  }
}

export class KeyValueHouseholdRepository implements HouseholdRepository {
  constructor(
    private readonly storage: KeyValueStorage,
    private readonly storageKey: string = HOUSEHOLD_STORAGE_KEY,
  ) {}

  async load(): Promise<HouseholdLoadResult> {
    let serialized: string | null;
    try {
      serialized = await this.storage.getItem(this.storageKey);
    } catch (error) {
      throw new HouseholdStorageUnavailableError('read', { cause: error });
    }

    if (serialized === null) {
      return { status: 'missing' };
    }

    try {
      const envelope = JSON.parse(serialized) as unknown;
      if (
        typeof envelope !== 'object' ||
        envelope === null ||
        !('version' in envelope) ||
        envelope.version !== CURRENT_STORAGE_VERSION ||
        !('data' in envelope) ||
        !isHouseholdAggregate(envelope.data)
      ) {
        return { status: 'corrupted' };
      }

      return { status: 'ready', aggregate: envelope.data };
    } catch {
      return { status: 'corrupted' };
    }
  }

  async save(aggregate: HouseholdAggregate): Promise<void> {
    const envelope: HouseholdEnvelope = {
      version: CURRENT_STORAGE_VERSION,
      data: aggregate,
    };

    try {
      await this.storage.setItem(this.storageKey, JSON.stringify(envelope));
    } catch (error) {
      throw new HouseholdStorageUnavailableError('write', { cause: error });
    }
  }

  async reset(): Promise<void> {
    try {
      await this.storage.removeItem(this.storageKey);
    } catch (error) {
      throw new HouseholdStorageUnavailableError('reset', { cause: error });
    }
  }
}
