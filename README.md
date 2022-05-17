# remark-mdx-next

> A [remark](https://github.com/remarkjs) plugin for converting frontmatter metadata into
> getStaticProps

Keep your MDX files clean! Based on the great
[remark-mdx-frontmatter](https://github.com/remcohaszing/remark-mdx-frontmatter) plugin.

## Installation

This package depends on the AST output by
[remark-frontmatter](https://github.com/remarkjs/remark-frontmatter)

```sh
npm install remark-frontmatter remark-mdx-next
```

## Usage

This remark plugin takes frontmatter content from mdx files and outputs it as props in getStaticProps for use in Next.js apps. Both YAML and TOML frontmatter data are supported. It also maintains the core functionality of remark-mdx-frontmatter.

Combine this plugin with the MDXProvider's `wrapper` component and you can keep your MDX files completely free of anything other than metadata and content.

For example, given a file named `example.mdx` with the following contents:

```mdx
---
hello: frontmatter
---

Rest of document
```

The following script:

```js
import { readFileSync } from 'fs';
import remarkFrontmatter from 'remark-frontmatter';
import { remarkMDXNext } from 'remark-mdx-next';
import { compileSync } from 'xdm';

const { contents } = compileSync(readFileSync('example.mdx'), {
  jsx: true,
  remarkPlugins: [remarkFrontmatter, remarkMDXNext],
});
console.log(contents);
```

Roughly yields:

```jsx
export const hello = 'frontmatter';
export function getStaticProps() {
  return {
    props: {
      hello: 'frontmatter',
    },
  };
}
export default function MDXContent() {
  return <p>Rest of document</p>;
}
```

### Options

#### `name`

By default, every frontmatter object key is turned into a JavaScript export. If `name` is specified,
the YAML content is exported as one single export using this name. This is useful if you wish to use
top-level frontmatter nodes other than objects, or if the frontmatter content contains keys which
aren’t valid JavaScript identifiers.
