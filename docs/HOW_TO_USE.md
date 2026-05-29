# TAP V2 — How to use the admin quiz builder

This guide walks through creating a quiz, designing question screens, mapping answers to results, and publishing a public link for students.

**Before you start:** run the one-time setup from the main [README](../readme.md) (macOS or Windows script). You need the admin app running at http://localhost:5173.

**Screenshots:** Image placeholders are included below. After you clone the repo, add your screenshots under `docs/images/` using the filenames shown (or update the paths in this file).

---

## Table of contents

1. [Sign in to the admin dashboard](#1-sign-in-to-the-admin-dashboard)
2. [Create a new quiz](#2-create-a-new-quiz)
3. [Open the quiz builder](#3-open-the-quiz-builder)
4. [Add a language](#4-add-a-language)
5. [Add questions and set order](#5-add-questions-and-set-order)
6. [Design each question screen](#6-design-each-question-screen)
7. [Map answers to custom results (optional)](#7-map-answers-to-custom-results-optional)
8. [Quiz settings](#8-quiz-settings)
9. [Save your work](#9-save-your-work)
10. [Publish the quiz](#10-publish-the-quiz)
11. [Manage public links](#11-manage-public-links)
12. [Share with students and test](#12-share-with-students-and-test)
13. [Enable or disable a quiz](#13-enable-or-disable-a-quiz)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. Sign in to the admin dashboard

1. Open **http://localhost:5173/admin/login** in your browser.
2. Sign in with the admin credentials from the README:

   | Field | Value |
   |-------|--------|
   | Email | `admin@tap.local` |
   | Password | `TAPadmin2026` |

3. After login you land on the **Dashboard**. Use the sidebar **Quizzes** to manage quizzes.

<!-- Add screenshot: docs/images/01-admin-login.png -->
![Admin login screen](images/01-admin-login.png)

---

## 2. Create a new quiz

1. Go to **Quizzes** in the left sidebar.
2. Click **New Quiz**.
3. Enter a **quiz name** (for example, `Spring 2026 intake`) and click **Create quiz**.
4. You are taken straight into the **quiz builder** for that quiz.

<!-- Add screenshot: docs/images/02-new-quiz.png -->
![New quiz dialog and quizzes list](images/02-new-quiz.png)

---

## 3. Open the quiz builder

From **Quizzes**, click **Edit** on any row to open the builder at:

`http://localhost:5173/admin/quizzes/{id}/builder`

The builder has five tabs:

| Tab | Purpose |
|-----|---------|
| **Questions** | Add screens, reorder flow, open the screen designer |
| **Answers** | Map student choices to custom result outcomes (optional) |
| **Languages** | Add languages for translations |
| **Settings** | Quiz name, description, result engine |
| **Links** | Create and manage public student URLs |

At the top you also have **Save draft**, **Publish**, and the **Public URL** bar (slug).

<!-- Add screenshot: docs/images/03-quiz-builder-overview.png -->
![Quiz builder overview with tabs](images/03-quiz-builder-overview.png)

---

## 4. Add a language

You need at least one language before you can publish.

1. Open the **Languages** tab.
2. Enter a **code** (for example `English`) and optional **display name**.
3. Click **Add**.
4. Click a language button to choose which translation you are editing (shown as “Editing: **English**” on the tab).

> **Note:** Adding a language does not create quiz screens by itself. You still add questions on the **Questions** tab.

<!-- Add screenshot: docs/images/04-languages.png -->
![Languages tab](images/04-languages.png)

---

## 5. Add questions and set order

1. Open the **Questions** tab.
2. Click **+ Add question**.
3. Enter a **screen name** (for example `Passion` or `Partner choice`). This becomes the question title and internal key.
4. Repeat for each step in your quiz flow.

**Order:** Drag the **⋮⋮** handle on a row to reorder questions. Students see questions from top to bottom; the last question’s **Next** action leads to the result.

**Row actions** (⋮ menu on each question):

| Action | What it does |
|--------|----------------|
| **Design** | Opens the visual screen editor (new browser tab) |
| **View design** | Preview the saved screen in a modal |
| **Duplicate design** | Copy one screen’s layout to another question |
| **Delete** | Remove the question |

<!-- Add screenshot: docs/images/05-questions-list.png -->
![Questions list with add and reorder](images/05-questions-list.png)

---

## 6. Design each question screen

1. On the **Questions** tab, open **Design** for a question (or go to  
   `/admin/quizzes/{quizId}/builder/design/{questionId}`).
2. Use the **component rail** on the right: drag or double-click items (text, button, image, carousel, etc.) onto the phone canvas.
3. Click an element to edit it in the **inspector** (right panel):
   - Text, images, colours, fonts, position, size
   - **Classified as option** — turn **On** for any tappable choice students can select (required for answer mapping)
   - Button **actions** — e.g. navigate to **Next** question or a specific screen
4. Click **Save layout** when you are happy with the screen.
5. Use the screen switcher in the designer to move between questions without returning to the list.

**Tips**

- Mark every selectable answer (image button, choice tile, etc.) with **Classified as option** so the **Answers** tab can map them.
- Use **Save draft** on the builder toolbar to persist quiz status without publishing.
- Upload images through element settings where supported; assets are stored for the quiz.

<!-- Add screenshot: docs/images/06-question-designer.png -->
![Question screen designer with canvas and component rail](images/06-question-designer.png)

<!-- Add screenshot: docs/images/07-option-toggle.png -->
![Inspector showing “Classified as option” toggle](images/07-option-toggle.png)

---

## 7. Map answers to custom results (optional)

Use this if you want specific result screens based on which options the student picked. If you use the default **TAP personality (Groq)** engine only, you can skip this section and rely on AI-generated results (requires `GROQ_API_KEY` in `backend/.env`).

1. Open the **Answers** tab.
2. Click **+ Add result**.
3. Fill in:
   - **Rule name** — internal label
   - **Result title** / **Result description** — shown on the result screen
   - **Conditions** — for each rule, pick a **Question** and the **Option** the student must choose
4. Click **Save** in the modal.
5. In the table, use **Design** to lay out that result screen (same canvas editor as questions).
6. Fix any **⚠** warnings before publishing (they mean a question or option changed and the rule needs updating).

**Important:** Answer rules and result designs are stored in your **browser** (`localStorage`) for this quiz. Use the same computer and browser when building and testing. Clearing site data removes them.

If you use custom results, every question that has selectable options should appear in at least one rule’s conditions before you publish.

<!-- Add screenshot: docs/images/08-answers-tab.png -->
![Answers tab with result rules](images/08-answers-tab.png)

---

## 8. Quiz settings

Open the **Settings** tab to update:

- **Name** and **description**
- **Result engine** — `TAP personality (Groq)` uses the AI result pipeline; `Static` is reserved for future use
- **TAP required keys** — reference chips (`passion`, `partner`, `treasure`, etc.) if you align with the standard TAP personality quiz structure

Click **Save details** after changes.

<!-- Add screenshot: docs/images/09-settings.png -->
![Settings tab](images/09-settings.png)

---

## 9. Save your work

- **Save draft** — sets quiz status to `draft` and saves your progress. Safe to use often while building.
- **Save layout** — on each question or result design screen, saves only that screen’s layout.

You do not need to publish until the quiz is ready for students.

---

## 10. Publish the quiz

Publishing makes the quiz **active** in the database so public links can serve it.

**Requirements before publish:**

- At least one **language**
- At least one **question**
- If you use **Answers** rules, all rules must be valid (no ⚠ on the Answers tab)

**Steps:**

1. Click **Publish** in the builder toolbar.
2. If prompted, set a **public URL slug**:
   - **URL slug hint** — friendly label (for example `Spring 2026 cohort`)
   - **Slug** — the path segment students use: `http://localhost:5173/q/your-slug`
3. Confirm **Save** (and publish if the dialog was opened from Publish).

The **Public URL** bar at the top of the builder shows the live link when a slug exists.

<!-- Add screenshot: docs/images/10-publish-slug.png -->
![Publish / slug dialog](images/10-publish-slug.png)

---

## 11. Manage public links

1. Open the **Links** tab (or use **Set slug** / **Edit slug** in the Public URL bar).
2. Create a link with **link name** and **slug**, or edit existing links.
3. Set link status to **active** so students can open it.
4. Use **Copy URL** to share.

Students open:

`http://localhost:5173/q/{slug}`

(In production, replace the host with your deployed domain.)

The quiz must be **published (active)** and the link **active**. Draft or inactive quizzes show an unavailable screen.

<!-- Add screenshot: docs/images/11-public-links.png -->
![Public quiz links panel](images/11-public-links.png)

---

## 12. Share with students and test

1. Copy the public URL from the **Links** tab or the **Public URL** bar.
2. Open it in a new tab (or on your phone on the same network if configured).
3. Walk through the quiz as a student: intro → questions → result.

**Quick checklist**

| Check | Expected |
|-------|----------|
| Quiz status | `active` (after Publish) |
| Link status | `active` |
| Questions | All screens designed and saved |
| Options | Tappable choices marked as options |
| Custom results | Rules valid if you use the Answers tab |

<!-- Add screenshot: docs/images/12-student-quiz.png -->
![Student-facing public quiz](images/12-student-quiz.png)

---

## 13. Enable or disable a quiz

On the **Quizzes** list, use the **Active** toggle for each row:

- **Active** — quiz can be served when published and linked
- **Disabled** — students cannot access it even if a link exists

This is separate from **Save draft**, which marks the quiz as a work-in-progress.

---

## 14. Troubleshooting

| Problem | What to try |
|---------|-------------|
| Cannot publish | Add at least one language and one question. Fix ⚠ on the **Answers** tab if you use custom results. |
| Publish blocked: answers need remapping | Open **Answers**, edit rules with warnings, update conditions to match current questions/options. |
| Public link shows “unavailable” | Publish the quiz, set link to **active**, and ensure the quiz **Active** toggle is on. |
| Admin login fails | Check `backend/.env` for `ADMIN_EMAIL` / `ADMIN_PASSWORD`; restart the backend. |
| No AI personality text | Add `GROQ_API_KEY` to `backend/.env` and restart Flask. |
| Custom results missing on another PC | Answer rules are in browser storage; rebuild on that machine or plan a future server-side export. |
| Changes not visible on public quiz | Hard-refresh the student page; confirm you published after saving layouts. |

For installation issues, see [Client quick start](../readme.md#client-quick-start-one-time-setup) in the README.

---

## Quick reference — URLs

| Page | URL |
|------|-----|
| Admin login | http://localhost:5173/admin/login |
| Quiz list | http://localhost:5173/admin/quizzes |
| Quiz builder | http://localhost:5173/admin/quizzes/{id}/builder |
| Public quiz | http://localhost:5173/q/{slug} |
