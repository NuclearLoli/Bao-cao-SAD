import {
  HOUSEHOLD_NAME_MAX_LENGTH,
  HouseholdAggregate,
  createHouseholdAggregate,
  isHouseholdAggregate,
  validateHouseholdName,
} from '@/features/household/domain/household';

describe('household domain', () => {
  test('M1 creates the household and makes its creator an admin member', () => {
    const aggregate = createHouseholdAggregate({
      name: 'Gia đình Nguyễn',
      userId: 'user_1',
      displayName: 'Chủ hộ',
      householdId: 'household_1',
      memberId: 'member_1',
      now: '2026-09-25T00:00:00.000Z',
    });

    expect(aggregate.household.name).toBe('Gia đình Nguyễn');
    expect(aggregate.household.currency).toBe('VND');
    expect(aggregate.members).toEqual([
      expect.objectContaining({ householdId: 'household_1', userId: 'user_1', role: 'admin' }),
    ]);
  });

  test('M2 trims surrounding whitespace before accepting a name', () => {
    expect(validateHouseholdName('  Gia đình Nguyễn  ')).toEqual({
      valid: true,
      normalizedName: 'Gia đình Nguyễn',
    });
  });

  test('M3 rejects an empty or whitespace-only name', () => {
    expect(validateHouseholdName('   ')).toEqual({
      valid: false,
      message: 'Vui lòng nhập tên hộ gia đình.',
    });
  });

  test('M4 rejects names over 80 characters and control characters', () => {
    expect(validateHouseholdName('a'.repeat(HOUSEHOLD_NAME_MAX_LENGTH + 1)).valid).toBe(false);
    expect(validateHouseholdName('Gia đình\nNguyễn')).toEqual({
      valid: false,
      message: 'Tên hộ gia đình không được chứa ký tự điều khiển.',
    });
  });

  test('rejects blank identity fields when creating an aggregate', () => {
    expect(() =>
      createHouseholdAggregate({
        name: 'Gia đình Nguyễn',
        userId: 'user_1',
        displayName: '   ',
        householdId: 'household_1',
        memberId: 'member_1',
        now: '2026-09-25T00:00:00.000Z',
      }),
    ).toThrow('Invalid aggregate input: displayName');
  });

  test('rejects persisted aggregates whose creator is not an admin member', () => {
    const aggregate: HouseholdAggregate = {
      household: {
        id: 'household_1',
        name: 'Gia đình Nguyễn',
        currency: 'VND',
        createdByUserId: 'user_2',
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

    expect(isHouseholdAggregate(aggregate)).toBe(false);
  });

  test('rejects persisted aggregates whose stored household name is not normalized', () => {
    const aggregate: HouseholdAggregate = {
      household: {
        id: 'household_1',
        name: '  Gia đình Nguyễn  ',
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

    expect(isHouseholdAggregate(aggregate)).toBe(false);
  });
});
