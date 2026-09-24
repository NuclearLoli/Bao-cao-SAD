import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import {
  IdentityProvider,
  LocalDevelopmentIdentityProvider,
} from '@/core/identity/identity-provider';
import { NoopTelemetry, Telemetry } from '@/core/telemetry/telemetry';

import { bootstrapHousehold } from '../application/bootstrap-household';
import {
  CreateHouseholdDependencies,
  HouseholdDataCorruptedError,
  createHousehold,
} from '../application/create-household';
import { asyncStorageHouseholdRepository } from '../data/async-storage-household-repository';
import {
  HouseholdRepository,
  HouseholdStorageUnavailableError,
} from '../data/household-repository';
import { HouseholdAggregate } from '../domain/household';

export type HouseholdUiState =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'creating' }
  | { status: 'ready'; aggregate: HouseholdAggregate }
  | { status: 'corrupted' }
  | { status: 'unavailable' };

type HouseholdServices = {
  repository: HouseholdRepository;
  identityProvider: IdentityProvider;
  telemetry: Telemetry;
  createId: CreateHouseholdDependencies['createId'];
  now: () => string;
};

export type { HouseholdServices };

type HouseholdContextValue = {
  state: HouseholdUiState;
  create: (name: string) => Promise<HouseholdAggregate>;
  retry: () => Promise<void>;
  reset: () => Promise<void>;
};

const HouseholdContext = createContext<HouseholdContextValue | null>(null);

function createLocalId(kind: 'household' | 'member'): string {
  return `${kind}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createDefaultHouseholdServices(
  identityProvider: IdentityProvider = new LocalDevelopmentIdentityProvider(),
  repository: HouseholdRepository = asyncStorageHouseholdRepository,
): HouseholdServices {
  return {
    repository,
    identityProvider,
    telemetry: new NoopTelemetry(),
    createId: createLocalId,
    now: () => new Date().toISOString(),
  };
}

const defaultServices: HouseholdServices = createDefaultHouseholdServices();

export function HouseholdProvider({
  children,
  services = defaultServices,
}: PropsWithChildren<{ services?: HouseholdServices }>) {
  const [state, setState] = useState<HouseholdUiState>({ status: 'loading' });
  const createInFlight = useRef<Promise<HouseholdAggregate> | null>(null);
  const latestOperationId = useRef(0);

  const beginOperation = useCallback(() => {
    latestOperationId.current += 1;
    return latestOperationId.current;
  }, []);

  const load = useCallback(async () => {
    const operationId = beginOperation();
    setState({ status: 'loading' });
    const result = await bootstrapHousehold(services.repository);
    if (operationId === latestOperationId.current) {
      setState(result);
    }
  }, [beginOperation, services.repository]);

  useEffect(() => {
    let active = true;
    const operationId = beginOperation();
    void bootstrapHousehold(services.repository).then((result) => {
      if (active && operationId === latestOperationId.current) {
        setState(result);
      }
    });
    return () => {
      active = false;
    };
  }, [beginOperation, services.repository]);

  const create = useCallback(
    (name: string): Promise<HouseholdAggregate> => {
      if (createInFlight.current) {
        return createInFlight.current;
      }

      const operation = (async () => {
        const operationId = beginOperation();
        setState({ status: 'creating' });
        try {
          const result = await createHousehold(name, services);
          if (operationId === latestOperationId.current) {
            setState({ status: 'ready', aggregate: result.aggregate });
          }
          return result.aggregate;
        } catch (error) {
          if (operationId === latestOperationId.current) {
            if (error instanceof HouseholdDataCorruptedError) {
              setState({ status: 'corrupted' });
            } else if (
              error instanceof HouseholdStorageUnavailableError &&
              error.operation === 'read'
            ) {
              setState({ status: 'unavailable' });
            } else {
              setState({ status: 'empty' });
            }
          }
          throw error;
        } finally {
          createInFlight.current = null;
        }
      })();

      createInFlight.current = operation;
      return operation;
    },
    [beginOperation, services],
  );

  const reset = useCallback(async () => {
    const operationId = beginOperation();
    setState({ status: 'loading' });
    try {
      await services.repository.reset();
      if (operationId === latestOperationId.current) {
        setState({ status: 'empty' });
      }
    } catch {
      if (operationId === latestOperationId.current) {
        setState({ status: 'unavailable' });
      }
    }
  }, [beginOperation, services.repository]);

  const value = useMemo(
    () => ({ state, create, retry: load, reset }),
    [create, load, reset, state],
  );

  return <HouseholdContext.Provider value={value}>{children}</HouseholdContext.Provider>;
}

export function useHousehold(): HouseholdContextValue {
  const context = useContext(HouseholdContext);
  if (!context) {
    throw new Error('useHousehold must be used inside HouseholdProvider.');
  }
  return context;
}
