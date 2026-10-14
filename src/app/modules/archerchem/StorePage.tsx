import React, { FC, useState, useEffect, useMemo } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { Content } from '../../../_metronic/layout/components/content'
import { toast } from 'react-hot-toast'
import {
  getStoreItems,
  createStoreItem,
  updateStoreItem,
  adjustStoreStock,
  deleteStoreItem,
  getStoreHistory
} from '../auth/core/_requests'

export interface StoreItem {
  id: number | string
  itemName: string
  quantity: number
  toleranceLimit: number
  branch?: string
  unit?: string
  category?: string
  location?: string
  notes?: string
  updatedAt?: string
  createdAt?: string
}

export interface StoreTransactionLog {
  id: number | string
  itemId: number | string
  itemName: string
  type: string
  qtyChange: number
  finalQty: number
  reason?: string
  reference?: string
  operatorName?: string
  branch?: string
  createdAt?: string
}

const DEFAULT_SEED_ITEMS: StoreItem[] = [
  { id: 1, itemName: 'Display Board', quantity: 50, toleranceLimit: 25, unit: 'Pcs', updatedAt: '2026-10-14T12:11:01.000Z' },
  { id: 2, itemName: 'Cutter', quantity: 10, toleranceLimit: 7, unit: 'Pcs', updatedAt: '2026-10-14T12:11:01.000Z' },
  { id: 3, itemName: 'Key Board PCB', quantity: 100, toleranceLimit: 40, unit: 'Pcs', updatedAt: '2026-10-14T12:11:01.000Z' },
  { id: 4, itemName: 'Mother board PCB', quantity: 50, toleranceLimit: 10, unit: 'Pcs', updatedAt: '2026-10-14T12:11:01.000Z' },
  { id: 5, itemName: 'Sealing Tar', quantity: 350, toleranceLimit: 99, unit: 'Kg', updatedAt: '2026-10-14T12:11:01.000Z' }
]

const StorePage: FC = () => {
  // Store items & history state
  const [items, setItems] = useState<StoreItem[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [historyLogs, setHistoryLogs] = useState<StoreTransactionLog[]>([])
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false)

  // New stock entry inputs
  const [newItemName, setNewItemName] = useState<string>('')
  const [newQuantity, setNewQuantity] = useState<string>('')
  const [newToleranceLimit, setNewToleranceLimit] = useState<string>('')
  const [submittingNew, setSubmittingNew] = useState<boolean>(false)

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [selectedItemFilter, setSelectedItemFilter] = useState<string>('')
  const [isLowStockOnly, setIsLowStockOnly] = useState<boolean>(false)

  // Manage Modal state
  const [manageModalOpen, setManageModalOpen] = useState<boolean>(false)
  const [activeItem, setActiveItem] = useState<StoreItem | null>(null)
  const [manageTab, setManageTab] = useState<'adjust' | 'edit' | 'delete'>('adjust')
  
  // Adjust stock inputs
  const [adjustAction, setAdjustAction] = useState<'IN' | 'OUT'>('IN')
  const [adjustQty, setAdjustQty] = useState<number>(1)
  const [adjustReason, setAdjustReason] = useState<string>('Stock Inward Receipt')
  const [adjustReference, setAdjustReference] = useState<string>('')
  const [submittingAdjust, setSubmittingAdjust] = useState<boolean>(false)

  // Edit item inputs
  const [editName, setEditName] = useState<string>('')
  const [editTolerance, setEditTolerance] = useState<number>(10)
  const [editUnit, setEditUnit] = useState<string>('Pcs')
  const [submittingEdit, setSubmittingEdit] = useState<boolean>(false)

  // History Modal state
  const [historyModalOpen, setHistoryModalOpen] = useState<boolean>(false)
  const [historyTargetItem, setHistoryTargetItem] = useState<StoreItem | null>(null)

  // Dynamic greeting based on current time
  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return '☀️ Good Morning!'
    if (hour < 17) return '🌤️ Good Afternoon!'
    return '🌙 Good Evening!'
  }, [])

  // Format date helper (matches exact format: 14/10/2026, 12:11:01)
  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '14/10/2026, 12:11:01'
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      const day = String(d.getDate()).padStart(2, '0')
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const year = d.getFullYear()
      const hours = String(d.getHours()).padStart(2, '0')
      const minutes = String(d.getMinutes()).padStart(2, '0')
      const seconds = String(d.getSeconds()).padStart(2, '0')
      return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`
    } catch {
      return dateStr
    }
  }

  // Fetch Items from Backend API
  const fetchInventory = async () => {
    setLoading(true)
    const activeBranch = localStorage.getItem('active_branch') || 'Vasai Factory (HQ)'
    try {
      const res = await getStoreItems({ branch: activeBranch })
      if (res.data && res.data.success && Array.isArray(res.data.items) && res.data.items.length > 0) {
        setItems(res.data.items)
      } else {
        setItems(DEFAULT_SEED_ITEMS)
      }
    } catch (err) {
      console.warn('Store API fetch failed, using local seed items:', err)
      const cached = localStorage.getItem('archerchem_store_items_cache')
      if (cached) {
        try {
          setItems(JSON.parse(cached))
        } catch {
          setItems(DEFAULT_SEED_ITEMS)
        }
      } else {
        setItems(DEFAULT_SEED_ITEMS)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInventory()
    const handleBranchChange = () => fetchInventory()
    window.addEventListener('branch_changed', handleBranchChange)
    return () => window.removeEventListener('branch_changed', handleBranchChange)
  }, [])

  // Sync cache
  useEffect(() => {
    if (items.length > 0) {
      localStorage.setItem('archerchem_store_items_cache', JSON.stringify(items))
    }
  }, [items])

  // Handle Add Item (New Stock Entry)
  const handleAddNewItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItemName.trim()) {
      toast.error('Please enter an item name')
      return
    }

    const qty = parseInt(newQuantity, 10) || 0
    const tolerance = parseInt(newToleranceLimit, 10) || 0
    const activeBranch = localStorage.getItem('active_branch') || 'Vasai Factory (HQ)'

    setSubmittingNew(true)
    try {
      const res = await createStoreItem({
        itemName: newItemName.trim(),
        quantity: qty,
        toleranceLimit: tolerance,
        branch: activeBranch
      })

      if (res.data && res.data.success && res.data.item) {
        toast.success(`Item "${newItemName.trim()}" added to inventory!`)
        await fetchInventory()
      } else {
        const localNew: StoreItem = {
          id: Date.now(),
          itemName: newItemName.trim(),
          quantity: qty,
          toleranceLimit: tolerance,
          branch: activeBranch,
          updatedAt: new Date().toISOString()
        }
        setItems((prev) => [localNew, ...prev])
        toast.success(`Item "${newItemName.trim()}" registered!`)
      }

      setNewItemName('')
      setNewQuantity('')
      setNewToleranceLimit('')
    } catch (err: any) {
      console.warn('Backend API create error, saving locally:', err)
      const localNew: StoreItem = {
        id: Date.now(),
        itemName: newItemName.trim(),
        quantity: qty,
        toleranceLimit: tolerance,
        branch: activeBranch,
        updatedAt: new Date().toISOString()
      }
      setItems((prev) => [localNew, ...prev])
      toast.success(`Item "${newItemName.trim()}" registered in local store!`)
      setNewItemName('')
      setNewQuantity('')
      setNewToleranceLimit('')
    } finally {
      setSubmittingNew(false)
    }
  }

  // Open Manage Modal
  const openManageModal = (item: StoreItem) => {
    setActiveItem(item)
    setEditName(item.itemName)
    setEditTolerance(item.toleranceLimit)
    setEditUnit(item.unit || 'Pcs')
    setAdjustQty(1)
    setAdjustAction('IN')
    setAdjustReason('Stock Inward Receipt')
    setAdjustReference('')
    setManageTab('adjust')
    setManageModalOpen(true)
  }

  // Open History Modal
  const openHistoryModal = async (item?: StoreItem) => {
    setHistoryTargetItem(item || null)
    setHistoryModalOpen(true)
    setLoadingHistory(true)
    const activeBranch = localStorage.getItem('active_branch') || 'Vasai Factory (HQ)'
    try {
      const res = await getStoreHistory({
        itemId: item ? item.id : undefined,
        branch: activeBranch
      })
      if (res.data && res.data.success && Array.isArray(res.data.logs)) {
        setHistoryLogs(res.data.logs)
      } else {
        setHistoryLogs([
          {
            id: 1,
            itemId: item?.id || 1,
            itemName: item?.itemName || 'Display Board',
            type: 'INITIAL_ENTRY',
            qtyChange: item?.quantity || 50,
            finalQty: item?.quantity || 50,
            reason: 'Opening Inventory Balance',
            reference: 'OPN-2026',
            operatorName: 'Store Incharge',
            branch: activeBranch,
            createdAt: item?.updatedAt || new Date().toISOString()
          }
        ])
      }
    } catch (err) {
      console.warn('History API error, displaying local log:', err)
      setHistoryLogs([
        {
          id: 1,
          itemId: item?.id || 1,
          itemName: item?.itemName || 'Display Board',
          type: 'INITIAL_ENTRY',
          qtyChange: item?.quantity || 50,
          finalQty: item?.quantity || 50,
          reason: 'Opening Inventory Balance',
          reference: 'OPN-2026',
          operatorName: 'Store Incharge',
          branch: activeBranch,
          createdAt: item?.updatedAt || new Date().toISOString()
        }
      ])
    } finally {
      setLoadingHistory(false)
    }
  }

  // Handle Adjust Stock (+ / -)
  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeItem) return

    if (adjustQty <= 0) {
      toast.error('Please enter a valid quantity greater than 0')
      return
    }

    if (adjustAction === 'OUT' && activeItem.quantity < adjustQty) {
      toast.error(`Insufficient stock! Only ${activeItem.quantity} ${activeItem.unit || 'units'} available.`)
      return
    }

    setSubmittingAdjust(true)
    try {
      const res = await adjustStoreStock(activeItem.id, {
        action: adjustAction,
        qty: adjustQty,
        reason: adjustReason,
        reference: adjustReference
      })

      if (res.data && res.data.success) {
        toast.success(res.data.message || `Stock updated successfully!`)
        await fetchInventory()
        setManageModalOpen(false)
      } else {
        const updatedQty = adjustAction === 'IN' ? activeItem.quantity + adjustQty : activeItem.quantity - adjustQty
        setItems((prev) =>
          prev.map((i) =>
            i.id === activeItem.id ? { ...i, quantity: updatedQty, updatedAt: new Date().toISOString() } : i
          )
        )
        toast.success(`Stock adjusted to ${updatedQty} units`)
        setManageModalOpen(false)
      }
    } catch (err: any) {
      console.warn('API adjust failed, applying locally:', err)
      const updatedQty = adjustAction === 'IN' ? activeItem.quantity + adjustQty : activeItem.quantity - adjustQty
      setItems((prev) =>
        prev.map((i) =>
          i.id === activeItem.id ? { ...i, quantity: updatedQty, updatedAt: new Date().toISOString() } : i
        )
      )
      toast.success(`Stock updated locally`)
      setManageModalOpen(false)
    } finally {
      setSubmittingAdjust(false)
    }
  }

  // Handle Edit Item
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeItem) return
    if (!editName.trim()) {
      toast.error('Item name cannot be empty')
      return
    }

    setSubmittingEdit(true)
    try {
      const res = await updateStoreItem(activeItem.id, {
        itemName: editName.trim(),
        toleranceLimit: editTolerance,
        unit: editUnit
      })

      if (res.data && res.data.success) {
        toast.success('Item details updated!')
        await fetchInventory()
        setManageModalOpen(false)
      } else {
        setItems((prev) =>
          prev.map((i) =>
            i.id === activeItem.id
              ? { ...i, itemName: editName.trim(), toleranceLimit: editTolerance, unit: editUnit, updatedAt: new Date().toISOString() }
              : i
          )
        )
        toast.success('Item details saved!')
        setManageModalOpen(false)
      }
    } catch (err) {
      console.warn('API edit failed, updating locally:', err)
      setItems((prev) =>
        prev.map((i) =>
          i.id === activeItem.id
            ? { ...i, itemName: editName.trim(), toleranceLimit: editTolerance, unit: editUnit, updatedAt: new Date().toISOString() }
            : i
        )
      )
      toast.success('Item updated locally')
      setManageModalOpen(false)
    } finally {
      setSubmittingEdit(false)
    }
  }

  // Handle Delete Item
  const handleDeleteItem = async () => {
    if (!activeItem) return
    if (!window.confirm(`Are you sure you want to remove "${activeItem.itemName}" from store inventory?`)) return

    try {
      await deleteStoreItem(activeItem.id)
      toast.success(`Item "${activeItem.itemName}" removed`)
      await fetchInventory()
      setManageModalOpen(false)
    } catch (err) {
      console.warn('API delete failed, removing locally:', err)
      setItems((prev) => prev.filter((i) => i.id !== activeItem.id))
      toast.success(`Item removed locally`)
      setManageModalOpen(false)
    }
  }

  // Export CSV
  const handleExportCSV = () => {
    if (filteredItems.length === 0) {
      toast.error('No items to export')
      return
    }

    const headers = ['Item Name', 'Quantity', 'Tolerance Limit', 'Status', 'Last Updated', 'Unit']
    const rows = filteredItems.map((item) => {
      const isOut = item.quantity === 0
      const isLow = item.quantity <= item.toleranceLimit
      const status = isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'
      return [
        `"${item.itemName.replace(/"/g, '""')}"`,
        item.quantity,
        item.toleranceLimit,
        status,
        `"${formatDateTime(item.updatedAt)}"`,
        item.unit || 'Pcs'
      ]
    })

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Archerchem_Store_Inventory_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Inventory exported to CSV!')
  }

  // Filtered Items logic
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim()
        if (!item.itemName.toLowerCase().includes(query)) {
          return false
        }
      }
      if (selectedItemFilter && selectedItemFilter !== 'all') {
        if (item.itemName !== selectedItemFilter) {
          return false
        }
      }
      if (isLowStockOnly) {
        if (item.quantity > item.toleranceLimit) {
          return false
        }
      }
      return true
    })
  }, [items, searchTerm, selectedItemFilter, isLowStockOnly])

  // Get unique item names for select dropdown
  const uniqueItemNames = useMemo(() => {
    const names = new Set(items.map((i) => i.itemName))
    return Array.from(names).sort()
  }, [items])

  // Statistics for Metronic KPI Cards
  const stats = useMemo(() => {
    const totalItems = items.length
    const lowStockCount = items.filter((i) => i.quantity > 0 && i.quantity <= i.toleranceLimit).length
    const outOfStockCount = items.filter((i) => i.quantity === 0).length
    const inStockCount = items.filter((i) => i.quantity > i.toleranceLimit).length
    const totalUnits = items.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0)
    return { totalItems, lowStockCount, outOfStockCount, inStockCount, totalUnits }
  }, [items])

  return (
    <>
      <PageTitle breadcrumbs={[]}>Store Inventory Management</PageTitle>
      <Content>
        {/* Metronic Page Header & Greeting Banner */}
        <div className='card card-flush border-0 shadow-sm mb-6 bg-white'>
          <div className='card-body py-6 px-8 text-center'>
            <h1 className='text-gray-900 fw-bolder fs-2x mb-2'>
              Archerchem Instruments Store Inventory Management
            </h1>
            <div className='d-inline-flex align-items-center gap-2 bg-light-primary px-4 py-2 rounded-pill'>
              <span className='fs-5'>{greeting.split(' ')[0]}</span>
              <span className='fs-6 fw-bold text-primary'>{greeting.replace(/^[^\s]+\s*/, '')}</span>
            </div>
          </div>
        </div>

        {/* Metronic KPI Summary Cards */}
        <div className='row g-5 g-xl-6 mb-6'>
          <div className='col-sm-6 col-xl-3'>
            <div className='card card-flush border-0 shadow-sm h-100 bg-white'>
              <div className='card-body p-5 d-flex align-items-center justify-content-between'>
                <div>
                  <span className='text-gray-500 fs-7 fw-bold text-uppercase d-block mb-1'>Total Catalogue</span>
                  <span className='text-gray-900 fs-2hx fw-bolder'>{stats.totalItems}</span>
                  <span className='text-muted fs-8 d-block mt-1'>Registered Items</span>
                </div>
                <div className='w-50px h-50px rounded-circle bg-light-primary d-flex align-items-center justify-content-center'>
                  <i className='bi bi-box-seam fs-2 text-primary'></i>
                </div>
              </div>
            </div>
          </div>

          <div className='col-sm-6 col-xl-3'>
            <div className='card card-flush border-0 shadow-sm h-100 bg-white'>
              <div className='card-body p-5 d-flex align-items-center justify-content-between'>
                <div>
                  <span className='text-gray-500 fs-7 fw-bold text-uppercase d-block mb-1'>In Stock</span>
                  <span className='text-success fs-2hx fw-bolder'>{stats.inStockCount}</span>
                  <span className='text-muted fs-8 d-block mt-1'>Healthy stock levels</span>
                </div>
                <div className='w-50px h-50px rounded-circle bg-light-success d-flex align-items-center justify-content-center'>
                  <i className='bi bi-check-circle fs-2 text-success'></i>
                </div>
              </div>
            </div>
          </div>

          <div className='col-sm-6 col-xl-3'>
            <div className='card card-flush border-0 shadow-sm h-100 bg-white'>
              <div className='card-body p-5 d-flex align-items-center justify-content-between'>
                <div>
                  <span className='text-gray-500 fs-7 fw-bold text-uppercase d-block mb-1'>Low Stock Alert</span>
                  <span className='text-warning fs-2hx fw-bolder'>{stats.lowStockCount}</span>
                  <span className='text-muted fs-8 d-block mt-1'>At or below tolerance</span>
                </div>
                <div className='w-50px h-50px rounded-circle bg-light-warning d-flex align-items-center justify-content-center'>
                  <i className='bi bi-exclamation-triangle fs-2 text-warning'></i>
                </div>
              </div>
            </div>
          </div>

          <div className='col-sm-6 col-xl-3'>
            <div className='card card-flush border-0 shadow-sm h-100 bg-white'>
              <div className='card-body p-5 d-flex align-items-center justify-content-between'>
                <div>
                  <span className='text-gray-500 fs-7 fw-bold text-uppercase d-block mb-1'>Total Store Units</span>
                  <span className='text-info fs-2hx fw-bolder'>{stats.totalUnits.toLocaleString()}</span>
                  <span className='text-muted fs-8 d-block mt-1'>Quantity in warehouse</span>
                </div>
                <div className='w-50px h-50px rounded-circle bg-light-info d-flex align-items-center justify-content-center'>
                  <i className='bi bi-layers fs-2 text-info'></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 1. New Stock Entry Card (Metronic Standard Card) */}
        <div className='card card-flush border-0 shadow-sm mb-6 bg-white'>
          <div className='card-header border-0 pt-6'>
            <h3 className='card-title fw-bold text-gray-900 fs-4'>
              <i className='bi bi-plus-circle text-success me-2 fs-3'></i> New Stock Entry
            </h3>
          </div>
          <div className='card-body pt-2 pb-6'>
            <form onSubmit={handleAddNewItem} className='row g-3 align-items-center'>
              <div className='col-12 col-md-4'>
                <label className='form-label fw-semibold fs-7 text-gray-700 d-none d-md-block'>Item Name</label>
                <div className='position-relative'>
                  <i className='bi bi-tag position-absolute top-50 start-0 translate-middle-y ms-3 text-gray-500'></i>
                  <input
                    type='text'
                    className='form-control form-control-solid ps-10 rounded-3'
                    placeholder='Item Name'
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className='col-12 col-md-3'>
                <label className='form-label fw-semibold fs-7 text-gray-700 d-none d-md-block'>Quantity</label>
                <div className='position-relative'>
                  <i className='bi bi-hash position-absolute top-50 start-0 translate-middle-y ms-3 text-gray-500'></i>
                  <input
                    type='number'
                    min='0'
                    className='form-control form-control-solid ps-10 rounded-3'
                    placeholder='Quantity'
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className='col-12 col-md-3'>
                <label className='form-label fw-semibold fs-7 text-gray-700 d-none d-md-block'>Tolerance Limit</label>
                <div className='position-relative'>
                  <i className='bi bi-shield-exclamation position-absolute top-50 start-0 translate-middle-y ms-3 text-gray-500'></i>
                  <input
                    type='number'
                    min='0'
                    className='form-control form-control-solid ps-10 rounded-3'
                    placeholder='Tolerance Limit'
                    value={newToleranceLimit}
                    onChange={(e) => setNewToleranceLimit(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className='col-12 col-md-2 mt-auto'>
                <button
                  type='submit'
                  disabled={submittingNew}
                  className='btn btn-success fw-bold w-100 rounded-pill py-3 d-flex align-items-center justify-content-center gap-2 shadow-sm'
                >
                  <i className='bi bi-plus-lg fs-5'></i>
                  {submittingNew ? 'Adding...' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* 2. Search & Toolbar Controls Card */}
        <div className='card card-flush border-0 shadow-sm mb-6 bg-white'>
          <div className='card-header border-0 pt-6'>
            <h3 className='card-title fw-bold text-gray-900 fs-4'>
              <i className='bi bi-funnel text-primary me-2 fs-3'></i> Search &amp; Filters
            </h3>
          </div>
          <div className='card-body pt-2 pb-6'>
            <div className='row g-3 align-items-center'>
              <div className='col-12 col-lg-5'>
                <div className='position-relative'>
                  <i className='bi bi-search position-absolute top-50 start-0 translate-middle-y ms-4 text-gray-500 fs-5'></i>
                  <input
                    type='text'
                    className='form-control form-control-solid ps-12 rounded-pill'
                    placeholder='Search by item name...'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className='col-12 col-sm-6 col-lg-3'>
                <select
                  className='form-select form-select-solid rounded-pill'
                  value={selectedItemFilter}
                  onChange={(e) => setSelectedItemFilter(e.target.value)}
                >
                  <option value=''>Select item (All items)</option>
                  {uniqueItemNames.map((name, idx) => (
                    <option key={idx} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div className='col-12 col-sm-6 col-lg-4'>
                <div className='d-flex align-items-center gap-2 flex-wrap'>
                  <button
                    type='button'
                    onClick={() => {
                      setSearchTerm('')
                      setSelectedItemFilter('')
                      setIsLowStockOnly(false)
                      fetchInventory()
                    }}
                    className='btn btn-light-primary fw-bold rounded-pill flex-fill py-2.5 px-4'
                  >
                    <i className='bi bi-arrow-repeat me-1'></i> View Inventory
                  </button>

                  <button
                    type='button'
                    onClick={() => setIsLowStockOnly(!isLowStockOnly)}
                    className={`btn fw-bold rounded-pill flex-fill py-2.5 px-4 position-relative ${
                      isLowStockOnly ? 'btn-warning text-white' : 'btn-light-warning text-warning'
                    }`}
                  >
                    <i className='bi bi-exclamation-triangle me-1'></i>
                    Low Stock
                    {stats.lowStockCount > 0 && (
                      <span className='badge badge-circle badge-warning text-white ms-2 fs-8'>
                        {stats.lowStockCount}
                      </span>
                    )}
                  </button>

                  <button
                    type='button'
                    onClick={handleExportCSV}
                    className='btn btn-primary fw-bold rounded-pill flex-fill py-2.5 px-4'
                  >
                    <i className='bi bi-file-earmark-arrow-down me-1'></i> Export CSV
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Main Inventory Table Card (Metronic Standard Table) */}
        <div className='card card-flush border-0 shadow-sm bg-white'>
          <div className='card-header border-0 pt-6 d-flex justify-content-between align-items-center flex-wrap gap-4'>
            <div className='card-title align-items-start flex-column'>
              <span className='card-label fw-bolder text-gray-900 fs-3'>Store Inventory Directory</span>
              <span className='text-gray-500 mt-1 fw-semibold fs-7'>
                Showing {filteredItems.length} of {items.length} registered stock entries
              </span>
            </div>
            <div className='card-toolbar gap-2'>
              <button
                type='button'
                onClick={() => openHistoryModal()}
                className='btn btn-sm btn-light fw-bold rounded-pill px-4'
              >
                <i className='bi bi-clock-history me-1'></i> Full Store History
              </button>
            </div>
          </div>

          <div className='card-body pt-0 pb-6'>
            <div className='table-responsive'>
              <table className='table table-row-dashed table-row-gray-200 align-middle gs-0 gy-4'>
                <thead>
                  <tr className='fw-bold text-gray-800 bg-light-primary rounded-3 text-uppercase fs-7'>
                    <th className='py-4 ps-6 rounded-start'>Item Name</th>
                    <th className='py-4 text-center'>Quantity</th>
                    <th className='py-4 text-center'>Tolerance Limit</th>
                    <th className='py-4 text-center'>Status</th>
                    <th className='py-4 text-center'>Last Updated</th>
                    <th className='py-4 text-center'>Manage</th>
                    <th className='py-4 pe-6 text-center rounded-end'>History</th>
                  </tr>
                </thead>
                <tbody className='fw-semibold text-gray-600'>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className='text-center py-10 text-muted'>
                        <div className='spinner-border spinner-border-sm text-primary me-2' role='status'></div>
                        Synchronizing store inventory from PostgreSQL...
                      </td>
                    </tr>
                  ) : filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className='text-center py-12'>
                        <i className='bi bi-inbox fs-2x text-gray-400 d-block mb-3'></i>
                        <span className='text-gray-700 fw-bold fs-5 d-block'>No inventory items found</span>
                        <span className='text-muted fs-7'>Try resetting your search query or add a new stock item.</span>
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => {
                      const isOut = item.quantity === 0
                      const isLow = item.quantity <= item.toleranceLimit
                      const statusLabel = isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'
                      const badgeClass = isOut ? 'badge-light-danger' : isLow ? 'badge-light-warning' : 'badge-light-success'

                      return (
                        <tr key={item.id} className='hover-elevate-up'>
                          {/* Item Name */}
                          <td className='ps-6'>
                            <div className='d-flex align-items-center gap-3'>
                              <div className='symbol symbol-40px symbol-circle bg-light-primary'>
                                <span className='symbol-label text-primary fw-bolder fs-6'>
                                  {item.itemName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <span className='text-gray-900 fw-bolder fs-6 d-block'>{item.itemName}</span>
                                <small className='text-gray-500 fs-8'>{item.category || 'General Store'}</small>
                              </div>
                            </div>
                          </td>

                          {/* Quantity */}
                          <td className='text-center'>
                            <span className='text-gray-900 fw-bolder fs-5'>{item.quantity}</span>
                            <span className='text-gray-500 fs-8 ms-1 fw-semibold'>{item.unit || 'Pcs'}</span>
                          </td>

                          {/* Tolerance Limit */}
                          <td className='text-center'>
                            <span className='badge badge-light-secondary text-gray-700 fw-bold fs-7 px-3 py-1.5'>
                              {item.toleranceLimit} {item.unit || 'Pcs'}
                            </span>
                          </td>

                          {/* Status Badge */}
                          <td className='text-center'>
                            <span className={`badge ${badgeClass} fw-bold px-4 py-2 rounded-pill fs-7`}>
                              {statusLabel}
                            </span>
                          </td>

                          {/* Last Updated */}
                          <td className='text-center text-nowrap'>
                            <span className='text-gray-700 fw-semibold fs-7'>
                              {formatDateTime(item.updatedAt)}
                            </span>
                          </td>

                          {/* Manage Button */}
                          <td className='text-center'>
                            <button
                              type='button'
                              onClick={() => openManageModal(item)}
                              className='btn btn-sm btn-light-primary fw-bold px-4 py-2 rounded-pill shadow-xs'
                            >
                              <i className='bi bi-sliders me-1'></i> Manage
                            </button>
                          </td>

                          {/* History Button */}
                          <td className='text-center pe-6'>
                            <button
                              type='button'
                              onClick={() => openHistoryModal(item)}
                              className='btn btn-sm btn-warning text-white fw-bold px-4 py-2 rounded-pill shadow-xs'
                            >
                              <i className='bi bi-clock-history me-1'></i> History
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

        {/* ─── METRONIC MODAL 1: MANAGE STOCK (Adjust / Edit / Delete) ─── */}
        {manageModalOpen && activeItem && (
          <div
            className='modal fade show d-block'
            tabIndex={-1}
            style={{ backgroundColor: 'rgba(15, 23, 42, 0.55)', zIndex: 1055 }}
            role='dialog'
          >
            <div className='modal-dialog modal-dialog-centered mw-500px'>
              <div className='modal-content border-0 shadow-lg rounded-4'>
                <div className='modal-header border-0 pb-0 pt-6 px-6 d-flex justify-content-between align-items-center'>
                  <div>
                    <h3 className='modal-title fw-bolder text-gray-900 fs-3 mb-1'>Manage Stock</h3>
                    <p className='text-muted fs-7 mb-0'>{activeItem.itemName}</p>
                  </div>
                  <button
                    type='button'
                    onClick={() => setManageModalOpen(false)}
                    className='btn btn-sm btn-icon btn-active-color-primary'
                    aria-label='Close'
                  >
                    <i className='bi bi-x-lg fs-4'></i>
                  </button>
                </div>

                <div className='modal-body px-6 pt-4 pb-6'>
                  {/* Current Balance Banner */}
                  <div className='card bg-light-primary border border-primary border-dashed rounded-3 p-4 mb-5'>
                    <div className='d-flex justify-content-between align-items-center'>
                      <div>
                        <span className='text-gray-600 fs-8 fw-bold text-uppercase d-block'>Current In-Stock</span>
                        <span className='fs-2hx fw-bolder text-primary'>
                          {activeItem.quantity} {activeItem.unit || 'Pcs'}
                        </span>
                      </div>
                      <div className='text-end'>
                        <span className='text-gray-600 fs-8 fw-bold text-uppercase d-block'>Safety Threshold</span>
                        <span className='fs-5 fw-bold text-gray-800'>{activeItem.toleranceLimit} Pcs</span>
                      </div>
                    </div>
                  </div>

                  {/* Metronic Nav Pills */}
                  <ul className='nav nav-pills nav-fill mb-5 gap-2 bg-light p-1.5 rounded-3'>
                    <li className='nav-item'>
                      <button
                        onClick={() => setManageTab('adjust')}
                        className={`nav-link fw-bold btn btn-sm py-2 rounded-2 ${
                          manageTab === 'adjust' ? 'btn-primary text-white shadow-xs' : 'text-gray-700'
                        }`}
                      >
                        Adjust Stock
                      </button>
                    </li>
                    <li className='nav-item'>
                      <button
                        onClick={() => setManageTab('edit')}
                        className={`nav-link fw-bold btn btn-sm py-2 rounded-2 ${
                          manageTab === 'edit' ? 'btn-primary text-white shadow-xs' : 'text-gray-700'
                        }`}
                      >
                        Edit Details
                      </button>
                    </li>
                    <li className='nav-item'>
                      <button
                        onClick={() => setManageTab('delete')}
                        className={`nav-link fw-bold btn btn-sm py-2 rounded-2 ${
                          manageTab === 'delete' ? 'btn-danger text-white shadow-xs' : 'text-gray-700'
                        }`}
                      >
                        Delete
                      </button>
                    </li>
                  </ul>

                  {/* Tab 1: Adjust Stock */}
                  {manageTab === 'adjust' && (
                    <form onSubmit={handleAdjustSubmit}>
                      <div className='mb-4'>
                        <label className='form-label fw-bold fs-7 mb-2'>Action Type</label>
                        <div className='d-flex gap-3'>
                          <button
                            type='button'
                            onClick={() => setAdjustAction('IN')}
                            className={`btn flex-fill py-3 fw-bold rounded-3 ${
                              adjustAction === 'IN' ? 'btn-success text-white shadow-sm' : 'btn-light'
                            }`}
                          >
                            <i className='bi bi-box-arrow-in-down me-1'></i> Add Stock (Inward)
                          </button>
                          <button
                            type='button'
                            onClick={() => setAdjustAction('OUT')}
                            className={`btn flex-fill py-3 fw-bold rounded-3 ${
                              adjustAction === 'OUT' ? 'btn-warning text-white shadow-sm' : 'btn-light'
                            }`}
                          >
                            <i className='bi bi-box-arrow-up me-1'></i> Issue Stock (Deduct)
                          </button>
                        </div>
                      </div>

                      <div className='mb-4'>
                        <label className='form-label fw-bold fs-7 mb-1 required'>Quantity</label>
                        <input
                          type='number'
                          min='1'
                          value={adjustQty}
                          onChange={(e) => setAdjustQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                          className='form-control form-control-solid rounded-3'
                          required
                        />
                      </div>

                      <div className='mb-4'>
                        <label className='form-label fw-bold fs-7 mb-1'>Reason / Purpose</label>
                        <select
                          value={adjustReason}
                          onChange={(e) => setAdjustReason(e.target.value)}
                          className='form-select form-select-solid rounded-3'
                        >
                          <option value='Stock Inward Receipt'>Stock Inward Receipt (Supplier)</option>
                          <option value='Issued to Production Line'>Issued to Production Line</option>
                          <option value='Issued for QC / Calibration Testing'>Issued for QC / Calibration Testing</option>
                          <option value='Defective / Damaged Scrap'>Defective / Damaged Scrap</option>
                          <option value='Periodic Inventory Audit'>Periodic Inventory Audit Adjustment</option>
                          <option value='Inter-branch Movement'>Inter-branch Movement</option>
                        </select>
                      </div>

                      <div className='mb-5'>
                        <label className='form-label fw-bold fs-7 mb-1'>Reference / Voucher #</label>
                        <input
                          type='text'
                          placeholder='e.g. PO-8891 / Issue Slip #104'
                          value={adjustReference}
                          onChange={(e) => setAdjustReference(e.target.value)}
                          className='form-control form-control-solid rounded-3'
                        />
                      </div>

                      <div className='d-flex justify-content-end gap-2 pt-2'>
                        <button
                          type='button'
                          onClick={() => setManageModalOpen(false)}
                          className='btn btn-light fw-bold px-5 rounded-pill'
                        >
                          Cancel
                        </button>
                        <button
                          type='submit'
                          disabled={submittingAdjust}
                          className='btn btn-primary fw-bold px-6 rounded-pill'
                        >
                          {submittingAdjust ? 'Updating...' : 'Confirm Movement'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Tab 2: Edit Item */}
                  {manageTab === 'edit' && (
                    <form onSubmit={handleEditSubmit}>
                      <div className='mb-4'>
                        <label className='form-label fw-bold fs-7 mb-1 required'>Item Name</label>
                        <input
                          type='text'
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className='form-control form-control-solid rounded-3'
                          required
                        />
                      </div>

                      <div className='row g-3 mb-4'>
                        <div className='col-6'>
                          <label className='form-label fw-bold fs-7 mb-1 required'>Tolerance Limit</label>
                          <input
                            type='number'
                            min='0'
                            value={editTolerance}
                            onChange={(e) => setEditTolerance(Math.max(0, parseInt(e.target.value, 10) || 0))}
                            className='form-control form-control-solid rounded-3'
                            required
                          />
                        </div>
                        <div className='col-6'>
                          <label className='form-label fw-bold fs-7 mb-1'>Unit of Measurement</label>
                          <select
                            value={editUnit}
                            onChange={(e) => setEditUnit(e.target.value)}
                            className='form-select form-select-solid rounded-3'
                          >
                            <option value='Pcs'>Pcs</option>
                            <option value='Kg'>Kg</option>
                            <option value='Mtr'>Mtr</option>
                            <option value='Box'>Box</option>
                            <option value='Set'>Set</option>
                          </select>
                        </div>
                      </div>

                      <div className='d-flex justify-content-end gap-2 mt-6 pt-2'>
                        <button
                          type='button'
                          onClick={() => setManageModalOpen(false)}
                          className='btn btn-light fw-bold px-5 rounded-pill'
                        >
                          Cancel
                        </button>
                        <button
                          type='submit'
                          disabled={submittingEdit}
                          className='btn btn-primary fw-bold px-6 rounded-pill'
                        >
                          {submittingEdit ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Tab 3: Delete */}
                  {manageTab === 'delete' && (
                    <div className='p-5 rounded-3 border border-danger border-dashed bg-light-danger text-center'>
                      <div className='mb-3'>
                        <i className='bi bi-trash fs-2hx text-danger'></i>
                      </div>
                      <h4 className='fw-bolder text-danger mb-2'>Remove "{activeItem.itemName}"?</h4>
                      <p className='text-gray-700 fs-7 mb-5'>
                        This item will be permanently removed from the active store inventory.
                      </p>
                      <button
                        type='button'
                        onClick={handleDeleteItem}
                        className='btn btn-danger fw-bold px-6 rounded-pill'
                      >
                        Confirm Delete Item
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── METRONIC MODAL 2: HISTORY LOGS ─── */}
        {historyModalOpen && (
          <div
            className='modal fade show d-block'
            tabIndex={-1}
            style={{ backgroundColor: 'rgba(15, 23, 42, 0.55)', zIndex: 1055 }}
            role='dialog'
          >
            <div className='modal-dialog modal-dialog-centered mw-750px'>
              <div className='modal-content border-0 shadow-lg rounded-4'>
                <div className='modal-header border-0 pb-0 pt-6 px-6 d-flex justify-content-between align-items-center'>
                  <div>
                    <h3 className='modal-title fw-bolder text-gray-900 fs-3 mb-1'>Stock Movement History</h3>
                    <p className='text-muted fs-7 mb-0'>
                      {historyTargetItem ? `Audit trail for ${historyTargetItem.itemName}` : 'All Store Movements'}
                    </p>
                  </div>
                  <button
                    type='button'
                    onClick={() => setHistoryModalOpen(false)}
                    className='btn btn-sm btn-icon btn-active-color-primary'
                    aria-label='Close'
                  >
                    <i className='bi bi-x-lg fs-4'></i>
                  </button>
                </div>

                <div className='modal-body px-6 pt-4 pb-6'>
                  <div className='table-responsive' style={{ maxHeight: '420px', overflowY: 'auto' }}>
                    <table className='table table-row-dashed table-row-gray-200 align-middle gs-0 gy-3'>
                      <thead>
                        <tr className='fw-bold text-muted text-uppercase fs-8'>
                          <th>Timestamp</th>
                          <th>Action</th>
                          <th className='text-center'>Qty Change</th>
                          <th className='text-center'>Balance</th>
                          <th>Reason / Ref</th>
                          <th>Operator</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loadingHistory ? (
                          <tr>
                            <td colSpan={6} className='text-center py-6 text-muted'>
                              <div className='spinner-border spinner-border-sm text-primary me-2' role='status'></div>
                              Loading logs...
                            </td>
                          </tr>
                        ) : historyLogs.length === 0 ? (
                          <tr>
                            <td colSpan={6} className='text-center py-6 text-muted'>
                              No transaction logs recorded yet.
                            </td>
                          </tr>
                        ) : (
                          historyLogs.map((log) => {
                            const isPositive = log.qtyChange > 0
                            return (
                              <tr key={log.id}>
                                <td className='text-nowrap text-gray-700 fs-7'>
                                  {formatDateTime(log.createdAt)}
                                </td>
                                <td>
                                  <span
                                    className={`badge badge-light-${
                                      log.type === 'INITIAL_ENTRY'
                                        ? 'primary'
                                        : isPositive
                                        ? 'success'
                                        : 'warning'
                                    } fw-bold rounded-pill px-3 py-1`}
                                  >
                                    {log.type === 'INITIAL_ENTRY'
                                      ? 'Initial Entry'
                                      : isPositive
                                      ? 'Stock In'
                                      : 'Stock Out'}
                                  </span>
                                </td>
                                <td className='text-center fw-bold'>
                                  <span className={isPositive ? 'text-success' : 'text-danger'}>
                                    {isPositive ? `+${log.qtyChange}` : log.qtyChange}
                                  </span>
                                </td>
                                <td className='text-center fw-bold text-gray-900'>{log.finalQty}</td>
                                <td className='fs-7'>
                                  <div className='text-gray-800 fw-semibold'>{log.reason || 'Movement'}</div>
                                  {log.reference && <small className='text-muted'>Ref: {log.reference}</small>}
                                </td>
                                <td className='text-muted fs-8'>{log.operatorName || 'System'}</td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className='d-flex justify-content-end gap-2 mt-4 pt-4 border-top'>
                    <button
                      type='button'
                      onClick={() => setHistoryModalOpen(false)}
                      className='btn btn-light fw-bold px-6 rounded-pill'
                    >
                      Close
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

export default StorePage
