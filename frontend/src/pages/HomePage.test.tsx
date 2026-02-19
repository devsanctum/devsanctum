import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomePage from './HomePage';

describe('HomePage', () => {
  beforeEach(() => {
    // Mock fetch with a resolved promise
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          json: () => Promise.resolve({ status: 'ok', timestamp: '2024-01-01', environment: 'test', database: 'connected' }),
        }),
      ),
    );
  });

  it('renders welcome message', () => {
    render(<HomePage />);
    expect(screen.getByText(/Welcome to DevSanctum/i)).toBeInTheDocument();
  });

  it('displays loading state initially', () => {
    render(<HomePage />);
    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
  });
});
