import { readFile } from 'fs/promises';
import path from 'path';

import { resolveNamespace } from '@markuplint/ml-spec';
import { getAttrSpecs } from '@markuplint/ml-spec/lib/specs/get-attr-specs';
import Ajv, { type ValidateFunction } from 'ajv';
import { sync as glob } from 'glob';
import strip from 'strip-json-comments';

import htmlSpec, { specs } from '../index';

const schemas = {
	element: {
		$id: '@markuplint/ml-spec/schemas/element.schema.json',
		...require('../../ml-spec/schemas/element.schema.json'),
	},
	aria: {
		$id: '@markuplint/ml-spec/schemas/aria.schema.json',
		...require('../../ml-spec/schemas/aria.schema.json'),
	},
	contentModels: {
		$id: '@markuplint/ml-spec/schemas/content-models.schema.json',
		...require('../../ml-spec/schemas/content-models.schema.json'),
	},
	globalAttributes: {
		$id: '@markuplint/ml-spec/schemas/global-attributes.schema.json',
		...require('../../ml-spec/schemas/global-attributes.schema.json'),
	},
	attributes: {
		$id: '@markuplint/ml-spec/schemas/attributes.schema.json',
		...require('../../ml-spec/schemas/attributes.schema.json'),
	},
	types: {
		$id: '@markuplint/types/types.schema.json',
		...require('../../types/types.schema.json'),
	},
};

test('structure', () => {
	specs.forEach(el => {
		const { localName, namespaceURI } = resolveNamespace(el.name);
		try {
			getAttrSpecs(localName, namespaceURI, htmlSpec);
		} catch (e: unknown) {
			throw el;
		}
	});
});

describe('schema', () => {
	const map: [name: string, validator: ValidateFunction, targetFiles: string][] = [
		[
			'spec.*.json',
			new Ajv({
				schemas: [
					schemas.element,
					schemas.aria,
					schemas.contentModels,
					schemas.globalAttributes,
					schemas.attributes,
					schemas.types,
				],
			}).getSchema(schemas.element.$id)!,
			path.resolve(__dirname, 'spec.*.json'),
		],
		[
			'spec-common.attributes.json',
			new Ajv({
				schemas: [schemas.globalAttributes, schemas.attributes, schemas.types],
			}).getSchema(schemas.globalAttributes.$id)!,
			path.resolve(__dirname, 'spec-common.attributes.json'),
		],
	];

	for (const [testName, validator, targetFiles] of map) {
		test(testName, async () => {
			const files = glob(targetFiles);
			for (const jsonPath of files) {
				const json = JSON.parse(strip(await readFile(jsonPath, { encoding: 'utf-8' })));
				const isValid = validator(json);
				if (!isValid) {
					throw new Error(`${path.basename(jsonPath)} is invalid (${validator.schemaEnv.baseId})`);
				}
			}
			expect(testName).toBe(testName);
		});
	}
});
