import rethinkDBDash from 'rethinkdbdash'


export const r = rethinkDBDash({
  host: 'rethink',
  db: 'owo_vc',
  optionalRun: false,
  cursor: false
})

export interface Link {
  id: string,
  destination: string
}

(async () => {
  const dbList = await r.dbList().run()
  if (!dbList.includes('owo_vc')) {
    await r.dbCreate('owo_vc').run()
  }
  const tableList = await r.tableList().run()
  if (!tableList.includes('links')) {
    await r.tableCreate('links').run()
  }
})()
  .catch(console.error)
