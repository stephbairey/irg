"""
Apply approved taxonomy changes to songs-consolidated.json.

Changes:
1. Apply Seattle category mapping to all Seattle songs
2. Rename Women's Issues → Gender Equity globally
3. Rename Health Care/Healthcare → Healthcare globally
4. Eliminate World Issues — redistribute to best-fit categories
5. Add 4 new categories: Guns & Violence, Immigration, Racism & Social Justice, Reproductive Rights
6. Discard null-mapped categories
7. Regenerate songs-review.xlsx and stats-report.txt
"""

import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from consolidate import generate_spreadsheet, populate_stats_sheet, generate_stats, strip_all_tags

BASE_DIR = Path(__file__).resolve().parent.parent

SEATTLE_CATEGORY_MAP = {
    "Business & Economy": "Business & Economy",
    "Children & Youth": "Human & Civil Rights",
    "Covid": "Healthcare",
    "Crime & Punishment": "Government & Politics",
    "Education": "Education",
    "Environment & Energy": "Environment & Energy",
    "GLBT": "Human & Civil Rights",
    "George W Bush": "Government & Politics",
    "Government & Politics": "Government & Politics",
    "Grannies": None,
    "Guns & Violence": "Guns & Violence",
    "Health": "Healthcare",
    "Healthcare": "Healthcare",
    "Holiday Tunes": "Holiday & Celebrations",
    "Homelessness": "Human & Civil Rights",
    "Housing": "Human & Civil Rights",
    "Human & Civil Rights": "Human & Civil Rights",
    "Immigration": "Immigration",
    "Labor": "Labor & Worker Rights",
    "Local Issues": "Local Issues",
    "Mental Health": "Healthcare",
    "Police Brutality": "Racism & Social Justice",
    "Poverty": "Human & Civil Rights",
    "Racism": "Racism & Social Justice",
    "Religious Issues": "Human & Civil Rights",
    "Reproductive Rights": "Reproductive Rights",
    "Schools": "Education",
    "Self-care": None,
    "Sexism": "Gender Equity",
    "Sexuality": "Human & Civil Rights",
    "Soldiers & Veterans": "Soldiers & Veterans",
    "Trump": "Government & Politics",
    "Uncategorized": None,
    "Voting": "Government & Politics",
    "WTO": "Business & Economy",
    "War & Peace": "War & Peace",
    "Women": "Gender Equity",
    "older- revamp?": None,
}

RENAMES = {
    "Women's Issues": "Gender Equity",
    "Health Care/Healthcare": "Healthcare",
}

# Manual redistribution for the 9 World Issues-only songs.
# Each was read and categorized by content.
WORLD_ISSUES_ONLY_REDISTRIBUTION = {
    "main-0046": {
        "issues": ["Human & Civil Rights"],
        "notes": "",
    },
    "main-0102": {
        "issues": ["Human & Civil Rights"],
        "notes": "",
    },
    "main-0118": {
        "issues": ["Human & Civil Rights"],
        "notes": "",
    },
    "main-0128": {
        "issues": ["Human & Civil Rights"],
        "notes": "",
    },
    "main-0216": {
        "issues": ["Human & Civil Rights"],
        "notes": "",
    },
    "main-0232": {
        "issues": ["Human & Civil Rights"],
        "notes": "",
    },
    "main-0680": {
        "issues": ["War & Peace"],
        "notes": "",
    },
    "main-0808": {
        "issues": ["Healthcare"],
        "notes": "Ambiguous: COVID recovery song with social justice themes. Healthcare chosen as primary since the song centers on post-pandemic life.",
        "ambiguous": True,
    },
    "main-0839": {
        "issues": ["War & Peace", "Human & Civil Rights"],
        "notes": "",
    },
}

VALID_ISSUES = {
    "Business & Economy",
    "Education",
    "Environment & Energy",
    "Gender Equity",
    "Government & Politics",
    "Guns & Violence",
    "Healthcare",
    "Holiday & Celebrations",
    "Human & Civil Rights",
    "Immigration",
    "Labor & Worker Rights",
    "Local Issues",
    "Racism & Social Justice",
    "Reproductive Rights",
    "Soldiers & Veterans",
    "War & Peace",
}


def apply_taxonomy(songs):
    world_issues_redistribution_log = []
    ambiguous_songs = []

    for song in songs:
        # --- Step 1: Apply Seattle category mapping ---
        if song["source"] == "seattle" and not song["issues"]:
            mapped = set()
            for cat in song["original_categories"]:
                target = SEATTLE_CATEGORY_MAP.get(cat)
                if target:
                    mapped.add(target)
            song["issues"] = sorted(mapped)

        # --- Step 2: Rename categories globally ---
        song["issues"] = [RENAMES.get(iss, iss) for iss in song["issues"]]

        # --- Step 3: Handle World Issues ---
        if "World Issues" in song["issues"]:
            song["issues"] = [i for i in song["issues"] if i != "World Issues"]

            if not song["issues"]:
                # World Issues-only song — use manual redistribution
                redist = WORLD_ISSUES_ONLY_REDISTRIBUTION.get(song["id"])
                if redist:
                    song["issues"] = redist["issues"]
                    if redist["notes"]:
                        if song["review_notes"]:
                            song["review_notes"] += "; " + redist["notes"]
                        else:
                            song["review_notes"] = redist["notes"]
                    if redist.get("ambiguous"):
                        song["needs_review"] = True
                        ambiguous_songs.append(song)
                    world_issues_redistribution_log.append({
                        "id": song["id"],
                        "title": song["title"],
                        "was": ["World Issues"],
                        "now": song["issues"],
                        "ambiguous": redist.get("ambiguous", False),
                    })
                else:
                    song["issues"] = ["Human & Civil Rights"]
                    song["needs_review"] = True
                    note = "World Issues eliminated — auto-assigned to Human & Civil Rights. Review recommended."
                    if song["review_notes"]:
                        song["review_notes"] += "; " + note
                    else:
                        song["review_notes"] = note
                    world_issues_redistribution_log.append({
                        "id": song["id"],
                        "title": song["title"],
                        "was": ["World Issues"],
                        "now": ["Human & Civil Rights"],
                        "ambiguous": True,
                    })
                    ambiguous_songs.append(song)
            else:
                # Had other issues too — just drop World Issues
                world_issues_redistribution_log.append({
                    "id": song["id"],
                    "title": song["title"],
                    "was": ["World Issues"] + song["issues"],
                    "now": song["issues"],
                    "ambiguous": False,
                })

        # --- Step 4: Deduplicate issues ---
        song["issues"] = sorted(set(song["issues"]))

        # --- Validate ---
        invalid = [i for i in song["issues"] if i not in VALID_ISSUES]
        if invalid:
            print(f"WARNING: {song['id']} has invalid issues after mapping: {invalid}")

    return world_issues_redistribution_log, ambiguous_songs


def main():
    json_path = BASE_DIR / "songs-consolidated.json"
    songs = json.load(open(json_path, encoding="utf-8"))

    print("Applying taxonomy changes...")
    redistribution_log, ambiguous = apply_taxonomy(songs)

    # Save updated JSON
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(songs, f, indent=2, ensure_ascii=False)
    print(f"Updated {json_path}")

    # Split for stats
    main_songs = [s for s in songs if s["source"] == "main"]
    seattle_songs = [s for s in songs if s["source"] == "seattle"]
    duplicate_pairs = []
    for sea in seattle_songs:
        if sea["duplicate_of"]:
            main_match = next((s for s in main_songs if s["id"] == sea["duplicate_of"]), None)
            if main_match:
                duplicate_pairs.append((main_match, sea))

    # Generate stats
    stats = generate_stats(songs, main_songs, seattle_songs, duplicate_pairs)
    stats_path = BASE_DIR / "stats-report.txt"
    with open(stats_path, "w", encoding="utf-8") as f:
        f.write(stats)
    print(f"Updated {stats_path}")

    # Generate spreadsheet
    wb = generate_spreadsheet(songs, duplicate_pairs)
    populate_stats_sheet(wb, stats)
    xlsx_path = BASE_DIR / "songs-review.xlsx"
    wb.save(xlsx_path)
    print(f"Updated {xlsx_path}")

    # --- Report ---
    print()
    print("=" * 60)
    print("WORLD ISSUES REDISTRIBUTION REPORT")
    print("=" * 60)
    total_wi = len(redistribution_log)
    dropped_only = [r for r in redistribution_log if len(r["now"]) > 0 and "World Issues" not in r["now"]]
    wi_only = [r for r in redistribution_log if r["was"] == ["World Issues"]]
    wi_multi = [r for r in redistribution_log if r["was"] != ["World Issues"]]

    print(f"Total songs that had World Issues: {total_wi}")
    print(f"  Had other categories too (just dropped WI): {len(wi_multi)}")
    print(f"  World Issues-only (redistributed): {len(wi_only)}")
    print()

    # Show redistribution targets
    from collections import Counter
    target_counts = Counter()
    for r in wi_only:
        for iss in r["now"]:
            target_counts[iss] += 1
    print("World Issues-only songs redistributed to:")
    for iss, cnt in target_counts.most_common():
        print(f"  {iss}: {cnt}")
    print()

    print("Individual redistributions:")
    for r in wi_only:
        marker = " *** AMBIGUOUS ***" if r["ambiguous"] else ""
        print(f"  {r['id']}: \"{r['title']}\" → {', '.join(r['now'])}{marker}")

    if ambiguous:
        print()
        print("AMBIGUOUS SONGS (need review):")
        for s in ambiguous:
            print(f"  {s['id']}: \"{s['title']}\"")
            print(f"    Assigned: {s['issues']}")
            print(f"    Notes: {s['review_notes']}")

    print()
    print(stats)


if __name__ == "__main__":
    main()
