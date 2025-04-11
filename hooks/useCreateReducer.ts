import { useMemo, useReducer } from 'react';

/**
 * Extracts property names from the initial state for typesafe dispatch objects.
 * Right now, it doesn't really matter if T[K] is string or not—both map to K.
 * But if you have logic that specifically wants to treat some fields differently,
 * you can adjust the extends check (T[K] extends string ? K : never, etc.).
 */
export type FieldNames<T> = {
  [K in keyof T]: K;
}[keyof T];

/**
 * Returns the Action type for the dispatch object:
 * - { type: 'reset' }
 * - { type?: 'change'; field: FieldNames<T>; value: any }
 *   (If type is not provided, we treat it as "change".)
 */
export type ActionType<T> =
  | { type: 'reset' }
  | { type?: 'change'; field: FieldNames<T>; value: any };

/**
 * useCreateReducer gives you a typed dispatch and state.
 * Example usage:
 *   const { state, dispatch } = useCreateReducer({ initialState });
 *   dispatch({ field: 'someField', value: 'newValue' }); // default "change"
 *   dispatch({ type: 'reset' });
 */
export const useCreateReducer = <T>({ initialState }: { initialState: T }) => {
  type Action =
    | { type: 'reset' }
    | { type?: 'change'; field: FieldNames<T>; value: any };

  const reducer = (state: T, action: Action) => {
    // If there's no "type", assume it's a "change" => update the field
    if (!action.type) {
      return {
        ...state,
        [action.field]: action.value,
      };
    }

    // If "reset", return initialState
    if (action.type === 'reset') {
      return initialState;
    }

    // Otherwise, handle or throw an error for unknown types
    throw new Error(`Unknown action type: ${action.type}`);
  };

  const [state, dispatch] = useReducer(reducer, initialState);

  // Memoize the result so re-renders won't re-create objects
  return useMemo(
    () => ({ state, dispatch }),
    [state, dispatch],
  );
};
