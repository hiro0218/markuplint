import 'normalize.css';
import '../global.css';

import type { MDXProviderComponentsProp } from '@mdx-js/react';
import type { AppProps } from 'next/app';
import type { PropsWithChildren } from 'react';

import { MDXProvider } from '@mdx-js/react';
import innerText from 'react-innertext';

const mdComponents: MDXProviderComponentsProp = {
	h1: _ => null,
	h2: (props: PropsWithChildren<{}>) => (
		<h2>
			<a {...props} id={innerText(props.children) || undefined} href={`#${innerText(props.children)}`}>
				{props.children}
			</a>
		</h2>
	),
	h3: (props: PropsWithChildren<{}>) => (
		<h3>
			<a {...props} id={innerText(props.children) || undefined} href={`#${innerText(props.children)}`}>
				{props.children}
			</a>
		</h3>
	),
	h4: (props: PropsWithChildren<{}>) => (
		<h4>
			<a {...props} id={innerText(props.children) || undefined} href={`#${innerText(props.children)}`}>
				{props.children}
			</a>
		</h4>
	),
	h5: (props: PropsWithChildren<{}>) => (
		<h5>
			<a {...props} id={innerText(props.children) || undefined} href={`#${innerText(props.children)}`}>
				{props.children}
			</a>
		</h5>
	),
	h6: (props: PropsWithChildren<{}>) => (
		<h6>
			<a {...props} id={innerText(props.children) || undefined} href={`#${innerText(props.children)}`}>
				{props.children}
			</a>
		</h6>
	),
	a: (props: PropsWithChildren<React.AnchorHTMLAttributes<HTMLAnchorElement>>) => {
		const isExternal = props.href && /^https?:\/\//.test(props.href);
		return (
			<a
				{...props}
				target={isExternal ? '_blank' : undefined}
				referrerPolicy={isExternal ? 'no-referrer' : undefined}
			>
				{props.children}
			</a>
		);
	},
	img: (props: PropsWithChildren<React.ImgHTMLAttributes<HTMLImageElement>>) => {
		return <img {...props} loading="lazy" />;
	},
	table: (props: PropsWithChildren<{}>) => {
		return (
			<div className="__table-wrapper">
				<table {...props}>{props.children}</table>
			</div>
		);
	},
};

export default function App({ Component, pageProps }: AppProps) {
	return (
		<MDXProvider components={mdComponents}>
			<Component {...pageProps} />
		</MDXProvider>
	);
}
