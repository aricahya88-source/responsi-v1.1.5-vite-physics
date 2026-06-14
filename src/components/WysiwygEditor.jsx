import { memo, useEffect, useLayoutEffect, useRef, useState } from "react";

const inlineCommands = [
  { command: "bold", label: "B", title: "Tebal" },
  { command: "italic", label: "I", title: "Miring" },
  { command: "underline", label: "U", title: "Garis bawah" },
  { command: "strikeThrough", label: "S", title: "Coret" },
  { command: "subscript", label: "x₂", title: "Subskrip" },
  { command: "superscript", label: "x²", title: "Superskrip" }
];

const paragraphCommands = [
  { command: "insertUnorderedList", label: "• List", title: "Bullet list" },
  { command: "insertOrderedList", label: "1. List", title: "Numbered list" },
  { command: "formatBlock", value: "blockquote", label: "Kutip", title: "Kutipan" }
];

const alignCommands = [
  { command: "justifyLeft", label: "⇤", title: "Rata kiri" },
  { command: "justifyCenter", label: "↔", title: "Rata tengah" },
  { command: "justifyRight", label: "⇥", title: "Rata kanan" },
  { command: "justifyFull", label: "☰", title: "Rata kanan-kiri" }
];

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function readLocalDraft(storageKey) {
  if (!storageKey) return "";
  try {
    return localStorage.getItem(storageKey) ?? "";
  } catch {
    return "";
  }
}

function saveLocalDraft(storageKey, html) {
  if (!storageKey) return;
  try {
    localStorage.setItem(storageKey, html ?? "");
  } catch {
    // Jika storage penuh, editor tetap tidak boleh menghapus isi yang sedang diketik.
  }
}

function WysiwygEditor({ value, onChange, placeholder, disabled, storageKey }) {
  const editorRef = useRef(null);
  const lastHtml = useRef("");
  const activeStorageKey = useRef("");
  const isFocused = useRef(false);
  const didHydrate = useRef(false);
  const onChangeRef = useRef(onChange);
  const [counter, setCounter] = useState(() => {
    const initialText = stripHtml(readLocalDraft(storageKey) || value || "");
    return {
      words: initialText ? initialText.split(/\s+/).filter(Boolean).length : 0,
      chars: initialText.length
    };
  });

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const updateCounter = (html) => {
    const text = stripHtml(html ?? "");
    setCounter({
      words: text ? text.split(/\s+/).filter(Boolean).length : 0,
      chars: text.length
    });
  };

  const hydrateEditor = (html, shouldNotifyParent = false) => {
    const node = editorRef.current;
    if (!node) return;
    const safeHtml = html ?? "";
    node.innerHTML = safeHtml;
    lastHtml.current = safeHtml;
    updateCounter(safeHtml);
    if (shouldNotifyParent) onChangeRef.current?.(safeHtml);
  };

  useLayoutEffect(() => {
    const node = editorRef.current;
    if (!node) return;

    const nextKey = storageKey ?? "";
    const keyChanged = activeStorageKey.current !== nextKey;
    const saved = readLocalDraft(storageKey);
    const nextHtml = saved || value || "";

    // Kasus penting: contentEditable tidak menerima `value` seperti textarea.
    // Jadi saat mount pertama dan saat pindah praktikum, isi editor harus disuntikkan manual.
    if (!didHydrate.current || keyChanged) {
      didHydrate.current = true;
      activeStorageKey.current = nextKey;
      hydrateEditor(nextHtml, Boolean(saved && saved !== value));
      return;
    }

    // Jangan menimpa isi saat mahasiswa sedang mengetik.
    if (isFocused.current) return;

    // Jika parent state berubah karena reload jawaban/submission, sinkronkan editor.
    // Pemeriksaan node.innerHTML kosong penting agar jawaban yang sudah tersimpan muncul lagi ketika kembali ke menu.
    if ((nextHtml !== lastHtml.current && nextHtml !== node.innerHTML) || (!node.innerHTML && nextHtml)) {
      hydrateEditor(nextHtml, false);
      if (nextHtml) saveLocalDraft(storageKey, nextHtml);
    }
  }, [value, storageKey]);

  const emitChange = () => {
    const html = editorRef.current?.innerHTML ?? "";
    lastHtml.current = html;
    saveLocalDraft(storageKey, html);
    updateCounter(html);
    onChangeRef.current?.(html);
  };

  const focusEditor = () => editorRef.current?.focus();

  const runCommand = (command, valueArg = null) => {
    if (disabled) return;
    focusEditor();
    document.execCommand(command, false, valueArg);
    emitChange();
  };

  const insertLatex = () => {
    if (disabled) return;
    const latex = window.prompt("Tulis persamaan LaTeX, contoh: I=\\frac{V}{R}");
    if (!latex?.trim()) return;
    focusEditor();
    document.execCommand("insertHTML", false, `<span class="inline-equation">\\(${latex.trim()}\\)</span>&nbsp;`);
    emitChange();
  };

  return (
    <div className={`wysiwyg ${disabled ? "disabled" : ""}`}>
      <div className="wysiwyg-toolbar" aria-label="Toolbar editor">
        <select
          aria-label="Format paragraf"
          disabled={disabled}
          defaultValue="p"
          onChange={(event) => runCommand("formatBlock", event.target.value)}
        >
          <option value="p">Paragraf</option>
          <option value="h3">Judul kecil</option>
          <option value="h4">Subjudul</option>
          <option value="blockquote">Kutipan</option>
        </select>

        {inlineCommands.map((item) => (
          <button key={item.command} type="button" title={item.title} onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand(item.command)} disabled={disabled}>
            {item.label}
          </button>
        ))}

        {paragraphCommands.map((item) => (
          <button key={`${item.command}-${item.label}`} type="button" title={item.title} onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand(item.command, item.value ?? null)} disabled={disabled}>
            {item.label}
          </button>
        ))}

        {alignCommands.map((item) => (
          <button key={item.command} type="button" title={item.title} onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand(item.command)} disabled={disabled}>
            {item.label}
          </button>
        ))}

        <button type="button" title="Sisipkan persamaan LaTeX" onMouseDown={(event) => event.preventDefault()} onClick={insertLatex} disabled={disabled}>Rumus</button>
        <button type="button" title="Undo" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("undo")} disabled={disabled}>↶</button>
        <button type="button" title="Redo" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("redo")} disabled={disabled}>↷</button>
        <button type="button" title="Hapus format" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("removeFormat")} disabled={disabled}>Clear</button>
      </div>

      <div
        ref={editorRef}
        className="wysiwyg-editor"
        contentEditable={!disabled}
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder}
        suppressContentEditableWarning
        onFocus={() => { isFocused.current = true; }}
        onInput={emitChange}
        onBlur={() => {
          isFocused.current = false;
          emitChange();
        }}
        onPaste={(event) => event.preventDefault()}
      />

      <small>{counter.words} kata · {counter.chars} karakter · draft otomatis aman</small>
    </div>
  );
}

export default memo(WysiwygEditor);
