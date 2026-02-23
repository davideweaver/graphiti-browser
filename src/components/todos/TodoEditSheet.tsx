import { useState, useEffect, useRef, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import type { Editor } from "@tiptap/react";
import { mergeAttributes } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Markdown } from "tiptap-markdown";

import type { Todo, UpdateTodoInput } from "@/types/todos";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SidePanelHeader } from "@/components/shared/SidePanelHeader";
import { formatScheduledDate } from "@/components/todos/TodoRow";
import { todosService } from "@/api/todosService";
import {
  CalendarDays, Check, Loader2, FolderOpen,
  Bold, Italic, Underline as UnderlineIcon,
  List, ListOrdered, ListChecks, Code2,
  Undo2, Redo2, ClipboardPaste,
  Send, ExternalLink, CheckCircle2,
} from "lucide-react";

const CustomTaskItem = TaskItem.extend({
  renderHTML({ node, HTMLAttributes }) {
    return [
      "li",
      mergeAttributes(HTMLAttributes, { "data-type": "taskItem" }),
      ["label", { contenteditable: "false" },
        ["input", { type: "checkbox", checked: node.attrs.checked ? "" : null }],
        ["span"],
      ],
      ["div", 0],
    ];
  },

  addNodeView() {
    return ({ node, HTMLAttributes, getPos, editor }) => {
      const listItem = document.createElement("li");
      const checkboxWrapper = document.createElement("label");
      const checkboxStyler = document.createElement("span");
      const checkbox = document.createElement("input");
      const content = document.createElement("div");

      Object.entries(HTMLAttributes).forEach(([key, value]) => {
        listItem.setAttribute(key, value);
      });
      listItem.dataset.type = this.name;

      // Use setProperty with 'important' priority to override prose styles
      listItem.style.setProperty("display", "flex", "important");
      listItem.style.setProperty("flex-direction", "row", "important");
      listItem.style.setProperty("align-items", "flex-start", "important");
      listItem.style.setProperty("gap", "0.5rem", "important");
      listItem.style.setProperty("list-style", "none", "important");
      listItem.style.setProperty("padding", "0", "important");
      listItem.style.setProperty("margin", "0.25rem 0", "important");

      checkboxWrapper.contentEditable = "false";
      checkboxWrapper.style.setProperty("flex", "0 0 auto", "important");
      checkboxWrapper.style.setProperty("display", "flex", "important");
      checkboxWrapper.style.setProperty("align-items", "center", "important");
      checkboxWrapper.style.setProperty("padding-top", "0.15rem", "important");
      checkboxWrapper.style.setProperty("user-select", "none", "important");
      checkboxWrapper.style.setProperty("cursor", "pointer", "important");

      content.style.setProperty("flex", "1 1 auto", "important");
      content.style.setProperty("min-width", "0", "important");

      checkbox.type = "checkbox";
      checkbox.checked = node.attrs.checked;
      checkbox.style.setProperty("width", "1.1rem", "important");
      checkbox.style.setProperty("height", "1.1rem", "important");
      checkbox.style.setProperty("cursor", "pointer", "important");

      checkbox.addEventListener("mousedown", (e) => e.preventDefault());
      checkbox.addEventListener("change", (e) => {
        if (!editor.isEditable) return;
        const { checked } = e.target as HTMLInputElement;
        if (typeof getPos === "function") {
          editor
            .chain()
            .focus(undefined, { scrollIntoView: false })
            .command(({ tr }) => {
              const pos = getPos();
              const currentNode = tr.doc.nodeAt(pos);
              tr.setNodeMarkup(pos, undefined, { ...currentNode?.attrs, checked });
              return true;
            })
            .run();
        }
      });

      if (!editor.isEditable) {
        checkbox.setAttribute("disabled", "disabled");
      }

      listItem.append(checkboxWrapper, content);
      checkboxWrapper.append(checkbox, checkboxStyler);

      return {
        dom: listItem,
        contentDOM: content,
        update: (updatedNode) => {
          if (updatedNode.type !== this.type) return false;
          if (updatedNode.attrs.checked) {
            checkbox.setAttribute("checked", "checked");
          } else {
            checkbox.removeAttribute("checked");
          }
          checkbox.checked = updatedNode.attrs.checked;
          return true;
        },
      };
    };
  },
});

// ─── Toolbar ──────────────────────────────────────────────────────────────────

function ToolbarBtn({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className={`h-8 w-8 flex items-center justify-center rounded transition-colors ${
        active
          ? "bg-white/20 text-white"
          : "text-zinc-400 hover:text-white hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

function HeadingSelect({ editor }: { editor: Editor }) {
  const getLevel = () =>
    ([1, 2, 3, 4] as const).find((l) => editor.isActive("heading", { level: l }))?.toString() ?? "0";

  const [value, setValue] = useState(getLevel);

  useEffect(() => {
    const update = () => setValue(getLevel());
    editor.on("selectionUpdate", update);
    editor.on("update", update);
    return () => {
      editor.off("selectionUpdate", update);
      editor.off("update", update);
    };
  }, [editor]);

  return (
    <select
      value={value}
      onChange={(e) => {
        const level = parseInt(e.target.value);
        if (level === 0) {
          editor.chain().focus().setParagraph().run();
        } else {
          editor.chain().focus().setHeading({ level: level as 1 | 2 | 3 | 4 }).run();
        }
      }}
      className="h-8 px-1.5 text-xs bg-zinc-700 text-zinc-300 border-0 rounded focus:outline-none cursor-pointer"
    >
      <option value="0" className="bg-zinc-800">Normal</option>
      <option value="1" className="bg-zinc-800">H1</option>
      <option value="2" className="bg-zinc-800">H2</option>
      <option value="3" className="bg-zinc-800">H3</option>
      <option value="4" className="bg-zinc-800">H4</option>
    </select>
  );
}

function EditorToolbar({ editor }: { editor: Editor }) {
  return (
    <div className="flex items-center gap-0.5 px-2 py-1.5 bg-zinc-800 border-b border-zinc-700 flex-wrap shrink-0">
      <HeadingSelect editor={editor} />
      <div className="w-px h-4 bg-zinc-600 mx-1" />
      <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} title="Undo">
        <Undo2 className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} title="Redo">
        <Redo2 className="h-4 w-4" />
      </ToolbarBtn>
      <div className="w-px h-4 bg-zinc-600 mx-1" />
      <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold">
        <Bold className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic">
        <Italic className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline">
        <UnderlineIcon className="h-4 w-4" />
      </ToolbarBtn>
      <div className="w-px h-4 bg-zinc-600 mx-1" />
      <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet list">
        <List className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Ordered list">
        <ListOrdered className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive("taskList")} title="Task list">
        <ListChecks className="h-4 w-4" />
      </ToolbarBtn>
      <div className="w-px h-4 bg-zinc-600 mx-1" />
      <ToolbarBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} title="Code block">
        <Code2 className="h-4 w-4" />
      </ToolbarBtn>
      <div className="w-px h-4 bg-zinc-600 mx-1" />
      <ToolbarBtn
        onClick={async () => {
          try {
            const text = await navigator.clipboard.readText();
            if (!text) return;
            editor.commands.focus();
            const clipboardData = new DataTransfer();
            clipboardData.setData("text/plain", text);
            editor.view.dom.dispatchEvent(
              new ClipboardEvent("paste", { clipboardData, bubbles: true, cancelable: true })
            );
          } catch {
            // clipboard permission denied
          }
        }}
        title="Paste markdown from clipboard"
      >
        <ClipboardPaste className="h-4 w-4" />
      </ToolbarBtn>
    </div>
  );
}

// ─── Sheet ────────────────────────────────────────────────────────────────────

type SaveState = "idle" | "saving" | "saved";

interface TodoEditSheetProps {
  todo: Todo | null;
  onClose: () => void;
  onSave: (id: string, input: UpdateTodoInput) => Promise<void>;
}

export function TodoEditSheet({ todo, onClose, onSave }: TodoEditSheetProps) {
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [isSending, setIsSending] = useState(false);
  const [slackThreadUrl, setSlackThreadUrl] = useState<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedMarkdownRef = useRef<string>("");
  const currentTodoIdRef = useRef<string | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const [displayTitle, setDisplayTitle] = useState(todo?.title ?? "");
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (todo) setDisplayTitle(todo.title);
  }, [todo?.id]);

  useEffect(() => {
    if (todo) {
      setSlackThreadUrl(localStorage.getItem(`todo-slack-url-${todo.id}`) ?? null);
    } else {
      setSlackThreadUrl(null);
    }
  }, [todo?.id]);

  useEffect(() => {
    if (editingTitle) {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }
  }, [editingTitle]);

  const [editingDate, setEditingDate] = useState(false);
  const [dateValue, setDateValue] = useState("");
  const [displayDate, setDisplayDate] = useState<string | null>(todo?.scheduledDate ?? null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (todo) setDisplayDate(todo.scheduledDate ?? null);
  }, [todo?.id]);

  useEffect(() => {
    if (editingDate) dateInputRef.current?.focus();
  }, [editingDate]);

  const saveDate = (val: string) => {
    if (!todo) return;
    if (val) {
      const iso = new Date(val + "T00:00:00").toISOString();
      onSave(todo.id, { scheduledDate: iso });
      setDisplayDate(iso);
    } else {
      onSave(todo.id, { scheduledDate: null });
      setDisplayDate(null);
    }
  };

  async function handleSendToSlack() {
    if (!todo) return;
    setIsSending(true);
    try {
      const result = await todosService.sendTodoToSlack(todo);
      localStorage.setItem(`todo-slack-url-${todo.id}`, result.threadUrl);
      setSlackThreadUrl(result.threadUrl);
    } catch {
      // toast already shown by service
    } finally {
      setIsSending(false);
    }
  }

  const scheduleSave = useCallback(
    (id: string, markdown: string) => {
      if (pendingSaveRef.current) clearTimeout(pendingSaveRef.current);
      setSaveState("saving");
      pendingSaveRef.current = setTimeout(async () => {
        try {
          await onSave(id, { body: markdown || null });
          lastSavedMarkdownRef.current = markdown;
          setSaveState("saved");
          if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
          saveTimerRef.current = setTimeout(() => setSaveState("idle"), 1500);
        } catch {
          setSaveState("idle");
        }
      }, 800);
    },
    [onSave]
  );

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TaskList,
      CustomTaskItem.configure({ nested: true }),
      Markdown.configure({ transformPastedText: true }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "tiptap prose prose-sm prose-invert max-w-none focus:outline-none px-6 py-4 min-h-[200px]",
      },
    },
    onUpdate: ({ editor }) => {
      const id = currentTodoIdRef.current;
      if (!id) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const markdown = (editor.storage as any).markdown.getMarkdown() as string;
      if (markdown !== lastSavedMarkdownRef.current) {
        scheduleSave(id, markdown);
      }
    },
  });

  useEffect(() => {
    if (!editor || !todo) return;
    if (pendingSaveRef.current) clearTimeout(pendingSaveRef.current);
    currentTodoIdRef.current = todo.id;
    const initialMarkdown = todo.body ?? "";
    lastSavedMarkdownRef.current = initialMarkdown;
    setSaveState("idle");
    setEditingTitle(false);
    setEditingDate(false);
    editor.commands.setContent(initialMarkdown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todo?.id, editor]);

  useEffect(() => {
    return () => {
      if (pendingSaveRef.current) clearTimeout(pendingSaveRef.current);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  return (
    <Sheet open={!!todo} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col p-0 gap-0 bg-zinc-900 border-zinc-700">
        {todo && (
          <>
            <div className="px-6">
              <SidePanelHeader
                titleClassName="text-lg text-zinc-100"
                title={
                editingTitle ? (
                  <input
                    ref={titleInputRef}
                    value={titleValue}
                    onChange={(e) => setTitleValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        setEditingTitle(false);
                      } else if (e.key === "Enter") {
                        e.preventDefault();
                        const trimmed = titleValue.trim();
                        if (trimmed && trimmed !== displayTitle) {
                          onSave(todo.id, { title: trimmed });
                          setDisplayTitle(trimmed);
                        }
                        setEditingTitle(false);
                      }
                    }}
                    onBlur={() => setEditingTitle(false)}
                    className="text-lg font-semibold leading-snug text-zinc-100 bg-transparent border-b border-zinc-500 focus:border-zinc-300 focus:outline-none w-full"
                  />
                ) : (
                  <span
                    className="cursor-text hover:text-zinc-300 transition-colors"
                    onClick={() => { setTitleValue(displayTitle); setEditingTitle(true); }}
                  >
                    {displayTitle}
                  </span>
                )
              }
              description={
                <div className="flex items-center gap-2">
                  {/* Save status */}
                  {saveState === "saving" && (
                    <span className="flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Saving…
                    </span>
                  )}
                  {saveState === "saved" && (
                    <span className="flex items-center gap-1">
                      <Check className="h-3 w-3 text-green-500" />
                      Saved
                    </span>
                  )}
                  {saveState === "idle" && (
                    <>
                      {/* Date */}
                      {editingDate ? (
                        <input
                          ref={dateInputRef}
                          type="date"
                          value={dateValue}
                          onChange={(e) => setDateValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Escape") {
                              setEditingDate(false);
                            } else if (e.key === "Enter") {
                              e.preventDefault();
                              saveDate(dateValue);
                              setEditingDate(false);
                            }
                          }}
                          onBlur={() => setEditingDate(false)}
                          className="text-sm bg-transparent border-b border-zinc-500 focus:border-zinc-300 focus:outline-none text-zinc-400"
                        />
                      ) : displayDate ? (
                        <span
                          className="flex items-center gap-1 cursor-pointer hover:text-zinc-300 transition-colors"
                          onClick={() => { setDateValue(displayDate.split("T")[0]); setEditingDate(true); }}
                        >
                          <CalendarDays className="h-3.5 w-3.5" />
                          {formatScheduledDate(displayDate)}
                        </span>
                      ) : (
                        <span
                          className="flex items-center gap-1 text-zinc-600 cursor-pointer hover:text-zinc-400 transition-colors"
                          onClick={() => { setDateValue(new Date().toISOString().split("T")[0]); setEditingDate(true); }}
                        >
                          <CalendarDays className="h-3.5 w-3.5" />
                          Add date
                        </span>
                      )}
                      {/* Project name */}
                      {todo.projectName && (
                        <>
                          <span className="text-zinc-600">•</span>
                          <span className="flex items-center gap-1">
                            <FolderOpen className="h-3.5 w-3.5" />
                            {todo.projectName}
                          </span>
                        </>
                      )}
                    </>
                  )}
                </div>
              }
            />
            </div>
            {/* Slack strip */}
            <div className="px-6 pt-2 pb-1">
              {slackThreadUrl ? (
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-sm text-green-400 font-medium">
                    <CheckCircle2 className="h-4 w-4" /> Sent to Slack
                  </span>
                  <a
                    href={slackThreadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    Open in Slack <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSendToSlack}
                  disabled={isSending}
                  className="border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 hover:bg-zinc-800"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send to Slack
                    </>
                  )}
                </Button>
              )}
            </div>
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden mt-3">
              {editor && <EditorToolbar editor={editor} />}
              <div className="flex-1 overflow-auto">
                <EditorContent editor={editor} className="h-full" />
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
