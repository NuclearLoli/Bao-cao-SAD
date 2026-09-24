import {
  HOUSEHOLD_STORAGE_KEY,
  HouseholdStorageUnavailableError,
  KeyValueHouseholdRepository,
  KeyValueStorage,
} from '@/features/household/data/household-repository';

import { makeHouseholdAggregate } from '../../test-utils/household-fixtures';

function createStorage(initialValue: string | null = null): KeyValueStorage & {
  getItem: jest.Mock;
  setItem: jest.Mock;
  removeItem: jest.Mock;
} {
  return {
    getItem: jest.fn().mockResolvedValue(initialValue),
    setItem: jest.fn().mockResolvedValue(undefined),
    removeItem: jest.fn().mockResolvedValue(undefined),
  };
}

describe('KeyValueHouseholdRepository', () => {
  test('M7 returns missing when no household has been stored', async () => {
    const repository = new KeyValueHouseholdRepository(createStorage());
    await expect(repository.load()).resolves.toEqual({ status: 'missing' });
  });

  test('M8 reports storage unavailability when a read rejects', async () => {
    const storage = createStorage();
    storage.getItem.mockRejectedValue(new Error('disk unavailable'));
    const repository = new KeyValueHouseholdRepository(storage);

    await expect(repository.load()).rejects.toBeInstanceOf(HouseholdStorageUnavailableError);
  });

  test.each([
    ['malformed JSON', '{not-json'],
    ['unsupported version', JSON.stringify({ version: 99, data: makeHouseholdAggregate() })],
    ['invalid schema', JSON.stringify({ version: 1, data: { household: {} } })],
    [
      'invalid member integrity',
      JSON.stringify({
        version: 1,
        data: {
          ...makeHouseholdAggregate(),
          members: [
            {
              ...makeHouseholdAggregate().members[0],
              householdId: 'household_other',
            },
          ],
        },
      }),
    ],
  ])('M9 returns corrupted for %s without overwriting it', async (_caseName, storedValue) => {
    const storage = createStorage(storedValue);
    const repository = new KeyValueHouseholdRepository(storage);

    await expect(repository.load()).resolves.toEqual({ status: 'corrupted' });
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(storage.removeItem).not.toHaveBeenCalled();
  });

  test('round-trips a versioned household envelope', async () => {
    const aggregate = makeHouseholdAggregate();
    const storage = createStorage();
    const repository = new KeyValueHouseholdRepository(storage);

    await repository.save(aggregate);
    const serialized = storage.setItem.mock.calls[0][1] as string;
    expect(storage.setItem).toHaveBeenCalledWith(HOUSEHOLD_STORAGE_KEY, expect.any(String));

    storage.getItem.mockResolvedValue(serialized);
    await expect(repository.load()).resolves.toEqual({ status: 'ready', aggregate });
  });

  test('wraps write failures as unavailable storage errors', async () => {
    const storage = createStorage();
    storage.setItem.mockRejectedValue(new Error('write failed'));
    const repository = new KeyValueHouseholdRepository(storage);

    await expect(repository.save(makeHouseholdAggregate())).rejects.toBeInstanceOf(
      HouseholdStorageUnavailableError,
    );
  });

  test('removes only the current household key during reset', async () => {
    const storage = createStorage();
    const repository = new KeyValueHouseholdRepository(storage);

    await repository.reset();
    expect(storage.removeItem).toHaveBeenCalledWith(HOUSEHOLD_STORAGE_KEY);
  });

  test('wraps reset failures as unavailable storage errors', async () => {
    const storage = createStorage();
    storage.removeItem.mockRejectedValue(new Error('reset failed'));
    const repository = new KeyValueHouseholdRepository(storage);

    await expect(repository.reset()).rejects.toBeInstanceOf(HouseholdStorageUnavailableError);
  });
});
