#!/usr/bin/env bun

import { createRoot } from '@opentui/react';
import { createCliRenderer } from '@opentui/core';
import { App } from './components/App';

try {
	const renderer = await createCliRenderer({
		exitOnCtrlC: true
	});

	createRoot(renderer).render(<App />);
} catch (error) {
	console.error('Error starting doomtype:', error);
	process.exit(1);
}
