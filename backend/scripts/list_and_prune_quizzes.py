"""List quizzes; delete all except TAP Personality Quiz (by name or tap-system-default uuid)."""
import sqlite3
import sys
from pathlib import Path

DB = Path(__file__).resolve().parents[1] / "auth.db"
KEEP_UUID = "tap-system-default"
KEEP_NAME = "TAP Personality Quiz"


def main():
    delete = "--delete" in sys.argv
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")

    rows = conn.execute(
        "SELECT id, quiz_uuid, name, status FROM quizzes ORDER BY id"
    ).fetchall()

    if not rows:
        print("No quizzes in database.")
        return

    print("Quizzes:")
    for r in rows:
        print(f"  {r['id']:4}  {r['quiz_uuid']:24}  {r['name']!r}  ({r['status']})")

    keep = conn.execute(
        "SELECT id FROM quizzes WHERE quiz_uuid = ? OR name = ?",
        (KEEP_UUID, KEEP_NAME),
    ).fetchone()

    if not keep:
        print(f"\nERROR: Could not find quiz to keep ({KEEP_UUID!r} / {KEEP_NAME!r}). Aborting.")
        sys.exit(1)

    keep_id = keep["id"]
    to_delete = [r for r in rows if r["id"] != keep_id]

    if not to_delete:
        print(f"\nNothing to delete. Keeping quiz id={keep_id}.")
        return

    print(f"\nKeeping id={keep_id} ({KEEP_NAME})")
    print(f"Would delete {len(to_delete)} quiz(es): {[r['id'] for r in to_delete]}")

    if not delete:
        print("\nRun with --delete to apply.")
        return

    for r in to_delete:
        conn.execute("DELETE FROM quizzes WHERE id = ?", (r["id"],))
    conn.commit()
    print(f"\nDeleted {len(to_delete)} quiz(es).")

    remaining = conn.execute("SELECT id, name FROM quizzes").fetchall()
    print("Remaining:")
    for r in remaining:
        print(f"  {r['id']}  {r['name']!r}")


if __name__ == "__main__":
    main()
