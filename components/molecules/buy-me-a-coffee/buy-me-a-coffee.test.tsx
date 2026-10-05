import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BuyMeACoffee } from './buy-me-a-coffee';

describe('BuyMeACoffee', () => {
  it('見出しテキストを表示する', () => {
    render(<BuyMeACoffee />);
    expect(screen.getByText('コーヒーで応援する')).toBeInTheDocument();
  });

  it('外部の応援ページへ移動するリンクを表示する', () => {
    render(<BuyMeACoffee />);
    const link = screen.getByRole('link', { name: /Buy me a coffee/u });

    expect(link).toHaveAttribute('href', 'https://buymeacoffee.com/ryoebata');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
