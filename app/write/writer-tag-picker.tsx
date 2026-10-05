'use client';

import { Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  collectWriterTags,
  filterWriterTagSuggestions,
  parseWriterTags,
  type ArticleSummary,
} from './writer-model';
import styles from './writer-tag-picker.module.css';

interface WriterTagPickerProps {
  articles: ArticleSummary[];
  onChange: (value: string) => void;
  onLimit: () => void;
  value: string;
}

const MAX_TAGS = 12;

export function WriterTagPicker({ articles, onChange, onLimit, value }: WriterTagPickerProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const existingTags = useMemo(() => collectWriterTags(articles), [articles]);
  const selectedTags = useMemo(() => parseWriterTags(value), [value]);
  const suggestions = useMemo(
    () => filterWriterTagSuggestions(existingTags, selectedTags, query),
    [existingTags, query, selectedTags]
  );

  const addTag = (input: string) => {
    const tag = input.trim().replaceAll(',', '');
    if (
      !tag ||
      selectedTags.some(
        (selected) => selected.toLocaleLowerCase('ja') === tag.toLocaleLowerCase('ja')
      )
    ) {
      setQuery('');
      return;
    }
    if (selectedTags.length >= MAX_TAGS) {
      onLimit();
      return;
    }
    onChange([...selectedTags, tag].join(', '));
    setQuery('');
    setIsOpen(true);
  };

  const removeTag = (tag: string) =>
    onChange(selectedTags.filter((selected) => selected !== tag).join(', '));

  return (
    <div className={styles.tagField}>
      <span className={styles.fieldLabel}>タグ</span>
      {selectedTags.length > 0 && (
        <div className={styles.selectedTags} aria-label="選択中のタグ">
          {selectedTags.map((tag) => (
            <span key={tag}>
              {tag}
              <button aria-label={`${tag}を削除`} onClick={() => removeTag(tag)} type="button">
                <X aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className={styles.tagCombobox}>
        <Search aria-hidden="true" />
        <input
          aria-autocomplete="list"
          aria-controls="writer-tag-suggestions"
          aria-expanded={isOpen}
          aria-label="タグを検索または追加"
          onBlur={() => window.setTimeout(() => setIsOpen(false), 100)}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              addTag(suggestions[0] ?? query);
            }
            if (event.key === 'Escape') setIsOpen(false);
          }}
          placeholder="既存タグを検索、または新規タグを入力"
          role="combobox"
          value={query}
        />
        {isOpen && (suggestions.length > 0 || query.trim()) && (
          <div className={styles.tagSuggestions} id="writer-tag-suggestions" role="listbox">
            {suggestions.map((tag) => (
              <button
                aria-selected="false"
                key={tag}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => addTag(tag)}
                role="option"
                type="button"
              >
                <span>{tag}</span>
                <small>既存</small>
              </button>
            ))}
            {query.trim() &&
              !existingTags.some(
                (tag) => tag.toLocaleLowerCase('ja') === query.trim().toLocaleLowerCase('ja')
              ) && (
                <button
                  aria-selected="false"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => addTag(query)}
                  role="option"
                  type="button"
                >
                  <span>「{query.trim()}」を追加</span>
                  <small>新規</small>
                </button>
              )}
          </div>
        )}
      </div>
      <small>
        {selectedTags.length}/{MAX_TAGS}個・Enterで追加
      </small>
    </div>
  );
}
