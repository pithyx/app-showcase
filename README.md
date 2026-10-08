# Pithyx app: showcase

Every method and event of `@pithyx/sdk` and every component of `@pithyx/ui` in one
[Pithyx](https://github.com/pithyx/pithyx) app, written with React. Install it on a box to see what each call does and
what each event carries, or read `src/` for how to use them.

- **Methods**: a button per SDK method (`src/demos.ts`), grouped as window, desktop, logs and data, users and groups,
  backend, files and shared folders, with the last result or the error code beside them. The showcase has no backend,
  so the backend calls show the error an app without one gets. The file calls work in the order of their buttons:
  `files.shares` picks a shared folder you may write to, `files.createFolder` and `files.upload` make a file there.
- **Events**: every SDK event as it arrives (`src/events.ts`); minimize the window, change the theme or the language,
  or click the showcase's notification to see them. The app also answers `beforeClose` (with its own dialog when "Ask
  before closing" is on) and `beforeUnload`.
- **Context**: what the desktop told the app, kept current by the events.
- **Components**: every component of `@pithyx/ui`.

Both lists are checked against the SDK's types (`satisfies Record<MethodName, ...>` and `Record<EventName, ...>`), so a
newer SDK with a new method or event does not build until the showcase covers it.

## Start

You need Node.js 24 or newer.

```sh
npm install
npm run dev     # the app in the mock desktop of pithyx dev, with hot reload
npm test        # type check, build, pithyx validate and the unit tests
npm run pack    # writes <id>-<version>.pithyxapp
```

Install the `.pithyxapp` on your box in the Store with "Install from file". It asks for `notifications`,
`directory.read`, `files.read`, `files.write` and `files.shares`, so the Store suggests it for administrators only.

## License

MIT
