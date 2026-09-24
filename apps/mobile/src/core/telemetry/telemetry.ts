export type TelemetryProperties = Record<string, boolean | number | string>;

export interface Telemetry {
  track(eventName: string, properties?: TelemetryProperties): Promise<void> | void;
}

export class NoopTelemetry implements Telemetry {
  track(): void {}
}
