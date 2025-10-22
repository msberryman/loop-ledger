// src/AppShell.smoke.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import user from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AppShell from './AppShell';

function renderAt(path = '/home') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppShell />
    </MemoryRouter>
  );
}

describe('Base UI contract', () => {
  it('smoke: can render and navigate core tabs', async () => {
    const app = renderAt('/home');

    // Text links that still exist
    expect(await screen.findByRole('link', { name: /loops/i })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: /expenses/i })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: /income/i })).toBeInTheDocument();

    // Icon-only items are present via aria-labels
    expect(screen.getByLabelText(/home/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/settings/i)).toBeInTheDocument();

    app.unmount();
  });

  it('persists loops/expenses/income/settings', async () => {
    let app = renderAt('/loops');

    // ---- Loops: add a loop (Loop Type is required) ----
    await user.type(screen.getByLabelText(/date/i), '2025-10-15');
    await user.type(screen.getByLabelText(/course/i), 'Fields Ranch');
    await user.click(screen.getByRole('button', { name: /single bag/i }));
    await user.click(screen.getByRole('button', { name: /add loop/i }));

    // It appears in the list
    expect(await screen.findByText('Fields Ranch')).toBeInTheDocument();

    // ---- Expenses reachable
    await user.click(screen.getByRole('link', { name: /expenses/i }));
    expect(await screen.findByText(/add expense/i)).toBeInTheDocument();

    // ---- Income reachable
    await user.click(screen.getByRole('link', { name: /income/i }));
    expect(await screen.findByText(/add income/i)).toBeInTheDocument();

    // ---- Settings reachable (icon-only nav item)
    await user.click(screen.getByLabelText(/settings/i));
    // Assert on real content in Settings (header was removed)
    expect(await screen.findByText(/export all data/i)).toBeInTheDocument();

    app.unmount();

    // Sanity re-mount
    app = renderAt('/loops');
    expect(await screen.findByText(/loops/i)).toBeInTheDocument();
    app.unmount();
  });
});
