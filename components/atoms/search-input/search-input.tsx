'use client';

import { Search, X } from 'lucide-react';
import { useRef, useState } from 'react';

import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  onChange: (value: string) => void | Promise<void>;
  placeholder?: string;
  value: string;
}

const handleCompositionStart = (isComposingRef: React.RefObject<boolean>) => () => {
  isComposingRef.current = true;
};

const createHandleCompositionEnd =
  (isComposingRef: React.RefObject<boolean>, onChange: (value: string) => void | Promise<void>) =>
  (event: React.CompositionEvent<HTMLInputElement>) => {
    isComposingRef.current = false;
    onChange(event.currentTarget.value);
  };

export const SearchInput = ({
  onChange,
  placeholder = '本文・タグも検索...',
  value,
}: SearchInputProps) => {
  const [inputValue, setInputValue] = useState(value);
  const isComposingRef = useRef(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setInputValue(newValue);
    if (!isComposingRef.current) {
      onChange(newValue);
    }
  };

  const handleClear = () => {
    setInputValue('');
    onChange('');
  };

  return (
    <div className="relative flex items-center">
      <Search
        data-testid="search-icon"
        className="pointer-events-none absolute left-3 size-4 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        aria-label="記事を検索"
        type="text"
        value={inputValue}
        onChange={handleChange}
        onCompositionStart={handleCompositionStart(isComposingRef)}
        onCompositionEnd={createHandleCompositionEnd(isComposingRef, onChange)}
        placeholder={placeholder}
        className={cn('pl-9', inputValue && 'pr-9')}
      />
      {inputValue && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={handleClear}
          className="absolute right-1 text-muted-foreground hover:text-foreground"
          aria-label="クリア"
        >
          <X className="size-4" />
        </Button>
      )}
    </div>
  );
};
