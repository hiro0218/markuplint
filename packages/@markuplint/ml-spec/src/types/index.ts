import type { ARIA } from './aria';
import type { AttributeJSON, AttributeType, GlobalAttributes } from './attributes';
import type { ContentModel, Category } from './permitted-structures';
import type { NamespaceURI } from '@markuplint/ml-ast';

/**
 * markuplint Markup-language spec
 */
export interface MLMLSpec {
	cites: Cites;
	def: SpecDefs;
	specs: ElementSpec[];
}

export type ExtendedElementSpec = Partial<Omit<ElementSpec, 'name' | 'attributes'>> & {
	name: ElementSpec['name'];
	attributes?: Record<string, Partial<Attribute>>;
};

export type ExtendedSpec = {
	cites?: Cites;
	def?: Partial<SpecDefs>;
	specs?: ExtendedElementSpec[];
};

/**
 * Reference URLs
 */
export type Cites = string[];

export type SpecDefs = {
	'#globalAttrs': Partial<{
		'#extends': Record<string, Partial<Attribute>>;
		'#HTMLGlobalAttrs': Record<string, Partial<Attribute>>;
		[OtherGlobalAttrs: string]: Record<string, Partial<Attribute>>;
	}>;
	'#aria': {
		'1.2': ARIASpec;
		'1.1': ARIASpec;
	};
	'#contentModels': { [model in Category]?: string[] };
};

type ARIASpec = {
	roles: ARIARoleInSchema[];
	graphicsRoles: ARIARoleInSchema[];
	props: ARIAProperty[];
};

/**
 * Element spec
 */
export type ElementSpec = {
	/**
	 * Tag name
	 */
	name: string;

	/**
	 * Namespaces in XML
	 * @see https://www.w3.org/TR/xml-names/
	 */
	namespace?: NamespaceURI;

	/**
	 * Reference URL
	 */
	cite: string;

	/**
	 * Description
	 */
	description?: string;

	/**
	 * Experimental technology
	 */
	experimental?: true;

	/**
	 * Obsolete or alternative elements
	 */
	obsolete?:
		| true
		| {
				alt: string;
		  };

	/**
	 * Deprecated
	 */
	deprecated?: true;

	/**
	 * Non-standard
	 */
	nonStandard?: true;

	/**
	 * Element categories
	 */
	categories: Category[];

	/**
	 * Permitted contents and permitted parents
	 */
	contentModel: ContentModel;

	/**
	 * Tag omission
	 */
	omission: ElementSpecOmission;

	/**
	 * Global Attributes
	 */
	globalAttrs: GlobalAttributes;

	/**
	 * Attributes
	 */
	attributes: Record<string, Attribute>;

	/**
	 * WAI-ARIA role and properties
	 */
	aria: ARIA;

	/**
	 * If true, it is possible to add any properties as attributes,
	 * for example, when using a template engine or a view language.
	 *
	 * @see https://v2.vuejs.org/v2/guide/components-slots.html#Scoped-Slots
	 *
	 * **It assumes to specify it on the parser plugin.**
	 */
	possibleToAddProperties?: true;
};

type ElementSpecOmission = false | ElementSpecOmissionTags;

type ElementSpecOmissionTags = {
	startTag: boolean | ElementCondition;
	endTag: boolean | ElementCondition;
};

type ElementCondition = {
	__WIP__: 'WORK_IN_PROGRESS';
};

export type Attribute = {
	name: string;
	type: AttributeType | AttributeType[];
	description?: string;
	caseSensitive?: true;
	experimental?: boolean;
	obsolete?: true;
	deprecated?: boolean;
	nonStandard?: true;
} & ExtendableAttributeSpec;

type ExtendableAttributeSpec = Omit<AttributeJSON, 'type'>;

export type ARIARole = {
	name: string;
	isAbstract: boolean;
	requiredContextRole: string[];
	requiredOwnedElements: string[];
	accessibleNameRequired: boolean;
	accessibleNameFromAuthor: boolean;
	accessibleNameFromContent: boolean;
	accessibleNameProhibited: boolean;
	childrenPresentational: boolean;
	ownedProperties: ARIARoleOwnedProperties[];
	prohibitedProperties: string[];
};

export type ARIARoleInSchema = Partial<
	ARIARole & {
		description: string;
		generalization: string[];
	}
> & {
	name: string;
};

export type ARIARoleOwnedProperties = {
	name: string;
	inherited?: true;
	required?: true;
	deprecated?: true;
};

export type ARIAProperty = {
	name: string;
	type: 'property' | 'state';
	deprecated?: true;
	isGlobal?: true;
	value: ARIAAttributeValue;
	conditionalValue?: {
		role: string[];
		value: ARIAAttributeValue;
	}[];
	enum: string[];
	defaultValue?: string;
	equivalentHtmlAttrs?: EquivalentHtmlAttr[];
	valueDescriptions?: Record<string, string>;
};

export type ARIAAttributeValue =
	| 'true/false'
	| 'tristate'
	| 'true/false/undefined'
	| 'ID reference'
	| 'ID reference list'
	| 'integer'
	| 'number'
	| 'string'
	| 'token'
	| 'token list'
	| 'URI';

export type ARIAVersion = '1.1' | '1.2';

export type EquivalentHtmlAttr = {
	htmlAttrName: string;
	isNotStrictEquivalent?: true;
	value: string | null;
};

export type Matches = (selector: string) => boolean;

export type ComputedRole = {
	el: Element;
	role:
		| (ARIARole & {
				superClassRoles: ARIARoleInSchema[];
				isImplicit?: boolean;
		  })
		| null;
	errorType?: RoleComputationError;
};

export type RoleComputationError =
	| 'ABSTRACT'
	| 'GLOBAL_PROP_MUST_NOT_BE_PRESENTATIONAL'
	| 'IMPLICIT_ROLE_NAMESPACE_ERROR'
	| 'INTERACTIVE_ELEMENT_MUST_NOT_BE_PRESENTATIONAL'
	| 'INVALID_LANDMARK'
	| 'INVALID_REQUIRED_CONTEXT_ROLE'
	| 'NO_EXPLICIT'
	| 'NO_OWNER'
	| 'NO_PERMITTED'
	| 'REQUIRED_OWNED_ELEMENT_MUST_NOT_BE_PRESENTATIONAL'
	| 'ROLE_NO_EXISTS';
