import { useReducer, useCallback } from 'react';

export interface Cycle {
  d: 0 | 1;
  q: 0 | 1;
  metastable: boolean;
}

interface State {
  history: Cycle[];
  currentD: 0 | 1;
  currentQ: 0 | 1;
  violate: boolean;
}

type Action =
  | { type: 'STEP' }
  | { type: 'TOGGLE_D' }
  | { type: 'TOGGLE_VIOLATE' }
  | { type: 'RESET' };

const MAX_HISTORY = 20;

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'STEP': {
      const metastable = state.violate && Math.random() < 0.4;
      const newQ: 0 | 1 = metastable ? state.currentQ : state.currentD;
      const cycle: Cycle = { d: state.currentD, q: newQ, metastable };
      const history = [...state.history, cycle].slice(-MAX_HISTORY);
      return { ...state, history, currentQ: newQ };
    }
    case 'TOGGLE_D':
      return { ...state, currentD: state.currentD === 0 ? 1 : 0 };
    case 'TOGGLE_VIOLATE':
      return { ...state, violate: !state.violate };
    case 'RESET':
      return { history: [], currentD: 0, currentQ: 0, violate: false };
    default:
      return state;
  }
}

const INITIAL: State = { history: [], currentD: 1, currentQ: 0, violate: false };

export function useDFlipFlop() {
  const [state, dispatch] = useReducer(reducer, INITIAL);

  const step = useCallback(() => dispatch({ type: 'STEP' }), []);
  const toggleD = useCallback(() => dispatch({ type: 'TOGGLE_D' }), []);
  const toggleViolate = useCallback(() => dispatch({ type: 'TOGGLE_VIOLATE' }), []);
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  return { state, step, toggleD, toggleViolate, reset };
}
