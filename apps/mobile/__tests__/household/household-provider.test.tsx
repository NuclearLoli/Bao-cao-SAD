import { act, renderHook, waitFor } from '@testing-library/react-native';
import { PropsWithChildren } from 'react';

import { HouseholdStorageUnavailableError } from '@/features/household/data/household-repository';
import { HouseholdProvider, useHousehold } from '@/features/household/ui/household-provider';

import { makeHouseholdAggregate } from '../../test-utils/household-fixtures';

function createServices(options?: { readFails?: boolean; writeFails?: boolean }) {
  return {
    repository: {
      load: options?.readFails
        ? jest.fn().mockRejectedValue(new HouseholdStorageUnavailableError('read'))
        : jest.fn().mockResolvedValue({ status: 'missing' as const }),
      save: options?.writeFails
        ? jest.fn().mockRejectedValue(new HouseholdStorageUnavailableError('write'))
        : jest.fn().mockResolvedValue(undefined),
      reset: jest.fn().mockResolvedValue(undefined),
    },
    identityProvider: {
      getCurrentIdentity: jest.fn().mockResolvedValue({ userId: 'user_1', displayName: 'Chủ hộ' }),
    },
    telemetry: { track: jest.fn().mockResolvedValue(undefined) },
    createId: (kind: 'household' | 'member') => `${kind}_1`,
    now: () => '2026-09-25T00:00:00.000Z',
  };
}

describe('HouseholdProvider', () => {
  test('M6 keeps onboarding active when a household write rejects', async () => {
    const services = createServices({ writeFails: true });
    const wrapper = ({ children }: PropsWithChildren) => (
      <HouseholdProvider services={services}>{children}</HouseholdProvider>
    );
    const hook = await renderHook(() => useHousehold(), { wrapper });
    await waitFor(() => expect(hook.result.current.state.status).toBe('empty'));

    await act(async () => {
      await expect(hook.result.current.create('Gia đình Nguyễn')).rejects.toBeInstanceOf(
        HouseholdStorageUnavailableError,
      );
    });
    expect(hook.result.current.state.status).toBe('empty');
  });

  test('M8 exposes recovery state when the initial storage read rejects', async () => {
    const services = createServices({ readFails: true });
    const wrapper = ({ children }: PropsWithChildren) => (
      <HouseholdProvider services={services}>{children}</HouseholdProvider>
    );
    const hook = await renderHook(() => useHousehold(), { wrapper });

    await waitFor(() => expect(hook.result.current.state.status).toBe('unavailable'));
  });

  test('restores a ready household on bootstrap without replaying telemetry', async () => {
    const aggregate = makeHouseholdAggregate();
    const track = jest.fn().mockResolvedValue(undefined);
    const services = {
      ...createServices(),
      repository: {
        load: jest.fn().mockResolvedValue({ status: 'ready' as const, aggregate }),
        save: jest.fn().mockResolvedValue(undefined),
        reset: jest.fn().mockResolvedValue(undefined),
      },
      telemetry: { track },
    };
    const wrapper = ({ children }: PropsWithChildren) => (
      <HouseholdProvider services={services}>{children}</HouseholdProvider>
    );
    const hook = await renderHook(() => useHousehold(), { wrapper });

    await waitFor(() => expect(hook.result.current.state.status).toBe('ready'));
    expect(track).not.toHaveBeenCalled();
  });

  test('keeps the reset result when an older retry resolves later', async () => {
    let resolveRetry:
      | ((value: { status: 'ready'; aggregate: ReturnType<typeof makeHouseholdAggregate> }) => void)
      | undefined;
    const services = createServices();
    services.repository.load = jest
      .fn()
      .mockResolvedValueOnce({ status: 'missing' as const })
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveRetry = resolve;
          }),
      );

    const wrapper = ({ children }: PropsWithChildren) => (
      <HouseholdProvider services={services}>{children}</HouseholdProvider>
    );
    const hook = await renderHook(() => useHousehold(), { wrapper });
    await waitFor(() => expect(hook.result.current.state.status).toBe('empty'));

    let retryPromise: Promise<void> | undefined;
    await act(async () => {
      retryPromise = hook.result.current.retry();
    });
    await act(async () => {
      await hook.result.current.reset();
    });

    await act(async () => {
      resolveRetry?.({ status: 'ready', aggregate: makeHouseholdAggregate() });
      await retryPromise;
    });

    expect(hook.result.current.state.status).toBe('empty');
  });
});
