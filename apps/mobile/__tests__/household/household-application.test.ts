import { IdentityProvider } from '@/core/identity/identity-provider';
import { Telemetry } from '@/core/telemetry/telemetry';
import { bootstrapHousehold } from '@/features/household/application/bootstrap-household';
import { createHousehold } from '@/features/household/application/create-household';
import {
  HouseholdRepository,
  HouseholdStorageUnavailableError,
} from '@/features/household/data/household-repository';

import { makeHouseholdAggregate } from '../../test-utils/household-fixtures';

function createDependencies(loadResult: Awaited<ReturnType<HouseholdRepository['load']>>) {
  const load = jest.fn().mockResolvedValue(loadResult);
  const save = jest.fn().mockResolvedValue(undefined);
  const reset = jest.fn().mockResolvedValue(undefined);
  const repository: HouseholdRepository = { load, save, reset };
  const identityProvider: IdentityProvider = {
    getCurrentIdentity: jest.fn().mockResolvedValue({ userId: 'user_1', displayName: 'Chủ hộ' }),
  };
  const track = jest.fn().mockResolvedValue(undefined);
  const telemetry: Telemetry = { track };

  return {
    repository,
    identityProvider,
    telemetry,
    createId: (kind: 'household' | 'member') => `${kind}_1`,
    now: () => '2026-09-25T00:00:00.000Z',
    mocks: { load, save, reset, track },
  };
}

describe('household application', () => {
  test('M1 and M2 persist one normalized aggregate and emit one creation event', async () => {
    const dependencies = createDependencies({ status: 'missing' });
    const result = await createHousehold('  Gia đình Nguyễn  ', dependencies);

    expect(result.created).toBe(true);
    expect(result.aggregate.household.name).toBe('Gia đình Nguyễn');
    expect(dependencies.mocks.save).toHaveBeenCalledTimes(1);
    expect(dependencies.mocks.save).toHaveBeenCalledWith(result.aggregate);
    expect(dependencies.mocks.track).toHaveBeenCalledTimes(1);
    expect(dependencies.mocks.track).toHaveBeenCalledWith('household_created', {
      householdId: result.aggregate.household.id,
      memberCount: result.aggregate.members.length,
    });
  });

  test('does not touch storage or identity when the household name is invalid', async () => {
    const dependencies = createDependencies({ status: 'missing' });

    await expect(createHousehold('   ', dependencies)).rejects.toThrow(
      'Vui lòng nhập tên hộ gia đình.',
    );
    expect(dependencies.mocks.load).not.toHaveBeenCalled();
    expect(dependencies.mocks.save).not.toHaveBeenCalled();
    expect(dependencies.mocks.track).not.toHaveBeenCalled();
  });

  test('M10 bootstraps valid persisted data as ready without emitting telemetry', async () => {
    const aggregate = makeHouseholdAggregate();
    const dependencies = createDependencies({ status: 'ready', aggregate });

    await expect(bootstrapHousehold(dependencies.repository)).resolves.toEqual({
      status: 'ready',
      aggregate,
    });
    expect(dependencies.mocks.track).not.toHaveBeenCalled();
  });

  test('M11 returns an existing household idempotently without saving or emitting telemetry', async () => {
    const aggregate = makeHouseholdAggregate();
    const dependencies = createDependencies({ status: 'ready', aggregate });

    await expect(createHousehold('Tên mới bị bỏ qua', dependencies)).resolves.toEqual({
      aggregate,
      created: false,
    });
    expect(dependencies.mocks.save).not.toHaveBeenCalled();
    expect(dependencies.mocks.track).not.toHaveBeenCalled();
  });

  test('does not fail a successful creation when telemetry rejects', async () => {
    const dependencies = createDependencies({ status: 'missing' });
    dependencies.mocks.track.mockRejectedValue(new Error('telemetry offline'));

    await expect(createHousehold('Gia đình Nguyễn', dependencies)).resolves.toMatchObject({
      created: true,
    });
  });

  test('does not keep creation pending when telemetry never settles', async () => {
    const dependencies = createDependencies({ status: 'missing' });
    dependencies.mocks.track.mockImplementation(() => new Promise(() => undefined));

    const result = await Promise.race([
      createHousehold('Gia đình Nguyễn', dependencies),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 50)),
    ]);

    expect(result).toMatchObject({ created: true });
  });

  test('does not emit telemetry when persistence fails', async () => {
    const dependencies = createDependencies({ status: 'missing' });
    dependencies.mocks.save.mockRejectedValue(new HouseholdStorageUnavailableError('write'));

    await expect(createHousehold('Gia đình Nguyễn', dependencies)).rejects.toBeInstanceOf(
      HouseholdStorageUnavailableError,
    );
    expect(dependencies.mocks.track).not.toHaveBeenCalled();
  });

  test('rethrows unexpected bootstrap errors instead of masking them as unavailable', async () => {
    const repository: HouseholdRepository = {
      load: jest.fn().mockRejectedValue(new Error('boom')),
      save: jest.fn().mockResolvedValue(undefined),
      reset: jest.fn().mockResolvedValue(undefined),
    };

    await expect(bootstrapHousehold(repository)).rejects.toThrow('boom');
  });
});
