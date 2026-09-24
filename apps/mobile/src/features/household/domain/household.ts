export const HOUSEHOLD_NAME_MAX_LENGTH = 80;

const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f-\u009f]/u;

export type Household = {
  id: string;
  name: string;
  currency: 'VND';
  createdByUserId: string;
  createdAt: string;
};

export type HouseholdMember = {
  id: string;
  householdId: string;
  userId: string;
  displayName: string;
  role: 'admin';
  joinedAt: string;
};

export type HouseholdAggregate = {
  household: Household;
  members: HouseholdMember[];
};

export type HouseholdNameValidation =
  | { valid: true; normalizedName: string }
  | { valid: false; message: string };

export function validateHouseholdName(value: string): HouseholdNameValidation {
  if (CONTROL_CHARACTER_PATTERN.test(value)) {
    return { valid: false, message: 'Tên hộ gia đình không được chứa ký tự điều khiển.' };
  }

  const normalizedName = value.trim();
  if (!normalizedName) {
    return { valid: false, message: 'Vui lòng nhập tên hộ gia đình.' };
  }

  if (normalizedName.length > HOUSEHOLD_NAME_MAX_LENGTH) {
    return {
      valid: false,
      message: `Tên hộ gia đình không được vượt quá ${HOUSEHOLD_NAME_MAX_LENGTH} ký tự.`,
    };
  }

  return { valid: true, normalizedName };
}

export function createHouseholdAggregate(input: {
  name: string;
  userId: string;
  displayName: string;
  householdId: string;
  memberId: string;
  now: string;
}): HouseholdAggregate {
  const validation = validateHouseholdName(input.name);
  if (!validation.valid) {
    throw new Error(validation.message);
  }

  assertNonBlankString(input.userId, 'userId');
  assertNonBlankString(input.displayName, 'displayName');
  assertNonBlankString(input.householdId, 'householdId');
  assertNonBlankString(input.memberId, 'memberId');
  assertNonBlankString(input.now, 'now');

  return {
    household: {
      id: input.householdId,
      name: validation.normalizedName,
      currency: 'VND',
      createdByUserId: input.userId,
      createdAt: input.now,
    },
    members: [
      {
        id: input.memberId,
        householdId: input.householdId,
        userId: input.userId,
        displayName: input.displayName,
        role: 'admin',
        joinedAt: input.now,
      },
    ],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonBlankString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function assertNonBlankString(value: string, fieldName: string): void {
  if (!isNonBlankString(value)) {
    throw new Error(`Invalid aggregate input: ${fieldName}`);
  }
}

export function isHouseholdAggregate(value: unknown): value is HouseholdAggregate {
  if (!isRecord(value) || !isRecord(value.household) || !Array.isArray(value.members)) {
    return false;
  }

  const household = value.household;
  if (typeof household.name !== 'string') {
    return false;
  }

  const validatedName = validateHouseholdName(household.name);
  if (
    !isNonBlankString(household.id) ||
    !isNonBlankString(household.name) ||
    household.currency !== 'VND' ||
    !isNonBlankString(household.createdByUserId) ||
    !isNonBlankString(household.createdAt) ||
    !validatedName.valid ||
    validatedName.normalizedName !== household.name ||
    value.members.length === 0
  ) {
    return false;
  }

  const membersAreValid = value.members.every(
    (member) =>
      isRecord(member) &&
      isNonBlankString(member.id) &&
      member.householdId === household.id &&
      isNonBlankString(member.userId) &&
      isNonBlankString(member.displayName) &&
      member.role === 'admin' &&
      isNonBlankString(member.joinedAt),
  );

  if (!membersAreValid) {
    return false;
  }

  return value.members.some(
    (member) => member.userId === household.createdByUserId && member.role === 'admin',
  );
}
