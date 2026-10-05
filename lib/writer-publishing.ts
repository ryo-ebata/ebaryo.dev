export type PublicationMode = 'draft' | 'published' | 'scheduled';

interface PublicationState {
  createdAt: string;
  draft: boolean;
}

const addDays = (date: string, days: number): string => {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
};

export const getPublicationMode = (state: PublicationState, today: string): PublicationMode => {
  if (state.draft) return 'draft';
  return state.createdAt > today ? 'scheduled' : 'published';
};

export const applyPublicationMode = <State extends PublicationState>(
  state: State,
  mode: PublicationMode,
  today: string
): State => {
  if (mode === 'draft') return { ...state, draft: true };
  if (mode === 'published') {
    return {
      ...state,
      createdAt: state.createdAt <= today ? state.createdAt : today,
      draft: false,
    };
  }

  return {
    ...state,
    createdAt: state.createdAt > today ? state.createdAt : addDays(today, 1),
    draft: false,
  };
};

export const getSeoLengthState = (
  length: number,
  recommendedMin: number,
  maximum: number
): 'empty' | 'good' | 'long' | 'short' => {
  if (length === 0) return 'empty';
  if (length > maximum) return 'long';
  if (length < recommendedMin) return 'short';
  return 'good';
};
