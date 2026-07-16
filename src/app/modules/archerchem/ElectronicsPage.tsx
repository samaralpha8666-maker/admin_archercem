import { FC, useState, useEffect } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { Content } from '../../../_metronic/layout/components/content'
import { getElectronics, createElectronicBoard, updateElectronicBoard, deleteElectronicBoard, getBranches, getBrands } from '../auth/core/_requests'
import { toast } from 'react-hot-toast'

interface Part {
  id: string
  name: string
  value: string
  pattern: string
  refdes: string
  qty: number
  minQty: number
  unit: string
  supplier: string
  basePerBoard?: number // baseline part quantity required per single board
}

interface Board {
  id: string | number
  name: string
  brand: string
  model: string
  version: string
  location: string
  description: string
  qty: number
  minQty: number
  date: string
  parts: Part[]
}

const ElectronicsPage: FC = () => {
  const [boards, setBoards] = useState<Board[]>([])
  const [selectedBoardId, setSelectedBoardId] = useState<string | number>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [plannerBatchQty, setPlannerBatchQty] = useState<number>(50)
  const [loading, setLoading] = useState(false)
  
  // Modals for parts management
  const [showAddPartModal, setShowAddPartModal] = useState(false)
  const [showBulkAdjustModal, setShowBulkAdjustModal] = useState(false)
  const [showNewBoardModal, setShowNewBoardModal] = useState(false)
  const [isSavingBoard, setIsSavingBoard] = useState(false)
  const [showEditBoardModal, setShowEditBoardModal] = useState(false)
  const [isDeletingBoard, setIsDeletingBoard] = useState(false)
  const [isUpdatingBoard, setIsUpdatingBoard] = useState(false)

  // Available branches and brands for new board form
  const [branchList, setBranchList] = useState<any[]>([])
  const [brandList, setBrandList] = useState<any[]>([])

  // New Board Form State
  const [newBoardForm, setNewBoardForm] = useState({
    name: '',
    brand: '',
    model: '',
    version: 'VER-1.0',
    location: '',
    description: '',
    qty: 0,
    minQty: 0
  })

  // Edit Board Form State
  const [editBoardForm, setEditBoardForm] = useState({
    name: '',
    brand: '',
    model: '',
    version: '',
    location: '',
    description: '',
    qty: 0,
    minQty: 0
  })

  // Add Part Form State
  const [partFormData, setPartFormData] = useState<Partial<Part>>({
    name: '', value: '', pattern: 'SMD-0805', refdes: '', qty: 0, minQty: 1, unit: 'Pcs', supplier: '', basePerBoard: 1
  })
  
  // Bulk Adjust State
  const [bulkAdjustmentText, setBulkAdjustmentText] = useState('')

  const fetchBoards = async () => {
    setLoading(true)
    try {
      const activeBranch = localStorage.getItem('active_branch') || 'Vasai Factory (HQ)'
      const res = await getElectronics(activeBranch)
      if (res.data && res.data.success) {
        const data = res.data.boards || []
        setBoards(data)
        if (data.length > 0) {
          // Reset selectedBoardId only if previous selection is not in new filtered list
          const exists = data.some(b => b.id === selectedBoardId)
          if (!exists) {
            setSelectedBoardId(data[0].id)
          }
        } else {
          setSelectedBoardId('')
        }
      }
    } catch (e) {
      console.error('Fetch electronics error:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBoards()
    // Load branches and brands for the new board form
    getBranches().then(r => { if (r.data?.success) setBranchList(r.data.branches || []) }).catch(() => {})
    getBrands().then(r => { if (r.data?.success) setBrandList(r.data.brands || []) }).catch(() => {})
    window.addEventListener('branch_changed', fetchBoards)
    return () => {
      window.removeEventListener('branch_changed', fetchBoards)
    }
  }, [selectedBoardId])

  const selectedBoard = boards.find((b) => b.id === selectedBoardId) || boards[0]

  // Filter BOM parts
  const filteredParts = selectedBoard
    ? selectedBoard.parts.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.refdes.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : []

  // Edit Board Submit
  const handleEditBoardSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBoard) return
    setIsUpdatingBoard(true)
    try {
      const res = await updateElectronicBoard(selectedBoard.id, editBoardForm)
      if (res.data?.success) {
        toast.success(`Board updated successfully!`)
        setShowEditBoardModal(false)
        fetchBoards()
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.error || 'Failed to update board.')
    } finally {
      setIsUpdatingBoard(false)
    }
  }

  // Delete Board
  const handleDeleteBoard = async (boardId: string | number, boardName: string) => {
    if (!window.confirm(`"${boardName}" board permanently delete karna chahte hain?\nIs board ke saare BOM parts bhi delete ho jayenge!`)) return
    setIsDeletingBoard(true)
    try {
      const res = await deleteElectronicBoard(boardId)
      if (res.data?.success) {
        toast.success(`Board "${boardName}" deleted successfully.`)
        setSelectedBoardId('')
        fetchBoards()
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.error || 'Failed to delete board.')
    } finally {
      setIsDeletingBoard(false)
    }
  }

  // New Board Submit
  const handleNewBoardSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBoardForm.name || !newBoardForm.model) {
      toast.error('Board Name and Model are required.')
      return
    }
    setIsSavingBoard(true)
    try {
      const activeBranch = localStorage.getItem('active_branch') || 'Vasai Factory (HQ)'
      const locationMap: Record<string, string> = {
        'Vasai Factory (HQ)': 'Vasai Factory',
        'Malad Store': 'Malad Store',
        'Sathivali Branch': 'Sathivali Branch',
        'Vadodara Lab': 'Vadodara Lab'
      }
      const payload = {
        ...newBoardForm,
        location: newBoardForm.location || locationMap[activeBranch] || activeBranch,
        parts: []
      }
      const res = await createElectronicBoard(payload)
      if (res.data?.success) {
        toast.success(`Board "${res.data.board.name}" created successfully!`)
        setShowNewBoardModal(false)
        setNewBoardForm({ name: '', brand: '', model: '', version: 'VER-1.0', location: '', description: '', qty: 0, minQty: 0 })
        fetchBoards()
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.error || 'Failed to create board.')
    } finally {
      setIsSavingBoard(false)
    }
  }

  // Add Part Submit
  const handleAddPartSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBoard || !partFormData.name || !partFormData.value) {
      toast.error('Please fill Name and Value fields.')
      return
    }

    const newPart: Part = {
      id: `${selectedBoard.id}-${Date.now()}`,
      name: partFormData.name,
      value: partFormData.value,
      pattern: partFormData.pattern || 'SMD-0805',
      refdes: partFormData.refdes || '—',
      qty: Number(partFormData.qty) || 0,
      minQty: Number(partFormData.minQty) || 0,
      unit: partFormData.unit || 'Pcs',
      supplier: partFormData.supplier || '—',
      basePerBoard: Number(partFormData.basePerBoard) || 1,
    }

    const updatedParts = [...selectedBoard.parts, newPart]

    try {
      const res = await updateElectronicBoard(selectedBoard.id, { parts: updatedParts })
      if (res.data && res.data.success) {
        toast.success('Part added to BOM successfully.')
        fetchBoards()
        setShowAddPartModal(false)
        setPartFormData({ name: '', value: '', pattern: 'SMD-0805', refdes: '', qty: 0, minQty: 1, unit: 'Pcs', supplier: '', basePerBoard: 1 })
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.error || 'Failed to add part to BOM.')
    }
  }

  // Bulk Adjust Submit (pasted text parsed format: PartValue,QuantityToAdd)
  const handleBulkAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBoard) return

    const lines = bulkAdjustmentText.split('\n')
    const partsCopy = [...selectedBoard.parts]
    let addedCount = 0

    lines.forEach((line) => {
      const parts = line.split(',')
      if (parts.length >= 2) {
        const val = parts[0].trim().toLowerCase()
        const adjustment = parseInt(parts[1].trim(), 10)
        if (val && !isNaN(adjustment)) {
          const match = partsCopy.find((p) => p.value.toLowerCase() === val)
          if (match) {
            match.qty = Math.max(0, match.qty + adjustment)
            addedCount++
          }
        }
      }
    })

    try {
      const res = await updateElectronicBoard(selectedBoard.id, { parts: partsCopy })
      if (res.data && res.data.success) {
        toast.success(`Successfully adjusted stock for ${addedCount} items.`)
        fetchBoards()
        setShowBulkAdjustModal(false)
        setBulkAdjustmentText('')
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.error || 'Failed to adjust stock quantities.')
    }
  }

  // CSV Shortfall Export Helper
  const exportPlannerCSV = () => {
    if (!selectedBoard) return

    const headers = 'Part Name,Value,Pattern,Required Per Board,Total Required,Current Stock,Shortfall,Status\n'
    const rows = selectedBoard.parts.map((p) => {
      const required = (p.basePerBoard || 0) * plannerBatchQty
      const shortfall = Math.max(0, required - p.qty)
      const status = shortfall > 0 ? 'SHORTFALL' : 'OK'
      return `"${p.name}","${p.value}","${p.pattern}",${p.basePerBoard || 0},${required},${p.qty},${shortfall},"${status}"`
    }).join('\n')

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', `${selectedBoard.model}_shortfall_plan_${plannerBatchQty}_units.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <>
      <PageTitle breadcrumbs={[]}>Electronics BOM &amp; Purchase Planner</PageTitle>
      <Content>
        {loading && boards.length === 0 ? (
          <div className='card p-10 text-center text-muted shadow-sm'>
            <span className='spinner-border spinner-border-sm align-middle me-2'></span>
            Loading BOM configurations from database...
          </div>
        ) : boards.length === 0 ? (
          <div className='card p-10 text-center text-muted shadow-sm'>No BOM configurations found.</div>
        ) : (
          <div className='row g-6'>
            {/* Left Column: Board BOM Explorer Table */}
            <div className='col-xl-8'>
              <div className='card border-0 shadow-sm mb-6'>
                <div className='card-header border-0 pt-6'>
                  <h3 className='card-title align-items-start flex-column'>
                    <span className='card-label fw-bold text-gray-900 fs-3'>BOM Stock Explorer</span>
                    <span className='text-gray-500 mt-1 fw-semibold fs-7'>Search and manage components in the board Bill of Materials</span>
                  </h3>
                  <div className='card-toolbar gap-2'>
                    <button
                      onClick={() => setShowNewBoardModal(true)}
                      className='btn btn-success btn-sm fw-bold'
                    >
                      🖥️ New Board
                    </button>
                    <button
                      onClick={() => setShowAddPartModal(true)}
                      className='btn btn-primary btn-sm fw-bold'
                    >
                      + Add BOM Part
                    </button>
                    <button
                      onClick={() => setShowBulkAdjustModal(true)}
                      className='btn btn-light-success btn-sm fw-bold'
                    >
                      ⚡ Bulk Adjust Stock
                    </button>
                  </div>
                </div>

                <div className='card-body pt-2'>
                  {/* Selector & Search Bar */}
                  <div className='row g-4 mb-6 align-items-center'>
                    <div className='col-md-5'>
                      <label className='form-label fw-bold fs-7 text-muted'>Select PCB Assembly</label>
                      <select
                        value={selectedBoardId}
                        onChange={(e) => setSelectedBoardId(e.target.value)}
                        className='form-select form-select-solid'
                      >
                        {boards.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({b.version})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className='col-md-7'>
                      <label className='form-label fw-bold fs-7 text-muted'>Search parts</label>
                      <div className='position-relative'>
                        <span className='position-absolute ms-3 top-50 translate-middle-y'>🔍</span>
                        <input
                          type='text'
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className='form-control form-control-solid ps-10'
                          placeholder='Search by capacitor/resistor value, refdes, footprint...'
                        />
                      </div>
                    </div>
                  </div>

                  {/* Board Meta strip */}
                  {selectedBoard && (
                    <div className='bg-light p-5 rounded mb-6'>
                      <div className='d-flex justify-content-between align-items-start flex-wrap gap-3'>
                        <div>
                          <strong className='text-gray-900 fs-6'>{selectedBoard.description || selectedBoard.name}</strong>
                          <div className='d-flex gap-4 mt-2 fs-7 text-muted flex-wrap'>
                            <span>🏭 Location: <strong>{selectedBoard.location}</strong></span>
                            <span>🔢 Version: <strong>{selectedBoard.version}</strong></span>
                            <span>🔄 Updated: <strong>{selectedBoard.date}</strong></span>
                          </div>
                        </div>
                        <div className='d-flex gap-2'>
                          <button
                            className='btn btn-light btn-sm fw-bold'
                            disabled={isUpdatingBoard || isDeletingBoard}
                            onClick={() => {
                              setEditBoardForm({
                                name: selectedBoard.name,
                                brand: selectedBoard.brand,
                                model: selectedBoard.model,
                                version: selectedBoard.version,
                                location: selectedBoard.location,
                                description: selectedBoard.description || '',
                                qty: selectedBoard.qty,
                                minQty: selectedBoard.minQty
                              })
                              setShowEditBoardModal(true)
                            }}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            className='btn btn-light-danger btn-sm fw-bold'
                            disabled={isDeletingBoard}
                            onClick={() => handleDeleteBoard(selectedBoard.id, selectedBoard.name)}
                          >
                            {isDeletingBoard ? (
                              <span className='spinner-border spinner-border-sm me-1'></span>
                            ) : '🗑️'} Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Parts Table */}
                  <div className='table-responsive'>
                    <table className='table table-row-dashed table-row-gray-200 align-middle gs-0 gy-3'>
                      <thead>
                        <tr className='fw-bold text-muted text-uppercase fs-8'>
                          <th>Part Description</th>
                          <th>Footprint / Pattern</th>
                          <th>Reference Designator</th>
                          <th className='text-end'>Stock Qty</th>
                          <th className='text-end'>Min safety qty</th>
                          <th className='text-end'>Base / Board</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredParts.length === 0 ? (
                          <tr>
                            <td colSpan={6} className='text-center text-muted py-6'>No matching parts in Bill of Materials.</td>
                          </tr>
                        ) : (
                          filteredParts.map((p) => {
                            const isLow = p.qty <= p.minQty
                            return (
                              <tr key={p.id}>
                                <td>
                                  <div className='d-flex flex-column'>
                                    <span className='text-gray-900 fw-bold fs-6'>{p.value}</span>
                                    <span className='text-muted fs-7'>{p.name}</span>
                                  </div>
                                </td>
                                <td>
                                  <span className='badge badge-light fw-bold fs-8'>{p.pattern}</span>
                                </td>
                                <td>
                                  <code className='text-gray-600 fs-8 d-block text-truncate' style={{ maxWidth: '180px' }} title={p.refdes}>
                                    {p.refdes}
                                  </code>
                                </td>
                                <td className='text-end'>
                                  <span className={`fw-bold fs-6 ${isLow ? 'text-danger' : 'text-gray-900'}`}>
                                    {p.qty} {p.unit}
                                  </span>
                                  {isLow && (
                                    <span className='badge badge-light-danger fw-bold ms-2 px-2 py-1 fs-9'>Low</span>
                                  )}
                                </td>
                                <td className='text-end text-muted fw-semibold fs-7'>{p.minQty}</td>
                                <td className='text-end fw-bold text-primary fs-7'>{p.basePerBoard || 1}</td>
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

            {/* Right Column: Production Requisition & Purchase Planner */}
            <div className='col-xl-4'>
              <div className='card border-0 shadow-sm mb-6 bg-body'>
                <div className='card-header pt-6 border-0'>
                  <h3 className='card-title fw-bold text-gray-900 fs-4'>Production &amp; Purchase Planner</h3>
                </div>

                {selectedBoard && (
                  <div className='card-body pt-2'>
                    <p className='text-gray-600 fs-7'>
                      Calculate part shortfall logs dynamically by entering your planned manufacturing production batch volume.
                    </p>

                    <div className='mb-6'>
                      <label className='form-label fw-bold fs-7 text-gray-800 required'>Planned Production Batch Size</label>
                      <div className='input-group'>
                        <input
                          type='number'
                          value={plannerBatchQty}
                          onChange={(e) => setPlannerBatchQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                          className='form-control form-control-solid'
                          placeholder='Qty'
                        />
                        <span className='input-group-text bg-light border-0 fw-semibold fs-7'>Boards</span>
                      </div>
                    </div>

                    {/* Planner Shortfall list */}
                    <div className='mb-6'>
                      <div className='d-flex justify-content-between align-items-center mb-3 fs-7'>
                        <span className='fw-bold text-muted text-uppercase'>Required Shortfall Summary</span>
                        <button onClick={exportPlannerCSV} className='btn btn-link btn-sm fw-bold p-0'>
                          📥 Export CSV Plan
                        </button>
                      </div>

                      <div className='d-flex flex-column gap-3 max-h-350px scroll-y pr-2'>
                        {selectedBoard.parts.map((p) => {
                          const required = (p.basePerBoard || 0) * plannerBatchQty
                          const shortfall = Math.max(0, required - p.qty)
                          const isShort = shortfall > 0

                          return (
                            <div key={p.id} className='d-flex align-items-center justify-content-between border-bottom pb-2'>
                              <div className='d-flex flex-column'>
                                <strong className='text-gray-800 fs-7'>{p.value}</strong>
                                <span className='text-muted fs-8'>{p.name} · req: {required}</span>
                              </div>
                              <div className='text-end'>
                                {isShort ? (
                                  <>
                                    <span className='text-danger fw-bold fs-7'>-{shortfall} {p.unit}</span>
                                    <span className='badge badge-light-danger fw-bold ms-2 px-2 py-0.5 fs-9'>Buy</span>
                                  </>
                                ) : (
                                  <span className='badge badge-light-success fw-bold px-2 py-1 fs-9'>Stock OK</span>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <button
                      onClick={exportPlannerCSV}
                      className='btn btn-light-primary fw-bold w-100'
                    >
                      📥 Generate and Download Purchase PR Data
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal: Add Part */}
        {showAddPartModal && (
          <div className='modal fade show d-block' style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} role='dialog'>
            <div className='modal-dialog modal-dialog-centered mw-600px'>
              <div className='modal-content rounded'>
                <div className='modal-header pb-0 border-0 justify-content-end'>
                  <button onClick={() => setShowAddPartModal(false)} className='btn btn-icon btn-active-color-primary'>
                    ✕
                  </button>
                </div>
                <div className='modal-body px-10 pt-0 pb-10'>
                  <form onSubmit={handleAddPartSubmit} className='form'>
                    <div className='mb-6 text-center'>
                      <h2 className='mb-2'>Add Part to BOM</h2>
                      <p className='text-gray-500 fs-7'>Add a new component standard to {selectedBoard?.name}</p>
                    </div>

                    <div className='row g-4 mb-4'>
                      <div className='col-md-6'>
                        <label className='form-label fw-bold fs-7 required'>Part Name</label>
                        <input
                          type='text'
                          value={partFormData.name || ''}
                          onChange={(e) => setPartFormData({ ...partFormData, name: e.target.value })}
                          className='form-control form-control-solid'
                          placeholder='e.g. Chip Resistor'
                        />
                      </div>
                      <div className='col-md-6'>
                        <label className='form-label fw-bold fs-7 required'>Value / Rating</label>
                        <input
                          type='text'
                          value={partFormData.value || ''}
                          onChange={(e) => setPartFormData({ ...partFormData, value: e.target.value })}
                          className='form-control form-control-solid'
                          placeholder='e.g. 10k-1%'
                        />
                      </div>
                    </div>

                    <div className='row g-4 mb-4'>
                      <div className='col-md-6'>
                        <label className='form-label fw-bold fs-7'>Pattern / Package</label>
                        <input
                          type='text'
                          value={partFormData.pattern || ''}
                          onChange={(e) => setPartFormData({ ...partFormData, pattern: e.target.value })}
                          className='form-control form-control-solid'
                          placeholder='e.g. SMD-0805'
                        />
                      </div>
                      <div className='col-md-6'>
                        <label className='form-label fw-bold fs-7'>Reference Designators</label>
                        <input
                          type='text'
                          value={partFormData.refdes || ''}
                          onChange={(e) => setPartFormData({ ...partFormData, refdes: e.target.value })}
                          className='form-control form-control-solid'
                          placeholder='e.g. R4, R5, R6'
                        />
                      </div>
                    </div>

                    <div className='row g-4 mb-6'>
                      <div className='col-md-4'>
                        <label className='form-label fw-bold fs-7'>Qty in Stock</label>
                        <input
                          type='number'
                          value={partFormData.qty || 0}
                          onChange={(e) => setPartFormData({ ...partFormData, qty: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                          className='form-control form-control-solid'
                        />
                      </div>
                      <div className='col-md-4'>
                        <label className='form-label fw-bold fs-7'>Min Safety Limit</label>
                        <input
                          type='number'
                          value={partFormData.minQty || 0}
                          onChange={(e) => setPartFormData({ ...partFormData, minQty: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                          className='form-control form-control-solid'
                        />
                      </div>
                      <div className='col-md-4'>
                        <label className='form-label fw-bold fs-7'>Base / Board Qty</label>
                        <input
                          type='number'
                          value={partFormData.basePerBoard || 1}
                          onChange={(e) => setPartFormData({ ...partFormData, basePerBoard: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                          className='form-control form-control-solid'
                        />
                      </div>
                    </div>

                    <div className='row g-4 mb-6'>
                      <div className='col-md-6'>
                        <label className='form-label fw-bold fs-7'>Unit</label>
                        <input
                          type='text'
                          value={partFormData.unit || ''}
                          onChange={(e) => setPartFormData({ ...partFormData, unit: e.target.value })}
                          className='form-control form-control-solid'
                        />
                      </div>
                      <div className='col-md-6'>
                        <label className='form-label fw-bold fs-7'>Supplier Name</label>
                        <input
                          type='text'
                          value={partFormData.supplier || ''}
                          onChange={(e) => setPartFormData({ ...partFormData, supplier: e.target.value })}
                          className='form-control form-control-solid'
                        />
                      </div>
                    </div>

                    <div className='d-flex justify-content-end gap-3'>
                      <button type='button' onClick={() => setShowAddPartModal(false)} className='btn btn-light'>
                        Cancel
                      </button>
                      <button type='submit' className='btn btn-primary'>
                        Add to BOM
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Bulk Adjust Stock */}
        {showBulkAdjustModal && (
          <div className='modal fade show d-block' style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} role='dialog'>
            <div className='modal-dialog modal-dialog-centered mw-500px'>
              <div className='modal-content rounded'>
                <div className='modal-header pb-0 border-0 justify-content-end'>
                  <button onClick={() => setShowBulkAdjustModal(false)} className='btn btn-icon btn-active-color-primary'>
                    ✕
                  </button>
                </div>
                <div className='modal-body px-10 pt-0 pb-10'>
                  <form onSubmit={handleBulkAdjustSubmit} className='form'>
                    <div className='mb-6 text-center'>
                      <h2 className='mb-2'>Bulk Stock-In Adjuster</h2>
                      <p className='text-gray-500 fs-7'>Pasted values must match format `ValueRating,Quantity` (one item per line)</p>
                    </div>

                    <div className='mb-6'>
                      <label className='form-label fw-bold fs-7'>Input adjustment details</label>
                      <textarea
                        value={bulkAdjustmentText}
                        onChange={(e) => setBulkAdjustmentText(e.target.value)}
                        rows={8}
                        className='form-control form-control-solid font-monospace fs-7'
                        placeholder='e.g.&#10;100nf, 200&#10;10uf, 50&#10;1k-1%, -10'
                      />
                    </div>

                    <div className='d-flex justify-content-end gap-3'>
                      <button type='button' onClick={() => setShowBulkAdjustModal(false)} className='btn btn-light'>
                        Cancel
                      </button>
                      <button type='submit' className='btn btn-success'>
                        Apply Adjustments
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Modal: Create New Board */}
        {showNewBoardModal && (
          <div className='modal fade show d-block' style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} role='dialog'>
            <div className='modal-dialog modal-dialog-centered mw-650px'>
              <div className='modal-content rounded border-0 shadow-lg bg-body'>
                <div className='modal-header border-0 pt-5 px-8'>
                  <h3 className='modal-title fw-bold fs-3 text-gray-900'>🖥️ Register New PCB Assembly</h3>
                  <button type='button' className='btn-close' onClick={() => setShowNewBoardModal(false)} disabled={isSavingBoard}></button>
                </div>

                <form onSubmit={handleNewBoardSubmit}>
                  <div className='modal-body px-8 py-5'>
                    <div className='row g-4 mb-4'>
                      <div className='col-md-6'>
                        <label className='form-label fw-bold fs-7 required'>Board / Assembly Name</label>
                        <input
                          type='text'
                          value={newBoardForm.name}
                          onChange={(e) => setNewBoardForm({ ...newBoardForm, name: e.target.value })}
                          className='form-control form-control-solid'
                          placeholder='e.g. ADRA ADC Module - CS5530'
                          required
                          disabled={isSavingBoard}
                        />
                      </div>
                      <div className='col-md-6'>
                        <label className='form-label fw-bold fs-7 required'>Model Number</label>
                        <input
                          type='text'
                          value={newBoardForm.model}
                          onChange={(e) => setNewBoardForm({ ...newBoardForm, model: e.target.value })}
                          className='form-control form-control-solid'
                          placeholder='e.g. ADRA-ADC-CS5530'
                          required
                          disabled={isSavingBoard}
                        />
                      </div>
                    </div>

                    <div className='row g-4 mb-4'>
                      <div className='col-md-6'>
                        <label className='form-label fw-bold fs-7'>Brand</label>
                        <select
                          value={newBoardForm.brand}
                          onChange={(e) => setNewBoardForm({ ...newBoardForm, brand: e.target.value })}
                          className='form-select form-select-solid'
                          disabled={isSavingBoard}
                        >
                          <option value=''>-- Select Brand --</option>
                          {brandList.map((br) => (
                            <option key={br.id} value={br.name}>{br.name}</option>
                          ))}
                          <option value='ADRA'>ADRA</option>
                        </select>
                      </div>
                      <div className='col-md-6'>
                        <label className='form-label fw-bold fs-7'>Version</label>
                        <input
                          type='text'
                          value={newBoardForm.version}
                          onChange={(e) => setNewBoardForm({ ...newBoardForm, version: e.target.value })}
                          className='form-control form-control-solid'
                          placeholder='e.g. VER-2.01'
                          disabled={isSavingBoard}
                        />
                      </div>
                    </div>

                    <div className='row g-4 mb-4'>
                      <div className='col-md-6'>
                        <label className='form-label fw-bold fs-7'>Branch / Location</label>
                        <select
                          value={newBoardForm.location}
                          onChange={(e) => setNewBoardForm({ ...newBoardForm, location: e.target.value })}
                          className='form-select form-select-solid'
                          disabled={isSavingBoard}
                        >
                          <option value=''>-- Select Branch --</option>
                          {branchList.map((b) => (
                            <option key={b.id} value={b.name}>{b.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className='col-md-3'>
                        <label className='form-label fw-bold fs-7'>Current Stock</label>
                        <input
                          type='number'
                          value={newBoardForm.qty}
                          onChange={(e) => setNewBoardForm({ ...newBoardForm, qty: parseInt(e.target.value) || 0 })}
                          className='form-control form-control-solid'
                          disabled={isSavingBoard}
                        />
                      </div>
                      <div className='col-md-3'>
                        <label className='form-label fw-bold fs-7'>Min Safety Qty</label>
                        <input
                          type='number'
                          value={newBoardForm.minQty}
                          onChange={(e) => setNewBoardForm({ ...newBoardForm, minQty: parseInt(e.target.value) || 0 })}
                          className='form-control form-control-solid'
                          disabled={isSavingBoard}
                        />
                      </div>
                    </div>

                    <div className='mb-4'>
                      <label className='form-label fw-bold fs-7'>Description</label>
                      <textarea
                        value={newBoardForm.description}
                        onChange={(e) => setNewBoardForm({ ...newBoardForm, description: e.target.value })}
                        className='form-control form-control-solid'
                        placeholder='e.g. ADC Module board based on Cirrus Logic CS5530 A/D converter IC (TSSOP20)'
                        rows={3}
                        disabled={isSavingBoard}
                      />
                    </div>

                    <div className='alert alert-info d-flex align-items-center p-4 mb-0'>
                      <span className='me-2'>💡</span>
                      <span className='fs-7'>Board create hone ke baad aap <strong>"+ Add BOM Part"</strong> button se individual components add kar sakte hain.</span>
                    </div>
                  </div>

                  <div className='modal-footer border-0 pb-6 px-8 gap-3'>
                    <button type='button' className='btn btn-light fw-bold fs-7' onClick={() => setShowNewBoardModal(false)} disabled={isSavingBoard}>Cancel</button>
                    <button type='submit' className='btn btn-success fw-bold fs-7' disabled={isSavingBoard}>
                      {!isSavingBoard ? (
                        '🖥️ Create Board'
                      ) : (
                        <span className='indicator-progress' style={{ display: 'block' }}>
                          Creating...
                          <span className='spinner-border spinner-border-sm align-middle ms-2'></span>
                        </span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
        {/* Modal: Edit Board */}
        {showEditBoardModal && (
          <div className='modal fade show d-block' style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} role='dialog'>
            <div className='modal-dialog modal-dialog-centered mw-650px'>
              <div className='modal-content rounded border-0 shadow-lg bg-body'>
                <div className='modal-header border-0 pt-5 px-8'>
                  <h3 className='modal-title fw-bold fs-3 text-gray-900'>✏️ Edit PCB Assembly</h3>
                  <button type='button' className='btn-close' onClick={() => setShowEditBoardModal(false)} disabled={isUpdatingBoard}></button>
                </div>

                <form onSubmit={handleEditBoardSubmit}>
                  <div className='modal-body px-8 py-5'>
                    <div className='row g-4 mb-4'>
                      <div className='col-md-6'>
                        <label className='form-label fw-bold fs-7 required'>Board / Assembly Name</label>
                        <input
                          type='text'
                          value={editBoardForm.name}
                          onChange={(e) => setEditBoardForm({ ...editBoardForm, name: e.target.value })}
                          className='form-control form-control-solid'
                          required
                          disabled={isUpdatingBoard}
                        />
                      </div>
                      <div className='col-md-6'>
                        <label className='form-label fw-bold fs-7 required'>Model Number</label>
                        <input
                          type='text'
                          value={editBoardForm.model}
                          onChange={(e) => setEditBoardForm({ ...editBoardForm, model: e.target.value })}
                          className='form-control form-control-solid'
                          required
                          disabled={isUpdatingBoard}
                        />
                      </div>
                    </div>

                    <div className='row g-4 mb-4'>
                      <div className='col-md-6'>
                        <label className='form-label fw-bold fs-7'>Brand</label>
                        <select
                          value={editBoardForm.brand}
                          onChange={(e) => setEditBoardForm({ ...editBoardForm, brand: e.target.value })}
                          className='form-select form-select-solid'
                          disabled={isUpdatingBoard}
                        >
                          <option value=''>-- Select Brand --</option>
                          {brandList.map((br) => (
                            <option key={br.id} value={br.name}>{br.name}</option>
                          ))}
                          <option value='ADRA'>ADRA</option>
                        </select>
                      </div>
                      <div className='col-md-6'>
                        <label className='form-label fw-bold fs-7'>Version</label>
                        <input
                          type='text'
                          value={editBoardForm.version}
                          onChange={(e) => setEditBoardForm({ ...editBoardForm, version: e.target.value })}
                          className='form-control form-control-solid'
                          disabled={isUpdatingBoard}
                        />
                      </div>
                    </div>

                    <div className='row g-4 mb-4'>
                      <div className='col-md-6'>
                        <label className='form-label fw-bold fs-7'>Branch / Location</label>
                        <select
                          value={editBoardForm.location}
                          onChange={(e) => setEditBoardForm({ ...editBoardForm, location: e.target.value })}
                          className='form-select form-select-solid'
                          disabled={isUpdatingBoard}
                        >
                          <option value=''>-- Select Branch --</option>
                          {branchList.map((b) => (
                            <option key={b.id} value={b.name}>{b.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className='col-md-3'>
                        <label className='form-label fw-bold fs-7'>Current Stock</label>
                        <input
                          type='number'
                          value={editBoardForm.qty}
                          onChange={(e) => setEditBoardForm({ ...editBoardForm, qty: parseInt(e.target.value) || 0 })}
                          className='form-control form-control-solid'
                          disabled={isUpdatingBoard}
                        />
                      </div>
                      <div className='col-md-3'>
                        <label className='form-label fw-bold fs-7'>Min Safety Qty</label>
                        <input
                          type='number'
                          value={editBoardForm.minQty}
                          onChange={(e) => setEditBoardForm({ ...editBoardForm, minQty: parseInt(e.target.value) || 0 })}
                          className='form-control form-control-solid'
                          disabled={isUpdatingBoard}
                        />
                      </div>
                    </div>

                    <div className='mb-2'>
                      <label className='form-label fw-bold fs-7'>Description</label>
                      <textarea
                        value={editBoardForm.description}
                        onChange={(e) => setEditBoardForm({ ...editBoardForm, description: e.target.value })}
                        className='form-control form-control-solid'
                        rows={3}
                        disabled={isUpdatingBoard}
                      />
                    </div>
                  </div>

                  <div className='modal-footer border-0 pb-6 px-8 gap-3'>
                    <button type='button' className='btn btn-light fw-bold fs-7' onClick={() => setShowEditBoardModal(false)} disabled={isUpdatingBoard}>Cancel</button>
                    <button type='submit' className='btn btn-primary fw-bold fs-7' disabled={isUpdatingBoard}>
                      {!isUpdatingBoard ? (
                        '✏️ Update Board'
                      ) : (
                        <span className='indicator-progress' style={{ display: 'block' }}>
                          Saving...
                          <span className='spinner-border spinner-border-sm align-middle ms-2'></span>
                        </span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </Content>
    </>
  )
}

export default ElectronicsPage
