// Lyrics saved from the Tiptap editor (/submit/, /edit-song/) by a granny who
// presses Enter after every line arrive as one <p> per line plus an empty
// <p></p> per blank line. WordPress then turns each empty paragraph into a
// stray </p>, which browsers render as nothing: the song shows as evenly
// spaced lines with no stanza breaks.
//
// When that shape is present, regroup it: each run of lines between blank
// lines becomes one <p> with <br /> between lines, the shape the classic
// editor produces and the song page styles. Anything else is returned as is.

const EMPTY_P = "<p></p>";

export function stanzaifyLyrics(html) {
  if (typeof html !== "string" || html === "") return html;

  // Restore the empty paragraphs WordPress collapsed into stray closers.
  let restored = html;
  while (/<\/p>\s*<\/p>/.test(restored)) {
    restored = restored.replace(/<\/p>(\s*)<\/p>/, `</p>$1${EMPTY_P}`);
  }
  // Only a truly empty paragraph marks this shape. Older songs space their
  // stanzas with <p>&nbsp;</p>, which renders fine and is left alone.
  if (!restored.includes(EMPTY_P)) return html;

  const paragraphs = [];
  let rest = restored.replace(/<p>([\s\S]*?)<\/p>/g, (_, inner) => {
    paragraphs.push(inner);
    return "";
  });
  // Only plain <p>…</p> runs are safe to regroup. Leftover markup means
  // attributes, nesting or loose text: leave the lyrics untouched.
  if (rest.trim() !== "") return html;

  const stanzas = [];
  let current = [];
  for (const inner of paragraphs) {
    const blank = inner.replace(/<br\s*\/?>|&nbsp;|\s/g, "") === "";
    if (blank) {
      if (current.length) stanzas.push(current);
      current = [];
    } else {
      current.push(inner.trim());
    }
  }
  if (current.length) stanzas.push(current);

  return stanzas.map((lines) => `<p>${lines.join("<br />\n")}</p>`).join("\n") + "\n";
}
