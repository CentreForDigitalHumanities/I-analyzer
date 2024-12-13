# Frontend environment settings

The frontend contains an `environment.ts` file that can be used to edit settings for the specific environment.

## List of settings

### `production`

Type: boolean

This will [enable production mode](https://v16.angular.io/api/core/enableProdMode) for Angular.

### `appName`

Type: string

The name of the application that should be shown to users. This is used in page titles and the like.

### `aboutPage`

Type: string

Different servers typically require different about pages. We keep several pages in [`/frontend/src/assets/about/`](/frontend/src/assets/about/); this setting determines which file is used.

The name must match the filename without a path or file extension.

### `apiUrl`

Type: string

The URL to the backend API endpoint. If the backend is served on the same domain as the frontend, you can use an absolute path (e.g. `/api/`) instead of a full URL. Relative paths (e.g. `api/`) are not supported.

### `adminUrl`

The URL to the Django admin site. See the documentation for `apiUrl`.

### `samlLogoutUrl`

The URL to the page where SAML users can log out. See the documentation for `apiUrl`.

### `showSolis`

Type: boolean

Whether to show the option for SAML login in the login or registration form.

### `runInIFrame`

Type: boolean

Set to `true` if this instance is intended to be embedded in an iframe, rather than visited directly.

This will affect the styling of the site; the main change is that the main navigation and footer will be hidden, which allows the site to fit into a different page. Note that this also limits options for users to navigate the site.

The effect is purely aesthetic. It does not adjust any server-side configurations, e.g. to set the `X-Frame-Options` header.

### `directDownloadLimit`

Type: number

Sets the cutoff point between [direct downloads and scheduled downloads](./Downloads.md#downloading-search-results).

### `version`

Type: string

Sets the semantic version of I-analyzer that is displayed in the footer.

You could set this manually, but in most cases, you will import it from `version.ts`. That file is updated when you build the frontend, based on the version number in [`package.json`](../package.json). See [Making a release](./Making-a-release.md).

### `sourceURL`

Type: string

The URL to the source repository, which is linked in the footer.

Change this if you create a fork of I-analyzer.

### `logos`

Can be used to add additional logos to the page footer.

Type: either `undefined` or an array of objects. Each item must match the following interface:

```ts
interface Logo {
    path: string, // URL of the image source
    url: string, // URL that the image should link to
    alt: string, // alt text for the image
    width: number, // width of the image in pixels
}
```

### `showCorpusFilters`

Type: boolean

By default, the corpus selection menu will allow users to filter corpora based on their category, time period, and language. If the server has a very small number of corpora, or the corpora are very similar, you can use this this setting to hide the filters.
