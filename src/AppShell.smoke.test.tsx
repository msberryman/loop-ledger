import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AppShell from './AppShell';
import { MemoryRouter } from 'react-router-dom';

function renderApp(path = '/home') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppShell />
    </MemoryRouter>
  );
}

beforeEach(() => localStorage.clear());

describe('Base UI contract', () => {
  it('renders all 5 nav links and navigates', async () => {
    const { unmount } = renderApp('/home');
    const tabs = ['Home', 'Loops', 'Expenses', 'Tips', 'Settings'] as const;

    for (const t of tabs) {
      expect(await screen.findByRole('link', { name: t })).toBeInTheDocument();
    }

    const user = userEvent.setup();
    await user.click(screen.getByRole('link', { name: 'Loops' }));
    expect(await screen.findByRole('heading', { name: 'Loops' })).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'Settings' }));
    expect(await screen.findByRole('heading', { name: 'Settings' })).toBeInTheDocument();

    unmount();
  });

  it('persists loops/expenses/tips/settings', async () => {
    const user = userEvent.setup();
    let app = renderApp('/loops');

    // Loops
    await user.type(screen.getByLabelText(/date/i), '2025-10-15');
    await user.type(screen.getByLabelText(/course/i), 'Fields Ranch');
    await user.click(screen.getByRole('button', { name: /add loop/i }));

    // Expenses
    await user.click(screen.getByRole('link', { name: 'Expenses' }));
    await user.type(screen.getByLabelText(/date/i), '2025-10-15');
    const cat = screen.getByLabelText(/category/i) as HTMLInputElement;
    await user.clear(cat);
    await user.type(cat, 'Mileage');
    await user.type(screen.getByLabelText(/^amount/i), '12.34');
    await user.click(screen.getByRole('button', { name: /add expense/i }));

    // Tips
    await user.click(screen.getByRole('link', { name: 'Tips' }));
    await user.type(screen.getByLabelText(/date/i), '2025-10-15');
    await user.type(screen.getByLabelText(/^amount/i), '40');
    await user.click(screen.getByRole('button', { name: /add tip/i }));

    // Settings
    await user.click(screen.getByRole('link', { name: 'Settings' }));
    await user.type(screen.getByLabelText(/home address/i), '123 Main St');
    const rate = screen.getByLabelText(/mileage rate/i) as HTMLInputElement;
    await user.clear(rate);
    await user.type(rate, '0.67');
    await user.click(screen.getByRole('button', { name: /save/i }));

    // Simulate refresh: unmount, then mount again
    app.unmount();
    app = renderApp('/loops');

    expect(await screen.findByText('Fields Ranch')).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'Expenses' }));
    expect(await screen.findByText(/\$12\.34/)).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'Tips' }));
    expect(await screen.findByText(/\$40\.00/)).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'Settings' }));
    expect((screen.getByLabelText(/home address/i) as HTMLInputElement).value).toBe('123 Main St');

    app.unmount();
  });
});