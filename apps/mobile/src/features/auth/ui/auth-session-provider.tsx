import AsyncStorage from '@react-native-async-storage/async-storage';
import { PropsWithChildren, createContext, useContext, useEffect, useMemo, useState } from 'react';

import { CurrentIdentity, IdentityProvider } from '@/core/identity/identity-provider';
import {
  hashPassword,
  securityRateLimiter,
  validatePasswordStrength,
  verifyPassword,
  sanitizeInput,
} from '@/core/security/security-utils';
import { HOUSEHOLD_STORAGE_KEY } from '@/features/household/data/household-repository';

const AUTH_STORAGE_KEY = 'cashflow.demo.auth';
const FINANCE_STORAGE_PREFIX = 'cashflow.finance';

type DemoPlan = 'Free' | 'Plus' | 'Pro';
type ShareInviteStatus = 'pending' | 'accepted' | 'declined' | 'revoked';

export type DemoAccount = {
  id: string;
  displayName: string;
  email: string;
  password: string;
  recoveryCode?: string;
  plan: DemoPlan;
  roleLabel: string;
};

type ShareInvite = {
  id: string;
  code: string;
  invitedEmail: string;
  invitedAccountId: string | null;
  status: ShareInviteStatus;
  createdAt: string;
  resolvedAt?: string;
};

type ShareGroup = {
  id: string;
  ownerAccountId: string;
  label: string;
  memberAccountIds: string[];
  invites: ShareInvite[];
  createdAt: string;
};

export type SharedMember = {
  accountId: string;
  displayName: string;
  email: string;
  plan: DemoPlan;
  accessLabel: string;
  permissionLabel: string;
  isCreator: boolean;
};

export type ShareInviteSummary = {
  id: string;
  code: string;
  invitedEmail: string;
  invitedDisplayName: string;
  status: ShareInviteStatus;
  createdAtLabel: string;
  canAccept: boolean;
};

export type SharedHouseholdSummary = {
  householdLabel: string;
  inviteStatus: 'accepted' | 'pending';
  members: SharedMember[];
  pendingInvites: ShareInviteSummary[];
  isCreator: boolean;
  canManage: boolean;
  isDemoSharedHousehold: boolean;
};

type AuthStore = {
  accounts: DemoAccount[];
  currentUserId: string | null;
  shareGroups: ShareGroup[];
};

type AuthState =
  | { status: 'loading' }
  | { status: 'guest'; accounts: DemoAccount[] }
  | { status: 'authenticated'; account: DemoAccount; accounts: DemoAccount[] };

type SignInInput = {
  email: string;
  password: string;
};

type SignUpInput = {
  displayName: string;
  email: string;
  password: string;
  plan: DemoPlan;
};

type CreateShareInviteInput = {
  email: string;
};

type AuthSessionContextValue = {
  state: AuthState;
  sharedHousehold: SharedHouseholdSummary | null;
  pendingShareInvites: ShareInviteSummary[];
  storageScopeKey: string | null;
  signIn: (input: SignInInput) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  signOut: () => Promise<void>;
  changePassword: (input: { currentPassword: string; newPassword: string }) => Promise<void>;
  resetPassword: (input: { email: string; recoveryCode: string; newPassword: string }) => Promise<void>;
  updateProfile: (input: { displayName: string }) => Promise<void>;
  continueWithDemoAccount: (accountId: string) => Promise<void>;
  createShareInvite: (input: CreateShareInviteInput) => Promise<ShareInviteSummary>;
  acceptShareInvite: (inviteId: string) => Promise<void>;
  declineShareInvite: (inviteId: string) => Promise<void>;
  revokeShareInvite: (inviteId: string) => Promise<void>;
  removeSharedMember: (accountId: string) => Promise<void>;
  leaveSharedHousehold: () => Promise<void>;
};

const initialAccounts: DemoAccount[] = [
  {
    id: 'demo_nu',
    displayName: 'Nguyễn Văn Nu',
    email: 'nu@giadinh.vn',
    password: '123456',
    recoveryCode: 'REC-NU-2026',
    plan: 'Plus',
    roleLabel: 'Đồng quản lý ngân sách',
  },
  {
    id: 'demo_mai',
    displayName: 'Mai Anh',
    email: 'mai@giadinh.vn',
    password: '123456',
    recoveryCode: 'REC-MAI-2026',
    plan: 'Pro',
    roleLabel: 'Theo dõi chi tiêu & AI insight',
  },
];

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isDemoSharedAccount(accountId: string | null) {
  return accountId === 'demo_nu' || accountId === 'demo_mai';
}

function toAuthState(store: AuthStore): AuthState {
  const currentAccount =
    store.currentUserId === null
      ? null
      : store.accounts.find((account) => account.id === store.currentUserId) ?? null;

  if (!currentAccount) {
    return { status: 'guest', accounts: store.accounts };
  }

  return { status: 'authenticated', account: currentAccount, accounts: store.accounts };
}

function createInitialStore(): AuthStore {
  return {
    accounts: initialAccounts,
    currentUserId: null,
    shareGroups: [],
  };
}

function findShareGroupByAccount(store: AuthStore, accountId: string | null) {
  if (!accountId || isDemoSharedAccount(accountId)) {
    return null;
  }

  return (
    store.shareGroups.find(
      (group) =>
        group.ownerAccountId === accountId || group.memberAccountIds.includes(accountId),
    ) ?? null
  );
}

function findPendingInvitesForAccount(store: AuthStore, account: DemoAccount | null) {
  if (!account) {
    return [];
  }

  const normalizedEmail = normalizeEmail(account.email);

  return store.shareGroups.flatMap((group) =>
    group.invites
      .filter(
        (invite) =>
          invite.status === 'pending' &&
          (invite.invitedAccountId === account.id ||
            normalizeEmail(invite.invitedEmail) === normalizedEmail),
      )
      .map((invite) => ({ group, invite })),
  );
}

function formatDateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Vừa tạo';
  }

  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
  });
}

function toInviteSummary(
  invite: ShareInvite,
  accounts: DemoAccount[],
  currentAccountId: string | null,
): ShareInviteSummary {
  const matchedAccount =
    (invite.invitedAccountId
      ? accounts.find((account) => account.id === invite.invitedAccountId)
      : accounts.find(
          (account) => normalizeEmail(account.email) === normalizeEmail(invite.invitedEmail),
        )) ?? null;

  return {
    id: invite.id,
    code: invite.code,
    invitedEmail: invite.invitedEmail,
    invitedDisplayName: matchedAccount?.displayName ?? 'Chưa có tài khoản',
    status: invite.status,
    createdAtLabel: formatDateLabel(invite.createdAt),
    canAccept:
      invite.status === 'pending' &&
      currentAccountId !== null &&
      (invite.invitedAccountId === currentAccountId ||
        (matchedAccount !== null && matchedAccount.id === currentAccountId)),
  };
}

function toDynamicSharedHouseholdSummary(
  store: AuthStore,
  currentAccountId: string,
): SharedHouseholdSummary | null {
  const group = findShareGroupByAccount(store, currentAccountId);
  if (!group) {
    return null;
  }

  const members = group.memberAccountIds
    .map((accountId) => store.accounts.find((account) => account.id === accountId) ?? null)
    .filter((account): account is DemoAccount => account !== null)
    .map((account) => ({
      accountId: account.id,
      displayName: account.displayName,
      email: account.email,
      plan: account.plan,
      accessLabel: account.id === group.ownerAccountId ? 'Người tạo household' : 'Đồng quản lý',
      permissionLabel: 'Cùng xem, cùng chỉnh quỹ, giao dịch, và thiết lập ngân sách ngang quyền',
      isCreator: account.id === group.ownerAccountId,
    }));

  const pendingInvites = group.invites
    .filter((invite) => invite.status === 'pending')
    .map((invite) => toInviteSummary(invite, store.accounts, currentAccountId));

  return {
    householdLabel: group.label,
    inviteStatus: pendingInvites.length > 0 ? 'pending' : 'accepted',
    members,
    pendingInvites,
    isCreator: currentAccountId === group.ownerAccountId,
    canManage: true,
    isDemoSharedHousehold: false,
  };
}

function toDemoSharedHouseholdSummary(
  accounts: DemoAccount[],
  currentUserId: string | null,
): SharedHouseholdSummary | null {
  const creator = accounts.find((account) => account.id === 'demo_nu') ?? null;
  const sharedManager = accounts.find((account) => account.id === 'demo_mai') ?? null;

  if (!creator || !sharedManager) {
    return null;
  }

  if (currentUserId !== creator.id && currentUserId !== sharedManager.id) {
    return null;
  }

  return {
    householdLabel: 'Household chung của Nu & Mai',
    inviteStatus: 'accepted',
    members: [
      {
        accountId: creator.id,
        displayName: creator.displayName,
        email: creator.email,
        plan: creator.plan,
        accessLabel: 'Người tạo household',
        permissionLabel: 'Quản lý quỹ, giao dịch, chia sẻ, và chỉnh cấu hình ngang quyền',
        isCreator: true,
      },
      {
        accountId: sharedManager.id,
        displayName: sharedManager.displayName,
        email: sharedManager.email,
        plan: sharedManager.plan,
        accessLabel: 'Tài khoản được chia sẻ',
        permissionLabel: 'Quản lý quỹ, giao dịch, chia sẻ, và chỉnh cấu hình ngang quyền',
        isCreator: false,
      },
    ],
    pendingInvites: [],
    isCreator: currentUserId === creator.id,
    canManage: false,
    isDemoSharedHousehold: true,
  };
}

function toSharedHouseholdSummary(store: AuthStore, currentUserId: string | null) {
  if (!currentUserId) {
    return null;
  }

  if (isDemoSharedAccount(currentUserId)) {
    return toDemoSharedHouseholdSummary(store.accounts, currentUserId);
  }

  return toDynamicSharedHouseholdSummary(store, currentUserId);
}

function toStorageScopeKey(store: AuthStore, currentUserId: string | null) {
  if (!currentUserId) {
    return null;
  }

  if (isDemoSharedAccount(currentUserId)) {
    return 'shared-demo-household';
  }

  const group = findShareGroupByAccount(store, currentUserId);
  if (group) {
    return `shared-${group.id}`;
  }

  return `account-${currentUserId}`;
}

function createInviteCode() {
  return `INV-${Math.random().toString(36).slice(2, 6).toUpperCase()}${Date.now()
    .toString(36)
    .slice(-2)
    .toUpperCase()}`;
}

async function persistStore(store: AuthStore) {
  await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(store));
}

async function copyScopeDataIfMissing(sourceScopeKey: string, targetScopeKey: string) {
  if (!sourceScopeKey || !targetScopeKey || sourceScopeKey === targetScopeKey) {
    return;
  }

  const sourceHouseholdKey = `${HOUSEHOLD_STORAGE_KEY}.${sourceScopeKey}`;
  const targetHouseholdKey = `${HOUSEHOLD_STORAGE_KEY}.${targetScopeKey}`;
  const [sourceHousehold, targetHousehold] = await Promise.all([
    AsyncStorage.getItem(sourceHouseholdKey),
    AsyncStorage.getItem(targetHouseholdKey),
  ]);

  if (sourceHousehold === null) {
    return;
  }

  if (targetHousehold === null) {
    await AsyncStorage.setItem(targetHouseholdKey, sourceHousehold);
  }

  let householdId: string | null = null;
  try {
    const parsed = JSON.parse(sourceHousehold) as {
      data?: { household?: { id?: string } };
    };
    householdId =
      typeof parsed.data?.household?.id === 'string' ? parsed.data.household.id : null;
  } catch {
    householdId = null;
  }

  if (!householdId) {
    return;
  }

  const sourceFinanceKey = `${FINANCE_STORAGE_PREFIX}.${sourceScopeKey}.${householdId}`;
  const targetFinanceKey = `${FINANCE_STORAGE_PREFIX}.${targetScopeKey}.${householdId}`;
  const [sourceFinance, targetFinance] = await Promise.all([
    AsyncStorage.getItem(sourceFinanceKey),
    AsyncStorage.getItem(targetFinanceKey),
  ]);

  if (sourceFinance !== null && targetFinance === null) {
    await AsyncStorage.setItem(targetFinanceKey, sourceFinance);
  }
}

export class AuthSessionIdentityProvider implements IdentityProvider {
  constructor(private readonly getIdentity: () => CurrentIdentity | null) {}

  async getCurrentIdentity(): Promise<CurrentIdentity> {
    const identity = this.getIdentity();
    if (!identity) {
      throw new Error('No authenticated user available.');
    }

    return identity;
  }
}

export function AuthSessionProvider({ children }: PropsWithChildren) {
  const [store, setStore] = useState<AuthStore | null>(null);

  useEffect(() => {
    let active = true;

    void AsyncStorage.getItem(AUTH_STORAGE_KEY).then(async (serialized) => {
      if (!active) {
        return;
      }

      if (!serialized) {
        const initialStore = createInitialStore();
        await persistStore(initialStore);
        if (active) {
          setStore(initialStore);
        }
        return;
      }

      try {
        const parsed = JSON.parse(serialized) as Partial<AuthStore>;
        const nextStore: AuthStore = {
          accounts:
            Array.isArray(parsed.accounts) && parsed.accounts.length > 0
              ? (parsed.accounts as DemoAccount[])
              : initialAccounts,
          currentUserId:
            typeof parsed.currentUserId === 'string' || parsed.currentUserId === null
              ? parsed.currentUserId
              : null,
          shareGroups: Array.isArray(parsed.shareGroups)
            ? (parsed.shareGroups as ShareGroup[])
            : [],
        };
        if (active) {
          setStore(nextStore);
        }
      } catch {
        const fallbackStore = createInitialStore();
        await persistStore(fallbackStore);
        if (active) {
          setStore(fallbackStore);
        }
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const state = useMemo<AuthState>(() => {
    if (!store) {
      return { status: 'loading' };
    }

    return toAuthState(store);
  }, [store]);

  const value = useMemo<AuthSessionContextValue>(() => {
    const currentAccount =
      state.status === 'authenticated' ? state.account : null;
    const currentStore = store ?? createInitialStore();
    const pendingShareInvites = currentAccount
      ? findPendingInvitesForAccount(currentStore, currentAccount).map(({ invite }) =>
          toInviteSummary(invite, currentStore.accounts, currentAccount.id),
        )
      : [];

    const persistAndSetStore = async (nextStore: AuthStore) => {
      await persistStore(nextStore);
      setStore(nextStore);
    };

    return {
      state,
      sharedHousehold:
        state.status === 'authenticated'
          ? toSharedHouseholdSummary(currentStore, state.account.id)
          : null,
      pendingShareInvites,
      storageScopeKey:
        state.status === 'authenticated'
          ? toStorageScopeKey(currentStore, state.account.id)
          : null,
      signIn: async ({ email, password }) => {
        if (store === null) {
          return;
        }

        const normalizedEmail = normalizeEmail(email);
        const rateCheck = securityRateLimiter.checkAttempt(`signin_${normalizedEmail}`);
        if (!rateCheck.allowed) {
          throw new Error(
            `Tài khoản tạm khóa do đăng nhập sai nhiều lần. Vui lòng thử lại sau ${rateCheck.remainingWaitSec}s.`,
          );
        }

        const candidate = store.accounts.find(
          (acc) => normalizeEmail(acc.email) === normalizedEmail,
        );

        if (!candidate || !verifyPassword(password, candidate.password, candidate.id)) {
          const failure = securityRateLimiter.recordFailure(`signin_${normalizedEmail}`);
          if (failure.isLocked) {
            throw new Error(
              `Đăng nhập sai 5 lần! Tài khoản tạm thời bị khóa trong ${failure.remainingWaitSec}s để bảo vệ an toàn.`,
            );
          }
          throw new Error('Email hoặc mật khẩu chưa chính xác.');
        }

        securityRateLimiter.recordSuccess(`signin_${normalizedEmail}`);
        await persistAndSetStore({
          ...store,
          currentUserId: candidate.id,
        });
      },
      signUp: async ({ displayName, email, password, plan }) => {
        if (store === null) {
          return;
        }

        const cleanDisplayName = sanitizeInput(displayName);
        if (!cleanDisplayName) {
          throw new Error('Vui lòng nhập họ tên hợp lệ.');
        }

        const normalizedEmail = normalizeEmail(email);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
          throw new Error('Địa chỉ email không đúng định dạng.');
        }

        if (
          store.accounts.some(
            (candidate) => normalizeEmail(candidate.email) === normalizedEmail,
          )
        ) {
          throw new Error('Email này đã được sử dụng. Vui lòng đăng nhập.');
        }

        const strengthCheck = validatePasswordStrength(password);
        if (!strengthCheck.valid) {
          throw new Error(strengthCheck.message);
        }

        const accountId = `user_${Date.now()}`;
        const recoveryCode = `REC-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Date.now().toString(36).slice(-4).toUpperCase()}`;

        const nextAccount: DemoAccount = {
          id: accountId,
          displayName: cleanDisplayName,
          email: normalizedEmail,
          password: hashPassword(password, accountId),
          recoveryCode,
          plan,
          roleLabel: 'Chủ tài khoản chính',
        };

        await persistAndSetStore({
          ...store,
          accounts: [...store.accounts, nextAccount],
          currentUserId: nextAccount.id,
        });
      },
      changePassword: async ({ currentPassword, newPassword }) => {
        if (store === null || currentAccount === null) {
          throw new Error('Bạn cần đăng nhập để đổi mật khẩu.');
        }

        if (!verifyPassword(currentPassword, currentAccount.password, currentAccount.id)) {
          throw new Error('Mật khẩu hiện tại không chính xác.');
        }

        const strengthCheck = validatePasswordStrength(newPassword);
        if (!strengthCheck.valid) {
          throw new Error(strengthCheck.message);
        }

        const updatedAccount: DemoAccount = {
          ...currentAccount,
          password: hashPassword(newPassword, currentAccount.id),
        };

        const nextAccounts = store.accounts.map((acc) =>
          acc.id === currentAccount.id ? updatedAccount : acc,
        );

        await persistAndSetStore({
          ...store,
          accounts: nextAccounts,
        });
      },
      resetPassword: async ({ email, recoveryCode, newPassword }) => {
        if (store === null) {
          return;
        }

        const normalizedEmail = normalizeEmail(email);
        const targetAccount = store.accounts.find(
          (acc) => normalizeEmail(acc.email) === normalizedEmail,
        );

        if (!targetAccount) {
          throw new Error('Không tìm thấy tài khoản với email này.');
        }

        const expectedCode = targetAccount.recoveryCode ?? `REC-${targetAccount.id.slice(0, 4).toUpperCase()}`;
        if (recoveryCode.trim().toUpperCase() !== expectedCode.toUpperCase()) {
          throw new Error('Mã khôi phục tài khoản không khớp.');
        }

        const strengthCheck = validatePasswordStrength(newPassword);
        if (!strengthCheck.valid) {
          throw new Error(strengthCheck.message);
        }

        const updatedAccount: DemoAccount = {
          ...targetAccount,
          password: hashPassword(newPassword, targetAccount.id),
        };

        const nextAccounts = store.accounts.map((acc) =>
          acc.id === targetAccount.id ? updatedAccount : acc,
        );

        await persistAndSetStore({
          ...store,
          accounts: nextAccounts,
          currentUserId: targetAccount.id,
        });
      },
      updateProfile: async ({ displayName }) => {
        if (store === null || currentAccount === null) {
          throw new Error('Bạn cần đăng nhập để cập nhật hồ sơ.');
        }

        const cleanDisplayName = sanitizeInput(displayName);
        if (!cleanDisplayName) {
          throw new Error('Tên hiển thị không được để trống.');
        }

        const updatedAccount: DemoAccount = {
          ...currentAccount,
          displayName: cleanDisplayName,
        };

        const nextAccounts = store.accounts.map((acc) =>
          acc.id === currentAccount.id ? updatedAccount : acc,
        );

        await persistAndSetStore({
          ...store,
          accounts: nextAccounts,
        });
      },
      signOut: async () => {
        if (store === null) {
          return;
        }

        await persistAndSetStore({
          ...store,
          currentUserId: null,
        });
      },
      continueWithDemoAccount: async (accountId) => {
        if (store === null) {
          return;
        }

        const exists = store.accounts.some((account) => account.id === accountId);
        if (!exists) {
          throw new Error('Không tìm thấy tài khoản demo.');
        }

        await persistAndSetStore({
          ...store,
          currentUserId: accountId,
        });
      },
      createShareInvite: async ({ email }) => {
        if (store === null || currentAccount === null) {
          throw new Error('Bạn cần đăng nhập trước.');
        }
        if (isDemoSharedAccount(currentAccount.id)) {
          throw new Error(
            'Cặp demo Nu/Mai đang là household mẫu cố định. Hãy tạo account mới để demo flow chia sẻ thật.',
          );
        }

        const invitedEmail = normalizeEmail(email);
        if (!invitedEmail) {
          throw new Error('Nhập email người muốn mời.');
        }
        if (invitedEmail === normalizeEmail(currentAccount.email)) {
          throw new Error('Không thể mời chính tài khoản hiện tại.');
        }

        const matchedAccount =
          store.accounts.find(
            (account) => normalizeEmail(account.email) === invitedEmail,
          ) ?? null;
        const existingGroup = findShareGroupByAccount(store, currentAccount.id);
        const targetGroup: ShareGroup = existingGroup ?? {
          id: `share_${Date.now().toString(36)}`,
          ownerAccountId: currentAccount.id,
          label: `Household chia sẻ của ${currentAccount.displayName}`,
          memberAccountIds: [currentAccount.id],
          invites: [],
          createdAt: new Date().toISOString(),
        };

        const duplicateInvite = targetGroup.invites.find(
          (invite) =>
            invite.status === 'pending' &&
            normalizeEmail(invite.invitedEmail) === invitedEmail,
        );
        if (duplicateInvite) {
          throw new Error('Email này đang có lời mời chờ phản hồi.');
        }

        const nextInvite: ShareInvite = {
          id: `invite_${Date.now().toString(36)}`,
          code: createInviteCode(),
          invitedEmail,
          invitedAccountId: matchedAccount?.id ?? null,
          status: 'pending',
          createdAt: new Date().toISOString(),
        };

        const nextGroup: ShareGroup = {
          ...targetGroup,
          invites: [nextInvite, ...targetGroup.invites],
        };

        const nextStore: AuthStore = {
          ...store,
          shareGroups: existingGroup
            ? store.shareGroups.map((group) =>
                group.id === nextGroup.id ? nextGroup : group,
              )
            : [...store.shareGroups, nextGroup],
        };

        if (!existingGroup) {
          await copyScopeDataIfMissing(
            `account-${currentAccount.id}`,
            `shared-${nextGroup.id}`,
          );
        }

        await persistAndSetStore(nextStore);
        return toInviteSummary(nextInvite, nextStore.accounts, currentAccount.id);
      },
      acceptShareInvite: async (inviteId) => {
        if (store === null || currentAccount === null) {
          throw new Error('Bạn cần đăng nhập trước.');
        }
        if (isDemoSharedAccount(currentAccount.id)) {
          throw new Error('Tài khoản demo mẫu không cần nhận thêm lời mời.');
        }

        const existingGroup = findShareGroupByAccount(store, currentAccount.id);
        const targetEntry = findPendingInvitesForAccount(store, currentAccount).find(
          ({ invite }) => invite.id === inviteId,
        );

        if (!targetEntry) {
          throw new Error('Không tìm thấy lời mời phù hợp.');
        }
        if (existingGroup && existingGroup.id !== targetEntry.group.id) {
          throw new Error(
            'Tài khoản này đang thuộc một household chia sẻ khác. Hãy rời household hiện tại trước.',
          );
        }

        const nextGroup: ShareGroup = {
          ...targetEntry.group,
          memberAccountIds: Array.from(
            new Set([...targetEntry.group.memberAccountIds, currentAccount.id]),
          ),
          invites: targetEntry.group.invites.map((invite) =>
            invite.id === inviteId
              ? {
                  ...invite,
                  invitedAccountId: currentAccount.id,
                  status: 'accepted',
                  resolvedAt: new Date().toISOString(),
                }
              : invite,
          ),
        };

        await persistAndSetStore({
          ...store,
          shareGroups: store.shareGroups.map((group) =>
            group.id === nextGroup.id ? nextGroup : group,
          ),
        });
      },
      declineShareInvite: async (inviteId) => {
        if (store === null || currentAccount === null) {
          throw new Error('Bạn cần đăng nhập trước.');
        }

        const targetEntry = findPendingInvitesForAccount(store, currentAccount).find(
          ({ invite }) => invite.id === inviteId,
        );

        if (!targetEntry) {
          throw new Error('Không tìm thấy lời mời phù hợp.');
        }

        const nextGroup: ShareGroup = {
          ...targetEntry.group,
          invites: targetEntry.group.invites.map((invite) =>
            invite.id === inviteId
              ? {
                  ...invite,
                  invitedAccountId: currentAccount.id,
                  status: 'declined',
                  resolvedAt: new Date().toISOString(),
                }
              : invite,
          ),
        };

        await persistAndSetStore({
          ...store,
          shareGroups: store.shareGroups.map((group) =>
            group.id === nextGroup.id ? nextGroup : group,
          ),
        });
      },
      revokeShareInvite: async (inviteId) => {
        if (store === null || currentAccount === null) {
          throw new Error('Bạn cần đăng nhập trước.');
        }
        if (isDemoSharedAccount(currentAccount.id)) {
          throw new Error('Household demo mẫu không chỉnh lời mời bằng flow này.');
        }

        const group = findShareGroupByAccount(store, currentAccount.id);
        if (!group) {
          throw new Error('Bạn chưa có household chia sẻ để quản lý.');
        }

        const inviteExists = group.invites.some((invite) => invite.id === inviteId);
        if (!inviteExists) {
          throw new Error('Không tìm thấy lời mời cần thu hồi.');
        }

        const nextGroup: ShareGroup = {
          ...group,
          invites: group.invites.map((invite) =>
            invite.id === inviteId
              ? {
                  ...invite,
                  status: 'revoked',
                  resolvedAt: new Date().toISOString(),
                }
              : invite,
          ),
        };

        await persistAndSetStore({
          ...store,
          shareGroups: store.shareGroups.map((entry) =>
            entry.id === nextGroup.id ? nextGroup : entry,
          ),
        });
      },
      removeSharedMember: async (accountId) => {
        if (store === null || currentAccount === null) {
          throw new Error('Bạn cần đăng nhập trước.');
        }
        if (isDemoSharedAccount(currentAccount.id)) {
          throw new Error('Household demo mẫu không chỉnh thành viên bằng flow này.');
        }

        const group = findShareGroupByAccount(store, currentAccount.id);
        if (!group) {
          throw new Error('Bạn chưa có household chia sẻ để quản lý.');
        }
        if (accountId === group.ownerAccountId) {
          throw new Error('Không thể xoá tài khoản tạo household khỏi nhóm.');
        }

        const nextGroup: ShareGroup = {
          ...group,
          memberAccountIds: group.memberAccountIds.filter((memberId) => memberId !== accountId),
        };

        await persistAndSetStore({
          ...store,
          shareGroups: store.shareGroups.map((entry) =>
            entry.id === nextGroup.id ? nextGroup : entry,
          ),
        });
      },
      leaveSharedHousehold: async () => {
        if (store === null || currentAccount === null) {
          throw new Error('Bạn cần đăng nhập trước.');
        }
        if (isDemoSharedAccount(currentAccount.id)) {
          throw new Error('Tài khoản demo mẫu không rời household này.');
        }

        const group = findShareGroupByAccount(store, currentAccount.id);
        if (!group) {
          throw new Error('Bạn chưa tham gia household chia sẻ nào.');
        }
        if (group.ownerAccountId === currentAccount.id) {
          throw new Error('Tài khoản tạo household không thể rời nhóm, hãy xoá thành viên khác thay vì rời.');
        }

        const nextGroup: ShareGroup = {
          ...group,
          memberAccountIds: group.memberAccountIds.filter(
            (memberId) => memberId !== currentAccount.id,
          ),
        };

        await persistAndSetStore({
          ...store,
          shareGroups: store.shareGroups.map((entry) =>
            entry.id === nextGroup.id ? nextGroup : entry,
          ),
        });
      },
    };
  }, [state, store]);

  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useAuthSession() {
  const context = useContext(AuthSessionContext);
  if (!context) {
    throw new Error('useAuthSession must be used inside AuthSessionProvider.');
  }
  return context;
}
