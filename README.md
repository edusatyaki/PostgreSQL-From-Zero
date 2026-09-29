# PostgreSQL from Zero: a digital book

A book that teaches PostgreSQL to someone who has never written a line of SQL,
built from the class notes *PostgreSQL Class Notes, DE 1 to DE 9*. It uses the
same sketchnote design as
[MVCC & the Query Engine](https://github.com/edusatyaki/MVCC-the-Query-Engine):
cream paper, highlighter and hand-drawn boxes, in light and dark.

**Every query in the book runs on a real PostgreSQL 18 inside the page.**
Readers can press Edit, change any query and press Run.

## Run it

```bash
python3 serve.py 8110
```

Then open <http://localhost:8110>. `serve.py` sends `no-store`, so a plain
reload always shows the files on disk. It is also registered in
`../.claude/launch.json` as `postgresql-from-zero`.

## What is inside

| Ch | Title | From the notes | Data |
|----|-------|----------------|------|
| 0 | Before you start | new: tables, databases, SQL, first queries | `friends` |
| 1 | Your first table | Chapter 1: DDL, DML, constraints | `Students` |
| 2 | Asking questions | Chapter 2: SELECT, WHERE, LIKE, ORDER BY, pagination | `students` (40) |
| 3 | Cleaning messy data | Chapters 3 and 3A: number, date, string, NULL functions | `employees` |
| 4 | Summing up groups | Chapter 4: GROUP BY, aggregates, HAVING, CASE | `students` (clans) |
| 5 | Windows, part 1 | Chapter 5: window functions | `snitch_sales` |
| 6 | Windows, part 2 | Chapter 6: window functions drilled | `dinosaur_danger_log` |
| 7 | Queries inside queries | Chapter 7: subqueries | `students`, `marks`, `fee_payments` |
| 8 | Joining tables | Chapter 8: joins | `customers`, `orders`, `products` |
| 9 | A real schema | Chapter 9: foreign keys, CTEs, multi-join reports | 5-table shop |
| Fin | The whole course | the quick reference, and a final challenge | |

Every chapter follows the same path:

1. **Opener**: the question the chapter answers, the story, what you will be able to do.
2. **The data**: the CREATE + INSERT code, shown with its rows.
3. **Lessons**: *Situation, Code, Output, Explanation*. Some ask you to
   *think first* and guess the output before running it. Many have a drawing.
4. **Toolbox**: the chapter's important functions, one runnable card each.
5. **Checkpoint**: concept MCQs with instant feedback and an explanation.
6. **Bug hunt**: broken queries with their real error message (or, for the
   silent bugs, their wrong result). Pick the fix, then watch it run.
7. **Points to remember**, then a **Playground** with the chapter's tables.

The finale draws 15 random questions from every checkpoint.

## Real output, never typed by hand

`book/outputs.js` is **generated**. `tools/build.mjs` runs every lesson, card,
quiz check and bug-hunt query on PGlite (PostgreSQL 18.3 compiled to
WebAssembly) and records exactly what it printed, in psql's own format:
aligned tables, `(3 rows)`, command tags, and errors with the `LINE n:` caret.

```bash
npm install        # once: fetches PGlite
npm run build      # rewrites book/outputs.js and checks everything
```

The build fails if:

- a lesson errors without being marked `errors: true` (or is marked and does not error)
- a quiz question's `check` query does not return the marked answer
- a bug hunt's broken query runs clean without being marked `silent: true`,
  or its marked fix errors
- a toolbox example errors

Lessons build on each other the way the class did (1.9 renames the table that
1.10 reads). The build runs them in order, and in the browser a lesson replays
every earlier page of its chapter before running, so an edited query sees the
same data the notes describe.

## How the page runs SQL

- **Unchanged code**: Run shows the recorded output at once. Nothing is downloaded.
- **Edited code**: the first Run downloads PGlite from jsDelivr (about 5 MB),
  builds the chapter's tables, and runs the query live. After that a run takes
  about 100 ms.
- **Date queries** (`NOW()`, `CURRENT_DATE`) always run live, so readers see today's date.

## Editing the book

The content lives in `book/ch00.js` ... `book/ch10.js`, one plain JS object per
chapter. Page kinds are listed at the top of `book/index.js`. After changing
any SQL, run `npm run build`.

| File | What it is |
|------|------------|
| `index.html` | the page shell |
| `assets/app.js` | the reader: navigation, code boxes, quizzes, search, progress, read-aloud |
| `assets/sqlrun.js` | splits scripts and prints results like psql (shared by the build and the page) |
| `assets/pg.js` | loads PGlite on demand and queues runs |
| `assets/art.js` | the drawings, as inline SVG coloured by the theme |
| `book/narrate.js` | what the narrator says on each page |
| `tools/gen_audio.py` | records the narration into `audio/` |
| `assets/book.css` | the look, light and dark |

## Keys

| Key | Action |
|-----|--------|
| `Right` / `Left` | next / previous page |
| `/` | search topics and functions |
| `T` | light / dark |
| `F` | full screen (the chapter list moves behind the menu button) |
| `Ctrl` + `Enter` | run the code you are editing |

Progress, quiz answers and the theme are saved in the reader's browser only.

## The narrator

**Listen** plays a recorded explanation of the page in a female Indian English
voice: Microsoft's neural `en-IN-NeerjaNeural`, generated with the free
`edge-tts` tool. There is one clip per page (`audio/<page>.mp3`), fetched only
when pressed, and it stops when you turn the page.

The words come from `book/narrate.js`, built from the same chapter data as the
page, with symbols spelled out for speaking (`<>` becomes "not equal to", `%`
"percent", `psql` "P S Q L"). If a clip cannot play, the browser speaks the same
words, choosing a female Indian English voice when it has one (Veena or Lekha on a Mac, Heera on Windows).

After editing a chapter, re-record only the pages whose words changed:

```bash
python3 -m venv .venv && .venv/bin/pip install edge-tts
.venv/bin/python tools/gen_audio.py            # changed pages only
.venv/bin/python tools/gen_audio.py --all      # everything
```

## Deploy

`.github/workflows/static.yml` publishes the repository to GitHub Pages on
every push to `main`. For the first deploy, enable Pages with the
**GitHub Actions** source in the repository settings.
