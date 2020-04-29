import { TRANSACTION_GROUPS, TRANSACTION_TYPES } from '@config'

import querystring from 'querystring'

const schemaRegex = new RegExp(/^(?:ark:)([-0-9a-zA-Z]{1,34})([-a-zA-Z0-9+&@#/%=~_|$?!:,.]*)$/)

const URIActions = {
  GROUP_1: {
    TRANSFER: 'transfer',
    VOTE: 'vote',
    DELEGATE_REGISTRATION: 'register-delegate'
  // },
  // GROUP_2: {
  //   BUSINESS_REGISTRATION: 'register-business',
  //   BRIDGECHAIN_REGISTRATION: 'register-bridgechain'
  }
}

export default class URIHandler {
  constructor (url) {
    this.url = url
  }

  /**
   * Transforms a uri schema into a json object
   * @returns {Object}
   */
  deserialize () {
    const schema = this.validate()

    if (!schema) return

    let address, action

    // 'address' is used only in legacy URIs
    if (schema[1].length === 34) {
      address = schema[1]
    } else {
      action = schema[1]
    }

    const scheme = {
      ...querystring.parse(schema[2].substring(1))
    }

    scheme.type = scheme.type !== undefined ? Number(scheme.type) : TRANSACTION_TYPES.GROUP_1.TRANSFER
    scheme.typeGroup = Number(scheme.typeGroup) || TRANSACTION_GROUPS.STANDARD

    scheme.amount = scheme.amount ? scheme.amount : ''
    scheme.label = this.__fullyDecode(scheme.label)
    scheme.nethash = this.__fullyDecode(scheme.nethash)
    scheme.vendorField = this.__fullyDecode(scheme.vendorField) || ''
    scheme.wallet = this.__fullyDecode(scheme.wallet)
    scheme.recipientId = address || scheme.recipientId || ''

    this.__inferTypesFromAction(scheme, action)

    const baseSchema = {
      type: scheme.type,
      typeGroup: scheme.typeGroup,
      fee: scheme.fee,
      wallet: scheme.wallet,
      nethash: scheme.nethash
    }

    // Standard Transactions
    if (scheme.typeGroup === TRANSACTION_GROUPS.STANDARD) {
      // Transfer
      if (scheme.type === TRANSACTION_TYPES.GROUP_1.TRANSFER) {
        return {
          ...baseSchema,
          amount: scheme.amount,
          recipientId: scheme.recipientId,
          vendorField: scheme.vendorField
        }
      }

      // Vote
      if (scheme.type === TRANSACTION_TYPES.GROUP_1.VOTE) {
        scheme.vote = scheme.delegate
      }

      // Delegate Registration
      if (scheme.type === TRANSACTION_TYPES.GROUP_1.DELEGATE_REGISTRATION) {
        console.log('delegate registration', {
          ...baseSchema,
          username: scheme.delegate
        })

        return {
          ...baseSchema,
          username: scheme.delegate
        }
      }
    }

    // Magistrate Transactions
    if (scheme.typeGroup === TRANSACTION_GROUPS.MAGISTRATE) {
      // Business Registration
      if (scheme.type === TRANSACTION_TYPES.GROUP_2.BUSINESS_REGISTRATION) {
        scheme.business = {
          name: this.__fullyDecode(scheme.name),
          website: this.__fullyDecode(scheme.website),
          vat: this.__fullyDecode(scheme.vat),
          repository: this.__fullyDecode(scheme.repository)
        }
      }

      // Bridgechain Registration
      if (scheme.type === TRANSACTION_TYPES.GROUP_2.BRIDGECHAIN_REGISTRATION) {
        scheme.bridgechain = {
          name: this.__fullyDecode(scheme.name),
          genesisHash: this.__fullyDecode(scheme.genesisHash),
          bridgechainRepository: this.__fullyDecode(scheme.bridgechainRepository),
          bridgechainAssetRepository: this.__fullyDecode(scheme.bridgechainAssetRepository)
        }
      }
    }

    return scheme
  }

  /**
   * Check if is a valid URI
   * @returns {Boolean}
   */
  validate () {
    if (schemaRegex.test(this.url)) {
      const schema = this.__formatSchema()

      if (schema[1].length === 34 || this.__actionExists(schema[1])) {
        return schema
      }
    }

    return false
  }

  /**
   * Checks whether the parameter is encoded
   * @param {String} param
   * @returns {String}
   */
  __fullyDecode (param) {
    if (!param) {
      return null
    }

    const isEncoded = (str) => str !== decodeURIComponent(str)

    while (isEncoded(param)) param = decodeURIComponent(param)

    return param
  }

  __formatSchema () {
    return schemaRegex.exec(this.url)
  }

  __inferTypesFromAction (scheme, action) {
    if (!this.__actionExists(action)) {
      return
    }

    if (action === URIActions.GROUP_1.TRANSFER) {
      scheme.type = TRANSACTION_TYPES.GROUP_1.TRANSFER
      scheme.typeGroup = TRANSACTION_GROUPS.STANDARD
    }

    if (action === URIActions.GROUP_1.VOTE) {
      scheme.type = TRANSACTION_TYPES.GROUP_1.VOTE
      scheme.typeGroup = TRANSACTION_GROUPS.STANDARD
    }

    if (action === URIActions.GROUP_1.DELEGATE_REGISTRATION) {
      scheme.type = TRANSACTION_TYPES.GROUP_1.DELEGATE_REGISTRATION
      scheme.typeGroup = TRANSACTION_GROUPS.STANDARD
    }

    // if (action === URIActions.GROUP_2.BUSINESS_REGISTRATIONS) {
    //   scheme.type = TRANSACTION_TYPES.GROUP_2.BUSINESS_REGISTRATION
    //   scheme.typeGroup = TRANSACTION_GROUPS.MAGISTRATE
    // }

    // if (action === URIActions.GROUP_2.BRIDGECHAIN_REGISTRATIONS) {
    //   scheme.type = TRANSACTION_TYPES.GROUP_2.BRIDGECHAIN_REGISTRATION
    //   scheme.typeGroup = TRANSACTION_GROUPS.MAGISTRATE
    // }
  }

  __actionExists (action) {
    const actions = []

    for (const actionGroup of Object.values(URIActions)) {
      actions.push(...Object.values(actionGroup))
    }

    return actions.includes(action)
  }
}
