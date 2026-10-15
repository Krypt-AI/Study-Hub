---
{
  "id": "fs-06-react.l02",
  "title": "State, events and effects",
  "summary": "Remembering values between renders, updating them correctly, and synchronising with the outside world.",
  "objectives": [
    "Use useState and update state immutably",
    "Decide where state should live",
    "Use useEffect only to synchronise with external systems"
  ],
  "estimatedMinutes": 55,
  "topics": [
    "fs-06-react.state-and-effects"
  ],
  "resources": [
    {
      "title": "State: a component's memory",
      "url": "https://react.dev/learn/state-a-components-memory",
      "free": true,
      "official": true
    },
    {
      "title": "You might not need an effect",
      "url": "https://react.dev/learn/you-might-not-need-an-effect",
      "free": true,
      "official": true
    }
  ]
}
---

## useState

```tsx
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>Clicked {count}</button>;
}
```

State is **the component's memory**. Calling the setter schedules a re-render with the new value. Regular variables reset every render; state persists.

## Update rules

- **Never mutate** state; give React a new value.

```tsx
setTodos([...todos, newTodo]);                         // add
setTodos(todos.filter((t) => t.id !== id));            // remove
setTodos(todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t))); // change
```

- When the next value depends on the previous one, pass a function: `setCount((c) => c + 1)`.
- State updates are applied on the **next render**; reading `count` right after `setCount` still gives the old value.

## Where should state live?

Put state in the **lowest component that all users of it share**. If two siblings need the same value, **lift it** to their parent and pass it down. Derive everything else during render instead of storing it:

```tsx
const [todos, setTodos] = useState<Todo[]>([]);
const remaining = todos.filter((t) => !t.done).length; // derived, not state
```

## Controlled inputs

```tsx
const [name, setName] = useState("");
<input value={name} onChange={(e) => setName(e.target.value)} />
```

## useEffect

An effect **synchronises a component with something outside React**: a network request, a subscription, a timer, the page title.

```tsx
useEffect(() => {
  const controller = new AbortController();
  fetch(`/api/courses/${id}`, { signal: controller.signal })
    .then((r) => r.json())
    .then(setCourse)
    .catch(() => {});
  return () => controller.abort();      // cleanup
}, [id]);                               // re-run when id changes
```

The dependency array lists every value the effect reads. Do **not** use an effect to compute values from props or state, or to respond to a click; do that during render or in the event handler. For server data, a library such as TanStack Query handles caching and loading states for you.
