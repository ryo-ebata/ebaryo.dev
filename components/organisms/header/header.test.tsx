import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Header } from './header';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

vi.mock('@/contexts/theme-provider', () => ({
  useTheme: () => ({
    theme: 'dark',
    actualTheme: 'dark',
    setTheme: vi.fn(),
  }),
}));

describe('Header', () => {
  it('サイト名を表示する', () => {
    render(<Header />);
    expect(screen.getByText('ebaryo.dev')).toBeInTheDocument();
  });

  it('ナビゲーションリンクを表示する', () => {
    render(<Header />);
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'About' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Portfolio' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Blog' })).toBeInTheDocument();
  });

  it('ローカル環境では管理画面へのリンクを表示する', async () => {
    render(<Header />);

    expect(await screen.findByRole('link', { name: '記事管理' })).toHaveAttribute('href', '/write');
    expect(screen.getByRole('link', { name: 'Portfolio管理' })).toHaveAttribute(
      'href',
      '/portfolio/manage'
    );
  });

  it('現在地リンクに aria-current="page" を付与する', () => {
    render(<Header />);
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'About' })).not.toHaveAttribute('aria-current');
  });

  it('テーマ切り替えボタンを表示する', () => {
    render(<Header />);
    expect(screen.getByText('テーマを切り替え')).toBeInTheDocument();
  });

  it('header要素としてレンダリングする', () => {
    render(<Header />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('メニューボタンの初期状態は閉じている', () => {
    render(<Header />);
    expect(screen.getByRole('button', { name: 'メニューを開く' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  it('メニューボタンをクリックすると開閉する', () => {
    render(<Header />);
    const toggleButton = screen.getByRole('button', { name: 'メニューを開く' });

    fireEvent.click(toggleButton);
    expect(screen.getByRole('button', { name: 'メニューを閉じる' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );

    fireEvent.click(screen.getByRole('button', { name: 'メニューを閉じる' }));
    expect(screen.getByRole('button', { name: 'メニューを開く' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  it('Escapeキーでメニューを閉じる', () => {
    render(<Header />);
    fireEvent.click(screen.getByRole('button', { name: 'メニューを開く' }));
    expect(screen.getByRole('button', { name: 'メニューを閉じる' })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.getByRole('button', { name: 'メニューを開く' })).toBeInTheDocument();
  });
});
