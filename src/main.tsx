// The SDK showcase: every method and event of @pithyx/sdk and every component of @pithyx/ui, to try them on a box.
import { connect } from '@pithyx/sdk';
import { UiProvider } from '@pithyx/ui';
import '@pithyx/ui/tokens.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Showcase } from './Showcase';
import './style.css';

const element = document.querySelector<HTMLElement>('#app')!;

try {
  const app = await connect();
  element.removeAttribute('aria-busy');
  createRoot(element).render(
    <StrictMode>
      <UiProvider locale={app.context.locale}>
        <Showcase app={app} />
      </UiProvider>
    </StrictMode>,
  );
} catch {
  // Opened outside the desktop (directly in a tab): there is no SDK to talk to.
  element.removeAttribute('aria-busy');
  element.textContent = 'This page runs inside the Pithyx desktop. Start it with npm run dev.';
}
