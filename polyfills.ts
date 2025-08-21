// Polyfill Node globals for React Native (Metaplex / web3.js dependencies)
import 'react-native-get-random-values';
import { Buffer } from 'buffer';

// react-native-get-random-values already polyfills crypto.getRandomValues; ensure object exists
// Ensure crypto object exists
if (!(global as any).crypto) (global as any).crypto = {} as any;

// After importing react-native-get-random-values we should have crypto.getRandomValues.
// Validate; if missing, provide a (warned) insecure fallback so app doesn't crash.
try {
	const g: any = global as any;
	if (!g.crypto.getRandomValues) {
		console.warn('[polyfills] crypto.getRandomValues missing; installing insecure Math.random fallback (NOT FOR PRODUCTION).');
		g.crypto.getRandomValues = (arr: Uint8Array) => {
			for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
			return arr;
		};
	} else {
		// Smoke test
		const test = new Uint8Array(1);
		g.crypto.getRandomValues(test);
	}
} catch (e) {
	console.warn('[polyfills] crypto.getRandomValues validation failed, applying fallback', e);
	const g: any = global as any;
	g.crypto.getRandomValues = (arr: Uint8Array) => {
		for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
		return arr;
	};
}

// atob/btoa simple polyfills
if (!(global as any).atob) (global as any).atob = (data: string) => Buffer.from(data, 'base64').toString('binary');
if (!(global as any).btoa) (global as any).btoa = (data: string) => Buffer.from(data, 'binary').toString('base64');
// Always assign Buffer early for libs expecting it immediately
(global as any).Buffer = Buffer;
if (!(global as any).process) (global as any).process = { env: {} } as any;
(global as any).process.browser = true;
