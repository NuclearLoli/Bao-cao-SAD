import { HouseholdAggregate } from '@/features/household/domain/household';

export function makeHouseholdAggregate(name = 'Gia đình Nguyễn'): HouseholdAggregate {
  return {
    household: {
      id: 'household_1',
      name,
      currency: 'VND',
      createdByUserId: 'user_1',
      createdAt: '2026-09-25T00:00:00.000Z',
    },
    members: [
      {
        id: 'member_1',
        householdId: 'household_1',
        userId: 'user_1',
        displayName: 'Chủ hộ',
        role: 'admin',
        joinedAt: '2026-09-25T00:00:00.000Z',
      },
    ],
  };
}
