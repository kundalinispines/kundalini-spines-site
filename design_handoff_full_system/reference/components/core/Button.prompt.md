One-line: the site's only button; solid `primary` for the single main action per view, `ghost` for everything secondary.

```jsx
<Button variant="primary" href="/about.html">Enter the World</Button>
<Button variant="ghost">Listen Now</Button>
```

- Never more than one `primary` in a row of actions — the hero pairs primary + ghost.
- `sm` exists for the track focus panel, where five actions share one row.
- Disabled means "not connected yet", not "forbidden": the site renders honest disabled placeholders rather than dead links.
