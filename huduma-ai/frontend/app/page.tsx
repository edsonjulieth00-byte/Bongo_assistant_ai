"use client";

import {
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import SuggestedQuestions from "@/components/chat/SuggestedQuestions";

type Message = {
  role: "user" | "assistant";
  content: string;
  time: string;
};

type Conversation = {
  id: string;
  title: string;
  messages: Message[];
};

type SpeechRecognitionEventLike = Event & {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
};

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: Event) => void) | null;
  onresult:
    | ((event: SpeechRecognitionEventLike) => void)
    | null;
};

type SpeechRecognitionConstructor =
  new () => SpeechRecognitionInstance;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const INITIAL_MESSAGE: Message = {
  role: "assistant",
  content:
    "Hello! 👋 I’m Tanzania Assistant. How can I help you with Tanzania government services today?",
  time: "",
};

const STORAGE_KEY =
  "tanzania-assistant-conversations";

const THEME_KEY =
  "tanzania-assistant-theme";

/*
 * Get the current local time.
 *
 * IMPORTANT:
 * This function is only called after the page has mounted
 * or after a user action. It is NOT called during the
 * initial server/client render.
 */
function getCurrentTime() {
  const now = new Date();

  return now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/*
 * Render simple Markdown formatting from assistant responses.
 *
 * Currently supports:
 * **bold text**
 *
 * It also preserves line breaks.
 */
function renderMessageContent(content: string) {
  const lines = content.split("\n");

  return lines.map((line, lineIndex) => {
    const parts = line.split(
      /(\*\*[^*]+\*\*)/g
    );

    return (
      <span key={lineIndex}>
        {parts.map((part, partIndex) => {
          if (
            part.startsWith("**") &&
            part.endsWith("**") &&
            part.length > 4
          ) {
            return (
              <strong
                key={partIndex}
                className="font-semibold"
              >
                {part.slice(2, -2)}
              </strong>
            );
          }

          return (
            <span key={partIndex}>
              {part}
            </span>
          );
        })}

        {lineIndex < lines.length - 1 && (
          <br />
        )}
      </span>
    );
  });
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    INITIAL_MESSAGE,
  ]);

  const [input, setInput] = useState("");

  const [loading, setLoading] =
    useState(false);

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [sidebarOpen, setSidebarOpen] =
    useState(true);

  const [darkMode, setDarkMode] =
    useState(false);

  const [language, setLanguage] =
    useState("en");

  const [speakingIndex, setSpeakingIndex] =
    useState<number | null>(null);

  const [isListening, setIsListening] =
    useState(false);

  /*
   * IMPORTANT:
   * Do not use Date.now() inside the initial
   * useState initializer because that can create
   * a server/client hydration mismatch.
   */
  const [conversationId, setConversationId] =
    useState<string>("");

  const [chatHistory, setChatHistory] =
    useState<Conversation[]>([]);

  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  const recognitionRef =
    useRef<SpeechRecognitionInstance | null>(
      null
    );

  /*
   * Load saved chat history and theme.
   *
   * localStorage only exists in the browser,
   * so this runs after hydration.
   */
  useEffect(() => {
    try {
      const saved =
        localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          const conversationsWithTime =
            parsed.map(
              (conversation: Conversation) => ({
                ...conversation,

                messages:
                  conversation.messages.map(
                    (message: Message) => ({
                      ...message,
                      time:
                        message.time ||
                        getCurrentTime(),
                    })
                  ),
              })
            );

          setChatHistory(
            conversationsWithTime
          );
        }
      }

      const savedTheme =
        localStorage.getItem(THEME_KEY);

      if (savedTheme === "dark") {
        setDarkMode(true);
      }

      /*
       * Create conversation ID only after
       * the browser has mounted.
       */
      setConversationId(
        Date.now().toString()
      );
    } catch (error) {
      console.error(
        "Could not load settings:",
        error
      );

      /*
       * Still create a conversation ID
       * if localStorage fails.
       */
      setConversationId(
        Date.now().toString()
      );
    }
  }, []);

  /*
   * Set the initial message time after hydration.
   *
   * This prevents the hydration mismatch caused
   * by rendering the current time on the server
   * and a different current time in the browser.
   */
  useEffect(() => {
    setMessages((current) => {
      if (
        current.length === 1 &&
        current[0].role === "assistant" &&
        !current[0].time
      ) {
        return [
          {
            ...current[0],
            time: getCurrentTime(),
          },
        ];
      }

      return current;
    });
  }, []);

  /*
   * Save current conversation.
   */
  useEffect(() => {
    if (!conversationId) {
      return;
    }

    if (messages.length <= 1) {
      return;
    }

    const userMessage = messages.find(
      (message) =>
        message.role === "user"
    );

    if (!userMessage) {
      return;
    }

    const title =
      userMessage.content.length > 35
        ? `${userMessage.content.substring(
            0,
            35
          )}...`
        : userMessage.content;

    setChatHistory((current) => {
      const updatedConversation: Conversation =
        {
          id: conversationId,
          title,
          messages,
        };

      const exists = current.some(
        (conversation) =>
          conversation.id ===
          conversationId
      );

      const updated = exists
        ? current.map((conversation) =>
            conversation.id ===
            conversationId
              ? updatedConversation
              : conversation
          )
        : [
            updatedConversation,
            ...current,
          ];

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updated)
      );

      return updated;
    });
  }, [messages, conversationId]);

  /*
   * Toggle dark/light mode.
   */
  function toggleTheme() {
    setDarkMode((current) => {
      const newMode = !current;

      localStorage.setItem(
        THEME_KEY,
        newMode ? "dark" : "light"
      );

      return newMode;
    });
  }

  /*
   * Read assistant response aloud.
   */
  function toggleSpeech(
    index: number,
    text: string
  ) {
    if (
      !("speechSynthesis" in window)
    ) {
      alert(
        "Voice reading is not supported in this browser."
      );

      return;
    }

    if (speakingIndex === index) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
      return;
    }

    window.speechSynthesis.cancel();

    const utterance =
      new SpeechSynthesisUtterance(text);

    const speechLanguages: Record<
      string,
      string
    > = {
      en: "en-US",
      sw: "sw-TZ",
      fr: "fr-FR",
    };

    utterance.lang =
      speechLanguages[language] ??
      "en-US";

    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => {
      setSpeakingIndex(index);
    };

    utterance.onend = () => {
      setSpeakingIndex(null);
    };

    utterance.onerror = () => {
      setSpeakingIndex(null);
    };

    window.speechSynthesis.speak(
      utterance
    );
  }

  /*
   * Start voice input.
   */
  function startListening() {
    if (loading) {
      return;
    }

    const SpeechRecognitionAPI =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      alert(
        "Voice input is not supported in this browser. Please try Google Chrome or Microsoft Edge."
      );

      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    window.speechSynthesis?.cancel();

    setSpeakingIndex(null);

    const recognition =
      new SpeechRecognitionAPI();

    recognition.continuous = false;
    recognition.interimResults = false;

    const speechLanguages: Record<
      string,
      string
    > = {
      en: "en-US",
      sw: "sw-TZ",
      fr: "fr-FR",
    };

    recognition.lang =
      speechLanguages[language] ??
      "en-US";

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (
      event: SpeechRecognitionEventLike
    ) => {
      const transcript =
        event.results[0][0].transcript;

      setInput((current) => {
        if (!current.trim()) {
          return transcript;
        }

        return `${current.trim()} ${transcript}`;
      });
    };

    recognition.onerror = (event) => {
      console.error(
        "Speech recognition error:",
        event
      );

      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current =
      recognition;

    try {
      recognition.start();
    } catch (error) {
      console.error(
        "Could not start speech recognition:",
        error
      );

      setIsListening(false);
      recognitionRef.current = null;
    }
  }

  /*
   * Stop voice input.
   */
  function stopListening() {
    recognitionRef.current?.stop();
    setIsListening(false);
  }

  /*
   * Send chat message.
   */
  async function sendMessage(
    event: FormEvent
  ) {
    event.preventDefault();

    const message = input.trim();

    if (!message || loading) {
      return;
    }

    stopListening();

    const messageTime =
      getCurrentTime();

    setMessages((current) => [
      ...current,
      {
        role: "user",
        content: message,
        time: messageTime,
      },
    ]);

    setInput("");
    setLoading(true);

    try {
      let response: Response;

      /*
       * FILE CHAT
       */
      if (selectedFile) {
        const formData =
          new FormData();

        formData.append(
          "message",
          message
        );

        formData.append(
          "file",
          selectedFile
        );

        formData.append(
          "language",
          language
        );

        response = await fetch(
          "https://bongo-assistant-ai.onrender.com/api/chat-with-file",
          {
            method: "POST",
            body: formData,
          }
        );
      }

      /*
       * NORMAL CHAT
       */
      else {
        response = await fetch(
          "https://bongo-assistant-ai.onrender.com/api/chat",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              message,
              language,
            }),
          }
        );
      }

      /*
       * Handle API errors.
       */
      if (!response.ok) {
        let errorMessage =
          "Failed to get a response.";

        try {
          const errorData =
            await response.json();

          if (errorData?.detail) {
            errorMessage =
              errorData.detail;
          }
        } catch {
          // Keep default error message.
        }

        throw new Error(errorMessage);
      }

      const data =
        await response.json();

      /*
       * Add assistant response.
       */
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            data.response ||
            data.message ||
            "I received your request, but no response was returned.",
          time: getCurrentTime(),
        },
      ]);

      /*
       * Clear selected file.
       */
      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error(error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Something went wrong.";

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: `Sorry, I couldn't complete your request. ${errorMessage}`,
          time: getCurrentTime(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  /*
   * Suggested question.
   */
  function selectSuggestedQuestion(
    question: string
  ) {
    setInput(question);

    setTimeout(() => {
      const form =
        document.getElementById(
          "chat-form"
        ) as HTMLFormElement | null;

      form?.requestSubmit();
    }, 0);
  }

  /*
   * Start a new chat.
   */
  function startNewChat() {
    window.speechSynthesis?.cancel();

    recognitionRef.current?.stop();

    setSpeakingIndex(null);
    setIsListening(false);

    setMessages([
      {
        role: "assistant",
        content:
          "Hello! 👋 I’m Tanzania Assistant. How can I help you with Tanzania government services today?",
        time: getCurrentTime(),
      },
    ]);

    setInput("");

    setSelectedFile(null);

    /*
     * Date.now() is safe here because this
     * function only runs after a user action.
     */
    setConversationId(
      Date.now().toString()
    );

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  /*
   * Load previous conversation.
   */
  function loadConversation(
    conversation: Conversation
  ) {
    window.speechSynthesis?.cancel();

    recognitionRef.current?.stop();

    setSpeakingIndex(null);
    setIsListening(false);

    const messagesWithTime =
      conversation.messages.map(
        (message) => ({
          ...message,
          time:
            message.time ||
            getCurrentTime(),
        })
      );

    setConversationId(
      conversation.id
    );

    setMessages(messagesWithTime);

    setInput("");

    setSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  /*
   * Delete conversation.
   */
  function deleteConversation(
    event: React.MouseEvent<HTMLButtonElement>,
    id: string
  ) {
    event.stopPropagation();

    setChatHistory((current) => {
      const updated = current.filter(
        (conversation) =>
          conversation.id !== id
      );

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updated)
      );

      return updated;
    });

    if (id === conversationId) {
      startNewChat();
    }
  }

  return (
    <main
      className={
        darkMode
          ? "flex min-h-screen bg-zinc-950 text-zinc-100"
          : "flex min-h-screen bg-zinc-50 text-zinc-900"
      }
    >
      {/* SIDEBAR */}
      {sidebarOpen && (
        <aside
          className={
            darkMode
              ? "hidden w-64 shrink-0 border-r border-zinc-800 bg-zinc-900 md:flex md:flex-col"
              : "hidden w-64 shrink-0 border-r border-zinc-200 bg-white md:flex md:flex-col"
          }
        >
          <div
            className={
              darkMode
                ? "flex items-center justify-between border-b border-zinc-800 px-4 py-4"
                : "flex items-center justify-between border-b border-zinc-100 px-4 py-4"
            }
          >
            <h2
              className={
                darkMode
                  ? "font-semibold text-white"
                  : "font-semibold text-zinc-900"
              }
            >
              Tanzania Assistant
            </h2>

            <button
              type="button"
              onClick={() =>
                setSidebarOpen(false)
              }
              className={
                darkMode
                  ? "flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
                  : "flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
              }
              title="Hide sidebar"
            >
              ←
            </button>
          </div>

          <div className="p-4">
            <button
              type="button"
              onClick={startNewChat}
              className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-700"
            >
              + New Chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3">
            <p className="mb-3 px-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Chat History
            </p>

            {chatHistory.length === 0 ? (
              <p className="px-2 text-sm text-zinc-400">
                No previous chats
              </p>
            ) : (
              <div className="space-y-2">
                {chatHistory.map(
                  (conversation) => (
                    <div
                      key={
                        conversation.id
                      }
                      onClick={() =>
                        loadConversation(
                          conversation
                        )
                      }
                      className={`group flex cursor-pointer items-center gap-2 rounded-xl px-3 py-3 text-sm transition ${
                        conversation.id ===
                        conversationId
                          ? darkMode
                            ? "bg-emerald-950 text-emerald-300"
                            : "bg-emerald-50 text-emerald-700"
                          : darkMode
                          ? "text-zinc-300 hover:bg-zinc-800"
                          : "text-zinc-700 hover:bg-zinc-100"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">
                          {
                            conversation.title
                          }
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={(event) =>
                          deleteConversation(
                            event,
                            conversation.id
                          )
                        }
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-zinc-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                        title="Delete conversation"
                      >
                        🗑️
                      </button>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </aside>
      )}

      {/* MAIN */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* HEADER */}
        <header
          className={
            darkMode
              ? "border-b border-zinc-800 bg-zinc-900 px-6 py-4 shadow-sm"
              : "border-b border-zinc-200 bg-white px-6 py-4 shadow-sm"
          }
        >
          <div className="flex w-full items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              {!sidebarOpen && (
                <button
                  type="button"
                  onClick={() =>
                    setSidebarOpen(true)
                  }
                  className={
                    darkMode
                      ? "mr-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-lg text-zinc-200 transition hover:bg-zinc-700"
                      : "mr-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-lg text-zinc-700 transition hover:bg-emerald-50 hover:text-emerald-700"
                  }
                  title="Show sidebar"
                >
                  ☰
                </button>
              )}

              {/* TANZANIA FLAG */}
              <div
                className="h-12 w-12 shrink-0 rounded-xl shadow-sm"
                style={{
                  background:
                    "linear-gradient(145deg, #1EB53A 0%, #1EB53A 42%, #FCD116 42%, #FCD116 46%, #000000 46%, #000000 54%, #FCD116 54%, #FCD116 58%, #00A3DD 58%, #00A3DD 100%)",
                }}
                title="Tanzania"
              />

              <div className="min-w-0">
                <h1
                  className={
                    darkMode
                      ? "truncate text-xl font-bold tracking-tight text-white"
                      : "truncate text-xl font-bold tracking-tight text-zinc-900"
                  }
                >
                  Tanzania Assistant
                </h1>

                <p
                  className={
                    darkMode
                      ? "truncate text-sm text-zinc-400"
                      : "truncate text-sm text-zinc-500"
                  }
                >
                  Your assistant for Tanzania
                  government services
                </p>
              </div>
            </div>

            {/* RIGHT SIDE CONTROLS */}
            <div className="flex shrink-0 items-center gap-2">
              {/* LANGUAGE SELECTOR */}
              <select
                value={language}
                onChange={(event) =>
                  setLanguage(
                    event.target.value
                  )
                }
                className={
                  darkMode
                    ? "h-10 rounded-xl bg-zinc-800 px-3 text-sm text-zinc-200 outline-none transition hover:bg-zinc-700"
                    : "h-10 rounded-xl bg-zinc-100 px-3 text-sm text-zinc-700 outline-none transition hover:bg-zinc-200"
                }
                title="Select language"
                aria-label="Select language"
              >
                <option value="en">
                  English
                </option>

                <option value="sw">
                  Swahili
                </option>

                <option value="fr">
                  French
                </option>
              </select>

              {/* THEME BUTTON */}
              <button
                type="button"
                onClick={toggleTheme}
                className={
                  darkMode
                    ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-lg transition hover:bg-zinc-700"
                    : "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-lg transition hover:bg-zinc-200"
                }
                title={
                  darkMode
                    ? "Switch to light mode"
                    : "Switch to dark mode"
                }
                aria-label={
                  darkMode
                    ? "Switch to light mode"
                    : "Switch to dark mode"
                }
              >
                {darkMode ? "☀️" : "🌙"}
              </button>
            </div>
          </div>
        </header>

        {/* CHAT */}
        <section className="flex min-w-0 flex-1 flex-col px-6 py-6">
          {messages.length === 1 &&
            !loading && (
              <div className="mb-8 flex flex-col items-center">
                <div className="mb-6 text-center">
                  <h2
                    className={
                      darkMode
                        ? "text-3xl font-bold text-white"
                        : "text-3xl font-bold text-zinc-900"
                    }
                  >
                    How can we help you
                    today?
                  </h2>

                  <p
                    className={
                      darkMode
                        ? "mt-2 text-sm text-zinc-400"
                        : "mt-2 text-sm text-zinc-500"
                    }
                  >
                    Ask about NIDA,
                    passport, or
                    immigration
                    services.
                  </p>
                </div>

                <SuggestedQuestions
                  onSelect={
                    selectSuggestedQuestion
                  }
                />
              </div>
            )}

          {/* MESSAGES */}
          <div className="flex-1 space-y-4 overflow-y-auto">
            {messages.map(
              (message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role ===
                    "user"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div className="max-w-[80%]">
                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        message.role ===
                        "user"
                          ? "bg-emerald-600 text-white"
                          : darkMode
                          ? "bg-zinc-900 text-zinc-200 shadow-sm"
                          : "bg-white text-zinc-800 shadow-sm"
                      }`}
                    >
                      {/* MESSAGE CONTENT */}
                      <p className="text-sm leading-6">
                        {renderMessageContent(
                          message.content
                        )}
                      </p>

                      {/* MESSAGE TIME */}
                      {message.time && (
                        <p
                          className={
                            message.role ===
                            "user"
                              ? "mt-2 text-right text-xs text-emerald-100"
                              : darkMode
                              ? "mt-2 text-xs text-zinc-500"
                              : "mt-2 text-xs text-zinc-400"
                          }
                        >
                          {message.time}
                        </p>
                      )}

                      {/* VOICE OUTPUT */}
                      {message.role ===
                        "assistant" &&
                        index > 0 && (
                          <div className="mt-2 flex justify-end">
                            <button
                              type="button"
                              onClick={() =>
                                toggleSpeech(
                                  index,
                                  message.content
                                )
                              }
                              className={
                                darkMode
                                  ? "flex h-8 w-8 items-center justify-center rounded-lg text-sm text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
                                  : "flex h-8 w-8 items-center justify-center rounded-lg text-sm text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
                              }
                              title={
                                speakingIndex ===
                                index
                                  ? "Stop speaking"
                                  : "Read answer aloud"
                              }
                              aria-label={
                                speakingIndex ===
                                index
                                  ? "Stop speaking"
                                  : "Read answer aloud"
                              }
                            >
                              {speakingIndex ===
                              index
                                ? "⏹️"
                                : "🔊"}
                            </button>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              )
            )}

            {/* LOADING */}
            {loading && (
              <div className="flex justify-start">
                <div
                  className={
                    darkMode
                      ? "rounded-2xl bg-zinc-900 px-4 py-3 text-sm text-zinc-400 shadow-sm"
                      : "rounded-2xl bg-white px-4 py-3 text-sm text-zinc-500 shadow-sm"
                  }
                >
                  Tanzania Assistant
                  is thinking...
                </div>
              </div>
            )}
          </div>

          {/* INPUT */}
          <form
            id="chat-form"
            onSubmit={sendMessage}
            className={
              darkMode
                ? "mt-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-3 shadow-sm"
                : "mt-6 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm"
            }
          >
            <div className="flex items-center gap-3">
              {/* FILE */}
              <button
                type="button"
                onClick={() =>
                  fileInputRef.current?.click()
                }
                disabled={
                  loading ||
                  isListening
                }
                className={
                  darkMode
                    ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-lg text-zinc-300 transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
                    : "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-lg text-zinc-600 transition hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                }
                title="Attach a file"
                aria-label="Attach a file"
              >
                📎
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.csv,.doc,.docx"
                className="hidden"
                onChange={(event) => {
                  const file =
                    event.target.files?.[0] ||
                    null;

                  setSelectedFile(file);
                }}
              />

              {/* INPUT */}
              <div
                className={
                  darkMode
                    ? "flex flex-1 items-center rounded-xl bg-zinc-800 px-3"
                    : "flex flex-1 items-center rounded-xl bg-zinc-100 px-3"
                }
              >
                <input
                  value={input}
                  onChange={(event) =>
                    setInput(
                      event.target.value
                    )
                  }
                  placeholder={
                    isListening
                      ? "Listening..."
                      : "Ask Tanzania Assistant..."
                  }
                  disabled={loading}
                  className={
                    darkMode
                      ? "w-full bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-zinc-500"
                      : "w-full bg-transparent px-2 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
                  }
                />
              </div>

              {/* MICROPHONE */}
              <button
                type="button"
                onClick={
                  isListening
                    ? stopListening
                    : startListening
                }
                disabled={loading}
                className={
                  isListening
                    ? "flex h-10 w-10 shrink-0 animate-pulse items-center justify-center rounded-xl bg-red-600 text-lg text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                    : darkMode
                    ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-lg text-zinc-200 transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
                    : "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-lg text-zinc-700 transition hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                }
                title={
                  isListening
                    ? "Stop listening"
                    : "Ask using your voice"
                }
                aria-label={
                  isListening
                    ? "Stop listening"
                    : "Ask using your voice"
                }
              >
                {isListening
                  ? "⏹️"
                  : "🎙️"}
              </button>

              {/* SEND */}
              <button
                type="submit"
                disabled={
                  loading ||
                  !input.trim()
                }
                className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading
                  ? "Sending..."
                  : "Send"}
              </button>
            </div>

            {/* LISTENING STATUS */}
            {isListening && (
              <div
                className={
                  darkMode
                    ? "mt-2 flex items-center gap-2 rounded-xl bg-red-950 px-3 py-2 text-sm text-red-300"
                    : "mt-2 flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700"
                }
              >
                <span className="animate-pulse">
                  🔴
                </span>

                <span>
                  Listening... Speak your
                  question clearly.
                </span>
              </div>
            )}

            {/* SELECTED FILE */}
            {selectedFile && (
              <div
                className={
                  darkMode
                    ? "mt-2 flex items-center justify-between rounded-xl bg-emerald-950 px-3 py-2 text-sm"
                    : "mt-2 flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2 text-sm"
                }
              >
                <span
                  className={
                    darkMode
                      ? "truncate text-emerald-300"
                      : "truncate text-emerald-800"
                  }
                >
                  📄{" "}
                  {selectedFile.name}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);

                    if (
                      fileInputRef.current
                    ) {
                      fileInputRef.current.value =
                        "";
                    }
                  }}
                  className="ml-3 text-zinc-500 hover:text-red-600"
                  title="Remove file"
                  aria-label="Remove file"
                >
                  ✕
                </button>
              </div>
            )}
          </form>
        </section>
      </div>
    </main>
  );
}