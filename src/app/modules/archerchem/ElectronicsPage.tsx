import { FC, useState, useEffect } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { Content } from '../../../_metronic/layout/components/content'
import { getElectronics, createElectronicBoard, updateElectronicBoard, deleteElectronicBoard, getBranches, getBrands, manufactureElectronicBoard, getElectronicsLogs } from '../auth/core/_requests'
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
  const [viewState, setViewState] = useState<'list' | 'detail'>('list')
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'low'>('all')
  const [boardSearchTerm, setBoardSearchTerm] = useState('')
  
  // Logs and Manufacturing States
  const [logs, setLogs] = useState<any[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [activeTab, setActiveTab] = useState<'boards' | 'logs'>('boards')
  
  const [showManufactureModal, setShowManufactureModal] = useState(false)
  const [manufactureQty, setManufactureQty] = useState<number>(5)
  const [manufactureRef, setManufactureRef] = useState('')
  const [isManufacturing, setIsManufacturing] = useState(false)

  // Single Component Manage Modal States
  const [managePart, setManagePart] = useState<Part | null>(null)
  const [manageAction, setManageAction] = useState<'add' | 'subtract' | 'set'>('add')
  const [manageQty, setManageQty] = useState<number>(0)
  const [manageReason, setManageReason] = useState('')
  const [isSavingManagePart, setIsSavingManagePart] = useState(false)

  // Purchase Planner Filter & Modal States
  const [plannerFilter, setPlannerFilter] = useState<'all' | 'shortfall' | 'ok'>('all')
  const [showPrSummaryModal, setShowPrSummaryModal] = useState(false)

  // Modals for parts management
  const [showAddPartModal, setShowAddPartModal] = useState(false)
  const [showBulkAdjustModal, setShowBulkAdjustModal] = useState(false)
  const [showBulkStockInModal, setShowBulkStockInModal] = useState(false)
  const [bulkStockInBoardsQty, setBulkStockInBoardsQty] = useState<number>(10)
  const [bulkStockInInvoice, setBulkStockInInvoice] = useState('')
  const [isSavingBulkStockIn, setIsSavingBulkStockIn] = useState(false)
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

  const fetchLogs = async (boardId?: string | number) => {
    setLoadingLogs(true)
    try {
      const res = await getElectronicsLogs(boardId)
      if (res.data?.success) {
        setLogs(res.data.logs || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingLogs(false)
    }
  }

  const handleManufactureSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBoard) return
    if (manufactureQty < 1) return
    setIsManufacturing(true)
    try {
      const res = await manufactureElectronicBoard(selectedBoard.id, manufactureQty, manufactureRef)
      if (res.data?.success) {
        toast.success(`Successfully manufactured ${manufactureQty} boards! Components deducted.`)
        fetchBoards()
        fetchLogs()
        setShowManufactureModal(false)
        setManufactureRef('')
        setManufactureQty(5)
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.error || 'Failed to process manufacturing batch.')
    } finally {
      setIsManufacturing(false)
    }
  }

  // Single Part Stock Manage Submit
  const handleManagePartSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBoard || !managePart) return

    setIsSavingManagePart(true)
    try {
      const prevQty = managePart.qty
      let newQty = prevQty
      if (manageAction === 'add') {
        newQty = prevQty + manageQty
      } else if (manageAction === 'subtract') {
        newQty = Math.max(0, prevQty - manageQty)
      } else if (manageAction === 'set') {
        newQty = Math.max(0, manageQty)
      }

      const updatedParts = selectedBoard.parts.map((p) => {
        if (p.id === managePart.id) {
          return { ...p, qty: newQty }
        }
        return p
      })

      const res = await updateElectronicBoard(selectedBoard.id, {
        parts: updatedParts,
        log_type: 'adjust',
        log_qty: 0,
        log_ref: manageReason ? `Manage: ${manageReason}` : `Adjusted ${managePart.value}`
      })

      if (res.data?.success) {
        toast.success(`Updated ${managePart.value} stock (${prevQty} → ${newQty}) successfully!`)
        fetchBoards()
        fetchLogs()
        setManagePart(null)
        setManageQty(0)
        setManageReason('')
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.error || 'Failed to update component quantity.')
    } finally {
      setIsSavingManagePart(false)
    }
  }

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

  // Confirm and save Bulk Stock In
  const handleBulkStockInSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBoard) return

    setIsSavingBulkStockIn(true)
    try {
      const updatedParts = selectedBoard.parts.map((p) => {
        const added = (p.basePerBoard || 1) * bulkStockInBoardsQty
        return {
          ...p,
          qty: p.qty + added
        }
      })

      const newBoardQty = selectedBoard.qty + bulkStockInBoardsQty

      const res = await updateElectronicBoard(selectedBoard.id, {
        parts: updatedParts,
        qty: newBoardQty
      })

      if (res.data && res.data.success) {
        toast.success(`Successfully added stock for ${bulkStockInBoardsQty} boards.`)
        fetchBoards()
        setShowBulkStockInModal(false)
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.error || 'Failed to complete Bulk Stock In.')
    } finally {
      setIsSavingBulkStockIn(false)
    }
  }

  // CSV Shortfall Export Helper (Matches spreadsheet screenshot layout)
  const exportPlannerCSV = () => {
    if (!selectedBoard) return

    const nowStr = new Date().toLocaleString('en-IN')
    let csvContent = `Purchase Plan for,${selectedBoard.name},Brand,${selectedBoard.brand}\n`
    csvContent += `Quantity to Build,${plannerBatchQty}\n`
    csvContent += `Generated,${nowStr}\n\n`
    csvContent += `Part Name,Value,Pattern,RefDes,Per Board Qty,Required Qty,Current Stock,Shortfall / To Buy,Status\n`

    const rows = selectedBoard.parts.map((p) => {
      const required = (p.basePerBoard || 0) * plannerBatchQty
      const shortfall = Math.max(0, required - p.qty)
      const status = shortfall > 0 ? 'SHORTFALL - BUY' : 'STOCK OK'
      const refdesClean = `"${(p.refdes || '').replace(/"/g, '""')}"`
      return `"${p.name}","${p.value}","${p.pattern}",${refdesClean},${p.basePerBoard || 0},${required},${p.qty},${shortfall},"${status}"`
    }).join('\n')

    csvContent += rows

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', `Purchase_Plan_${selectedBoard.model}_${plannerBatchQty}_boards.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Export All Boards to CSV
  const exportAllBoardsCSV = () => {
    if (boards.length === 0) return

    const headers = 'Board Name,Brand,Model,Version,Location,Total Boards Qty,Min Limit,Total Parts,Low Parts\n'
    const rows = boards.map((b) => {
      const totalParts = (b.parts || []).length
      const lowParts = (b.parts || []).filter(p => p.qty <= p.minQty).length
      return `"${b.name}","${b.brand}","${b.model}","${b.version}","${b.location}",${b.qty},${b.minQty},${totalParts},${lowParts}`
    }).join('\n')

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', `Archerchem_Electronics_Material_Inventory.csv`)
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
            Loading configurations from database...
          </div>
        ) : viewState === 'list' ? (
          <>
            {/* Hero Banner */}
            <div className='card border-0 shadow-sm overflow-hidden mb-6'>
              <div
                className='d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between p-8 text-white'
                style={{
                  background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
                }}
              >
                <div className='d-flex align-items-center gap-3 mb-4 mb-md-0'>
                  <i className='bi bi-cpu text-white fs-1 me-2'></i>
                  <div className='text-start'>
                    <h4 className='m-0 fw-bold text-white fs-3'>Electronics Material Inventory</h4>
                    <span className='fs-8 text-white-50'>Boards &amp; Components hierarchy management</span>
                  </div>
                </div>

                <button
                  onClick={() => setShowNewBoardModal(true)}
                  className='btn btn-success fw-bold px-6 py-3 shadow-sm d-flex align-items-center gap-2'
                >
                  <i className='bi bi-plus-circle-fill fs-5'></i> + Add New Board
                </button>
              </div>
            </div>

            {/* Tab Navigation & Main Action */}
            <div className='d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-3 mb-6'>
              <div className='d-flex align-items-center gap-2'>
                <button
                  onClick={() => setActiveTab('boards')}
                  className={`btn fw-bold px-6 py-3 ${activeTab === 'boards' ? 'btn-primary' : 'btn-light'}`}
                >
                  <i className='bi bi-grid-3x3-gap me-2'></i> PCB Assemblies
                </button>
                <button
                  onClick={() => {
                    setActiveTab('logs')
                    fetchLogs()
                  }}
                  className={`btn fw-bold px-6 py-3 ${activeTab === 'logs' ? 'btn-dark' : 'btn-light'}`}
                >
                  <i className='bi bi-journal-text me-2'></i> Inventory Logs
                </button>
              </div>

              <button
                onClick={() => setShowNewBoardModal(true)}
                className='btn btn-success fw-bold px-6 py-3 d-flex align-items-center gap-2'
              >
                <i className='bi bi-plus-lg me-1'></i> New Board Assembly
              </button>
            </div>

            {activeTab === 'boards' && (<>
            {/* Stat Cards */}
            <div className='row g-5 mb-6'>
              <div className='col-md-4'>
                <div className='card border shadow-sm p-6 text-center bg-white'>
                  <span className='fs-2hx fw-bold text-gray-900 d-block'>{boards.length}</span>
                  <span className='fs-7 fw-semibold text-muted text-uppercase mt-1 d-block'>Boards</span>
                </div>
              </div>
              <div className='col-md-4'>
                <div className='card border shadow-sm p-6 text-center bg-white'>
                  <span className='fs-2hx fw-bold text-gray-900 d-block'>
                    {boards.reduce((acc, b) => acc + (b.parts || []).length, 0)}
                  </span>
                  <span className='fs-7 fw-semibold text-muted text-uppercase mt-1 d-block'>Total Parts</span>
                </div>
              </div>
              <div className='col-md-4'>
                <div className='card border shadow-sm p-6 text-center bg-white' style={{ borderColor: '#f87171' }}>
                  <span className='fs-2hx fw-bold text-danger d-block'>
                    {boards.reduce((acc, b) => acc + (b.parts || []).filter(p => p.qty <= p.minQty).length, 0)}
                  </span>
                  <span className='fs-7 fw-semibold text-danger text-uppercase mt-1 d-block'>Low Parts</span>
                </div>
              </div>
            </div>

            {/* Search & Filter bar */}
            <div className='card border-0 shadow-sm mb-6'>
              <div className='card-body p-6'>
                <div className='d-flex flex-column flex-md-row gap-4 align-items-center justify-content-between'>
                  <div className='position-relative w-100 w-md-350px'>
                    <i className='bi bi-search position-absolute ms-4 top-50 translate-middle-y text-gray-500 fs-5'></i>
                    <input
                      type='text'
                      value={boardSearchTerm}
                      onChange={(e) => setBoardSearchTerm(e.target.value)}
                      className='form-control form-control-solid ps-12'
                      placeholder='Search boards...'
                    />
                  </div>

                  <div className='d-flex gap-2 flex-wrap'>
                    <button
                      onClick={() => setFilterTab('all')}
                      className={`btn btn-sm fw-bold px-4 py-2 ${filterTab === 'all' ? 'btn-primary' : 'btn-light'}`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setFilterTab('active')}
                      className={`btn btn-sm fw-bold px-4 py-2 ${filterTab === 'active' ? 'btn-primary' : 'btn-light'}`}
                    >
                      Active
                    </button>
                    <button
                      onClick={() => setFilterTab('low')}
                      className={`btn btn-sm fw-bold px-4 py-2 ${filterTab === 'low' ? 'btn-light-danger text-danger' : 'btn-light'}`}
                    >
                      <i className='bi bi-exclamation-triangle me-1'></i> Low Parts
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Cards List Grid */}
            {(() => {
              const getLowPartsCount = (b: Board) => (b.parts || []).filter(p => p.qty <= p.minQty).length
              const getOkPartsCount = (b: Board) => (b.parts || []).filter(p => p.qty > p.minQty).length

              const filteredBoards = boards.filter((b) => {
                const matchesText = b.name.toLowerCase().includes(boardSearchTerm.toLowerCase()) || 
                                    b.model.toLowerCase().includes(boardSearchTerm.toLowerCase())
                
                if (!matchesText) return false
                if (filterTab === 'active') return b.qty > 0
                if (filterTab === 'low') return getLowPartsCount(b) > 0
                return true
              })

              return (
                <>
                  <div className='row g-6 mb-6'>
                    {filteredBoards.map((b) => {
                      const lowCount = getLowPartsCount(b)
                      const okCount = getOkPartsCount(b)
                      return (
                        <div key={b.id} className='col-md-6 col-xl-4'>
                          <div
                            className='card border shadow-sm h-100 hover-elevate-up cursor-pointer'
                            onClick={() => {
                              setSelectedBoardId(b.id)
                              setViewState('detail')
                            }}
                            style={{ borderTop: `4px solid ${lowCount > 0 ? '#ef4444' : '#10b981'}` }}
                          >
                            <div className='card-body p-6 d-flex flex-column justify-content-between'>
                              <div>
                                <div className='d-flex align-items-center justify-content-between mb-3'>
                                  <span className={`badge ${b.qty > 0 ? 'badge-light-success' : 'badge-light-danger'} fw-bold fs-9`}>
                                    {b.qty > 0 ? 'In Stock' : 'Out of Stock'}
                                  </span>
                                  {lowCount > 0 && (
                                    <span className='badge badge-light-danger fw-bold fs-9'>
                                      <i className='bi bi-exclamation-circle text-danger me-1 fs-9'></i> {lowCount} Low Parts
                                    </span>
                                  )}
                                </div>
                                <h4 className='fw-bold text-gray-900 mb-1 fs-5'>{b.name}</h4>
                                <span className='text-muted fs-8 fw-semibold d-block mb-3'>{b.brand} · {b.model} · {b.version}</span>
                                <span className='badge badge-light-primary fw-semibold fs-8 mb-4'>
                                  <i className='bi bi-building text-primary me-1 fs-8'></i> {b.location}
                                </span>
                              </div>
                              
                              <div className='border-top border-gray-200 pt-4 mt-2'>
                                <div className='row text-center g-2'>
                                  <div className='col-4 border-end'>
                                    <span className='fs-6 fw-bold text-gray-800 d-block'>{b.qty}</span>
                                    <span className='fs-9 text-muted text-uppercase fw-semibold'>Boards</span>
                                  </div>
                                  <div className='col-4 border-end'>
                                    <span className='fs-6 fw-bold text-gray-800 d-block'>{(b.parts || []).length}</span>
                                    <span className='fs-9 text-muted text-uppercase fw-semibold'>Parts</span>
                                  </div>
                                  <div className='col-4'>
                                    <span className='fs-6 fw-bold text-gray-800 d-block'>{okCount}</span>
                                    <span className='fs-9 text-muted text-uppercase fw-semibold'>OK Parts</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    {filteredBoards.length === 0 && (
                      <div className='col-12'>
                        <div className='card border shadow-sm p-10 text-center text-muted'>
                          No matching board assemblies found.
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )
            })()}

            {/* Bottom Actions */}
            <div className='d-flex flex-column flex-md-row gap-4 align-items-center mb-10'>
              <button
                onClick={() => setShowNewBoardModal(true)}
                className='btn btn-success fw-bold px-8 py-3 flex-grow-1'
              >
                <i className='bi bi-plus-lg me-2'></i> Add New Board
              </button>
              
              <button
                onClick={() => {
                  if (boards.length > 0) {
                    setSelectedBoardId(boards[0].id)
                    setViewState('detail')
                  } else {
                    toast.error('Create a board first to plan purchases.')
                  }
                }}
                className='btn btn-primary fw-bold px-8 py-3 flex-grow-1'
                style={{ backgroundColor: '#1e1b4b', borderColor: '#1e1b4b' }}
              >
                <i className='bi bi-calculator me-2'></i> Purchase Planner
              </button>
              
              <button
                onClick={exportAllBoardsCSV}
                className='btn btn-light-success fw-bold px-8 py-3 w-100 w-md-auto'
              >
                <i className='bi bi-file-earmark-arrow-down me-2'></i> Export All Boards (CSV)
              </button>
            </div>
            </>)}

            {/* Inventory Logs Tab */}
            {activeTab === 'logs' && (
              <div className='card border-0 shadow-sm'>
                <div className='card-header border-0 pt-6 d-flex align-items-center justify-content-between'>
                  <div>
                    <h3 className='card-title fw-bold fs-4 text-gray-900 mb-1'>
                      <i className='bi bi-journal-text me-2 text-primary'></i>Stock Transaction Logs
                    </h3>
                    <p className='text-muted fs-7 mb-0'>Full history of stock additions, manufacturing runs, and adjustments</p>
                  </div>
                  <button onClick={() => fetchLogs()} className='btn btn-light btn-sm fw-bold'>
                    <i className='bi bi-arrow-clockwise me-1'></i> Refresh
                  </button>
                </div>
                <div className='card-body pt-2'>
                  {loadingLogs ? (
                    <div className='text-center py-10 text-muted'>
                      <span className='spinner-border spinner-border-sm me-2'></span> Loading logs...
                    </div>
                  ) : logs.length === 0 ? (
                    <div className='text-center py-10 text-muted'>
                      <i className='bi bi-inbox fs-1 d-block mb-3 text-gray-400'></i>
                      <p className='fw-semibold'>No transactions yet. Stock In or Manufacture boards to see history here.</p>
                    </div>
                  ) : (
                    <div className='table-responsive'>
                      <table className='table table-row-dashed align-middle gs-0 gy-4'>
                        <thead>
                          <tr className='fw-bold text-muted text-uppercase fs-8 border-bottom'>
                            <th>Date / Time</th>
                            <th>Board</th>
                            <th>Type</th>
                            <th className='text-center'>Qty (N)</th>
                            <th>Reference</th>
                            <th>Operator</th>
                            <th>Parts Movement</th>
                          </tr>
                        </thead>
                        <tbody>
                          {logs.map((log) => {
                            const typeStyles: Record<string, string> = {
                              stock_in: 'badge badge-light-success',
                              manufacture: 'badge badge-light-danger',
                              adjust: 'badge badge-light-warning'
                            }
                            const typeIcons: Record<string, string> = {
                              stock_in: 'bi-box-arrow-in-down',
                              manufacture: 'bi-tools',
                              adjust: 'bi-lightning-fill'
                            }
                            return (
                              <tr key={log.id}>
                                <td>
                                  <div className='d-flex flex-column'>
                                    <span className='fw-bold text-gray-800 fs-7'>
                                      {new Date(log.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </span>
                                    <span className='text-muted fs-8'>
                                      {new Date(log.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                </td>
                                <td>
                                  <div className='d-flex flex-column'>
                                    <span className='fw-bold text-gray-800 fs-7'>{log.board?.name || '—'}</span>
                                    <span className='text-muted fs-8'>{log.board?.version || ''}</span>
                                  </div>
                                </td>
                                <td>
                                  <span className={typeStyles[log.type] || 'badge badge-light'}>
                                    <i className={`bi ${typeIcons[log.type] || 'bi-circle'} me-1`}></i>
                                    {log.type === 'stock_in' ? 'Stock In' : log.type === 'manufacture' ? 'Manufacture' : 'Adjust'}
                                  </span>
                                </td>
                                <td className='text-center'>
                                  <span className='fw-bold fs-6 text-gray-900'>{log.qty}</span>
                                  <span className='text-muted fs-8 ms-1'>Boards</span>
                                </td>
                                <td>
                                  <span className='text-gray-700 fs-7 fw-semibold'>{log.ref || <span className='text-muted'>—</span>}</span>
                                </td>
                                <td>
                                  <span className='fs-7 text-gray-600'>
                                    <i className='bi bi-person me-1'></i>{log.operatorName || '—'}
                                  </span>
                                </td>
                                <td>
                                  {(log.partsSnapshot || []).length > 0 ? (
                                    <div style={{ maxHeight: '80px', overflowY: 'auto' }}>
                                      {(log.partsSnapshot as any[]).slice(0, 3).map((snap: any, i: number) => (
                                        <div key={i} className='fs-8 text-muted mb-1'>
                                          <span className='fw-semibold text-gray-700'>{snap.value || snap.name}:</span>
                                          {' '}
                                          <span className={log.type === 'manufacture' ? 'text-danger' : 'text-success'}>
                                            {log.type === 'manufacture' ? '-' : '+'}{Math.abs(snap.after - snap.before)}
                                          </span>
                                          <span className='text-muted ms-1'>({snap.before} → {snap.after})</span>
                                        </div>
                                      ))}
                                      {(log.partsSnapshot as any[]).length > 3 && (
                                        <span className='text-muted fs-9'>+{(log.partsSnapshot as any[]).length - 3} more parts</span>
                                      )}
                                    </div>
                                  ) : <span className='text-muted fs-8'>—</span>}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <button
              onClick={() => setViewState('list')}
              className='btn btn-light btn-sm fw-bold mb-4'
            >
              <i className='bi bi-arrow-left me-2'></i> Back to Boards
            </button>
            
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
                      <i className='bi bi-plus-lg me-1'></i> New Board
                    </button>
                    <button
                      onClick={() => setShowAddPartModal(true)}
                      className='btn btn-primary btn-sm fw-bold'
                    >
                      <i className='bi bi-plus-lg me-1'></i> Add BOM Part
                    </button>
                    <button
                      onClick={() => setShowBulkAdjustModal(true)}
                      className='btn btn-light-success btn-sm fw-bold'
                    >
                      <i className='bi bi-lightning-fill me-1'></i> Bulk Adjust Stock
                    </button>
                    <button
                      onClick={() => {
                        setBulkStockInBoardsQty(10)
                        setBulkStockInInvoice('')
                        setShowBulkStockInModal(true)
                      }}
                      className='btn btn-light-info btn-sm fw-bold'
                    >
                      <i className='bi bi-box-seam me-1'></i> Bulk Stock In
                    </button>
                    <button
                      onClick={() => {
                        setManufactureQty(5)
                        setManufactureRef('')
                        setShowManufactureModal(true)
                      }}
                      className='btn btn-danger btn-sm fw-bold'
                    >
                      <i className='bi bi-tools me-1'></i> Manufacture Board
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
                        <i className='bi bi-search position-absolute ms-3 top-50 translate-middle-y text-gray-500 fs-6'></i>
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
                            <span><i className='bi bi-building me-1 fs-7 text-primary'></i> Location: <strong>{selectedBoard.location}</strong></span>
                            <span><i className='bi bi-tags me-1 fs-7 text-primary'></i> Version: <strong>{selectedBoard.version}</strong></span>
                            <span><i className='bi bi-calendar3 me-1 fs-7 text-primary'></i> Updated: <strong>{selectedBoard.date}</strong></span>
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
                            <i className='bi bi-pencil me-1'></i> Edit
                          </button>
                          <button
                            className='btn btn-light-danger btn-sm fw-bold'
                            disabled={isDeletingBoard}
                            onClick={() => handleDeleteBoard(selectedBoard.id, selectedBoard.name)}
                          >
                            {isDeletingBoard ? (
                              <span className='spinner-border spinner-border-sm me-1'></span>
                            ) : <i className='bi bi-trash me-1'></i>} Delete
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
                          <th className='text-end pe-4'>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredParts.length === 0 ? (
                          <tr>
                            <td colSpan={7} className='text-center text-muted py-6'>No matching parts in Bill of Materials.</td>
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
                                <td className='text-end pe-4'>
                                  <button
                                    onClick={() => {
                                      setManagePart(p)
                                      setManageAction('add')
                                      setManageQty(0)
                                      setManageReason('')
                                    }}
                                    className='btn btn-light-primary btn-sm fw-bold me-2 px-3 py-1 fs-8'
                                    title='Manage Component Stock'
                                  >
                                    Manage
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (!selectedBoard) return
                                      if (!window.confirm(`"${p.value} (${p.name})" component ko remove karna chahte hain?`)) return
                                      const updatedParts = selectedBoard.parts.filter((item) => item.id !== p.id)
                                      try {
                                        const res = await updateElectronicBoard(selectedBoard.id, { parts: updatedParts })
                                        if (res.data?.success) {
                                          toast.success('Component removed successfully!')
                                          fetchBoards()
                                        }
                                      } catch (err) {
                                        toast.error('Failed to remove component.')
                                      }
                                    }}
                                    className='btn btn-icon btn-bg-light btn-active-color-danger btn-sm'
                                    title='Delete Component'
                                  >
                                    <i className='bi bi-trash-fill fs-7'></i>
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

            {/* Right Column: Production Requisition & Purchase Planner */}
            <div className='col-xl-4'>
              <div className='card border-0 shadow-sm mb-6 bg-body'>
                <div className='card-header pt-6 border-0 d-flex align-items-center justify-content-between'>
                  <h3 className='card-title fw-bold text-gray-900 fs-4 m-0'>
                    <i className='bi bi-calculator text-primary me-2'></i> Purchase Planner
                  </h3>
                  {selectedBoard && (
                    <span className='badge badge-light-primary fw-bold fs-8'>{selectedBoard.model}</span>
                  )}
                </div>

                {selectedBoard && (() => {
                  const parts = selectedBoard.parts || []
                  const shortfallItems = parts.filter(p => ((p.basePerBoard || 0) * plannerBatchQty) > p.qty)
                  const okItemsCount = parts.length - shortfallItems.length
                  const readinessScore = parts.length > 0 ? Math.round((okItemsCount / parts.length) * 100) : 100

                  const displayedParts = parts.filter(p => {
                    const req = (p.basePerBoard || 0) * plannerBatchQty
                    const isShort = req > p.qty
                    if (plannerFilter === 'shortfall') return isShort
                    if (plannerFilter === 'ok') return !isShort
                    return true
                  })

                  return (
                    <div className='card-body pt-2'>
                      <p className='text-muted fs-7 mb-4'>
                        Enter planned batch volume to calculate exact component shortfalls and generate PR sheets.
                      </p>

                      {/* Planned Production Volume & Presets */}
                      <div className='mb-5'>
                        <label className='form-label fw-bold fs-7 text-gray-800 required'>Planned Production Batch Size</label>
                        <div className='input-group mb-2'>
                          <input
                            type='number'
                            value={plannerBatchQty}
                            onChange={(e) => setPlannerBatchQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                            className='form-control form-control-solid fw-bold fs-6'
                            placeholder='Qty'
                          />
                          <span className='input-group-text bg-light border-0 fw-semibold fs-7'>Boards</span>
                        </div>

                        {/* Presets */}
                        <div className='d-flex gap-2 align-items-center'>
                          <span className='fs-8 text-muted fw-semibold'>Presets:</span>
                          {[10, 25, 50, 100].map((qty) => (
                            <button
                              key={qty}
                              onClick={() => setPlannerBatchQty(qty)}
                              className={`btn btn-xs fw-bold px-3 py-1 fs-9 ${plannerBatchQty === qty ? 'btn-primary' : 'btn-light'}`}
                            >
                              {qty} Boards
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Readiness KPI Indicators */}
                      <div className='row g-3 mb-5'>
                        <div className='col-6'>
                          <div className='border rounded p-3 text-center bg-light'>
                            <span className={`fs-4 fw-extrabold d-block ${readinessScore === 100 ? 'text-success' : 'text-warning'}`}>
                              {readinessScore}%
                            </span>
                            <span className='fs-8 text-muted fw-semibold text-uppercase'>Batch Readiness</span>
                          </div>
                        </div>
                        <div className='col-6'>
                          <div className='border rounded p-3 text-center bg-light' style={{ borderColor: shortfallItems.length > 0 ? '#f87171' : undefined }}>
                            <span className={`fs-4 fw-extrabold d-block ${shortfallItems.length > 0 ? 'text-danger' : 'text-success'}`}>
                              {shortfallItems.length}
                            </span>
                            <span className='fs-8 text-muted fw-semibold text-uppercase'>Shortfall Items</span>
                          </div>
                        </div>
                      </div>

                      {/* Filter Chips & List Header */}
                      <div className='d-flex align-items-center justify-content-between mb-3 fs-7 border-bottom pb-2'>
                        <div className='d-flex gap-1'>
                          <button
                            onClick={() => setPlannerFilter('all')}
                            className={`btn btn-xs fw-bold px-2 py-1 fs-9 ${plannerFilter === 'all' ? 'btn-dark' : 'btn-light'}`}
                          >
                            All ({parts.length})
                          </button>
                          <button
                            onClick={() => setPlannerFilter('shortfall')}
                            className={`btn btn-xs fw-bold px-2 py-1 fs-9 ${plannerFilter === 'shortfall' ? 'btn-light-danger text-danger' : 'btn-light'}`}
                          >
                            Shortfall ({shortfallItems.length})
                          </button>
                          <button
                            onClick={() => setPlannerFilter('ok')}
                            className={`btn btn-xs fw-bold px-2 py-1 fs-9 ${plannerFilter === 'ok' ? 'btn-light-success text-success' : 'btn-light'}`}
                          >
                            OK ({okItemsCount})
                          </button>
                        </div>
                        
                        <button onClick={exportPlannerCSV} className='btn btn-link btn-sm fw-bold p-0 text-primary fs-8' title='Export CSV'>
                          <i className='bi bi-file-earmark-arrow-down me-1'></i> CSV
                        </button>
                      </div>

                      {/* Shortfall Component List */}
                      <div className='d-flex flex-column gap-3 max-h-300px overflow-auto pe-1 mb-5'>
                        {displayedParts.length === 0 ? (
                          <div className='text-center py-5 text-muted fs-8'>No items match the selected filter.</div>
                        ) : (
                          displayedParts.map((p) => {
                            const required = (p.basePerBoard || 0) * plannerBatchQty
                            const shortfall = Math.max(0, required - p.qty)
                            const isShort = shortfall > 0

                            return (
                              <div key={p.id} className='d-flex align-items-center justify-content-between border-bottom pb-2'>
                                <div className='d-flex flex-column'>
                                  <strong className='text-gray-800 fs-7'>{p.value}</strong>
                                  <span className='text-muted fs-8'>{p.name} · Req: {required} {p.unit}</span>
                                </div>
                                <div className='text-end'>
                                  {isShort ? (
                                    <div className='d-flex align-items-center gap-1'>
                                      <span className='text-danger fw-bold fs-7'>-{shortfall} {p.unit}</span>
                                      <span className='badge badge-light-danger fw-bold px-2 py-0.5 fs-9'>Buy</span>
                                    </div>
                                  ) : (
                                    <span className='badge badge-light-success fw-bold px-2 py-1 fs-9'>Stock OK</span>
                                  )}
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className='d-flex flex-column gap-2'>
                        <button
                          onClick={() => setShowPrSummaryModal(true)}
                          className='btn btn-primary fw-bold w-100 py-3 d-flex align-items-center justify-content-center gap-2'
                          style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)', borderColor: '#1e1b4b' }}
                        >
                          <i className='bi bi-eye-fill fs-6'></i> View PR Requisition Sheet
                        </button>

                        <button
                          onClick={exportPlannerCSV}
                          className='btn btn-light-success fw-bold w-100 py-2 fs-7 d-flex align-items-center justify-content-center gap-2'
                        >
                          <i className='bi bi-file-earmark-arrow-down-fill fs-6'></i> Export Excel / CSV Plan
                        </button>
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>
        </>
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
                  <h3 className='modal-title fw-bold fs-3 text-gray-900'><i className='bi bi-pc-display me-2 text-success'></i> Register New PCB Assembly</h3>
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
                      <i className='bi bi-lightbulb text-info me-2 fs-4'></i>
                      <span className='fs-7'>Board create hone ke baad aap <strong>"+ Add BOM Part"</strong> button se individual components add kar sakte hain.</span>
                    </div>
                  </div>

                  <div className='modal-footer border-0 pb-6 px-8 gap-3'>
                    <button type='button' className='btn btn-light fw-bold fs-7' onClick={() => setShowNewBoardModal(false)} disabled={isSavingBoard}>Cancel</button>
                    <button type='submit' className='btn btn-success fw-bold fs-7' disabled={isSavingBoard}>
                      {!isSavingBoard ? (
                        <><i className='bi bi-check-lg me-1'></i> Create Board</>
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
                  <h3 className='modal-title fw-bold fs-3 text-gray-900'><i className='bi bi-pencil me-2 text-primary'></i> Edit PCB Assembly</h3>
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
                        <><i className='bi bi-check-lg me-1'></i> Update Board</>
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

        {/* Modal: Single Component Manage Stock */}
        {managePart && selectedBoard && (
          <div className='modal fade show d-block' style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} role='dialog'>
            <div className='modal-dialog modal-dialog-centered mw-550px'>
              <div className='modal-content rounded border-0 shadow-lg bg-body'>
                <div className='modal-header border-0 pt-5 px-8 pb-3 d-flex align-items-center justify-content-between'>
                  <h3 className='modal-title fw-bold fs-3 text-gray-900 m-0'>
                    {managePart.name} — {managePart.value}
                  </h3>
                  <button type='button' className='btn-close' onClick={() => setManagePart(null)} disabled={isSavingManagePart}></button>
                </div>

                <form onSubmit={handleManagePartSubmit}>
                  <div className='modal-body px-8 py-4'>
                    <div className='mb-4'>
                      <span className='fs-6 text-gray-700 fw-semibold'>Current Qty: </span>
                      <span className='fs-5 fw-bold text-gray-900 ms-1'>{managePart.qty} {managePart.unit}</span>
                    </div>

                    <div className='border rounded p-4 bg-light mb-5'>
                      <div className='row g-2 fs-7'>
                        <div className='col-4 text-muted fw-semibold'>Pattern:</div>
                        <div className='col-8 text-gray-800 fw-bold'>{managePart.pattern || '—'}</div>
                        <div className='col-4 text-muted fw-semibold'>RefDes:</div>
                        <div className='col-8 text-gray-800 fw-bold'>{managePart.refdes || '—'}</div>
                        <div className='col-4 text-muted fw-semibold'>Base / Board:</div>
                        <div className='col-8 text-primary fw-bold'>{managePart.basePerBoard || 1} {managePart.unit}</div>
                      </div>
                    </div>

                    <div className='row g-4 mb-4'>
                      <div className='col-md-6'>
                        <label className='form-label fw-bold fs-7 required text-uppercase text-muted'>Action</label>
                        <select
                          value={manageAction}
                          onChange={(e) => setManageAction(e.target.value as any)}
                          className='form-select form-select-solid'
                          disabled={isSavingManagePart}
                        >
                          <option value='add'>➕ Add Stock</option>
                          <option value='subtract'>➖ Subtract Stock</option>
                          <option value='set'>✏️ Set Exact Qty</option>
                        </select>
                      </div>
                      <div className='col-md-6'>
                        <label className='form-label fw-bold fs-7 required text-uppercase text-muted'>Quantity *</label>
                        <input
                          type='number'
                          value={manageQty}
                          onChange={(e) => setManageQty(Math.max(0, parseInt(e.target.value) || 0))}
                          className='form-control form-control-solid'
                          required
                          min={0}
                          disabled={isSavingManagePart}
                        />
                      </div>
                    </div>

                    <div className='mb-4'>
                      <label className='form-label fw-bold fs-7 text-uppercase text-muted'>Reason *</label>
                      <input
                        type='text'
                        value={manageReason}
                        onChange={(e) => setManageReason(e.target.value)}
                        className='form-control form-control-solid'
                        placeholder='e.g. Production use, Damage replacement, Physical audit'
                        disabled={isSavingManagePart}
                      />
                    </div>

                    {/* Quantity Preview Banner */}
                    <div className='alert alert-secondary d-flex align-items-center justify-content-between p-4 mb-0'>
                      <span className='fs-7 text-gray-700 fw-semibold'>Updated Total Preview:</span>
                      <span className='fs-5 fw-bold text-primary'>
                        {manageAction === 'add'
                          ? managePart.qty + manageQty
                          : manageAction === 'subtract'
                          ? Math.max(0, managePart.qty - manageQty)
                          : manageQty}{' '}
                        {managePart.unit}
                      </span>
                    </div>
                  </div>

                  <div className='modal-footer border-0 pb-6 px-8 pt-2'>
                    <button
                      type='submit'
                      className='btn fw-bold fs-6 w-100 py-3 text-white'
                      style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)', borderColor: '#1e1b4b' }}
                      disabled={isSavingManagePart}
                    >
                      {!isSavingManagePart ? (
                        <>
                          <i className='bi bi-check-circle-fill me-2'></i> Save Changes
                        </>
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

        {/* Modal: Manufacture Board */}
        {showManufactureModal && selectedBoard && (
          <div className='modal fade show d-block' style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} role='dialog'>
            <div className='modal-dialog modal-dialog-centered mw-650px'>
              <div className='modal-content rounded border-0 shadow-lg bg-body'>
                <div className='modal-header border-0 pt-5 px-8' style={{ background: 'linear-gradient(135deg, #1e1b4b, #dc2626)', borderRadius: '8px 8px 0 0' }}>
                  <h3 className='modal-title fw-bold fs-3 text-white'>
                    <i className='bi bi-tools me-2 fs-3'></i> Manufacture Board Batch
                  </h3>
                  <button type='button' className='btn-close btn-close-white' onClick={() => setShowManufactureModal(false)} disabled={isManufacturing}></button>
                </div>

                <form onSubmit={handleManufactureSubmit}>
                  <div className='modal-body px-8 py-6'>
                    <div className='alert alert-warning d-flex align-items-center gap-3 mb-5 py-3'>
                      <i className='bi bi-exclamation-triangle-fill fs-4 text-warning'></i>
                      <div className='fs-7'>
                        Manufacturing <strong>{selectedBoard.name}</strong> will <strong>deduct component parts</strong> from stock based on each part's base-per-board ratio × N.
                      </div>
                    </div>

                    <div className='row g-4 mb-5'>
                      <div className='col-md-6'>
                        <label className='form-label fw-bold fs-7 required'>Boards to Manufacture (N)</label>
                        <input
                          type='number'
                          value={manufactureQty}
                          onChange={(e) => setManufactureQty(Math.max(1, parseInt(e.target.value) || 1))}
                          className='form-control form-control-solid'
                          required
                          min={1}
                          disabled={isManufacturing}
                        />
                      </div>
                      <div className='col-md-6'>
                        <label className='form-label fw-bold fs-7'>Batch / Job Reference</label>
                        <input
                          type='text'
                          value={manufactureRef}
                          onChange={(e) => setManufactureRef(e.target.value)}
                          className='form-control form-control-solid'
                          placeholder='e.g. BATCH-2026-001'
                          disabled={isManufacturing}
                        />
                      </div>
                    </div>

                    <div className='mb-3'>
                      <label className='form-label fw-bold fs-7 text-muted'>Preview — Components to be deducted</label>
                    </div>

                    <div className='border rounded overflow-auto mb-3' style={{ maxHeight: '260px' }}>
                      <table className='table table-row-dashed align-middle gs-0 gy-2 mb-0'>
                        <thead className='sticky-top bg-white'>
                          <tr className='fw-bold text-muted text-uppercase fs-9'>
                            <th className='ps-4'>Component</th>
                            <th className='text-end'>Current Stock</th>
                            <th className='text-end text-danger'>— Deduct</th>
                            <th className='text-end'>Remaining</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedBoard.parts.map((p) => {
                            const deduct = (p.basePerBoard || 1) * manufactureQty
                            const remaining = p.qty - deduct
                            const isShortfall = remaining < 0
                            return (
                              <tr key={p.id}>
                                <td className='ps-4'>
                                  <div className='d-flex flex-column'>
                                    <span className='fw-bold text-gray-800 fs-7'>{p.value}</span>
                                    <span className='text-muted fs-8'>{p.name} · {p.basePerBoard || 1}/board</span>
                                  </div>
                                </td>
                                <td className='text-end fs-7 text-gray-700'>{p.qty} {p.unit}</td>
                                <td className='text-end fs-7 fw-bold text-danger'>-{deduct} {p.unit}</td>
                                <td className='text-end fs-7 fw-bold'>
                                  <span className={isShortfall ? 'text-danger' : 'text-success'}>
                                    {isShortfall && <i className='bi bi-exclamation-triangle me-1'></i>}
                                    {remaining} {p.unit}
                                  </span>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    {selectedBoard.parts.some(p => (p.qty - (p.basePerBoard || 1) * manufactureQty) < 0) && (
                      <div className='alert alert-danger d-flex align-items-center gap-3 py-3 mb-0'>
                        <i className='bi bi-exclamation-circle-fill fs-5'></i>
                        <span className='fs-7'>Some components have <strong>insufficient stock</strong>. Remaining quantities will be set to 0.</span>
                      </div>
                    )}
                  </div>

                  <div className='modal-footer border-0 pb-6 px-8 gap-3'>
                    <button type='button' className='btn btn-light fw-bold fs-7' onClick={() => setShowManufactureModal(false)} disabled={isManufacturing}>Cancel</button>
                    <button type='submit' className='btn btn-danger fw-bold fs-7 d-flex align-items-center gap-2' disabled={isManufacturing}>
                      {!isManufacturing ? (
                        <>
                          <i className='bi bi-tools fs-6'></i> Confirm Manufacturing ({manufactureQty} Boards)
                        </>
                      ) : (
                        <span className='indicator-progress' style={{ display: 'block' }}>
                          Processing...
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

        {/* Modal: Bulk Stock In */}
        {showBulkStockInModal && selectedBoard && (
          <div className='modal fade show d-block' style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} role='dialog'>
            <div className='modal-dialog modal-dialog-centered mw-650px'>
              <div className='modal-content rounded border-0 shadow-lg bg-body'>
                <div className='modal-header border-0 pt-5 px-8'>
                  <h3 className='modal-title fw-bold fs-3 text-gray-900'>
                    <i className='bi bi-box-seam text-warning me-2 fs-3'></i> Bulk Stock In
                  </h3>
                  <button type='button' className='btn-close' onClick={() => setShowBulkStockInModal(false)} disabled={isSavingBulkStockIn}></button>
                </div>

                <form onSubmit={handleBulkStockInSubmit}>
                  <div className='modal-body px-8 py-5'>
                    <p className='text-gray-600 fs-7 mb-5'>
                      Enter how many <strong>{selectedBoard.name}</strong> — worth of material just arrived. Every part's quantity below will be increased by <strong>(part's per-board qty) × N</strong>.
                    </p>

                    <div className='row g-4 mb-5'>
                      <div className='col-md-6'>
                        <label className='form-label fw-bold fs-7 required'>Number of Boards (N)</label>
                        <input
                          type='number'
                          value={bulkStockInBoardsQty}
                          onChange={(e) => setBulkStockInBoardsQty(Math.max(1, parseInt(e.target.value) || 1))}
                          className='form-control form-control-solid'
                          required
                          min={1}
                          disabled={isSavingBulkStockIn}
                        />
                      </div>
                      <div className='col-md-6'>
                        <label className='form-label fw-bold fs-7'>Invoice / Reference</label>
                        <input
                          type='text'
                          value={bulkStockInInvoice}
                          onChange={(e) => setBulkStockInInvoice(e.target.value)}
                          className='form-control form-control-solid'
                          placeholder='e.g. INV-2026-0451'
                          disabled={isSavingBulkStockIn}
                        />
                      </div>
                    </div>

                    <div className='mb-3'>
                      <label className='form-label fw-bold fs-7 text-muted'>Preview — quantities after stock-in</label>
                    </div>

                    <div className='border rounded p-4 bg-light overflow-auto max-h-300px mb-3'>
                      <table className='table table-row-dashed align-middle gs-0 gy-2 mb-0'>
                        <thead>
                          <tr className='fw-bold text-muted text-uppercase fs-9'>
                            <th>Part</th>
                            <th className='text-end'>Current</th>
                            <th className='text-end'>+ Add</th>
                            <th className='text-end'>New Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedBoard.parts.map((p) => {
                            const added = (p.basePerBoard || 1) * bulkStockInBoardsQty
                            const newTotal = p.qty + added
                            return (
                              <tr key={p.id}>
                                <td>
                                  <div className='d-flex flex-column'>
                                    <span className='fw-bold text-gray-800 fs-7'>{p.value}</span>
                                    <span className='text-muted fs-8'>{p.name}</span>
                                  </div>
                                </td>
                                <td className='text-end fs-7 text-gray-700'>{p.qty} {p.unit}</td>
                                <td className='text-end fs-7 text-success fw-bold'>+{added} {p.unit}</td>
                                <td className='text-end fs-7 text-gray-900 fw-bold'>{newTotal} {p.unit}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className='modal-footer border-0 pb-6 px-8 gap-3'>
                    <button type='button' className='btn btn-light fw-bold fs-7' onClick={() => setShowBulkStockInModal(false)} disabled={isSavingBulkStockIn}>Cancel</button>
                    <button type='submit' className='btn btn-success fw-bold fs-7 d-flex align-items-center gap-2' disabled={isSavingBulkStockIn}>
                      {!isSavingBulkStockIn ? (
                        <>
                          <i className='bi bi-check-circle-fill fs-6'></i> Confirm Stock In
                        </>
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

        {/* Modal: PR Requisition Summary Sheet (Matches Spreadsheet Mockup) */}
        {showPrSummaryModal && selectedBoard && (
          <div className='modal fade show d-block' style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} role='dialog'>
            <div className='modal-dialog modal-dialog-centered mw-900px'>
              <div className='modal-content rounded border-0 shadow-lg bg-body'>
                <div className='modal-header border-0 pt-5 px-8 pb-3 d-flex align-items-center justify-content-between' style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)', borderRadius: '8px 8px 0 0' }}>
                  <div className='text-white'>
                    <h3 className='modal-title fw-bold fs-3 text-white m-0'>
                      <i className='bi bi-file-earmark-spreadsheet me-2'></i> Purchase Requisition (PR) Plan
                    </h3>
                    <span className='fs-8 text-white-50'>Formatted BOM shortfall requisition sheet for procurement</span>
                  </div>
                  <button type='button' className='btn-close btn-close-white' onClick={() => setShowPrSummaryModal(false)}></button>
                </div>

                <div className='modal-body px-8 py-5'>
                  {/* Metadata Header Box */}
                  <div className='card border shadow-sm p-4 mb-5 bg-light'>
                    <div className='row g-3 fs-7'>
                      <div className='col-md-6'>
                        <span className='text-muted fw-semibold'>Purchase Plan For: </span>
                        <strong className='text-gray-900 fs-6 ms-1'>{selectedBoard.name}</strong>
                      </div>
                      <div className='col-md-3'>
                        <span className='text-muted fw-semibold'>Brand: </span>
                        <span className='badge badge-light-primary fw-bold ms-1'>{selectedBoard.brand}</span>
                      </div>
                      <div className='col-md-3'>
                        <span className='text-muted fw-semibold'>Model: </span>
                        <span className='fw-bold text-gray-800 ms-1'>{selectedBoard.model}</span>
                      </div>
                      <div className='col-md-6'>
                        <span className='text-muted fw-semibold'>Planned Batch Volume: </span>
                        <span className='badge badge-light-dark fw-bold fs-7 ms-1'>{plannerBatchQty} Boards</span>
                      </div>
                      <div className='col-md-6 text-md-end'>
                        <span className='text-muted fs-8'>Generated: {new Date().toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Requisition Table */}
                  <div className='table-responsive border rounded max-h-400px overflow-auto mb-3'>
                    <table className='table table-row-dashed align-middle gs-0 gy-3 mb-0'>
                      <thead className='sticky-top bg-white border-bottom'>
                        <tr className='fw-bold text-muted text-uppercase fs-9 pe-4'>
                          <th className='ps-4'>Part Name &amp; Value</th>
                          <th>Pattern</th>
                          <th>RefDes</th>
                          <th className='text-center'>Per Board Qty</th>
                          <th className='text-end'>Total Required</th>
                          <th className='text-end'>Current Stock</th>
                          <th className='text-end text-danger'>Shortfall (To Buy)</th>
                          <th className='text-center pe-4'>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedBoard.parts.map((p) => {
                          const required = (p.basePerBoard || 0) * plannerBatchQty
                          const shortfall = Math.max(0, required - p.qty)
                          const isShort = shortfall > 0

                          return (
                            <tr key={p.id} className={isShort ? 'bg-light-danger bg-opacity-25' : ''}>
                              <td className='ps-4'>
                                <div className='d-flex flex-column'>
                                  <span className='fw-bold text-gray-900 fs-7'>{p.value}</span>
                                  <span className='text-muted fs-8'>{p.name}</span>
                                </div>
                              </td>
                              <td><span className='badge badge-light fs-9 fw-semibold'>{p.pattern}</span></td>
                              <td>
                                <code className='text-gray-600 fs-9 d-block text-truncate' style={{ maxWidth: '140px' }} title={p.refdes}>
                                  {p.refdes}
                                </code>
                              </td>
                              <td className='text-center fw-bold fs-7 text-primary'>{p.basePerBoard || 1}</td>
                              <td className='text-end fw-bold fs-7 text-gray-800'>{required} {p.unit}</td>
                              <td className='text-end fs-7 text-gray-700'>{p.qty} {p.unit}</td>
                              <td className='text-end fw-extrabold fs-7 text-danger'>
                                {isShort ? `-${shortfall} ${p.unit}` : '0'}
                              </td>
                              <td className='text-center pe-4'>
                                {isShort ? (
                                  <span className='badge badge-danger fw-bold px-3 py-1 fs-9'>SHORTFALL - BUY</span>
                                ) : (
                                  <span className='badge badge-light-success fw-bold px-3 py-1 fs-9'>STOCK OK</span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className='modal-footer border-0 pb-6 px-8 gap-3 justify-content-between'>
                  <button type='button' className='btn btn-light fw-bold fs-7' onClick={() => setShowPrSummaryModal(false)}>Close</button>
                  <div className='d-flex gap-2'>
                    <button
                      type='button'
                      className='btn btn-light-primary fw-bold fs-7'
                      onClick={() => window.print()}
                    >
                      <i className='bi bi-printer me-1'></i> Print PR Sheet
                    </button>
                    <button
                      type='button'
                      className='btn btn-success fw-bold fs-7 d-flex align-items-center gap-2'
                      onClick={exportPlannerCSV}
                    >
                      <i className='bi bi-file-earmark-arrow-down-fill fs-6'></i> Export Excel / CSV
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Content>
    </>
  )
}

export default ElectronicsPage
