import { TextAttributes } from '@opentui/core';
import { useKeyboard, useRenderer } from '@opentui/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { THEME } from '../constants';
import { TypingField } from './TypingField';
import { createPrompt, formatSeconds, isPrintableKey } from '../utils';

export function App() {
	const renderer = useRenderer();

	useEffect(() => {
		// Hide cursor for cleaner look
		renderer.console.hide();
	}, [renderer]);
	const [targetText, setTargetText] = useState(() => createPrompt());
	const characters = useMemo(() => Array.from(targetText ?? ''), [targetText]);

	const [typed, setTyped] = useState('');
	const [startTime, setStartTime] = useState<number | null>(null);
	const [endTime, setEndTime] = useState<number | null>(null);
	const [elapsed, setElapsed] = useState(0);
	const [isReady, setIsReady] = useState(false);

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

	useEffect(() => {
		const timeout = setTimeout(() => {
			setIsReady(true);
		}, 100);
		return () => clearTimeout(timeout);
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
				if (!isReady) {
					return;
				}

				if (key.ctrl && key.name === 'r') {
					pickNewPrompt();
					return;
				}

				if (key.name === 'backspace') {
					if (typed.length === 0 || finished) return;
					setTyped((previous) => previous.slice(0, -1));
					return;
				}

				if (finished) {
					return;
				}

				const printable = isPrintableKey(key);
				if (!printable) {
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

					const nextValue = previous + (key.sequence ?? '');
					if (nextValue.length === characters.length) {
						setEndTime(Date.now());
					}
					return nextValue;
				});
			},
			[
				characters.length,
				finished,
				isReady,
				pickNewPrompt,
				startTime,
				typed.length
			]
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
