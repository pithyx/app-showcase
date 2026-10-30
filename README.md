# Pithyx app: showcase

Every method and event of `@pithyx/sdk` and every component of `@pithyx/ui` in one
[Pithyx](https://github.com/pithyx/pithyx) app, written with React. Install it on a box to see what each call does and
what each event carries, or read `src/` for how to use them.

Part of Pithyx by Schecher1 (https://github.com/Schecher1).

The app is laid out after the [design guidelines](https://pithyx.org/docs/developers/apps/design/): an `AppFrame` with
a navigation column (`NavList`) and a page per group, which turns into a list page in a narrow window.

- **Methods**: a button per SDK method (`src/demos.ts`), one page per group: window, desktop, logs and data, users and groups,
  backend, files and shared folders, with the last result or the error code below them. The showcase has no backend,
  so the backend calls show the error an app without one gets. The file calls work in the order of their buttons:
  `files.shares` picks a shared folder you may write to, `files.createFolder` and `files.upload` make a file there.
- **Events**: every SDK event as it arrives (`src/events.ts`), in a `DataTable`; minimize the window, change the theme or the language,
  or click the showcase's notification to see them. The app also answers `beforeClose` (with its own dialog when "Ask
  before closing" is on) and `beforeUnload`.
- **Context**: what the desktop told the app, kept current by the events.
- **Components**: every component of `@pithyx/ui`.
- **Patterns**: the patterns an app with more than one view is built from, on sample data: `SummaryTiles`,
  `AttentionList`, `DataTable` with `StatusBadge`, `Card` with `Meter`, and `FormSection` with `FormRow`.

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

Install the `.pithyxapp` on your box in the Store (gear, Install from file). It asks for `notifications`,
`directory.read`, `files.read`, `files.write` and `files.shares`, so the Store suggests it for administrators only.

## Bring it to a box

There are two ways:

- **A catalog**, for everybody else's boxes: open a pull request that adds the app's source as `apps/<id>/` to a
  catalog repository, for example `pithyx/apps-community` (see its CONTRIBUTING.md), with `pithyx` (the Pithyx
  versions it runs on) and `license` in `pithyx.json` and your GitHub login in `maintainers.json`. After the review, the
  catalog's CI builds the app from the merged commit and publishes it; boxes install it from the Store and get its
  updates. You never publish a package or an image yourself.
- **A sideload**, for your own box and for testing: `npm run pack` writes the `.pithyxapp`; install it in the Store
  (gear, Install from file). A sideload is marked unverified and gets no updates unless a catalog has the same id.

## License

MIT
