---
{
  "id": "fs-06-react.l01",
  "title": "Components, JSX and props",
  "summary": "Thinking in components: describing UI with JSX, passing data with props and rendering lists and conditions.",
  "objectives": [
    "Write function components and JSX",
    "Pass data down with props and render lists with keys",
    "Render conditionally and compose with children"
  ],
  "estimatedMinutes": 45,
  "topics": [
    "fs-06-react.components-and-props"
  ],
  "resources": [
    {
      "title": "React: your first component",
      "url": "https://react.dev/learn/your-first-component",
      "free": true,
      "official": true
    },
    {
      "title": "Passing props",
      "url": "https://react.dev/learn/passing-props-to-a-component",
      "free": true,
      "official": true
    }
  ]
}
---

## UI as a function of data

A React **component** is a function that takes data (props) and returns a description of the UI (JSX). React calls it and updates the DOM to match.

```tsx
type CourseCardProps = { title: string; lessons: number; done?: boolean };

function CourseCard({ title, lessons, done = false }: CourseCardProps) {
  return (
    <article className="card">
      <h2>{title}</h2>
      <p>{lessons} lessons {done && <strong>Complete</strong>}</p>
    </article>
  );
}
```

## JSX rules

- Return **one root** element (or a fragment `<>...</>`).
- Use `className`, `htmlFor`; close every tag (`<img />`).
- `{ }` embeds a JavaScript **expression**: `{title}`, `{items.length}`, `{ok ? "Yes" : "No"}`.
- Component names start with a capital letter; lowercase names are HTML elements.

## Props flow down

Data goes from parent to child through props; props are **read-only**. To let a child ask for a change, the parent passes a function:

```tsx
<CourseCard title="CSS" lessons={9} done />
<Button onClick={() => save(id)}>Save</Button>
```

## Lists and keys

```tsx
<ul>
  {courses.map((course) => (
    <li key={course.id}>{course.title}</li>
  ))}
</ul>
```

The `key` must be **stable and unique among siblings** (a database id). Using the array index breaks state and animations when the list is reordered.

## Conditions and children

```tsx
{loading ? <Spinner /> : <List items={items} />}
{error && <p role="alert">{error}</p>}
```

`children` lets a component wrap other content: `<Card><p>Inside</p></Card>`. Keep components small and focused; extract one when a piece of JSX has its own name, its own data or repeats.
