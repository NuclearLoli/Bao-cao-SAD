import { HouseholdAggregate } from '../domain/household';
import {
  HouseholdRepository,
  HouseholdStorageUnavailableError,
} from '../data/household-repository';

export type HouseholdBootstrapResult =
  | { status: 'empty' }
  | { status: 'ready'; aggregate: HouseholdAggregate }
  | { status: 'corrupted' }
  | { status: 'unavailable' };

export async function bootstrapHousehold(
  repository: HouseholdRepository,
): Promise<HouseholdBootstrapResult> {
  try {
    const result = await repository.load();
    if (result.status === 'missing') {
      return { status: 'empty' };
    }
    return result;
  } catch (error) {
    if (error instanceof HouseholdStorageUnavailableError) {
      return { status: 'unavailable' };
    }

    throw error;
  }
}
