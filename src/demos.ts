import type { FileLocation, FileRef, MethodName, PithyxApp } from '@pithyx/sdk';

/** What one demo left for the next: a file, a shared folder, a folder watch or a job. */
export interface DemoState {
  file: FileRef | null;
  share: FileLocation | null;
  watch: string | null;
  job: number | null;
  dirty: boolean;
  badge: number;
  /** Where the last click was, for the context menu. */
  point: { x: number; y: number };
}

export const initialState = (): DemoState => ({
  file: null,
  share: null,
  watch: null,
  job: null,
  dirty: false,
  badge: 0,
  point: { x: 40, y: 40 },
});

/** One demo per SDK method: it calls the method and returns what came back, which the app shows. */
export type Demo = (app: PithyxApp, state: DemoState) => Promise<unknown>;

/** The demos grouped as the app shows them; the order inside a group is the order of the buttons. */
export const groups: Record<string, MethodName[]> = {
  window: ['window.setTitle', 'window.setSize', 'window.setDirty', 'window.requestAttention', 'window.close'],
  desktop: ['notify', 'setBadge', 'contextMenu.show', 'clipboard.writeText', 'openUrl', 'ui.showError'],
  data: ['log.write', 'session.save', 'storage.set', 'storage.get', 'storage.keys', 'storage.remove'],
  people: ['directory.users', 'directory.groups'],
  backend: ['backend.token', 'backend.ticket'],
  files: ['files.pick', 'files.saveAs', 'files.read', 'files.write', 'files.url', 'files.open'],
  shares: [
    'files.shares',
    'files.list',
    'files.watch',
    'files.unwatch',
    'files.upload',
    'files.createFolder',
    'files.rename',
    'files.download',
    'files.versions',
    'files.restoreVersion',
    'files.run',
    'jobs.cancel',
  ],
  trash: ['trash.list', 'trash.restore', 'trash.delete', 'trash.empty'],
};

const FOLDER = 'Pithyx showcase';

function share(state: DemoState): FileLocation {
  if (state.share === null) {
    throw new Error('Call files.shares first: it picks the first shared folder you may write to.');
  }
  return state.share;
}

function file(state: DemoState): FileRef {
  if (state.file === null) {
    throw new Error('Call files.pick or files.saveAs first.');
  }
  return state.file;
}

/**
 * Every method of the SDK. `satisfies` keeps the list complete: a method the SDK adds is a type error here until it has
 * its demo.
 */
export const demos = {
  'window.setTitle': (app) => app.window.setTitle(`Showcase ${new Date().toLocaleTimeString()}`),
  'window.setSize': (app) => app.window.setSize({ width: 960, height: 680 }),
  'window.setDirty': async (app, state) => {
    state.dirty = !state.dirty;
    await app.window.setDirty(state.dirty);
    return { dirty: state.dirty };
  },
  'window.requestAttention': (app) => app.window.requestAttention(),
  'window.close': (app) => app.window.close(),
  notify: (app) =>
    app.notify({
      title: 'Showcase',
      body: 'A notification with a button.',
      level: 'success',
      actions: [{ id: 'open', label: 'Open' }],
      data: { from: 'showcase' },
      tag: 'showcase',
    }),
  setBadge: async (app, state) => {
    state.badge = state.badge >= 5 ? 0 : state.badge + 1;
    await app.setBadge(state.badge === 0 ? null : state.badge);
    return { badge: state.badge };
  },
  'contextMenu.show': (app, state) =>
    app.contextMenu.show(state.point, [
      { id: 'copy', label: 'Copy', shortcut: 'Ctrl+C' },
      { id: 'pinned', label: 'Pinned', checked: true },
      { id: 'disabled', label: 'Not now', disabled: true },
      { separator: true },
      { id: 'delete', label: 'Delete', danger: true },
    ]),
  'clipboard.writeText': (app) => app.clipboard.writeText('Copied from the Pithyx showcase'),
  openUrl: (app) => app.openUrl('https://github.com/pithyx/app-showcase'),
  'ui.showError': (app) => app.ui.showError(new Error('A failure the desktop shows for the app.')),
  'log.write': async (app) => {
    const data = { at: new Date().toISOString() };
    app.log.debug('Showcase debug entry', data);
    app.log.info('Showcase info entry', data);
    app.log.warn('Showcase warning', data);
    app.log.error('Showcase error entry', data);
    return 'Four entries; debug reaches the box only while debug logging is on.';
  },
  'session.save': async (app) => {
    await app.session.save({ savedAt: new Date().toISOString() });
    return app.session.restore();
  },
  'storage.set': (app) => app.storage.set('showcase', { savedAt: new Date().toISOString() }),
  'storage.get': (app) => app.storage.get('showcase'),
  'storage.keys': (app) => app.storage.keys(),
  'storage.remove': (app) => app.storage.remove('showcase'),
  'directory.users': (app) => app.directory.users(),
  'directory.groups': (app) => app.directory.groups(),
  // The showcase has no backend: both calls show the error an app without one gets.
  'backend.token': (app) => app.backend.token(),
  'backend.ticket': (app) => app.backend.socket('/live'),
  'files.pick': async (app, state) => {
    const [picked] = await app.files.pick({ multiple: false });
    state.file = picked ?? state.file;
    return picked ?? null;
  },
  'files.saveAs': async (app, state) => {
    const saved = await app.files.saveAs('showcase.txt', new Blob(['Written by the Pithyx showcase.\n']));
    state.file = saved ?? state.file;
    return saved;
  },
  'files.read': async (app, state) => (await app.files.read(file(state))).text(),
  'files.write': async (app, state) => {
    state.file = await app.files.write(file(state), new Blob([`Rewritten at ${new Date().toISOString()}\n`]));
    return state.file;
  },
  'files.url': (app, state) => app.files.url(file(state)),
  'files.open': async (app, state) => {
    state.file = await app.files.open(share(state), `${FOLDER}/hello.txt`);
    return state.file;
  },
  'files.shares': async (app, state) => {
    const shares = await app.files.shares();
    const writable = shares.find((candidate) => candidate.access === 'readWrite' && candidate.unavailable === undefined);
    state.share = writable === undefined ? null : { share: writable.id };
    return shares;
  },
  'files.list': (app, state) => app.files.list(share(state), '/', { limit: 20, sort: 'name', order: 'asc' }),
  'files.watch': async (app, state) => {
    state.watch = await app.files.watch(share(state), `/${FOLDER}`);
    return state.watch;
  },
  'files.unwatch': async (app, state) => {
    if (state.watch !== null) {
      await app.files.unwatch(state.watch);
    }
    state.watch = null;
  },
  'files.upload': (app, state) =>
    app.files.upload(share(state), `/${FOLDER}`, 'hello.txt', new Blob(['Hello from the showcase.\n']), {
      overwrite: true,
    }),
  'files.createFolder': (app, state) => app.files.createFolder(share(state), `/${FOLDER}`),
  'files.rename': (app, state) => app.files.rename(share(state), `/${FOLDER}/hello.txt`, 'hello again.txt'),
  'files.download': (app, state) => app.files.download(share(state), `/${FOLDER}/hello again.txt`),
  'files.versions': (app, state) => app.files.versions(share(state), `/${FOLDER}/hello again.txt`),
  'files.restoreVersion': async (app, state) => {
    const [newest] = await app.files.versions(share(state), `/${FOLDER}/hello again.txt`);
    if (newest === undefined) {
      return 'No snapshot holds this file yet.';
    }
    return app.files.restoreVersion(share(state), `/${FOLDER}/hello again.txt`, newest.snapshot, { overwrite: false });
  },
  'files.run': async (app, state) => {
    const job = await app.files.run({
      kind: 'copy',
      source: { location: share(state), folder: `/${FOLDER}`, items: { names: ['hello again.txt'] } },
      target: { location: share(state), path: `/${FOLDER}` },
      onConflict: 'rename',
    });
    state.job = job.id;
    return job;
  },
  'jobs.cancel': async (app, state) => {
    if (state.job === null) {
      return 'Call files.run first.';
    }
    await app.jobs.cancel(state.job);
    return { cancelled: state.job };
  },
  'trash.list': (app, state) => app.trash.list(share(state), { limit: 20 }),
  'trash.restore': async (app, state) => {
    const page = await app.trash.list(share(state), { limit: 1 });
    return page.items.length === 0 ? 'The bin is empty.' : app.trash.restore(share(state), [page.items[0]!.id], 'rename');
  },
  'trash.delete': async (app, state) => {
    const page = await app.trash.list(share(state), { limit: 1 });
    return page.items.length === 0 ? 'The bin is empty.' : app.trash.delete(share(state), [page.items[0]!.id]);
  },
  'trash.empty': (app, state) => app.trash.empty(share(state)),
} satisfies Record<MethodName, Demo>;
