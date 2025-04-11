// file: /hooks/useCreateReducer.ts

import { useMemo, useReducer } from 'react';

// Let FieldNames<T> simply be `keyof T`:
export type FieldNames<T> = keyof T;

/**
 * Now we define one strict union:
 *   - { type: 'reset' }
 *   - { type: 'change'; field: FieldNames<T>; value: any }
 */
export type ActionType<T> =
  | { type: 'reset' }
  | { type: 'change'; field: FieldNames<T>; value: any };

export const useCreateReducer = <T>({ initialState }: { initialState: T }) => {
  // Our local Action is the same union:
  type Action =
    | { type: 'reset' }
    | { type: 'change'; field: FieldNames<T>; value: any };

  // The reducer now switches on `action.type`:
  const reducer = (state: T, action: Action) => {
    switch (action.type) {
      case 'reset':
        return initialState;

      case 'change':
        return { ...state, [action.field]: action.value };

      default:
        // We never expect other action types:
        throw new Error(`Unknown action type: ${action}`);
    }
  };

  const [state, dispatch] = useReducer(reducer, initialState);

  // Return a stable object
  return useMemo(() => ({ state, dispatch }), [state, dispatch]);
};
