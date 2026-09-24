import { IdentityProvider } from '@/core/identity/identity-provider';
import { Telemetry } from '@/core/telemetry/telemetry';

import { HouseholdRepository } from '../data/household-repository';
import { HouseholdAggregate, createHouseholdAggregate } from '../domain/household';

export class HouseholdDataCorruptedError extends Error {
  constructor() {
    super('Stored household data is corrupted.');
    this.name = 'HouseholdDataCorruptedError';
  }
}

export type CreateHouseholdResult = {
  aggregate: HouseholdAggregate;
  created: boolean;
};

export type CreateHouseholdDependencies = {
  repository: HouseholdRepository;
  identityProvider: IdentityProvider;
  telemetry: Telemetry;
  createId: (kind: 'household' | 'member') => string;
  now: () => string;
};

function trackCreationBestEffort(
  telemetry: Telemetry,
  aggregate: HouseholdAggregate,
): void {
  try {
    const tracking = telemetry.track('household_created', {
      householdId: aggregate.household.id,
      memberCount: aggregate.members.length,
    });

    void Promise.resolve(tracking).catch(() => undefined);
  } catch {}
}

export async function createHousehold(
  name: string,
  dependencies: CreateHouseholdDependencies,
): Promise<CreateHouseholdResult> {
  createHouseholdAggregate({
    name,
    userId: 'validation-user',
    displayName: 'validation-user',
    householdId: 'validation-household',
    memberId: 'validation-member',
    now: dependencies.now(),
  });

  const existing = await dependencies.repository.load();
  if (existing.status === 'ready') {
    return { aggregate: existing.aggregate, created: false };
  }
  if (existing.status === 'corrupted') {
    throw new HouseholdDataCorruptedError();
  }

  const identity = await dependencies.identityProvider.getCurrentIdentity();
  const aggregate = createHouseholdAggregate({
    name,
    userId: identity.userId,
    displayName: identity.displayName,
    householdId: dependencies.createId('household'),
    memberId: dependencies.createId('member'),
    now: dependencies.now(),
  });

  await dependencies.repository.save(aggregate);
  trackCreationBestEffort(dependencies.telemetry, aggregate);

  return { aggregate, created: true };
}
