import { name as isValidIdentifierName } from 'estree-util-is-identifier-name';
import { valueToEstree } from 'estree-util-value-to-estree';
import { load } from 'js-yaml';
import { Root, YAML } from 'mdast';
import { MDXJSEsm } from 'mdast-util-mdx';
import { parse } from 'toml';
import { Attacher } from 'unified';

export interface RemarkMdxNextOptions {
  /**
   * If specified, the YAML data is exported using this name. Otherwise, each
   * object key will be used as an export name.
   */
  name?: string;
}

/**
 * A remark plugin to expose frontmatter data as getStaticProps.
 *
 * @param options - Optional options to configure the output.
 * @returns A unified transformer.
 */
export const remarkMdxNext: Attacher<[RemarkMdxNextOptions?]> =
  ({ name } = {}) =>
  (ast) => {
    const mdast = ast as Root;
    const imports: MDXJSEsm[] = [];

    if (name && !isValidIdentifierName(name)) {
      throw new Error(
        `If name is specified, this should be a valid identifier name, got: ${JSON.stringify(
          name,
        )}`,
      );
    }

    for (const node of mdast.children) {
      let data: unknown;
      const { value } = node as YAML;
      if (node.type === 'yaml') {
        data = load(value);
        // @ts-expect-error A custom node type may be registered for TOML frontmatter data.
      } else if (node.type === 'toml') {
        data = parse(value);
      }
      if (data == null) {
        continue;
      }
      if (!name && typeof data !== 'object') {
        throw new Error(`Expected frontmatter data to be an object, got:\n${value}`);
      }

      imports.push({
        type: 'mdxjsEsm',
        value: '',
        data: {
          estree: {
            type: 'Program',
            sourceType: 'module',
            body: [
              {
                type: 'ExportNamedDeclaration',
                // Id: { type: "Identifier", name: 'getStaticProps' },
                source: null,
                specifiers: [],
                declaration: {
                  type: 'FunctionDeclaration',
                  id: { type: 'Identifier', name: 'getStaticProps' },
                  params: [],
                  body: {
                    type: 'BlockStatement',
                    body: [
                      {
                        type: 'ReturnStatement',
                        argument: valueToEstree({ props: data }),
                      },
                    ],
                  },
                  generator: false,
                },
              },
              {
                type: 'ExportNamedDeclaration',
                source: null,
                specifiers: [],
                declaration: {
                  type: 'VariableDeclaration',
                  kind: 'const',
                  declarations: Object.entries(name ? { [name]: data } : (data as object)).map(
                    ([identifier, val]) => {
                      if (!isValidIdentifierName(identifier)) {
                        throw new Error(
                          `Frontmatter keys should be valid identifiers, got: ${JSON.stringify(
                            identifier,
                          )}`,
                        );
                      }
                      return {
                        type: 'VariableDeclarator',
                        id: { type: 'Identifier', name: identifier },
                        init: valueToEstree(val),
                      };
                    },
                  ),
                },
              },
            ],
          },
        },
      });
    }
    mdast.children.unshift(...imports);
  };
