---
{
  "id": "fs-04-git-and-tooling.l02",
  "title": "The terminal, Node and npm",
  "summary": "The commands you use daily, how packages and scripts work, and how to keep a project reproducible.",
  "objectives": [
    "Navigate and manage files from the terminal",
    "Install dependencies and run scripts with npm",
    "Read package.json and understand versioning"
  ],
  "estimatedMinutes": 35,
  "topics": [
    "fs-04-git-and-tooling.terminal-and-npm"
  ],
  "resources": [
    {
      "title": "npm documentation",
      "url": "https://docs.npmjs.com/",
      "free": true,
      "official": true
    },
    {
      "title": "Node.js learn",
      "url": "https://nodejs.org/en/learn",
      "free": true,
      "official": true
    }
  ]
}
---

## The terminal

```bash
pwd                 # where am I
ls -la              # list files, including hidden
cd src/components   # change directory (cd .. goes up)
mkdir app && cd app
cat package.json    # print a file
grep -rn "TODO" src # search text
rm -r old/          # delete (no recycle bin)
```

Pipes combine commands: `git log --oneline | head -5`. `>` writes output to a file. `Ctrl+C` stops a running process.

## package.json

```json
{
  "name": "study-hub",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "vitest run"
  },
  "dependencies": { "react": "^18.3.1" },
  "devDependencies": { "typescript": "~5.5.0" }
}
```

- `dependencies` ship with the app; `devDependencies` are build and test tools.
- `npm install` reads `package.json` and writes `package-lock.json`, which pins exact versions. **Commit the lock file** so everyone installs the same tree.
- `npm run dev` runs a script; `npm ci` does a clean install exactly from the lock file (use it in CI).
- `node_modules` is generated: put it in `.gitignore`.

## Semantic versioning

`MAJOR.MINOR.PATCH`: patch fixes bugs, minor adds compatible features, major breaks compatibility. `^1.4.2` allows `1.x.x` updates; `~1.4.2` allows `1.4.x` only.

## Environment variables

Configuration that differs per machine or holds secrets (API keys, database URLs) belongs in the environment, not in code: `process.env.DATABASE_URL`, loaded in development from a `.env` file that is **not** committed.
