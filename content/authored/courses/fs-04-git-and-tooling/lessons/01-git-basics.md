---
{
  "id": "fs-04-git-and-tooling.l01",
  "title": "Git: commits, branches and merging",
  "summary": "The three areas of Git, a clean commit habit, branches and how work is combined and recovered.",
  "objectives": [
    "Explain the working tree, staging area and repository",
    "Create commits and branches and merge them",
    "Undo mistakes safely"
  ],
  "estimatedMinutes": 45,
  "topics": [
    "fs-04-git-and-tooling.git-basics"
  ],
  "resources": [
    {
      "title": "Pro Git book",
      "url": "https://git-scm.com/book/en/v2",
      "free": true,
      "official": true
    },
    {
      "title": "Git reference",
      "url": "https://git-scm.com/docs",
      "free": true,
      "official": true
    }
  ]
}
---

## Three areas

```
working tree  --git add-->  staging area  --git commit-->  repository
(your files)               (the next commit)               (history)
```

```bash
git init
git status                      # what changed and what is staged
git add src/app.ts              # stage one file (or `git add -p` to choose hunks)
git commit -m "Add course list"
git log --oneline --graph
git diff                        # unstaged changes; `git diff --staged` for staged
```

A **commit** is a snapshot with a message, an author and a pointer to its parent. Make small commits that each do one thing and say *why* in the message.

## Branches

A branch is a movable name pointing at a commit, so creating one is instant and cheap.

```bash
git switch -c feature/login     # create and switch
# ...edit, commit...
git switch main
git merge feature/login         # bring the work in
git branch -d feature/login
```

A **fast-forward** merge just moves the pointer; otherwise Git makes a **merge commit**. When both sides changed the same lines you get a **conflict**: open the file, keep the right text, remove the `<<<<<<<` markers, `git add`, then `git commit`.

## Remotes

```bash
git clone https://github.com/user/repo.git
git fetch            # download, change nothing
git pull             # fetch + merge
git push -u origin feature/login
```

The usual team flow: branch, commit, push, open a **pull request**, get a review, merge.

## Undoing things

| Goal | Command |
|---|---|
| Discard unstaged edits in a file | `git restore file` |
| Unstage a file | `git restore --staged file` |
| Fix the last commit message (unpushed) | `git commit --amend` |
| Undo a pushed commit safely | `git revert <hash>` (adds a new commit) |
| Find lost commits | `git reflog` |

Never rewrite history that others have pulled. Add secrets and build output to `.gitignore`, and never commit a secret: removing it later does not remove it from history.
