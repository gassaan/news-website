import { useCallback, useRef } from "react";
import { set, type StringInputProps } from "sanity";

// Dhivehi punctuation while typing: after a Thaana letter, an English comma, question
// mark or semicolon becomes the Thaana one (، ؟ ؛), and a second space in a row is
// ignored. Numbers like 5,000 keep their comma (it only follows Thaana letters). Words
// that mix Thaana and English letters (usually a keyboard slip) are pointed out.

export const THAANA = /[\u0780-\u07BF]/;
const LATIN = /[A-Za-z]/;
export const MARKS: Record<string, string> = { ",": "،", "?": "؟", ";": "؛" };
// The text just before the cursor ends in a Thaana letter, maybe with one space after it.
export const AFTER_THAANA = /[\u0780-\u07BF]( ?)$/;

const ENGLISH_MARK = /([\u0780-\u07BF]) ?([,?;])/g;
const DOUBLE_SPACE = /(\S) {2,}(?=\S)/g;
export function fixText(text: string): string {
  return text.replace(ENGLISH_MARK, (_, t: string, mark: string) => t + MARKS[mark]).replace(DOUBLE_SPACE, "$1 ");
}
export const fixCount = (text: string) => (text.match(ENGLISH_MARK) ?? []).length + (text.match(DOUBLE_SPACE) ?? []).length;

const WORD = /[^\s.,،؟?!:;"'“”‘’()[\]{}«»…\-–—/*#>|_=+]+/g;
export const isMixed = (word: string) => THAANA.test(word) && LATIN.test(word);
export function mixedWords(text: string): string[] {
  // Link addresses aren't words.
  const words = text.replace(/\]\([^)]*\)/g, "]").replace(/https?:\/\/\S+/g, " ").match(WORD) ?? [];
  return [...new Set(words.filter(isMixed))];
}

// For text boxes (headline, summary): put the Thaana mark in as the key is typed.
function onBeforeInput(e: InputEvent) {
  const el = e.target;
  if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return;
  if (e.inputType !== "insertText" || !e.data) return;
  const pos = el.selectionStart;
  if (pos === null || pos !== el.selectionEnd) return;
  const before = el.value.slice(Math.max(0, pos - 2), pos);
  const mark = MARKS[e.data];
  if (mark) {
    const m = before.match(AFTER_THAANA);
    if (!m) return;
    e.preventDefault();
    // "ބަނދަރު ," : the stray space before the mark goes too.
    if (m[1]) el.setSelectionRange(pos - 1, pos);
    document.execCommand("insertText", false, mark);
  } else if (e.data === " " && before.endsWith(" ")) {
    e.preventDefault();
  }
}
export function useThaanaTyping() {
  const cleanup = useRef<(() => void) | null>(null);
  return useCallback((el: HTMLElement | null) => {
    cleanup.current?.();
    cleanup.current = null;
    if (!el) return;
    el.addEventListener("beforeinput", onBeforeInput, true);
    cleanup.current = () => el.removeEventListener("beforeinput", onBeforeInput, true);
  }, []);
}

// Under a text box: marks left in English (e.g. pasted text) with a Fix button, and
// words that mix Thaana and English letters.
export function ThaanaNote({ text, onFix, readOnly }: { text: string; onFix: () => void; readOnly?: boolean }) {
  const n = fixCount(text);
  const mixed = mixedWords(text);
  if (!n && !mixed.length) return null;
  return (
    <div className="th-notes">
      {n > 0 && (
        <p className="th-fix">
          <span>
            {n} English mark{n === 1 ? "" : "s"} or double space{n === 1 ? "" : "s"} to fix ( ، ؟ ؛ )
          </span>
          <button type="button" className="ef-soft" disabled={readOnly} onClick={onFix}>
            Fix
          </button>
        </p>
      )}
      {mixed.length > 0 && (
        <p className="th-mixed">
          <b>
            {mixed.length} word{mixed.length === 1 ? " mixes" : "s mix"} English and Thaana letters:
          </b>{" "}
          <span dir="rtl" className="th-words">
            {mixed.slice(0, 6).join("، ")}
          </span>
          <br />
          Usually a keyboard slip. Names written fully in English are fine.
        </p>
      )}
    </div>
  );
}

// The headline box: Sanity's own, with the punctuation help.
export function ThaanaStringInput(props: StringInputProps) {
  const ref = useThaanaTyping();
  const text = props.value ?? "";
  return (
    <div className="ef-stack" ref={ref}>
      {props.renderDefault(props)}
      <ThaanaNote text={text} readOnly={props.readOnly} onFix={() => props.onChange(set(fixText(text)))} />
    </div>
  );
}

