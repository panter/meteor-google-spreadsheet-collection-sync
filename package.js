Package.describe({
  name: 'panter:google-spreadsheet-collection-sync',
  version: '0.0.3',
  // Brief, one-line summary of the package.
  summary: 'easily snyc collections with a google spreadsheet',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
})

Package.onUse(function(api) {
  api.versionsFrom('1.8.1')
  api.use('ecmascript')
  api.use('webapp')
  api.use('panter:google-api-auth@0.0.2')
  api.mainModule('google-spreadsheet-collection-sync.js', ['server'])
})
