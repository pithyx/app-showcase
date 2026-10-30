import { isProblem, type MethodName, type PithyxApp } from '@pithyx/sdk';
import { createI18n } from '@pithyx/sdk/i18n';
import {
  AppFrame,
  AttentionList,
  Badge,
  Button,
  Card,
  Checkbox,
  ContextMenuPopover,
  DataTable,
  Dialog,
  FormRow,
  FormSection,
  IconButton,
  Menu,
  MenuItem,
  MenuPopover,
  MenuSeparator,
  MenuTrigger,
  Meter,
  NavList,
  OtpField,
  PasswordField,
  ProgressBar,
  SearchField,
  StatusBadge,
  SummaryTile,
  SummaryTiles,
  Switch,
  TextField,
  Toolbar,
  Tooltip,
  TooltipTrigger,
  type DataTableColumn,
  type NavGroup,
} from '@pithyx/ui';
import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import de from '../i18n/de.json';
import en from '../i18n/en.json';
import { demos, groups, initialState } from './demos';
import { eventNames, record, type EventRecord } from './events';

/** A page of the showcase: a group of SDK methods (a key of `groups`), the events, the context, the components or the patterns. */
type Place = string;

/** A result as the app shows it: JSON, or the problem's code for a failure. */
function show(value: unknown): string {
  if (value === undefined) {
    return 'OK';
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function Showcase({ app }: { app: PithyxApp }) {
  const [locale, setLocale] = useState(app.context.locale);
  const i18n = useMemo(() => createI18n(app, { en, de }), [app, locale]);
  const t = i18n.t.bind(i18n);
  const [place, setPlace] = useState<Place>('window');
  const [view, setView] = useState<'navigation' | 'page'>('page');
  const [result, setResult] = useState<{ method: string; text: string; failed: boolean } | null>(null);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [askBeforeClose, setAskBeforeClose] = useState(false);
  const [closing, setClosing] = useState(false);
  const [contextVersion, setContextVersion] = useState(0);
  const state = useRef(initialState());
  const askRef = useRef(askBeforeClose);
  askRef.current = askBeforeClose;

  useEffect(() => {
    void app.window.setTitle(t('title'));
    const stops = eventNames.map((event) =>
      app.on(event, (data) => {
        setEvents((log) => record(log, { at: new Date().toLocaleTimeString(), event, data }));
        setContextVersion((version) => version + 1);
        if (event === 'localeChange') {
          setLocale(app.context.locale);
        }
      }),
    );
    // Asked before the window closes: keep it open and ask in the app's own dialog.
    app.answer('beforeClose', () => {
      if (askRef.current) {
        setClosing(true);
        return { allow: false };
      }
      return { allow: true };
    });
    // Asked before the window goes for sure: sign-out, shutdown, restart, update. Save quickly; it cannot be refused.
    app.answer('beforeUnload', async ({ reason }) => {
      await app.session.save({ reason, at: new Date().toISOString() });
      return {};
    });
    return () => {
      for (const stop of stops) {
        stop();
      }
    };
  }, [app]);

  const run = async (method: MethodName) => {
    try {
      const value = await demos[method](app, state.current);
      setResult({ method, text: show(value), failed: false });
    } catch (error) {
      const code = isProblem(error) ? error.code : error instanceof Error ? error.message : String(error);
      setResult({ method, text: t('result.failed', { code }), failed: true });
    }
  };

  const remember = (event: MouseEvent) => {
    state.current.point = { x: event.clientX, y: event.clientY };
  };

  const navigation: NavGroup[] = [
    {
      id: 'sdk',
      label: t('nav.sdk'),
      items: Object.entries(groups).map(([group, methods]) => ({
        id: group,
        label: t(`groups.${group}`),
        count: methods.length,
      })),
    },
    {
      id: 'app',
      label: t('nav.app'),
      items: [
        { id: 'events', label: t('tabs.events'), ...(events.length > 0 ? { count: events.length } : {}) },
        { id: 'context', label: t('tabs.context') },
      ],
    },
    {
      id: 'ui',
      label: t('nav.ui'),
      items: [
        { id: 'components', label: t('tabs.components') },
        { id: 'patterns', label: t('tabs.patterns') },
      ],
    },
  ];
  const isGroup = (value: Place) => Object.hasOwn(groups, value);
  const title = isGroup(place) ? t(`groups.${place}`) : t(`tabs.${place}`);

  return (
    <AppFrame
      className="showcase"
      view={view}
      onViewChange={setView}
      pageKey={place}
      navigation={
        <NavList
          aria-label={t('title')}
          searchPlaceholder={t('nav.search')}
          groups={navigation}
          selectedId={place}
          onSelect={(id) => {
            setPlace(id);
            setView('page');
          }}
        />
      }
      title={title}
      toolbar={
        place === 'events' ? (
          <Toolbar aria-label={t('tabs.events')}>
            <Button size="sm" variant="secondary" isDisabled={events.length === 0} onPress={() => setEvents([])}>
              {t('events.clear')}
            </Button>
          </Toolbar>
        ) : undefined
      }
      statusBar={result !== null && isGroup(place) ? <span>{t('status.last', { method: result.method })}</span> : undefined}
    >
      {isGroup(place) && (
        <div className="methods" onMouseDown={remember}>
          <FormSection title={t('methods.title')}>
            <div className="buttons">
              {(groups[place] ?? []).map((method) => (
                <Button
                  key={method}
                  size="sm"
                  variant="secondary"
                  onPress={() => void run(method)}
                  isDisabled={!app.supports(method)}
                >
                  <code>{method}</code>
                </Button>
              ))}
            </div>
            {place === 'window' && (
              <Checkbox isSelected={askBeforeClose} onChange={setAskBeforeClose}>
                {t('close.label')}
              </Checkbox>
            )}
          </FormSection>
          <FormSection title={t('result.title')}>
            <div className="result" aria-live="polite">
              {result === null ? (
                <p className="muted">{t('result.empty')}</p>
              ) : (
                <>
                  <code className={result.failed ? 'failed' : undefined}>{result.method}</code>
                  <pre>{result.text}</pre>
                </>
              )}
            </div>
          </FormSection>
        </div>
      )}

      {place === 'events' && <Events events={events} t={t} />}

      {place === 'context' && (
        <section key={contextVersion}>
          <pre>{show(app.context)}</pre>
        </section>
      )}

      {place === 'components' && <Components t={t} />}

      {place === 'patterns' && <Patterns t={t} />}

      <Dialog
        isOpen={closing}
        onOpenChange={setClosing}
        title={t('title')}
        actions={
          <>
            <Button variant="secondary" onPress={() => setClosing(false)}>
              {t('components.cancel')}
            </Button>
            <Button variant="primary" onPress={() => void app.window.close()}>
              {t('close.confirm')}
            </Button>
          </>
        }
      >
        {t('close.question')}
      </Dialog>
    </AppFrame>
  );
}

type Translate = (key: string, params?: Record<string, unknown>) => string;

/** The events as a table, newest first. */
function Events({ events, t }: { events: EventRecord[]; t: Translate }) {
  const rows = events.map((entry, index) => ({ ...entry, key: `${entry.at}-${String(index)}` }));
  const columns: DataTableColumn<(typeof rows)[number]>[] = [
    { id: 'at', label: t('events.time'), width: 110, muted: true, cell: (entry) => entry.at },
    { id: 'event', label: t('events.event'), width: 200, cell: (entry) => <code>{entry.event}</code> },
    { id: 'data', label: t('events.data'), cell: (entry) => <code className="data">{JSON.stringify(entry.data)}</code> },
  ];
  return (
    <DataTable
      aria-label={t('tabs.events')}
      columns={columns}
      items={rows}
      getKey={(entry) => entry.key}
      emptyState={t('events.empty')}
    />
  );
}

/** The patterns an app with more than one view is built from, on sample data (design guidelines, D394). */
function Patterns({ t }: { t: Translate }) {
  const [name, setName] = useState('');
  const [sounds, setSounds] = useState(true);
  const files = [
    { name: 'Budget.ods', size: '84 kB', state: 'synced' },
    { name: 'Holiday.jpg', size: '4.8 MB', state: 'uploading' },
    { name: 'Notes.md', size: '3 kB', state: 'conflict' },
  ] as const;
  const tones = { synced: 'success', uploading: 'info', conflict: 'warning' } as const;
  const columns: DataTableColumn<(typeof files)[number]>[] = [
    { id: 'name', label: t('patterns.name'), sortValue: (file) => file.name, cell: (file) => file.name },
    { id: 'size', label: t('patterns.size'), align: 'end', width: 100, muted: true, cell: (file) => file.size },
    {
      id: 'state',
      label: t('patterns.state'),
      width: 140,
      cell: (file) => <StatusBadge tone={tones[file.state]}>{t(`patterns.states.${file.state}`)}</StatusBadge>,
    },
  ];
  return (
    <div className="patterns">
      <SummaryTiles>
        <SummaryTile label={t('patterns.files')} value="3" detail={t('patterns.filesDetail')} />
        <SummaryTile label={t('patterns.used')} value="4.9 MB" detail="12 %" />
        <SummaryTile label={t('patterns.synced')} value="1" detail={t('patterns.syncedDetail')} />
      </SummaryTiles>
      <AttentionList
        items={[
          {
            id: 'conflict',
            tone: 'warning',
            title: t('patterns.attention'),
            description: t('patterns.attentionDetail'),
            action: { label: t('patterns.resolve'), onPress: () => undefined },
          },
        ]}
      />
      <DataTable
        aria-label={t('patterns.table')}
        columns={columns}
        items={files}
        getKey={(file) => file.name}
        selectionMode="single"
      />
      <Card
        title={t('patterns.cardTitle')}
        badge={<StatusBadge tone="success">{t('patterns.states.synced')}</StatusBadge>}
        facts={t('patterns.cardFacts')}
        meter={<Meter aria-label={t('patterns.used')} value={12} start="4.9 MB" end="40 MB" />}
      >
        <p>{t('patterns.cardDetails')}</p>
      </Card>
      <FormSection title={t('patterns.settings')}>
        <FormRow label={t('components.name')} hint={t('components.nameHint')}>
          <TextField value={name} onChange={setName} />
        </FormRow>
        <FormRow label={t('components.switch')}>
          <Switch isSelected={sounds} onChange={setSounds}>
            {t('components.switch')}
          </Switch>
        </FormRow>
      </FormSection>
    </div>
  );
}

/** Every component of @pithyx/ui once. */
function Components({ t }: { t: (key: string, params?: Record<string, unknown>) => string }) {
  const [chosen, setChosen] = useState<string | null>(null);
  const [menuAt, setMenuAt] = useState<{ x: number; y: number } | null>(null);
  const [dialog, setDialog] = useState(false);
  const [progress, setProgress] = useState(40);

  return (
    <div className="components">
      <section>
        <h2>{t('components.buttons')}</h2>
        <div className="buttons">
          <Button variant="primary">{t('components.primary')}</Button>
          <Button variant="secondary">{t('components.secondary')}</Button>
          <Button variant="quiet">{t('components.quiet')}</Button>
          <Button variant="danger">{t('components.danger')}</Button>
          <Button size="sm">{t('components.small')}</Button>
          <IconButton label={t('components.icon')} tooltip onPress={() => setProgress((value) => (value + 20) % 120)}>
            ↻
          </IconButton>
        </div>
      </section>

      <section>
        <h2>{t('components.fields')}</h2>
        <TextField label={t('components.name')} description={t('components.nameHint')} />
        <PasswordField label={t('components.password')} autoComplete="new-password" />
        <OtpField label={t('components.code')} />
        <SearchField label={t('components.search')} />
      </section>

      <section>
        <h2>{t('components.controls')}</h2>
        <Checkbox>{t('components.checkbox')}</Checkbox>
        <Switch>{t('components.switch')}</Switch>
        <ProgressBar label={t('components.progress')} value={Math.min(progress, 100)} showValue />
        <div className="buttons">
          <Badge>3</Badge>
          <Badge tone="accent">{t('components.new')}</Badge>
          <Badge tone="highlight">!</Badge>
          <Badge tone="neutral">0</Badge>
          <Badge tone="danger">9+</Badge>
        </div>
      </section>

      <section>
        <h2>{t('components.menu')}</h2>
        <MenuTrigger>
          <Button variant="secondary">{t('components.open')}</Button>
          <MenuPopover>
            <Menu onAction={(key) => setChosen(String(key))}>
              <MenuItem id="rename" shortcut="F2">
                {t('components.rename')}
              </MenuItem>
              <MenuItem id="duplicate">{t('components.duplicate')}</MenuItem>
              <MenuSeparator />
              <MenuItem id="delete" tone="danger">
                {t('components.delete')}
              </MenuItem>
            </Menu>
          </MenuPopover>
        </MenuTrigger>
        <div
          className="context-area"
          onContextMenu={(event) => {
            event.preventDefault();
            setMenuAt({ x: event.clientX, y: event.clientY });
          }}
        >
          {t('components.contextMenu')}
        </div>
        {menuAt !== null && (
          <ContextMenuPopover x={menuAt.x} y={menuAt.y} onClose={() => setMenuAt(null)}>
            <Menu
              onAction={(key) => {
                setChosen(String(key));
                setMenuAt(null);
              }}
            >
              <MenuItem id="rename">{t('components.rename')}</MenuItem>
              <MenuItem id="delete" tone="danger">
                {t('components.delete')}
              </MenuItem>
            </Menu>
          </ContextMenuPopover>
        )}
        {chosen !== null && <p className="muted">{t('components.chose', { item: chosen })}</p>}
      </section>

      <section>
        <h2>{t('components.tooltip')}</h2>
        <TooltipTrigger>
          <Button variant="quiet">{t('components.tooltip')}</Button>
          <Tooltip>{t('components.tooltipText')}</Tooltip>
        </TooltipTrigger>
      </section>

      <section>
        <h2>{t('components.dialog')}</h2>
        <Button variant="secondary" onPress={() => setDialog(true)}>
          {t('components.openDialog')}
        </Button>
        <Dialog
          isOpen={dialog}
          onOpenChange={setDialog}
          title={t('components.dialogTitle')}
          tone="danger"
          role="alertdialog"
          actions={
            <>
              <Button variant="secondary" onPress={() => setDialog(false)}>
                {t('components.cancel')}
              </Button>
              <Button variant="danger" onPress={() => setDialog(false)}>
                {t('components.delete')}
              </Button>
            </>
          }
        >
          {t('components.dialogText')}
        </Dialog>
      </section>
    </div>
  );
}
