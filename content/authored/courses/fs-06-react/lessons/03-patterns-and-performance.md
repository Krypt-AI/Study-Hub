---
{
  "id": "fs-06-react.l03",
  "title": "Hooks, forms and patterns that scale",
  "summary": "Custom hooks, context, reducers, routing and the habits that keep React applications fast and maintainable.",
  "objectives": [
    "Extract logic into a custom hook",
    "Choose between useState, useReducer and context",
    "Avoid common performance and correctness traps"
  ],
  "estimatedMinutes": 45,
  "topics": [
    "fs-06-react.patterns-and-performance"
  ],
  "resources": [
    {
      "title": "Reusing logic with custom hooks",
      "url": "https://react.dev/learn/reusing-logic-with-custom-hooks",
      "free": true,
      "official": true
    },
    {
      "title": "Scaling up with reducer and context",
      "url": "https://react.dev/learn/scaling-up-with-reducer-and-context",
      "free": true,
      "official": true
    }
  ]
}
---

## Custom hooks

A hook is a function whose name starts with `use` and that calls other hooks. It shares **logic**, not state: every caller gets its own state.

```tsx
function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    const saved = localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : initial;
  });
  useEffect(() => localStorage.setItem(key, JSON.stringify(value)), [key, value]);
  return [value, setValue] as const;
}
```

## useReducer

When many actions change related state, a reducer puts every transition in one pure function:

```ts
type Action = { type: "add"; text: string } | { type: "toggle"; id: number } | { type: "clear" };

function reducer(state: Todo[], action: Action): Todo[] {
  switch (action.type) {
    case "add":    return [...state, { id: Date.now(), text: action.text, done: false }];
    case "toggle": return state.map((t) => (t.id === action.id ? { ...t, done: !t.done } : t));
    case "clear":  return [];
  }
}
```

## Context

Context passes a value to a whole subtree without threading props: a theme, the signed-in user, the language. It is not a general state manager: every consumer re-renders when the value changes, so keep contexts small and focused.

## Routing and data

Single-page apps use a router (React Router, TanStack Router) to map URLs to components. Keep the URL as the source of truth for what the user is looking at (page, filters, selected id) so refresh, back and shared links work.

## Traps

- **Do not define components inside components**: they are re-created every render and lose their state.
- **Missing or unstable keys** in lists cause wrong state to stick to the wrong item.
- **Stale closures**: an effect that reads `count` but omits it from the dependency array sees an old value. Install the `react-hooks/exhaustive-deps` lint rule.
- Optimise **after measuring** (React DevTools Profiler). `memo`, `useMemo` and `useCallback` are tools for proven problems, not defaults.
- Split large bundles with `lazy()` and `Suspense`.
