import AsyncStorage from '@react-native-async-storage/async-storage';

import { HOUSEHOLD_STORAGE_KEY, KeyValueHouseholdRepository } from './household-repository';

export const asyncStorageHouseholdRepository = new KeyValueHouseholdRepository(AsyncStorage);

export function createAsyncStorageHouseholdRepository(storageKey: string = HOUSEHOLD_STORAGE_KEY) {
  return new KeyValueHouseholdRepository(AsyncStorage, storageKey);
}
