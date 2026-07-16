import { FC, useState, useEffect } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { Content } from '../../../_metronic/layout/components/content'
import { toast } from 'react-hot-toast'

interface StoreMeta {
  label: string
  location: string
  abbr: string
  brand: string
}

interface InventoryItem {
  name: string
  quantity: number
  tolerance: number // minimum quantity threshold
}

const STORES: Record<string, StoreMeta> = {
  'vasai': { label: 'Archerchem — Vasai Factory', location: 'Vasai, MH', abbr: 'VF', brand: 'archerchem' },
  'malad': { label: 'Archerchem — Malad Store', location: 'Mumbai, MH', abbr: 'MA', brand: 'archerchem' },
  'sathivali': { label: 'Archerchem — Sathivali Branch', location: 'Navi Mumbai, MH', abbr: 'SA', brand: 'archerchem' },
  'radwag-mumbai': { label: 'Radwag — Mumbai Office', location: 'Andheri, MH', abbr: 'RW', brand: 'radwag' },
  'radwag-pune': { label: 'Radwag — Pune Office', location: 'Pune, MH', abbr: 'RP', brand: 'radwag' },
  'tapson-vasai': { label: 'Tapson — Vasai Unit', location: 'Vasai, MH', abbr: 'TV', brand: 'tapson' },
  'tapson-delhi': { label: 'Tapson — Delhi Office', location: 'Delhi', abbr: 'TD', brand: 'tapson' },
  'adra-vasai': { label: 'ADRA — Vasai Unit', location: 'Vasai, MH', abbr: 'AV', brand: 'adra' },
}

const INITIAL_INVENTORY: Record<string, InventoryItem[]> = {
  'vasai': [
    { name: 'Display Board Assembly', quantity: 120, tolerance: 20 },
    { name: 'Sealing Compound', quantity: 340, tolerance: 50 },
    { name: 'Weight Box 1Kg', quantity: 45, tolerance: 10 },
    { name: 'Calibration Weight', quantity: 18, tolerance: 5 },
    { name: 'Keyboard PCB Module', quantity: 75, tolerance: 15 },
    { name: 'Screw Driver Set', quantity: 12, tolerance: 4 },
  ],
  'malad': [
    { name: 'Display Board Assembly', quantity: 24, tolerance: 10 },
    { name: 'Weight Box 1Kg', quantity: 15, tolerance: 5 },
    { name: 'Calibration Weight', quantity: 6, tolerance: 3 },
    { name: 'Printer Paper Roll', quantity: 40, tolerance: 10 },
  ],
  'sathivali': [
    { name: 'Display Board Assembly', quantity: 15, tolerance: 10 },
    { name: 'Sealing Compound', quantity: 120, tolerance: 30 },
    { name: 'Keyboard PCB Module', quantity: 30, tolerance: 10 },
  ],
  'radwag-mumbai': [
    { name: 'Calibration Weight', quantity: 22, tolerance: 5 },
    { name: 'Screw Driver Set', quantity: 8, tolerance: 3 },
    { name: 'Printer Paper Roll', quantity: 60, tolerance: 15 },
  ],
}

const StorePage: FC = () => {
  const [inventories, setInventories] = useState<Record<string, InventoryItem[]>>({})
  const [selectedStoreId, setSelectedStoreId] = useState<string>('vasai')
  const [activeTab, setActiveTab] = useState<'inventory' | 'transfer'>('inventory')

  // Modals state
  const [showIssueModal, setShowIssueModal] = useState(false)
  const [selectedItemName, setSelectedItemName] = useState<string | null>(null)
  const [issueQty, setIssueQty] = useState<number>(1)

  // Transfer Form State
  const [transferSource, setTransferSource] = useState('vasai')
  const [transferDest, setTransferDest] = useState('malad')
  const [transferItem, setTransferItem] = useState('')
  const [transferQty, setTransferQty] = useState<number>(1)

  useEffect(() => {
    const cached = localStorage.getItem('archerchem_store_inventories')
    if (cached) {
      try {
        setInventories(JSON.parse(cached))
      } catch (e) {
        setInventories(INITIAL_INVENTORY)
      }
    } else {
      setInventories(INITIAL_INVENTORY)
      localStorage.setItem('archerchem_store_inventories', JSON.stringify(INITIAL_INVENTORY))
    }
  }, [])

  useEffect(() => {
    const syncActiveStore = () => {
      const activeBranch = localStorage.getItem('active_branch') || 'Vasai Factory (HQ)'
      if (activeBranch.includes('Vasai')) {
        setSelectedStoreId('vasai')
      } else if (activeBranch.includes('Malad')) {
        setSelectedStoreId('malad')
      } else if (activeBranch.includes('Sathivali')) {
        setSelectedStoreId('sathivali')
      }
    }
    syncActiveStore()
    window.addEventListener('branch_changed', syncActiveStore)
    return () => {
      window.removeEventListener('branch_changed', syncActiveStore)
    }
  }, [])

  const saveInventories = (updated: Record<string, InventoryItem[]>) => {
    setInventories(updated)
    localStorage.setItem('archerchem_store_inventories', JSON.stringify(updated))
  }

  const selectedStore = STORES[selectedStoreId] || STORES['vasai']
  const storeItems = inventories[selectedStoreId] || []

  // Issue Stock action
  const handleIssueStockSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItemName) return

    const items = inventories[selectedStoreId] || []
    const match = items.find((i) => i.name === selectedItemName)
    if (!match) return

    if (match.quantity < issueQty) {
      toast.error(`Insufficient stock. Only ${match.quantity} available in ${selectedStore.label}.`)
      return
    }

    const updatedItems = items.map((i) =>
      i.name === selectedItemName ? { ...i, quantity: i.quantity - issueQty } : i
    )
    const updated = { ...inventories, [selectedStoreId]: updatedItems }

    saveInventories(updated)
    toast.success(`Successfully issued ${issueQty} units of ${selectedItemName} from ${selectedStore.label}.`)
    setShowIssueModal(false)
    setSelectedItemName(null)
    setIssueQty(1)
  }

  // Inter Branch Transfer Submit
  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (transferSource === transferDest) {
      toast.error('Source and destination stores must be different.')
      return
    }
    if (!transferItem) {
      toast.error('Please select an item to transfer.')
      return
    }

    const sourceItems = inventories[transferSource] || []
    const matchSource = sourceItems.find((i) => i.name === transferItem)

    if (!matchSource || matchSource.quantity < transferQty) {
      toast.error(`Insufficient stock in source branch. Available: ${matchSource ? matchSource.quantity : 0}`)
      return
    }

    // Deduct from Source
    const updatedSource = sourceItems.map((i) =>
      i.name === transferItem ? { ...i, quantity: i.quantity - transferQty } : i
    )

    // Add to Destination
    const destItems = inventories[transferDest] || []
    const matchDest = destItems.find((i) => i.name === transferItem)
    let updatedDest: InventoryItem[]

    if (matchDest) {
      updatedDest = destItems.map((i) =>
        i.name === transferItem ? { ...i, quantity: i.quantity + transferQty } : i
      )
    } else {
      // Create new record in destination store
      updatedDest = [...destItems, { name: transferItem, quantity: transferQty, tolerance: matchSource.tolerance }]
    }

    const updated = {
      ...inventories,
      [transferSource]: updatedSource,
      [transferDest]: updatedDest,
    }

    saveInventories(updated)
    toast.success(`Successfully transferred ${transferQty} unit(s) of ${transferItem} from ${STORES[transferSource].label} to ${STORES[transferDest].label}.`)
    setTransferQty(1)
  }

  return (
    <>
      <PageTitle breadcrumbs={[]}>Store Locations &amp; Logistics</PageTitle>
      <Content>
        {/* Navigation Tabs */}
        <div className='card mb-6 border-0 shadow-sm'>
          <div className='card-body py-2 d-flex justify-content-between align-items-center flex-wrap gap-4'>
            <div className='d-flex align-items-center gap-3'>
              <button
                onClick={() => setActiveTab('inventory')}
                className={`btn btn-sm px-5 py-3 fw-bold ${
                  activeTab === 'inventory' ? 'btn-primary' : 'btn-light-secondary text-gray-800'
                }`}
              >
                🏪 Store Stock Inventory
              </button>
              <button
                onClick={() => setActiveTab('transfer')}
                className={`btn btn-sm px-5 py-3 fw-bold ${
                  activeTab === 'transfer' ? 'btn-primary' : 'btn-light-secondary text-gray-800'
                }`}
              >
                ↔️ Inter-Branch Transfer
              </button>
            </div>
          </div>
        </div>

        {/* Tab 1: Inventory explorer */}
        {activeTab === 'inventory' && (
          <div className='row g-6'>
            {/* Sidebar selector of stores */}
            <div className='col-lg-4'>
              <div className='card card-flush border-0 shadow-sm'>
                <div className='card-header pt-6'>
                  <h3 className='card-title fw-bold text-gray-900 fs-4'>Store Locations</h3>
                </div>
                <div className='card-body pt-2'>
                  <div className='d-flex flex-column gap-2'>
                    {Object.keys(STORES).map((storeId) => (
                      <button
                        key={storeId}
                        onClick={() => setSelectedStoreId(storeId)}
                        className={`btn text-start fw-bold px-4 py-3 ${
                          selectedStoreId === storeId ? 'btn-primary' : 'btn-light-secondary text-gray-800'
                        }`}
                      >
                        <div className='d-flex align-items-center gap-2'>
                          <span className='fs-5'>{STORES[storeId].abbr}</span>
                          <div>
                            <div className='fs-7'>{STORES[storeId].label}</div>
                            <small className='fs-9 opacity-75'>{STORES[storeId].location}</small>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Store inventory list */}
            <div className='col-lg-8'>
              <div className='card card-flush border-0 shadow-sm'>
                <div className='card-header pt-6 border-0'>
                  <h3 className='card-title align-items-start flex-column'>
                    <span className='card-label fw-bold text-gray-900 fs-3'>{selectedStore.label}</span>
                    <span className='text-gray-500 mt-1 fw-semibold fs-7'>Active inventory stock logs</span>
                  </h3>
                </div>

                <div className='card-body pt-2'>
                  <div className='table-responsive'>
                    <table className='table table-row-dashed table-row-gray-200 align-middle gs-0 gy-4'>
                      <thead>
                        <tr className='fw-bold text-muted text-uppercase fs-8'>
                          <th>Item Name</th>
                          <th className='text-end'>Stock Qty</th>
                          <th className='text-end'>Safety Threshold</th>
                          <th className='text-end'>Stock Status</th>
                          <th className='text-end'>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {storeItems.length === 0 ? (
                          <tr>
                            <td colSpan={5} className='text-center text-muted py-6'>No inventory stock registered in this store.</td>
                          </tr>
                        ) : (
                          storeItems.map((item, idx) => {
                            const isLow = item.quantity <= item.tolerance
                            const isOut = item.quantity === 0
                            return (
                              <tr key={idx}>
                                <td><span className='text-gray-900 fw-bold fs-6'>{item.name}</span></td>
                                <td className='text-end fw-bold text-gray-900'>{item.quantity} Pcs</td>
                                <td className='text-end text-muted fw-semibold fs-7'>{item.tolerance} Pcs</td>
                                <td className='text-end'>
                                  <span
                                    className={`badge badge-light-${
                                      isOut ? 'danger' : isLow ? 'warning' : 'success'
                                    } fw-bold px-3 py-1`}
                                  >
                                    {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                                  </span>
                                </td>
                                <td className='text-end'>
                                  <button
                                    onClick={() => {
                                      setSelectedItemName(item.name)
                                      setIssueQty(1)
                                      setShowIssueModal(true)
                                    }}
                                    disabled={isOut}
                                    className='btn btn-light-primary btn-sm fw-bold px-3 py-1.5'
                                  >
                                    Issue Stock
                                  </button>
                                </td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Inter Branch Transfer */}
        {activeTab === 'transfer' && (
          <div className='card border-0 shadow-sm mw-800px mx-auto'>
            <div className='card-header border-0 pt-6'>
              <h3 className='card-title fw-bold text-gray-900 fs-3'>Inter-Branch Stock Transfer</h3>
            </div>
            <form onSubmit={handleTransferSubmit} className='form card-body pt-4'>
              <p className='text-gray-600 fs-7 mb-6'>
                Move items directly from one factory branch store to another. Deductions and additions are calculated instantly.
              </p>

              <div className='row g-6 mb-6'>
                <div className='col-md-6'>
                  <label className='form-label fw-bold fs-7 required'>Source Store (From)</label>
                  <select
                    value={transferSource}
                    onChange={(e) => {
                      setTransferSource(e.target.value)
                      setTransferItem('')
                    }}
                    className='form-select form-select-solid'
                  >
                    {Object.keys(STORES).map((storeId) => (
                      <option key={storeId} value={storeId}>
                        {STORES[storeId].label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className='col-md-6'>
                  <label className='form-label fw-bold fs-7 required'>Destination Store (To)</label>
                  <select
                    value={transferDest}
                    onChange={(e) => setTransferDest(e.target.value)}
                    className='form-select form-select-solid'
                  >
                    {Object.keys(STORES).map((storeId) => (
                      <option key={storeId} value={storeId}>
                        {STORES[storeId].label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Selector of item */}
              <div className='row g-6 mb-6'>
                <div className='col-md-8'>
                  <label className='form-label fw-bold fs-7 required'>Select Item to Transfer</label>
                  <select
                    value={transferItem}
                    onChange={(e) => setTransferItem(e.target.value)}
                    className='form-select form-select-solid'
                  >
                    <option value=''>-- Select Item --</option>
                    {(inventories[transferSource] || []).map((i, idx) => (
                      <option key={idx} value={i.name}>
                        {i.name} (Available: {i.quantity} Pcs)
                      </option>
                    ))}
                  </select>
                </div>

                <div className='col-md-4'>
                  <label className='form-label fw-bold fs-7 required'>Quantity to Transfer</label>
                  <input
                    type='number'
                    value={transferQty}
                    onChange={(e) => setTransferQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className='form-control form-control-solid'
                  />
                </div>
              </div>

              <div className='d-flex justify-content-end gap-3 pt-6 border-top'>
                <button
                  type='submit'
                  className='btn btn-primary fw-bold px-6'
                  disabled={!transferItem}
                >
                  ↔️ Initiate Inter-branch Transfer
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Modal: Issue Stock */}
        {showIssueModal && selectedItemName && (
          <div className='modal fade show d-block' style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} role='dialog'>
            <div className='modal-dialog modal-dialog-centered mw-450px'>
              <div className='modal-content rounded border-0'>
                <div className='modal-header pb-0 border-0 justify-content-end'>
                  <button onClick={() => setShowIssueModal(false)} className='btn btn-icon btn-active-color-primary'>✕</button>
                </div>
                <div className='modal-body px-8 pt-0 pb-8'>
                  <form onSubmit={handleIssueStockSubmit} className='form'>
                    <div className='mb-6 text-center'>
                      <h3 className='mb-2'>Issue Inventory Stock</h3>
                      <p className='text-gray-500 fs-7'>Issue `{selectedItemName}` from {selectedStore.label}</p>
                    </div>

                    <div className='mb-6'>
                      <label className='form-label fw-bold fs-7 required'>Quantity to Issue</label>
                      <input
                        type='number'
                        value={issueQty}
                        onChange={(e) => setIssueQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className='form-control form-control-solid'
                      />
                    </div>

                    <div className='d-flex justify-content-end gap-3'>
                      <button type='button' onClick={() => setShowIssueModal(false)} className='btn btn-light'>Cancel</button>
                      <button type='submit' className='btn btn-primary'>Confirm Issue</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </Content>
    </>
  )
}

export default StorePage
