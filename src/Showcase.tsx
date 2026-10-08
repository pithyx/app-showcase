import { isProblem, type MethodName, type PithyxApp } from '@pithyx/sdk';
import { createI18n } from '@pithyx/sdk/i18n';
import {
  Badge,
  Button,
  Checkbox,
  ContextMenuPopover,
  Dialog,
  IconButton,
  Menu,
  MenuItem,
  MenuPopover,
  MenuSeparator,
  MenuTrigger,
  OtpField,
  PasswordField,
  ProgressBar,
  SearchField,
  Switch,
  TextField,
  Tooltip,
  TooltipTrigger,
} from '@pithyx/ui';
import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import de from '../i18n/de.json';
import en from '../i18n/en.json';
import { demos, groups, initialState } from './demos';
import { eventNames, record, type EventRecord } from './events';

type Tab = 'methods' | 'events' | 'context' | 'components';

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
  const [tab, setTab] = useState<Tab>('methods');
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

  return (
    <div className="showcase">
      <nav className="tabs" aria-label={t('title')}>
        {(['methods', 'events', 'context', 'components'] as const).map((name) => (
          <Button key={name} variant={tab === name ? 'primary' : 'quiet'} size="sm" onPress={() => setTab(name)}>
            {t(`tabs.${name}`)}
          </Button>
        ))}
      </nav>

      {tab === 'methods' && (
        <div className="methods" onMouseDown={remember}>
          <div className="groups">
            {Object.entries(groups).map(([group, methods]) => (
              <section key={group}>
                <h2>{t(`groups.${group}`)}</h2>
                <div className="buttons">
                  {methods.map((method) => (
                    <Button
                      key={method}
                      size="sm"
                      variant="secondary"
                      onPress={() => void run(method)}
                      {...(app.supports(method) ? {} : { 'aria-description': t('unsupported') })}
                    >
                      <code>{method}</code>
                    </Button>
                  ))}
                </div>
              </section>
            ))}
            <Checkbox isSelected={askBeforeClose} onChange={setAskBeforeClose}>
              {t('close.label')}
            </Checkbox>
          </div>
          <section className="result" aria-live="polite">
            <h2>{t('result.title')}</h2>
            {result === null ? (
              <p className="muted">{t('result.empty')}</p>
            ) : (
              <>
                <code className={result.failed ? 'failed' : undefined}>{result.method}</code>
                <pre>{result.text}</pre>
              </>
            )}
          </section>
        </div>
      )}

      {tab === 'events' && (
        <section>
          <Button size="sm" variant="quiet" onPress={() => setEvents([])}>
            {t('events.clear')}
          </Button>
          {events.length === 0 ? (
            <p className="muted">{t('events.empty')}</p>
          ) : (
            <ol className="events">
              {events.map((entry, index) => (
                <li key={`${entry.at}-${index}`}>
                  <span className="muted">{entry.at}</span> <code>{entry.event}</code>
                  <pre>{show(entry.data)}</pre>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      {tab === 'context' && (
        <section key={contextVersion}>
          <pre>{show(app.context)}</pre>
        </section>
      )}

      {tab === 'components' && <Components t={t} />}

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
              OK
            </Button>
          </>
        }
      >
        {t('close.question')}
      </Dialog>
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
