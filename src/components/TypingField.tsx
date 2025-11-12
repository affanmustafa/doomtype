import { TextAttributes } from '@opentui/core';
import { THEME } from '../constants';

type TypingFieldProps = {
	characters: string[];
	typed: string;
	finished: boolean;
};

export function TypingField({ characters, typed, finished }: TypingFieldProps) {
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

