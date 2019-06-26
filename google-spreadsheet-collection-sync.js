import { google } from 'googleapis'
import { set, omit } from 'lodash'

import { Meteor } from 'meteor/meteor'
import { Promise } from 'meteor/promise'
import { WebApp } from 'meteor/webapp'
import { createAuth } from 'meteor/panter:google-api-auth'

const WEBHOOKS = {}

const DEFAULT_FORMATTERS = {
  Number,
  Boolean,
}
export class CollectionSyncer {
  constructor({
    spreadsheetId,
    sheetName,
    idExtractor = null,
    collection,
    rowFilter,
    scopes = ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    headerIndex = 1,
    typesIndex = 2,
    formatters = {},
    webhookId,
    excludeKeys = [],
    deleteUnusedSelector = {},
    additionalProps,
    webhookPrefix = '/_hooks/sync',
  }) {
    this.rowFilter = rowFilter
    this.deleteUnusedSelector = deleteUnusedSelector
    this.webhookPrefix = webhookPrefix
    this.webhookId = webhookId || sheetName
    this.sheetName = sheetName
    this.spreadsheetId = spreadsheetId
    this.idExtractor = idExtractor
    this.collection = collection
    this.excludeKeys = excludeKeys
    this.additionalProps = additionalProps
    const auth = createAuth(scopes)
    const sheets = google.sheets({ version: 'v4', auth })
    this.getValuesSync = Meteor.wrapAsync(
      sheets.spreadsheets.values.get,
      sheets.spreadsheets.values
    )

    this.headerIndex = headerIndex
    this.typesIndex = typesIndex
    this.formatters = {
      ...DEFAULT_FORMATTERS,
      ...formatters,
    }
    this.setupHooks()
  }

  sync() {
    const data = this.getData()
    const idsSynced = []

    data.forEach(({ _id, ...row }, index) => {
      if (!_id) {
        if (this.idExtractor) {
          _id = this.idExtractor(row, index)
        } else {
          throw new Error(
            `row has no _id and no idExtractor is defined: ${JSON.stringify(
              row
            )}`
          )
        }
      }
      idsSynced.push(_id)

      const data = omit(row, this.excludeKeys)

      this.collection.upsert(
        {
          _id,
        },
        {
          $set: {
            ...data,
            ...(this.additionalProps
              ? this.additionalProps({ _id, ...row })
              : {}),
          },
        }
      )
    })

    this.collection.remove({
      _id: { $nin: idsSynced },
      ...this.deleteUnusedSelector,
    })
  }

  getData() {
    const result = this.getValuesSync({
      spreadsheetId: this.spreadsheetId,
      range: `'${this.sheetName}'!A1:AH999999`,
      majorDimension: 'ROWS',
    })
    const { values } = result.data

    const rows = values.slice(Math.max(this.typesIndex, this.headerIndex) + 1)
    const header = values[this.headerIndex]
    const types = values[this.typesIndex]

    // use first row as ids

    const data = rows.map(row =>
      row.reduce((obj, cell, index) => {
        const keyPath = header[index]
        if (!keyPath) {
          return obj
        }
        const type = types[index]
        const formatter = this.formatters[type]
        const value = formatter ? formatter(cell) : cell
        return set(obj, keyPath, value)
      }, {})
    )

    if (!this.rowFilter) {
      return data
    }
    return data.filter(this.rowFilter)
  }

  setupHooks() {
    if (!process.env.SYNC_WEBHOOK_SECRET) {
      return
    }
    const webhook = `${this.webhookPrefix}/${process.env.SYNC_WEBHOOK_SECRET}/${
      this.webhookId
    }`
    if (!WEBHOOKS[webhook]) {
      WEBHOOKS[webhook] = [this]
      console.log(`creating webhook: ${Meteor.absoluteUrl(webhook)}`)

      WebApp.connectHandlers.use(webhook, (req, res, next) => {
        WEBHOOKS[webhook].forEach(syncer => syncer.sync())
        res.writeHead(200)
        res.end(`done`)
      })
    } else {
      WEBHOOKS[webhook].push(this)
    }
  }
}
