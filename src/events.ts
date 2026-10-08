import type { EventName } from '@pithyx/sdk';

/**
 * Every event of the SDK, in the order the app lists them. `satisfies` keeps it complete: an event the SDK adds is a
 * type error here until the app listens to it.
 */
const events = {
  launch: true,
  focus: true,
  blur: true,
  minimize: true,
  restore: true,
  themeChange: true,
  localeChange: true,
  sizeClassChange: true,
  openFile: true,
  appUpdated: true,
  visibilityChange: true,
  connectionChange: true,
  backendStatus: true,
  permissionsChange: true,
  storageChange: true,
  notificationAction: true,
  logLevelChange: true,
  sharesChanged: true,
  folderChanged: true,
  uploadProgress: true,
  jobChanged: true,
} satisfies Record<EventName, true>;

export const eventNames = Object.keys(events) as EventName[];

/** One line of the event log: when, which event and its data. */
export interface EventRecord {
  at: string;
  event: string;
  data: unknown;
}

/** The newest record first, at most `limit` of them. */
export function record(log: readonly EventRecord[], entry: EventRecord, limit = 50): EventRecord[] {
  return [entry, ...log].slice(0, limit);
}
