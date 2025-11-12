import { TextAttributes, createCliRenderer } from '@opentui/core';
import { createRoot, useKeyboard } from '@opentui/react';
import { generate as generateWords } from 'random-words';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const THEME = {
	background: '#030712',
	panel: '#060913',
	panelMuted: '#090b12',
	border: '#1f2a37',
	gridLine: '#111827',
	text: '#e2e8f0',
	textDim: '#94a3b8',
	accent: '#38bdf8',
	success: '#7fd18d',
	error: '#f87171'
} as const;

const DEFAULT_WORD_COUNT = 28;

const createPrompt = (wordCount = DEFAULT_WORD_COUNT) =>
	generateWords({
		exactly: wordCount,
		join: ' ',
		formatter: (word) => word.toLowerCase()
	}) as string;

const formatSeconds = (milliseconds: number) =>
	(milliseconds / 1000).toFixed(1);

type TypingFieldProps = {
	characters: string[];
	typed: string;
	finished: boolean;
};

function TypingField({ characters, typed, finished }: TypingFieldProps) {
	return (
		<text wrapMode="word" fg={THEME.text}>
			{characters.map((char, index) => {
				const typedChar = typed[index];
				const isCurrent = index === typed.length && !finished;

				if (typedChar !== undefined) {
					const fg = typedChar === char ? THEME.success : THEME.error;
					return (
						<span key={`${char}-${index}`} fg={fg}>
							{char}
						</span>
					);
				}

				return (
					<span
						key={`${char}-${index}`}
						fg={isCurrent ? '#020617' : THEME.textDim}
						bg={isCurrent ? THEME.accent : undefined}
						attributes={
							isCurrent
								? TextAttributes.UNDERLINE | TextAttributes.BOLD
								: undefined
						}
					>
						{char}
					</span>
				);
			})}
		</text>
	);
}

function App() {
	const [targetText, setTargetText] = useState(() => createPrompt());
	const characters = useMemo(() => Array.from(targetText ?? ''), [targetText]);
	const debugLogged = useRef(0);

	const [typed, setTyped] = useState('');
	const [startTime, setStartTime] = useState<number | null>(null);
	const [endTime, setEndTime] = useState<number | null>(null);
	const [elapsed, setElapsed] = useState(0);

	const finished = typed.length >= characters.length && characters.length > 0;
	const correctChars = useMemo(
		() =>
			typed.split('').filter((char, index) => char === characters[index])
				.length,
		[typed, characters]
	);
	const accuracy =
		typed.length === 0 ? 100 : (correctChars / typed.length) * 100;
	const wpm =
		typed.length === 0 || elapsed === 0
			? 0
			: Math.max(0, typed.length / 5 / (Math.max(elapsed, 1) / 60000));

	const pickNewPrompt = useCallback(() => {
		setTargetText(createPrompt());
		setTyped('');
		setStartTime(null);
		setEndTime(null);
		setElapsed(0);
	}, []);

	// Some terminals (notably iTerm2) echo capability responses through stdin.
	// Resetting right after mount flushes any phantom characters those responses add.
	useEffect(() => {
		setTyped('');
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
				if (key.ctrl && key.name === 'r') {
					pickNewPrompt();
					return;
				}

				if (!startTime && typed.length === 0 && debugLogged.current < 24) {
					console.log('[key-event]', {
						sequence: key.sequence,
						name: key.name,
						raw: key.raw,
						ctrl: key.ctrl,
						meta: key.meta
					});
					debugLogged.current += 1;
				}

				if (key.name === 'backspace') {
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

				if (sequence === '\r' || sequence === '\n' || sequence.length !== 1) {
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
			[characters.length, finished, pickNewPrompt, startTime, typed.length]
		)
	);

	const statusMessage = finished
		? `All done in ${formatSeconds(elapsed)}s. Press Ctrl+R for a new prompt.`
		: startTime
		? 'Keep going — accuracy matters more than speed.'
		: 'Start typing to kick off the timer.';

	const stats = [
		{ label: 'Timer', value: `${formatSeconds(elapsed)}s` },
		{ label: 'Speed', value: `${wpm.toFixed(1)} WPM` },
		{ label: 'Accuracy', value: `${accuracy.toFixed(0)}%` },
		{
			label: 'Position',
			value: `${Math.min(typed.length + 1, characters.length)} / ${
				characters.length
			}`
		}
	];

	return (
		<box flexGrow={1} style={{ backgroundColor: THEME.background, padding: 2 }}>
			<box
				flexDirection="column"
				alignSelf="center"
				style={{ width: '100%', maxWidth: 110 }}
			>
				<text
					attributes={TextAttributes.BOLD}
					fg={THEME.text}
					style={{
						marginTop: 1,
						alignItems: 'center',
						justifyContent: 'center'
					}}
				>
					Your clanker is slow. You don't need to be.
				</text>

				<box
					border
					style={{
						borderColor: THEME.border,
						marginTop: 1,
						padding: 1,
						backgroundColor: THEME.panel
					}}
				>
					<text attributes={TextAttributes.DIM} fg={THEME.textDim}>
						Prompt
					</text>
					<TypingField
						characters={characters}
						typed={typed}
						finished={finished}
					/>
				</box>

				<box
					style={{
						border: true,
						borderColor: THEME.border,
						marginTop: 1,
						padding: 1,
						backgroundColor: THEME.panelMuted
					}}
				>
					<text attributes={TextAttributes.DIM} fg={THEME.textDim}>
						{statusMessage}
					</text>
					<box
						flexDirection="row"
						justifyContent="space-between"
						flexWrap="wrap"
					>
						{stats.map((stat) => (
							<box key={stat.label} style={{ width: '48%', marginTop: 1 }}>
								<text attributes={TextAttributes.DIM} fg={THEME.textDim}>
									{stat.label}
								</text>
								<text fg={stat.label === 'Speed' ? THEME.accent : THEME.text}>
									{stat.value}
								</text>
							</box>
						))}
					</box>
					<text
						attributes={TextAttributes.DIM}
						fg={THEME.textDim}
						style={{ marginTop: 1 }}
					>
						Backspace fixes mistakes • Ctrl+R refreshes • Ctrl+C exits
					</text>
				</box>
			</box>
		</box>
	);
}

const renderer = await createCliRenderer();
createRoot(renderer).render(<App />);
