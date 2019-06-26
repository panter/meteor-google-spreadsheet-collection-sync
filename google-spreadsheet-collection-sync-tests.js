// Import Tinytest from the tinytest Meteor package.
import { Tinytest } from "meteor/tinytest";

// Import and rename a variable exported by google-spreadsheet-collection-sync.js.
import { name as packageName } from "meteor/panter:google-spreadsheet-collection-sync";

// Write your tests here!
// Here is an example.
Tinytest.add('google-spreadsheet-collection-sync - example', function (test) {
  test.equal(packageName, "google-spreadsheet-collection-sync");
});
