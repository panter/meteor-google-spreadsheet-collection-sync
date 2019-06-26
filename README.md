# google-spreadsheet-collection-sync

## usage

simple example:

```js
const Products = new Meteor.Collection('Products')

const productsSync = new CollectionSyncer({
  spreadsheetId: 'myspreadsheetId',
  sheetName: 'Products',
  collection: Products,
})
```

you can sync by calling `productsSync.sync()`

if you define an env var `SYNC_WEBHOOK_SECRET`

you can also trigger the sync by calling a webhook:

`http://localhost:3000/_hooks/sync/<SYNC_WEBHOOK_SECRET>/Products`
