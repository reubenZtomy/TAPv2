# TAP V2 — How to use the admin quiz builder

This guide walks through creating a quiz, designing question screens, adding translations, mapping answers to results, and publishing a public link for students.

**Before you start:** run the one-time setup from the main [README](../readme.md) (macOS or Windows script). You need the admin app running at http://localhost:5173.

---

## Table of contents

1. [Sign in to the admin dashboard](#1-sign-in-to-the-admin-dashboard)
2. [Create a new quiz](#2-create-a-new-quiz)
3. [Open the quiz builder](#3-open-the-quiz-builder)
4. [Add questions and set order](#4-add-questions-and-set-order)
5. [Design each question screen](#5-design-each-question-screen)
6. [Add languages and translations](#6-add-languages-and-translations)
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
2. Sign in with **`ADMIN_EMAIL`** and **`ADMIN_PASSWORD`** from your **`backend/.env`** file.

   On a **brand-new** install (no `backend/.env` yet), the setup script creates that file from [`.env.example`](../backend/.env.example), which defaults to `admin@tap.local` / `TAPadmin2026`. If you already had `backend/.env`, use **your** values — check the file or the output of `setup-windows.ps1` / `setup-mac.sh`.

3. After login you land on the **Dashboard**. Use the sidebar **Quizzes** to manage quizzes.

---

## 2. Create a new quiz

1. Go to **Quizzes** in the left sidebar.
2. Click **New Quiz**.
3. Enter a **quiz name** (for example, `Spring 2026 intake`) and click **Create quiz**.
4. You are taken straight into the **quiz builder** for that quiz.

New quizzes start with a default language (usually **English**). You need at least one language and one question before you can publish.

---

## 3. Open the quiz builder

From **Quizzes**, click **Edit** on any row to open the builder at:

`http://localhost:5173/admin/quizzes/{id}/builder`

The builder has five tabs:

| Tab | Purpose |
|-----|---------|
| **Questions** | Add screens, reorder flow, open the screen designer |
| **Answers** | Map student choices (and language) to custom result outcomes (optional) |
| **Languages** | Download translation files, upload new languages, place the language switcher |
| **Settings** | Quiz name and description |
| **Links** | Create and manage public student URLs |

At the top you also have **Save draft**, **Publish**, and the **Public URL** bar (slug).

**Recommended build order:** Questions → Design screens → Languages → Answers (optional) → Publish.

---

## 4. Add questions and set order

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

> **Before languages:** Add and design your questions first. The **Languages** tab needs question text and options to build a translation file.

---

## 5. Design each question screen

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

---

## 6. Add languages and translations

Use this when students should take the same quiz in more than one language.

### Before you start

- **Add questions first** — the Languages tab shows a reminder: *Make sure you have added questions before setting language.*
- Your **default language** (★ on the language card) is the source text used when you download a translation template.

### Download a translation template

1. Open the **Languages** tab.
2. Click a language button to set the **preview language** (shown as “Editing preview language: **English**”). This is the language whose text is copied into the file.
3. Under **Translation template**, enter:
   - **New language code** — e.g. `Chinese` or `Spanish` (must match what you will upload)
   - **Display name** — optional label shown in the admin UI
4. Click **Download template from {language}**.

You get a `.txt` file with JSON inside, in the same shape as legacy **`English.txt`**:

```json
{
  "title": { "heading": "...", "subtitle": "...", "startButton": "..." },
  "ui": { "back": "Back", "confirm": "Confirm", ... },
  "questions": {
    "passion": {
      "question": "...",
      "options": [
        { "key": "business", "label": "BUSINESS" }
      ]
    }
  }
}
```

- Keep all **keys** unchanged (`passion`, `business`, etc.).
- Replace only the **human-readable text** (headings, questions, option labels, UI strings).

You can also click **Download Quiz JSON** on a language card to export that language’s current content.

### Upload a translated file

1. Enter the **new language code** and **display name** (same as when you downloaded, if the file has no metadata block).
2. Click **Upload translated JSON** and choose your translated `.txt` / `.json` file.
3. On success, a dialog appears: **Language successfully added. Please add the language switcher element on your design.**
4. Click **Place language switch element** (or use the same button on the new language’s card later).

The upload creates the language in the quiz and stores translations for intro text, question titles, option labels, and layout strings where applicable.

### Place the language switcher on the first screen

Students need a control to change language during the quiz.

1. From the success dialog or the language card, click **Place your language switch element**.
2. The builder opens the **first screen** of the quiz:
   - **Intro / first screen** designer if you have an intro layout, or
   - The **first question** screen designer otherwise
3. A **language dropdown** is added in the centre of the canvas (if one is not already there).
4. Select it and use the **inspector** to adjust:
   - Position and size (width and height — the dropdown and options scale with it)
   - Colours, background, font size, border
5. Click **Save layout**.

At runtime, when a student picks a language from this dropdown, all translated question text and options update for the rest of the quiz.

### Manage languages

| Action | How |
|--------|-----|
| Switch preview language | Click a language button on its card |
| Remove a language | **×** on the language card |
| Default language | Marked with ★ (set when the quiz is created) |

---

## 7. Map answers to custom results (optional)

Use this to define which result screen students see based on their choices — and optionally which **language** they used.

1. Open the **Answers** tab.
2. Click **+ Add result**.
3. Fill in:
   - **Rule name** — internal label
   - **Result title** / **Result description** — fallback text if the result layout is empty
   - **Conditions** — for each row, choose:
     - **Language** — specific language, or **Any language**
     - **Question** — which screen
     - **Option** — which answer choice
4. Click **Save** in the modal.
5. In the table, use **Design** to lay out that result screen (same canvas editor as questions).
6. If the quiz has **multiple languages**, open the result designer and use **Design language** to build a **separate result layout per language** when needed.
7. Fix any **⚠** warnings before publishing (they mean a question, option, or language changed and the rule needs updating).

**Example condition:** Language = `Chinese`, Question = `Passion`, Option = `business` → show the “Business scholar” result screen.

**Important:** Answer rules and result designs are stored in your **browser** (`localStorage`) for this quiz. Use the same computer and browser when building and testing. Clearing site data removes them.

If you use custom results, every question that has selectable options should appear in at least one rule’s conditions before you publish.

---

## 8. Quiz settings

Open the **Settings** tab to update:

- **Name** and **description**

Click **Save details** after changes.

---

## 9. Save your work

- **Save draft** — sets quiz status to `draft` and saves your progress. Safe to use often while building.
- **Save layout** — on each question, intro, or result design screen, saves only that screen’s layout.

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

---

## 12. Share with students and test

1. Copy the public URL from the **Links** tab or the **Public URL** bar.
2. Open it in a new tab (or on your phone on the same network if configured).
3. Walk through the quiz as a student: intro → questions → result.
4. If you added extra languages, use the **language dropdown** on the first screen and confirm question text and options change.
5. If you use **Answers** rules with a language condition, test each language path you configured.

**Quick checklist**

| Check | Expected |
|-------|----------|
| Quiz status | `active` (after Publish) |
| Link status | `active` |
| Questions | All screens designed and saved |
| Options | Tappable choices marked as options |
| Languages | Template uploaded; language switcher placed and saved |
| Custom results | Rules valid if you use the Answers tab |

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
| Publish blocked: answers need remapping | Open **Answers**, edit rules with warnings, update conditions to match current questions/options/languages. |
| Public link shows “unavailable” | Publish the quiz, set link to **active**, and ensure the quiz **Active** toggle is on. |
| Admin login fails | Check `backend/.env` for `ADMIN_EMAIL` / `ADMIN_PASSWORD`; restart the backend. |
| Cannot download/upload language file | Add questions first; enter a **new language code** before download or upload. |
| Upload fails: missing language code | Set **New language code** in the Languages tab before uploading, unless the file includes `_language.target_language`. |
| Language switcher does nothing | Save the layout after placing the switcher; publish the quiz; hard-refresh the public quiz page. |
| Translations missing on one screen | Re-upload the translation file; ensure question keys in the file match your quiz (`question_key` values). |
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
| Intro / first-screen designer | http://localhost:5173/admin/quizzes/{id}/builder/intro/design |
| Question designer | http://localhost:5173/admin/quizzes/{id}/builder/design/{questionId} |
| Public quiz | http://localhost:5173/q/{slug} |
