export type CurrentIdentity = {
  userId: string;
  displayName: string;
};

export interface IdentityProvider {
  getCurrentIdentity(): Promise<CurrentIdentity>;
}

export class LocalDevelopmentIdentityProvider implements IdentityProvider {
  async getCurrentIdentity(): Promise<CurrentIdentity> {
    return {
      userId: 'local-device-user',
      displayName: 'Chủ hộ',
    };
  }
}
