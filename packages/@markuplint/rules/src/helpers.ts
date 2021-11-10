import type { Translator } from '@markuplint/i18n';
import type { Element, RuleConfigValue } from '@markuplint/ml-core';
import type { ARIRRoleAttribute, Attribute, MLMLSpec, PermittedRoles } from '@markuplint/ml-spec';

import { def, specs } from '@markuplint/html-spec';

import { attrCheck } from './attr-check';

export function getAttrSpecs(nameWithNS: string, { specs, def }: MLMLSpec) {
	const spec = specs.find(spec => spec.name === nameWithNS);

	if (!spec) {
		return null;
	}
	const globalAttrs = def['#globalAttrs'];
	const attrs: Attribute[] = [];

	if (!/[a-z]:[a-z]/i.test(nameWithNS)) {
		// It's HTML tag
		const hasGlobalAttr = spec.attributes.some(attr => attr === '#globalAttrs');
		if (hasGlobalAttr) {
			attrs.push(...(globalAttrs['#HTMLGlobalAttrs'] || []));
		}
	}

	for (const attr of spec.attributes) {
		if (typeof attr === 'string') {
			const globalAttr = globalAttrs[attr];
			if (!globalAttr) {
				continue;
			}
			attrs.push(...globalAttr);
			continue;
		}

		const definedIndex = attrs.findIndex(a => a.name === attr.name);
		if (definedIndex !== -1) {
			attrs[definedIndex] = {
				...attrs[definedIndex],
				...attr,
			};
			continue;
		}

		attrs.push(attr);
	}

	attrs.push(...(globalAttrs['#extends'] || []));

	return attrs;
}

export function attrMatches<T extends RuleConfigValue, R>(node: Element<T, R>, condition: Attribute['condition']) {
	if (!condition) {
		return true;
	}

	let matched = false;
	if ('self' in condition && condition.self) {
		const condSelector = Array.isArray(condition.self) ? condition.self.join(',') : condition.self;
		matched = node.matches(condSelector);
	}
	if ('ancestor' in condition && condition.ancestor) {
		let _node = node.parentNode;
		while (_node) {
			if (_node.type === 'Element') {
				if (_node.matches(condition.ancestor)) {
					matched = true;
					break;
				}
			}
			_node = _node.parentNode;
		}
	}
	return matched;
}

export function match(needle: string, pattern: string) {
	const matches = pattern.match(/^\/(.*)\/(i|g|m)*$/);
	if (matches && matches[1]) {
		const re = matches[1];
		const flag = matches[2];
		return new RegExp(re, flag).test(needle);
	}
	return needle === pattern;
}

/**
 * PotentialCustomElementName
 *
 * @see https://spec.whatwg.org/multipage/custom-elements.html#prod-potentialcustomelementname
 *
 * > PotentialCustomElementName ::=
 * >   [a-z] (PCENChar)* '-' (PCENChar)*
 * > PCENChar ::=
 * >   "-" | "." | [0-9] | "_" | [a-z] | #xB7 | [#xC0-#xD6] | [#xD8-#xF6] | [#xF8-#x37D] |
 * >   [#x37F-#x1FFF] | [#x200C-#x200D] | [#x203F-#x2040] | [#x2070-#x218F] | [#x2C00-#x2FEF] | [#x3001-#xD7FF] | [#xF900-#xFDCF] | [#xFDF0-#xFFFD] | [#x10000-#xEFFFF]
 * > This uses the EBNF notation from the XML specification. [XML]
 *
 * ASCII-case-insensitively.
 * Originally, it is not possible to define a name including ASCII upper alphas in the custom element, but it is not treated as illegal by the HTML parser.
 */
export const rePCENChar = [
	'\\-',
	'\\.',
	'[0-9]',
	'_',
	'[a-z]',
	'\u00B7',
	'[\u00C0-\u00D6]',
	'[\u00D8-\u00F6]',
	'[\u00F8-\u037D]',
	'[\u037F-\u1FFF]',
	'[\u200C-\u200D]',
	'[\u203F-\u2040]',
	'[\u2070-\u218F]',
	'[\u2C00-\u2FEF]',
	'[\u3001-\uD7FF]',
	'[\uF900-\uFDCF]',
	'[\uFDF0-\uFFFD]',
	'[\uD800-\uDBFF][\uDC00-\uDFFF]',
].join('|');

export function htmlSpec(nameWithNS: string) {
	const spec = specs.find(spec => spec.name === nameWithNS);
	return spec || null;
}

export function isValidAttr(
	t: Translator,
	name: string,
	value: string,
	isDynamicValue: boolean,
	node: Element<any, any>,
	attrSpecs: Attribute[],
) {
	let invalid: ReturnType<typeof attrCheck> = false;
	const spec = attrSpecs.find(s => s.name === name);
	invalid = attrCheck(t, name, value, false, spec);
	if (!invalid && spec && spec.condition && !node.hasSpreadAttr && !attrMatches(node, spec.condition)) {
		invalid = {
			invalidType: 'non-existent',
			message: t('{0} is {1}', t('the "{0}" {1}', name, 'attribute'), 'disallowed'),
		};
	}
	if (invalid && invalid.invalidType === 'invalid-value' && isDynamicValue) {
		invalid = false;
	}
	return invalid;
}

export function ariaSpec() {
	const roles = def['#roles'];
	const ariaAttrs = def['#ariaAttrs'];
	return {
		roles,
		ariaAttrs,
	};
}

export function getRoleSpec(roleName: string) {
	const role = getRoleByName(roleName);
	if (!role) {
		return null;
	}
	const superClassRoles = recursiveTraverseSuperClassRoles(roleName);
	return {
		name: role.name,
		isAbstract: !!role.isAbstract,
		statesAndProps: role.ownedAttribute,
		superClassRoles,
	};
}

function getRoleByName(roleName: string) {
	const roles = def['#roles'];
	const role = roles.find(r => r.name === roleName);
	return role;
}

function getSuperClassRoles(roleName: string) {
	const role = getRoleByName(roleName);
	return (
		role?.generalization
			.map(roleName => getRoleByName(roleName))
			.filter((role): role is ARIRRoleAttribute => !!role) || null
	);
}

function recursiveTraverseSuperClassRoles(roleName: string) {
	const roles: ARIRRoleAttribute[] = [];
	const superClassRoles = getSuperClassRoles(roleName);
	if (superClassRoles) {
		roles.push(...superClassRoles);
		for (const superClassRole of superClassRoles) {
			const ancestorRoles = recursiveTraverseSuperClassRoles(superClassRole.name);
			roles.push(...ancestorRoles);
		}
	}
	return roles;
}

/**
 * Getting permitted ARIA roles.
 *
 * - If an array, it is role list.
 * - If `true`, this mean is "Any".
 * - If `false`, this mean is "No".
 */
export function getPermittedRoles(el: Element<any, any>) {
	const implicitRole = getImplicitRole(el);
	const spec = htmlSpec(el.nodeName)?.permittedRoles;
	if (!spec) {
		return true;
	}
	if (spec.conditions) {
		for (const { condition, roles } of spec.conditions) {
			if (el.matches(condition)) {
				return mergeRoleList(implicitRole, roles);
			}
		}
	}
	if (implicitRole && Array.isArray(spec.roles)) {
		return [implicitRole, ...spec.roles];
	}
	if (implicitRole && spec.roles === false) {
		return [implicitRole];
	}
	return mergeRoleList(implicitRole, spec.roles);
}

function mergeRoleList(implicitRole: string | false, permittedRoles: PermittedRoles) {
	if (implicitRole && Array.isArray(permittedRoles)) {
		return [implicitRole, ...permittedRoles];
	}
	if (implicitRole && permittedRoles === false) {
		return [implicitRole];
	}
	return permittedRoles;
}

export function getImplicitRole(el: Element<any, any>) {
	const implicitRole = htmlSpec(el.nodeName)?.implicitRole;
	if (!implicitRole) {
		return false;
	}
	if (implicitRole.conditions) {
		for (const { condition, role } of implicitRole.conditions) {
			if (el.matches(condition)) {
				return role;
			}
		}
	}
	return implicitRole.role;
}

export function getComputedRole(el: Element<any, any>) {
	const roleAttrTokens = el.getAttributeToken('role');
	const roleAttr = roleAttrTokens[0];
	if (roleAttr) {
		const roleName = roleAttr.getValue().potential.trim().toLowerCase();
		return {
			name: roleName,
			isImplicit: false,
		};
	}
	const implicitRole = getImplicitRole(el);
	if (implicitRole) {
		return {
			name: implicitRole,
			isImplicit: true,
		};
	}
	return null;
}

/**
 *
 * @see https://www.w3.org/TR/wai-aria-1.2/#propcharacteristic_value
 *
 * @param type
 * @param value
 * @param tokenEnum
 */
export function checkAriaValue(type: string, value: string, tokenEnum: string[]) {
	switch (type) {
		case 'token': {
			return tokenEnum.includes(value);
		}
		case 'token list': {
			const list = value.split(/\s+/g).map(s => s.trim());
			return list.every(token => tokenEnum.includes(token));
		}
		case 'string':
		case 'ID reference':
		case 'ID reference list': {
			return true;
		}
		case 'true/false': {
			return ['true', 'false'].includes(value);
		}
		case 'tristate': {
			return ['mixed', 'true', 'false', 'undefined'].includes(value);
		}
		case 'true/false/undefined': {
			return ['true', 'false', 'undefined'].includes(value);
		}
		case 'integer': {
			return parseInt(value).toString() === value;
		}
		case 'number': {
			return parseFloat(value).toString() === value;
		}
	}
	// For skipping checking
	return true;
}

export function checkAria(attrName: string, currentValue: string, role?: string) {
	const ariaAttrs = def['#ariaAttrs'];
	const aria = ariaAttrs.find(a => a.name === attrName);
	if (!aria) {
		return {
			currentValue,
			// For skipping checking
			isValid: true,
		};
	}
	let valueType = aria.value;
	if (role && aria.conditionalValue) {
		for (const cond of aria.conditionalValue) {
			if (cond.role.includes(role)) {
				valueType = cond.value;
				break;
			}
		}
	}
	const isValid = checkAriaValue(valueType, currentValue, aria.enum);
	return {
		...aria,
		currentValue,
		isValid,
	};
}
