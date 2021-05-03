'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class UnitsSchema extends Schema {
  up () {
    this.create('units', (table) => {
      table.increments()
      table.integer('semester')
      table.string('name', 255)
      table.integer('students')
      table.timestamps()
    })
  }

  down () {
    this.drop('units')
  }
}

module.exports = UnitsSchema