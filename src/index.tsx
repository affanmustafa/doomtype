import { TextAttributes, createCliRenderer } from "@opentui/core";
import { createRoot, useKeyboard } from "@opentui/react";
import { useCallback, useEffect, useMemo, useState } from "react";

const PROMPTS = [
  "Slow is smooth and smooth becomes fast when you stay consistent on the keyboard.",
  "Practice is the secret ingredient that turns awkward typing into fearless flow.",
  "Every accurate keystroke is a vote for the typist you want to become.",
  "Let distractions fade and follow the rhythm of the words in front of you.",
  "Focus on precision first; the speed you want will happily follow.",
] as const;

const describeChar = (char?: string) => {
  if (!char) return "done";
  if (char === " ") return "space";
  if (char === "\n") return "line break";
  return char;
};

const formatSeconds = (milliseconds: number) => (milliseconds / 1000).toFixed(1);

type TypingFieldProps = {
  characters: string[];
  typed: string;
  finished: boolean;
};

function TypingField({ characters, typed, finished }: TypingFieldProps) {
  return (
    <text wrapMode="word">
      {characters.map((char, index) => {
        const typedChar = typed[index];
        const isCurrent = index === typed.length && !finished;

        if (typedChar !== undefined) {
          const fg = typedChar === char ? "#7fd18d" : "#f87171";
          return (
            <span key={`${char}-${index}`} fg={fg}>
              {char}
            </span>
          );
        }

        return (
          <span
            key={`${char}-${index}`}
            fg={isCurrent ? "#111827" : "#94a3b8"}
            bg={isCurrent ? "#fbbf24" : undefined}
            attributes={isCurrent ? TextAttributes.UNDERLINE : undefined}
          >
            {char}
          </span>
        );
      })}
    </text>
  );
}

function App() {
  const [promptIndex, setPromptIndex] = useState(() => Math.floor(Math.random() * PROMPTS.length));
  const targetText = PROMPTS[promptIndex];
  const characters = useMemo(() => Array.from(targetText), [targetText]);

  const [typed, setTyped] = useState("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const finished = typed.length >= characters.length && characters.length > 0;
  const correctChars = useMemo(
    () => typed.split("").filter((char, index) => char === characters[index]).length,
    [typed, characters],
  );
  const accuracy = typed.length === 0 ? 100 : (correctChars / typed.length) * 100;
  const wpm =
    typed.length === 0 || elapsed === 0
      ? 0
      : Math.max(0, (typed.length / 5) / (Math.max(elapsed, 1) / 60000));

  const pickNewPrompt = useCallback(() => {
    setPromptIndex((previous) => {
      if (PROMPTS.length === 1) return previous;
      let next = previous;
      while (next === previous) {
        next = Math.floor(Math.random() * PROMPTS.length);
      }
      return next;
    });
    setTyped("");
    setStartTime(null);
    setEndTime(null);
    setElapsed(0);
  }, []);

  useEffect(() => {
    if (!startTime) return;
    if (endTime) {
      setElapsed(endTime - startTime);
      return;
    }
    const tick = () => {
      setElapsed(Date.now() - startTime);
    };
    tick();
    const interval = setInterval(tick, 80);
    return () => clearInterval(interval);
  }, [startTime, endTime]);

  useKeyboard(
    useCallback(
      (key) => {
        if (key.ctrl && key.name === "r") {
          pickNewPrompt();
          return;
        }

        if (key.name === "backspace") {
          if (typed.length === 0 || finished) return;
          setTyped((previous) => previous.slice(0, -1));
          return;
        }

        if (finished) {
          return;
        }

        const sequence = key.sequence;
        if (!sequence || key.ctrl || key.meta) {
          return;
        }

        if (sequence === "\r" || sequence === "\n" || sequence.length !== 1) {
          return;
        }

        if (!startTime) {
          const now = Date.now();
          setStartTime(now);
          setElapsed(0);
        }

        setTyped((previous) => {
          if (previous.length >= characters.length) {
            return previous;
          }

          const nextValue = previous + sequence;
          if (nextValue.length === characters.length) {
            setEndTime(Date.now());
          }
          return nextValue;
        });
      },
      [characters.length, finished, pickNewPrompt, startTime, typed.length],
    ),
  );

  const currentChar = characters[typed.length];
  const statusMessage = finished
    ? `All done in ${formatSeconds(elapsed)}s. Press Ctrl+R for a new prompt.`
    : startTime
      ? "Keep going — accuracy matters more than speed."
      : "Start typing to kick off the timer.";

  const stats = [
    { label: "Timer", value: `${formatSeconds(elapsed)}s` },
    { label: "Speed", value: `${wpm.toFixed(1)} WPM` },
    { label: "Accuracy", value: `${accuracy.toFixed(0)}%` },
    { label: "Position", value: `${Math.min(typed.length + 1, characters.length)} / ${characters.length}` },
    { label: "Current", value: describeChar(currentChar) },
  ];

  return (
    <box flexGrow={1} style={{ backgroundColor: "#05060a", padding: 2 }}>
      <box
        flexDirection="column"
        alignSelf="center"
        style={{ width: "100%", maxWidth: 110 }}
      >
        <text attributes={TextAttributes.BOLD}>Terminal Typing Sprint</text>
        <text attributes={TextAttributes.DIM}>Plain, focused practice for your typing flow.</text>

        <box
          border
          style={{
            borderColor: "#1f2933",
            marginTop: 1,
            padding: 1,
            backgroundColor: "#0a0c12",
          }}
        >
          <text attributes={TextAttributes.DIM}>Prompt</text>
          <TypingField characters={characters} typed={typed} finished={finished} />
        </box>

        <box
          style={{
            border: true,
            borderColor: "#1f2933",
            marginTop: 1,
            padding: 1,
            backgroundColor: "#090b10",
          }}
        >
          <text attributes={TextAttributes.DIM}>{statusMessage}</text>
          <box flexDirection="row" justifyContent="space-between" flexWrap="wrap">
            {stats.map((stat) => (
              <box key={stat.label} style={{ width: "48%", marginTop: 1 }}>
                <text attributes={TextAttributes.DIM}>{stat.label}</text>
                <text>{stat.value}</text>
              </box>
            ))}
          </box>
          <text attributes={TextAttributes.DIM} style={{ marginTop: 1 }}>
            Backspace fixes mistakes • Ctrl+R refreshes • Ctrl+C exits
          </text>
        </box>
      </box>
    </box>
  );
}

const renderer = await createCliRenderer();
createRoot(renderer).render(<App />);
