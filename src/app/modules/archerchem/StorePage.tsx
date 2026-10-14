import React, { FC, useState, useEffect, useMemo, useRef } from 'react'
import * as XLSX from 'xlsx'
import { PageTitle } from '../../../_metronic/layout/core'
import { Content } from '../../../_metronic/layout/components/content'
import { toast } from 'react-hot-toast'
import {
  getStoreItems,
  createStoreItem,
  updateStoreItem,
  adjustStoreStock,
  deleteStoreItem,
  getStoreHistory,
  bulkImportStoreItems
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

export interface ParsedImportRow {
  itemName: string
  quantity: number
  toleranceLimit: number
  unit: string
  category: string
  notes?: string
  isValid: boolean
  statusType: 'valid_new' | 'valid_update' | 'invalid'
  statusMessage: string
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

  // View state: 'directory' or 'form' (new stock entry)
  const [viewState, setViewState] = useState<'directory' | 'form'>('directory')

  // New stock entry inputs
  const [newItemName, setNewItemName] = useState<string>('')
  const [newQuantity, setNewQuantity] = useState<string>('')
  const [newToleranceLimit, setNewToleranceLimit] = useState<string>('')
  const [newUnit, setNewUnit] = useState<string>('Pcs')
  const [submittingNew, setSubmittingNew] = useState<boolean>(false)

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [filterChip, setFilterChip] = useState<'all' | 'instock' | 'low' | 'out'>('all')

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

  // Excel Import state
  const [importModalOpen, setImportModalOpen] = useState<boolean>(false)
  const [importRows, setImportRows] = useState<ParsedImportRow[]>([])
  const [importFileName, setImportFileName] = useState<string>('')
  const [importLoading, setImportLoading] = useState<boolean>(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Format date helper (matches exact format: 14/10/2026, 12:11:01)
  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '—'
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
          unit: newUnit,
          branch: activeBranch,
          updatedAt: new Date().toISOString()
        }
        setItems((prev) => [localNew, ...prev])
        toast.success(`Item "${newItemName.trim()}" registered!`)
      }

      setNewItemName('')
      setNewQuantity('')
      setNewToleranceLimit('')
      setNewUnit('Pcs')
      setViewState('directory')
    } catch (err: any) {
      console.warn('Backend API create error, saving locally:', err)
      const localNew: StoreItem = {
        id: Date.now(),
        itemName: newItemName.trim(),
        quantity: qty,
        toleranceLimit: tolerance,
        unit: newUnit,
        branch: activeBranch,
        updatedAt: new Date().toISOString()
      }
      setItems((prev) => [localNew, ...prev])
      toast.success(`Item "${newItemName.trim()}" registered in local store!`)
      setNewItemName('')
      setNewQuantity('')
      setNewToleranceLimit('')
      setNewUnit('Pcs')
      setViewState('directory')
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

  // ─── EXCEL IMPORT LOGIC ───
  // Download Sample Template for Excel / CSV
  const handleDownloadSampleExcel = () => {
    try {
      const templateData = [
        ['Item Name', 'Quantity', 'Tolerance Limit', 'Unit', 'Category', 'Notes'],
        ['Display Board V2.1', 50, 25, 'Pcs', 'Electronics', 'Master display module for precision balance'],
        ['Key Board PCB 2026', 100, 40, 'Pcs', 'Electronics', 'Keypad controller membrane'],
        ['Sealing Tar Grade A', 250, 50, 'Kg', 'Consumables', 'Standard legal metrology stamping wax'],
        ['Precision Loadcell 500g', 15, 5, 'Pcs', 'Sensors', 'High accuracy strain gauge cell'],
        ['Cutter Blade 18mm', 20, 10, 'Pcs', 'Tools', 'Warehouse packing utility cutter']
      ]

      const worksheet = XLSX.utils.aoa_to_sheet(templateData)
      worksheet['!cols'] = [
        { wch: 26 }, // Item Name
        { wch: 12 }, // Quantity
        { wch: 16 }, // Tolerance Limit
        { wch: 10 }, // Unit
        { wch: 16 }, // Category
        { wch: 45 }  // Notes
      ]

      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Store_Inventory_Template')
      XLSX.writeFile(workbook, 'Archerchem_Store_Import_Template.xlsx')
      toast.success('Sample Excel template downloaded!')
    } catch (error) {
      console.error('Failed to create template:', error)
      toast.error('Failed to generate template file.')
    }
  }

  // Process File (Excel .xlsx / .xls or .csv)
  const processUploadedFile = (file: File) => {
    setImportError(null)
    setImportFileName(file.name)

    const validExtensions = ['.xlsx', '.xls', '.csv']
    const hasValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))
    if (!hasValidExt) {
      setImportError('Invalid file format. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.')
      toast.error('Please upload an Excel or CSV file.')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result
        const workbook = XLSX.read(buffer, { type: 'array' })
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          setImportError('No worksheet found in the uploaded file.')
          return
        }

        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        const rawJson = XLSX.utils.sheet_to_json<any>(worksheet, { defval: '' })

        if (!rawJson || rawJson.length === 0) {
          setImportError('The selected file appears to be empty. Please verify data rows.')
          setImportRows([])
          return
        }

        // Map columns intelligently supporting common header aliases
        const parsed: ParsedImportRow[] = rawJson.map((row: any, idx: number) => {
          // Find item name
          const nameCandidate =
            row['Item Name'] ||
            row['item name'] ||
            row['Item'] ||
            row['item'] ||
            row['itemName'] ||
            row['item_name'] ||
            row['Material'] ||
            row['Product'] ||
            row['Description'] ||
            ''
          const itemName = String(nameCandidate).trim()

          // Find quantity
          const qtyCandidate =
            row['Quantity'] ||
            row['quantity'] ||
            row['Qty'] ||
            row['qty'] ||
            row['Stock'] ||
            row['stock'] ||
            row['Count'] ||
            0
          const quantity = Math.max(0, parseInt(String(qtyCandidate), 10) || 0)

          // Find tolerance limit
          const toleranceCandidate =
            row['Tolerance Limit'] ||
            row['tolerance limit'] ||
            row['Tolerance'] ||
            row['tolerance'] ||
            row['toleranceLimit'] ||
            row['tolerance_limit'] ||
            row['Safety Stock'] ||
            row['Min Stock'] ||
            0
          const toleranceLimit = Math.max(0, parseInt(String(toleranceCandidate), 10) || 0)

          // Unit
          const unitCandidate = row['Unit'] || row['unit'] || row['UOM'] || 'Pcs'
          const unit = String(unitCandidate).trim() || 'Pcs'

          // Category
          const categoryCandidate = row['Category'] || row['category'] || row['Group'] || 'General Store'
          const category = String(categoryCandidate).trim() || 'General Store'

          // Notes
          const notesCandidate = row['Notes'] || row['notes'] || row['Remarks'] || row['remarks'] || ''
          const notes = String(notesCandidate).trim()

          if (!itemName) {
            return {
              itemName: `Row #${idx + 2} (Missing Name)`,
              quantity,
              toleranceLimit,
              unit,
              category,
              notes,
              isValid: false,
              statusType: 'invalid',
              statusMessage: 'Item name is blank'
            }
          }

          // Check if already in current inventory list (case-insensitive)
          const existingItem = items.find((i) => i.itemName.toLowerCase() === itemName.toLowerCase())
          if (existingItem) {
            return {
              itemName,
              quantity,
              toleranceLimit: toleranceLimit > 0 ? toleranceLimit : existingItem.toleranceLimit,
              unit: unit || existingItem.unit || 'Pcs',
              category: category || existingItem.category || 'General Store',
              notes,
              isValid: true,
              statusType: 'valid_update',
              statusMessage: `Stock top-up (${existingItem.quantity} currently in stock + ${quantity} imported)`
            }
          }

          return {
            itemName,
            quantity,
            toleranceLimit,
            unit,
            category,
            notes,
            isValid: true,
            statusType: 'valid_new',
            statusMessage: 'New item to be registered'
          }
        })

        setImportRows(parsed)
      } catch (err: any) {
        console.error('Error parsing excel file:', err)
        setImportError(`Failed to parse file: ${err.message || 'Unknown error'}`)
        toast.error('Unable to parse file. Please verify the format.')
      }
    }
    reader.onerror = () => {
      setImportError('Failed to read the file. Please try again.')
    }
    reader.readAsArrayBuffer(file)
  }

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processUploadedFile(e.dataTransfer.files[0])
    }
  }

  // Handle File Input Change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processUploadedFile(e.target.files[0])
    }
  }

  // Execute Bulk Import
  const handleExecuteBulkImport = async () => {
    const validRows = importRows.filter((r) => r.isValid)
    if (validRows.length === 0) {
      toast.error('No valid items to import.')
      return
    }

    setImportLoading(true)
    const activeBranch = localStorage.getItem('active_branch') || 'Vasai Factory (HQ)'

    try {
      const res = await bulkImportStoreItems({
        items: validRows,
        branch: activeBranch
      })

      if (res.data && res.data.success) {
        toast.success(
          res.data.message ||
            `Successfully imported ${res.data.totalProcessed || validRows.length} items!`
        )
        await fetchInventory()
        setImportModalOpen(false)
        setImportRows([])
        setImportFileName('')
      } else {
        // Fallback local merge
        applyLocalBulkImport(validRows, activeBranch)
      }
    } catch (err: any) {
      console.warn('Backend bulk import error, executing local store sync:', err)
      applyLocalBulkImport(validRows, activeBranch)
    } finally {
      setImportLoading(false)
    }
  }

  // Local fallback merge
  const applyLocalBulkImport = (validRows: ParsedImportRow[], activeBranch: string) => {
    let newCount = 0
    let updateCount = 0

    setItems((prev) => {
      const updated = [...prev]
      validRows.forEach((row) => {
        const index = updated.findIndex((i) => i.itemName.toLowerCase() === row.itemName.toLowerCase())
        if (index >= 0) {
          updated[index] = {
            ...updated[index],
            quantity: updated[index].quantity + row.quantity,
            toleranceLimit: row.toleranceLimit > 0 ? row.toleranceLimit : updated[index].toleranceLimit,
            unit: row.unit || updated[index].unit,
            category: row.category || updated[index].category,
            updatedAt: new Date().toISOString()
          }
          updateCount++
        } else {
          updated.unshift({
            id: Date.now() + Math.random(),
            itemName: row.itemName,
            quantity: row.quantity,
            toleranceLimit: row.toleranceLimit,
            unit: row.unit,
            category: row.category,
            branch: activeBranch,
            notes: row.notes,
            updatedAt: new Date().toISOString()
          })
          newCount++
        }
      })
      return updated
    })

    toast.success(`Imported ${validRows.length} items (${newCount} new, ${updateCount} stock additions)!`)
    setImportModalOpen(false)
    setImportRows([])
    setImportFileName('')
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
      if (filterChip === 'instock') {
        if (item.quantity <= item.toleranceLimit || item.quantity === 0) return false
      } else if (filterChip === 'low') {
        if (item.quantity === 0 || item.quantity > item.toleranceLimit) return false
      } else if (filterChip === 'out') {
        if (item.quantity > 0) return false
      }
      return true
    })
  }, [items, searchTerm, filterChip])

  // Statistics for KPI Cards
  const stats = useMemo(() => {
    const totalItems = items.length
    const lowStockCount = items.filter((i) => i.quantity > 0 && i.quantity <= i.toleranceLimit).length
    const outOfStockCount = items.filter((i) => i.quantity === 0).length
    const inStockCount = items.filter((i) => i.quantity > i.toleranceLimit).length
    const totalUnits = items.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0)
    return { totalItems, lowStockCount, outOfStockCount, inStockCount, totalUnits }
  }, [items])

  // Stock health percentage for progress bar
  const getStockHealth = (item: StoreItem) => {
    if (item.toleranceLimit === 0) return 100
    const ratio = (item.quantity / (item.toleranceLimit * 3)) * 100
    return Math.min(100, Math.max(0, ratio))
  }

  // Import Preview Counts
  const importSummary = useMemo(() => {
    const total = importRows.length
    const valid = importRows.filter((r) => r.isValid).length
    const updates = importRows.filter((r) => r.statusType === 'valid_update').length
    const newItems = importRows.filter((r) => r.statusType === 'valid_new').length
    const invalid = importRows.filter((r) => !r.isValid).length
    return { total, valid, updates, newItems, invalid }
  }, [importRows])

  return (
    <>
      <PageTitle breadcrumbs={[]}>Store & Inventory</PageTitle>
      <Content>
        {/* ─── TOOLBAR HEADER (Matching PurchasePage Style) ─── */}
        <div className='card border-0 shadow-sm mb-6'>
          <div className='card-header border-0 pt-6 d-flex justify-content-between align-items-center flex-wrap gap-4'>
            <h3 className='card-title align-items-start flex-column'>
              <span className='card-label fw-bold text-gray-900 fs-3'>Store & Inventory Management</span>
              <span className='text-gray-500 mt-1 fw-semibold fs-7'>
                Archerchem Instruments — Track, manage & audit warehouse stock
              </span>
            </h3>
            <div className='card-toolbar d-flex align-items-center gap-2 flex-wrap'>
              <button
                onClick={() => setViewState('directory')}
                className={`btn btn-sm px-5 py-3 fw-bold ${
                  viewState === 'directory' ? 'btn-primary' : 'btn-light-primary text-primary'
                }`}
              >
                <i className='bi bi-grid-3x3-gap me-1'></i> Inventory
              </button>
              <button
                onClick={() => setViewState('form')}
                className={`btn btn-sm px-5 py-3 fw-bold ${
                  viewState === 'form' ? 'btn-primary' : 'btn-light-primary text-primary'
                }`}
              >
                <i className='bi bi-plus-lg me-1'></i> New Stock Entry
              </button>
              <button
                onClick={() => {
                  setImportModalOpen(true)
                  setImportRows([])
                  setImportFileName('')
                  setImportError(null)
                }}
                className='btn btn-sm btn-light-success text-success px-5 py-3 fw-bold'
                title='Import Excel or CSV'
              >
                <i className='bi bi-file-earmark-spreadsheet me-1'></i> Import Excel
              </button>
              <button
                onClick={() => openHistoryModal()}
                className='btn btn-sm btn-light-warning text-warning px-5 py-3 fw-bold'
              >
                <i className='bi bi-clock-history me-1'></i> Audit Log
              </button>
            </div>
          </div>
        </div>

        {/* ─── VIEW: NEW STOCK ENTRY FORM ─── */}
        {viewState === 'form' && (
          <div className='card border-0 shadow-sm mb-6'>
            <div className='card-header border-0 pt-6'>
              <h3 className='card-title align-items-start flex-column'>
                <span className='card-label fw-bold text-gray-900 fs-3'>
                  <i className='bi bi-plus-circle text-success me-2'></i>
                  Register New Stock Item
                </span>
                <span className='text-gray-500 mt-1 fw-semibold fs-7'>
                  Add a new material or component to the store inventory
                </span>
              </h3>
            </div>
            <div className='card-body pt-4 pb-6'>
              <form onSubmit={handleAddNewItem}>
                <div className='row g-4 mb-6'>
                  <div className='col-12 col-md-6'>
                    <label className='form-label fw-bold fs-7 text-gray-800 required'>Item / Material Name</label>
                    <input
                      type='text'
                      className='form-control form-control-solid'
                      placeholder='e.g. Display Board V2.1, IC Register 74HC595'
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      required
                    />
                  </div>
                  <div className='col-6 col-md-2'>
                    <label className='form-label fw-bold fs-7 text-gray-800 required'>Opening Qty</label>
                    <input
                      type='number'
                      min='0'
                      className='form-control form-control-solid'
                      placeholder='0'
                      value={newQuantity}
                      onChange={(e) => setNewQuantity(e.target.value)}
                      required
                    />
                  </div>
                  <div className='col-6 col-md-2'>
                    <label className='form-label fw-bold fs-7 text-gray-800 required'>Tolerance Limit</label>
                    <input
                      type='number'
                      min='0'
                      className='form-control form-control-solid'
                      placeholder='0'
                      value={newToleranceLimit}
                      onChange={(e) => setNewToleranceLimit(e.target.value)}
                      required
                    />
                  </div>
                  <div className='col-6 col-md-2'>
                    <label className='form-label fw-bold fs-7 text-gray-800'>Unit</label>
                    <select
                      className='form-select form-select-solid'
                      value={newUnit}
                      onChange={(e) => setNewUnit(e.target.value)}
                    >
                      <option value='Pcs'>Pcs</option>
                      <option value='Kg'>Kg</option>
                      <option value='Mtr'>Mtr</option>
                      <option value='Box'>Box</option>
                      <option value='Set'>Set</option>
                      <option value='Ltr'>Ltr</option>
                      <option value='Roll'>Roll</option>
                    </select>
                  </div>
                </div>

                <div className='separator separator-dashed mb-6'></div>

                <div className='d-flex justify-content-end gap-3'>
                  <button
                    type='button'
                    onClick={() => setViewState('directory')}
                    className='btn btn-light fw-bold px-6'
                  >
                    Cancel
                  </button>
                  <button
                    type='submit'
                    disabled={submittingNew}
                    className='btn btn-primary fw-bold px-6'
                  >
                    <i className='bi bi-plus-lg me-1'></i>
                    {submittingNew ? 'Adding...' : 'Add to Inventory'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ─── VIEW: INVENTORY DIRECTORY ─── */}
        {viewState === 'directory' && (
          <div className='card border-0 shadow-sm'>
            <div className='card-body pt-6'>
              {/* KPI Stat Cards Row */}
              <div className='row g-4 mb-6'>
                <div className='col-md-3 col-6'>
                  <div className='card bg-light-primary border-primary border-dashed p-5 text-center h-100'>
                    <div className='fs-2hx fw-bolder text-primary'>{stats.totalItems}</div>
                    <div className='fs-7 fw-bold text-primary text-uppercase'>Total Items</div>
                  </div>
                </div>
                <div className='col-md-3 col-6'>
                  <div className='card bg-light-success border-success border-dashed p-5 text-center h-100'>
                    <div className='fs-2hx fw-bolder text-success'>{stats.inStockCount}</div>
                    <div className='fs-7 fw-bold text-success text-uppercase'>In Stock</div>
                  </div>
                </div>
                <div className='col-md-3 col-6'>
                  <div className='card bg-light-warning border-warning border-dashed p-5 text-center h-100'>
                    <div className='fs-2hx fw-bolder text-warning'>{stats.lowStockCount}</div>
                    <div className='fs-7 fw-bold text-warning text-uppercase'>Low Stock</div>
                  </div>
                </div>
                <div className='col-md-3 col-6'>
                  <div className='card bg-light-info border-info border-dashed p-5 text-center h-100'>
                    <div className='fs-2hx fw-bolder text-info'>{stats.totalUnits.toLocaleString()}</div>
                    <div className='fs-7 fw-bold text-info text-uppercase'>Total Units</div>
                  </div>
                </div>
              </div>

              {/* Filter Chips & Search Bar */}
              <div className='d-flex align-items-center justify-content-between flex-wrap gap-4 mb-6'>
                <div className='d-flex align-items-center gap-2 flex-wrap'>
                  {(['all', 'instock', 'low', 'out'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setFilterChip(st)}
                      className={`btn btn-sm px-4 py-2 fw-bold text-capitalize ${
                        filterChip === st ? 'btn-primary' : 'btn-light'
                      }`}
                    >
                      {st === 'all' ? 'All' : st === 'instock' ? '✅ In Stock' : st === 'low' ? '⚠️ Low Stock' : '❌ Out of Stock'}
                      {st === 'low' && stats.lowStockCount > 0 && (
                        <span className='badge badge-circle badge-sm bg-warning text-white ms-2 fs-9'>
                          {stats.lowStockCount}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <div className='d-flex align-items-center gap-2 flex-wrap'>
                  <div className='position-relative w-220px'>
                    <span className='position-absolute ms-3 top-50 translate-middle-y text-gray-500 fs-6'>
                      <i className='bi bi-search'></i>
                    </span>
                    <input
                      type='text'
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className='form-control form-control-solid ps-10 py-2 fs-7'
                      placeholder='Search items...'
                    />
                  </div>
                  <button
                    type='button'
                    onClick={() => {
                      setImportModalOpen(true)
                      setImportRows([])
                      setImportFileName('')
                      setImportError(null)
                    }}
                    className='btn btn-sm btn-light-success fw-bold px-3 py-2'
                    title='Import from Excel or CSV'
                  >
                    <i className='bi bi-file-earmark-spreadsheet me-1'></i> Import Excel
                  </button>
                  <button
                    type='button'
                    onClick={handleExportCSV}
                    className='btn btn-sm btn-light-primary fw-bold px-3 py-2'
                    title='Export CSV'
                  >
                    <i className='bi bi-file-earmark-arrow-down me-1'></i> Export
                  </button>
                  <button
                    type='button'
                    onClick={() => {
                      setSearchTerm('')
                      setFilterChip('all')
                      fetchInventory()
                    }}
                    className='btn btn-sm btn-light fw-bold px-3 py-2'
                    title='Refresh'
                  >
                    <i className='bi bi-arrow-repeat'></i>
                  </button>
                </div>
              </div>

              {/* Inventory Table */}
              <div className='table-responsive'>
                <table className='table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4'>
                  <thead>
                    <tr className='fw-bold text-muted text-uppercase fs-8 border-bottom border-gray-300'>
                      <th className='min-w-200px'>Item Name</th>
                      <th className='text-center'>Qty / Stock</th>
                      <th className='text-center'>Tolerance</th>
                      <th className='min-w-120px'>Stock Level</th>
                      <th className='text-center'>Status</th>
                      <th>Last Updated</th>
                      <th className='text-end min-w-120px'>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={7} className='text-center text-gray-500 py-8'>
                          <div className='spinner-border spinner-border-sm text-primary me-2' role='status'></div>
                          Loading inventory...
                        </td>
                      </tr>
                    ) : filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan={7} className='text-center text-gray-500 py-12'>
                          <i className='bi bi-inbox fs-2x text-gray-400 d-block mb-3'></i>
                          <span className='text-gray-700 fw-bold fs-5 d-block'>No items found</span>
                          <span className='text-muted fs-7'>Try resetting your filters, import from Excel, or add a new stock item.</span>
                        </td>
                      </tr>
                    ) : (
                      filteredItems.map((item) => {
                        const isOut = item.quantity === 0
                        const isLow = !isOut && item.quantity <= item.toleranceLimit
                        const statusLabel = isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'
                        const badgeClass = isOut ? 'badge-light-danger' : isLow ? 'badge-light-warning' : 'badge-light-success'
                        const progressColor = isOut ? 'bg-danger' : isLow ? 'bg-warning' : 'bg-success'
                        const healthPct = getStockHealth(item)

                        return (
                          <tr key={item.id}>
                            {/* Item Name */}
                            <td>
                              <div className='d-flex align-items-center gap-3'>
                                <div className='symbol symbol-40px symbol-circle'>
                                  <span
                                    className={`symbol-label fw-bolder fs-6 ${
                                      isOut
                                        ? 'bg-light-danger text-danger'
                                        : isLow
                                        ? 'bg-light-warning text-warning'
                                        : 'bg-light-primary text-primary'
                                    }`}
                                  >
                                    {item.itemName.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <span
                                    className='text-gray-900 fw-bolder text-hover-primary cursor-pointer fs-6 d-block'
                                    onClick={() => openManageModal(item)}
                                  >
                                    {item.itemName}
                                  </span>
                                  <span className='text-gray-500 fs-8'>{item.unit || 'Pcs'} · {item.category || 'General Store'}</span>
                                </div>
                              </div>
                            </td>

                            {/* Quantity */}
                            <td className='text-center'>
                              <span className='text-gray-900 fw-bolder fs-5'>{item.quantity}</span>
                              <span className='text-gray-500 fs-8 ms-1'>{item.unit || 'Pcs'}</span>
                            </td>

                            {/* Tolerance */}
                            <td className='text-center'>
                              <span className='text-gray-700 fw-semibold fs-7'>
                                {item.toleranceLimit} {item.unit || 'Pcs'}
                              </span>
                            </td>

                            {/* Stock Level Progress Bar */}
                            <td>
                              <div className='d-flex align-items-center gap-2'>
                                <div className='progress h-6px w-100 bg-light-dark rounded'>
                                  <div
                                    className={`progress-bar rounded ${progressColor}`}
                                    role='progressbar'
                                    style={{ width: `${healthPct}%` }}
                                  />
                                </div>
                                <span className='text-gray-600 fs-8 fw-bold text-nowrap'>
                                  {Math.round(healthPct)}%
                                </span>
                              </div>
                            </td>

                            {/* Status Badge */}
                            <td className='text-center'>
                              <span className={`badge ${badgeClass} fw-bold px-3 py-1 text-capitalize`}>
                                {statusLabel}
                              </span>
                            </td>

                            {/* Last Updated */}
                            <td>
                              <span className='text-gray-700 fw-semibold fs-7'>
                                {formatDateTime(item.updatedAt)}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className='text-end'>
                              <div className='d-flex justify-content-end gap-2'>
                                <button
                                  type='button'
                                  onClick={() => openManageModal(item)}
                                  className='btn btn-icon btn-light-primary btn-sm'
                                  title='Manage Stock'
                                >
                                  <i className='bi bi-sliders fs-5'></i>
                                </button>
                                <button
                                  type='button'
                                  onClick={() => openHistoryModal(item)}
                                  className='btn btn-icon btn-light-warning btn-sm'
                                  title='View History'
                                >
                                  <i className='bi bi-clock-history fs-5'></i>
                                </button>
                              </div>
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
        )}

        {/* ─── MODAL 1: EXCEL / CSV BULK IMPORT ─── */}
        {importModalOpen && (
          <div
            className='modal fade show d-block'
            tabIndex={-1}
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.55)', zIndex: 1055 }}
            role='dialog'
          >
            <div className='modal-dialog modal-dialog-centered mw-800px'>
              <div className='modal-content border-0 shadow-lg rounded-3'>
                {/* Modal Header */}
                <div className='modal-header border-0 pb-0 pt-6 px-8 d-flex justify-content-between align-items-center'>
                  <div>
                    <h3 className='modal-title fw-bolder text-gray-900 fs-3 mb-1'>
                      <i className='bi bi-file-earmark-spreadsheet text-success me-2 fs-2'></i>
                      Bulk Import Store Inventory
                    </h3>
                    <p className='text-muted fs-7 mb-0'>
                      Upload an Excel (.xlsx, .xls) or CSV file with your items and stock figures.
                    </p>
                  </div>
                  <button
                    type='button'
                    onClick={() => setImportModalOpen(false)}
                    className='btn btn-sm btn-icon btn-active-color-primary'
                    aria-label='Close'
                  >
                    <i className='bi bi-x-lg fs-4'></i>
                  </button>
                </div>

                <div className='modal-body px-8 pt-4 pb-8'>
                  {/* Template Download Alert */}
                  <div className='alert alert-dismissible bg-light-primary border border-primary border-dashed d-flex align-items-center p-4 mb-5 rounded-3'>
                    <i className='bi bi-info-circle fs-2 text-primary me-4'></i>
                    <div className='d-flex flex-column flex-grow-1'>
                      <span className='fw-bold text-gray-900 fs-7'>Standard Column Format</span>
                      <span className='text-gray-600 fs-8'>
                        Headers supported: <strong>Item Name</strong>, <strong>Quantity</strong>, <strong>Tolerance Limit</strong>, <strong>Unit</strong>, <strong>Category</strong>, <strong>Notes</strong>.
                      </span>
                    </div>
                    <button
                      type='button'
                      onClick={handleDownloadSampleExcel}
                      className='btn btn-sm btn-primary fw-bold text-nowrap ms-2'
                    >
                      <i className='bi bi-download me-1'></i> Download Sample Template
                    </button>
                  </div>

                  {/* File Upload Drop Area */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border border-2 border-dashed rounded-3 p-6 text-center cursor-pointer mb-5 transition-all ${
                      isDragging ? 'border-primary bg-light-primary' : 'border-gray-300 bg-light-secondary hover-elevate-up'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type='file'
                      accept='.xlsx, .xls, .csv'
                      className='d-none'
                      onChange={handleFileInputChange}
                    />
                    <div className='mb-2'>
                      <i className='bi bi-cloud-arrow-up text-success fs-3x'></i>
                    </div>
                    <h5 className='fw-bolder text-gray-900 mb-1'>
                      {importFileName ? importFileName : 'Click or drag & drop Excel / CSV file here'}
                    </h5>
                    <span className='text-muted fs-8 d-block'>
                      Supported formats: <strong>.XLSX, .XLS, .CSV</strong> (Max 5,000 rows per batch)
                    </span>
                    {importFileName && (
                      <span className='badge badge-light-success fw-bold mt-2 px-3 py-1'>
                        <i className='bi bi-check-circle me-1'></i> File Loaded
                      </span>
                    )}
                  </div>

                  {/* Error display */}
                  {importError && (
                    <div className='alert alert-danger d-flex align-items-center p-4 mb-5 rounded-3'>
                      <i className='bi bi-exclamation-triangle fs-2 text-danger me-3'></i>
                      <div className='text-danger fw-semibold fs-7'>{importError}</div>
                    </div>
                  )}

                  {/* Parsed Preview Section */}
                  {importRows.length > 0 && (
                    <div>
                      {/* Metric summary pills */}
                      <div className='d-flex align-items-center gap-2 mb-4 flex-wrap'>
                        <span className='badge badge-light-dark fw-bold fs-8 px-3 py-2'>
                          Total: <strong>{importSummary.total}</strong> rows
                        </span>
                        <span className='badge badge-light-success fw-bold fs-8 px-3 py-2'>
                          Ready to Import: <strong>{importSummary.valid}</strong>
                        </span>
                        {importSummary.newItems > 0 && (
                          <span className='badge badge-light-primary fw-bold fs-8 px-3 py-2'>
                            New Items: <strong>{importSummary.newItems}</strong>
                          </span>
                        )}
                        {importSummary.updates > 0 && (
                          <span className='badge badge-light-warning fw-bold fs-8 px-3 py-2'>
                            Existing (Stock Inward): <strong>{importSummary.updates}</strong>
                          </span>
                        )}
                        {importSummary.invalid > 0 && (
                          <span className='badge badge-light-danger fw-bold fs-8 px-3 py-2'>
                            Invalid / Incomplete: <strong>{importSummary.invalid}</strong>
                          </span>
                        )}
                      </div>

                      {/* Preview Table */}
                      <div
                        className='table-responsive border rounded-3 mb-4'
                        style={{ maxHeight: '280px', overflowY: 'auto' }}
                      >
                        <table className='table table-row-dashed table-row-gray-200 align-middle gs-0 gy-2 px-3 mb-0'>
                          <thead className='bg-light position-sticky top-0'>
                            <tr className='fw-bold text-muted text-uppercase fs-8'>
                              <th className='ps-3'>#</th>
                              <th>Item Name</th>
                              <th className='text-center'>Qty</th>
                              <th className='text-center'>Tolerance</th>
                              <th>Unit</th>
                              <th>Category</th>
                              <th className='text-end pe-3'>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {importRows.map((row, idx) => (
                              <tr key={idx}>
                                <td className='ps-3 text-muted fs-8'>{idx + 1}</td>
                                <td>
                                  <span className='fw-bold text-gray-900 fs-7'>{row.itemName}</span>
                                </td>
                                <td className='text-center fw-bolder text-gray-800 fs-7'>{row.quantity}</td>
                                <td className='text-center text-gray-600 fs-7'>{row.toleranceLimit}</td>
                                <td className='text-gray-700 fs-7'>{row.unit}</td>
                                <td className='text-gray-600 fs-8'>{row.category}</td>
                                <td className='text-end pe-3'>
                                  <span
                                    className={`badge badge-light-${
                                      row.statusType === 'valid_new'
                                        ? 'primary'
                                        : row.statusType === 'valid_update'
                                        ? 'warning'
                                        : 'danger'
                                    } fw-bold fs-8 px-2 py-1`}
                                    title={row.statusMessage}
                                  >
                                    {row.statusType === 'valid_new'
                                      ? 'New Item'
                                      : row.statusType === 'valid_update'
                                      ? 'Stock In'
                                      : 'Invalid'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div className='separator separator-dashed mb-5'></div>

                  {/* Modal Footer Controls */}
                  <div className='d-flex justify-content-between align-items-center flex-wrap gap-3'>
                    <button
                      type='button'
                      onClick={() => {
                        setImportRows([])
                        setImportFileName('')
                        setImportError(null)
                      }}
                      disabled={importRows.length === 0}
                      className='btn btn-sm btn-light fw-bold'
                    >
                      <i className='bi bi-trash me-1'></i> Clear File
                    </button>

                    <div className='d-flex gap-2'>
                      <button
                        type='button'
                        onClick={() => setImportModalOpen(false)}
                        className='btn btn-sm btn-light fw-bold px-5'
                      >
                        Cancel
                      </button>
                      <button
                        type='button'
                        onClick={handleExecuteBulkImport}
                        disabled={importLoading || importSummary.valid === 0}
                        className='btn btn-sm btn-success fw-bold px-6'
                      >
                        {importLoading ? (
                          <>
                            <span className='spinner-border spinner-border-sm me-2' role='status'></span>
                            Importing...
                          </>
                        ) : (
                          <>
                            <i className='bi bi-check2-circle me-1'></i>
                            Import {importSummary.valid > 0 ? `${importSummary.valid} Items` : 'Items'}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── MODAL 2: MANAGE STOCK (Adjust / Edit / Delete) ─── */}
        {manageModalOpen && activeItem && (
          <div
            className='modal fade show d-block'
            tabIndex={-1}
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1055 }}
            role='dialog'
          >
            <div className='modal-dialog modal-dialog-centered mw-500px'>
              <div className='modal-content border-0 shadow-lg'>
                <div className='modal-header border-0 pb-0 pt-6 px-8'>
                  <div>
                    <h3 className='modal-title fw-bolder text-gray-900 fs-3 mb-0'>Manage Stock</h3>
                    <p className='text-muted fs-7 mb-0'>
                      {activeItem.itemName} · {activeItem.quantity} {activeItem.unit || 'Pcs'} in stock
                    </p>
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

                <div className='modal-body px-8 pt-4 pb-8'>
                  {/* Current Balance Info */}
                  <div className='card bg-light-primary border-primary border-dashed p-4 mb-6'>
                    <div className='d-flex justify-content-between align-items-center'>
                      <div>
                        <span className='text-gray-600 fs-8 fw-bold text-uppercase d-block'>Current In-Stock</span>
                        <span className='fs-2hx fw-bolder text-primary'>
                          {activeItem.quantity} {activeItem.unit || 'Pcs'}
                        </span>
                      </div>
                      <div className='text-end'>
                        <span className='text-gray-600 fs-8 fw-bold text-uppercase d-block'>Safety Threshold</span>
                        <span className='fs-5 fw-bold text-gray-800'>
                          {activeItem.toleranceLimit} {activeItem.unit || 'Pcs'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Nav Pills */}
                  <ul className='nav nav-tabs nav-line-tabs nav-line-tabs-2x mb-6 fs-6'>
                    <li className='nav-item'>
                      <button
                        onClick={() => setManageTab('adjust')}
                        className={`nav-link fw-bold ${manageTab === 'adjust' ? 'active text-primary' : 'text-gray-600'}`}
                      >
                        <i className='bi bi-arrow-left-right me-1'></i> Adjust
                      </button>
                    </li>
                    <li className='nav-item'>
                      <button
                        onClick={() => setManageTab('edit')}
                        className={`nav-link fw-bold ${manageTab === 'edit' ? 'active text-primary' : 'text-gray-600'}`}
                      >
                        <i className='bi bi-pencil me-1'></i> Edit
                      </button>
                    </li>
                    <li className='nav-item'>
                      <button
                        onClick={() => setManageTab('delete')}
                        className={`nav-link fw-bold ${manageTab === 'delete' ? 'active text-danger' : 'text-gray-600'}`}
                      >
                        <i className='bi bi-trash me-1'></i> Delete
                      </button>
                    </li>
                  </ul>

                  {/* Tab 1: Adjust Stock */}
                  {manageTab === 'adjust' && (
                    <form onSubmit={handleAdjustSubmit}>
                      <div className='mb-5'>
                        <label className='form-label fw-bold fs-7 mb-2'>Action Type</label>
                        <div className='d-flex gap-3'>
                          <button
                            type='button'
                            onClick={() => setAdjustAction('IN')}
                            className={`btn flex-fill py-3 fw-bold ${
                              adjustAction === 'IN' ? 'btn-success text-white' : 'btn-light'
                            }`}
                          >
                            <i className='bi bi-box-arrow-in-down me-1'></i> Inward (+)
                          </button>
                          <button
                            type='button'
                            onClick={() => setAdjustAction('OUT')}
                            className={`btn flex-fill py-3 fw-bold ${
                              adjustAction === 'OUT' ? 'btn-warning text-white' : 'btn-light'
                            }`}
                          >
                            <i className='bi bi-box-arrow-up me-1'></i> Issue (−)
                          </button>
                        </div>
                      </div>

                      <div className='mb-5'>
                        <label className='form-label fw-bold fs-7 mb-1 required'>Quantity</label>
                        <input
                          type='number'
                          min='1'
                          value={adjustQty}
                          onChange={(e) => setAdjustQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                          className='form-control form-control-solid'
                          required
                        />
                        {adjustAction === 'IN' && (
                          <span className='text-success fs-8 mt-1 d-block'>
                            New balance: {activeItem.quantity + adjustQty} {activeItem.unit || 'Pcs'}
                          </span>
                        )}
                        {adjustAction === 'OUT' && (
                          <span className={`fs-8 mt-1 d-block ${activeItem.quantity >= adjustQty ? 'text-warning' : 'text-danger'}`}>
                            {activeItem.quantity >= adjustQty
                              ? `New balance: ${activeItem.quantity - adjustQty} ${activeItem.unit || 'Pcs'}`
                              : `Insufficient stock!`}
                          </span>
                        )}
                      </div>

                      <div className='mb-5'>
                        <label className='form-label fw-bold fs-7 mb-1'>Reason / Purpose</label>
                        <select
                          value={adjustReason}
                          onChange={(e) => setAdjustReason(e.target.value)}
                          className='form-select form-select-solid'
                        >
                          <option value='Stock Inward Receipt'>Stock Inward Receipt (Supplier)</option>
                          <option value='Issued to Production Line'>Issued to Production Line</option>
                          <option value='Issued for QC / Calibration Testing'>Issued for QC / Calibration Testing</option>
                          <option value='Defective / Damaged Scrap'>Defective / Damaged Scrap</option>
                          <option value='Periodic Inventory Audit'>Periodic Inventory Audit Adjustment</option>
                          <option value='Inter-branch Movement'>Inter-branch Movement</option>
                        </select>
                      </div>

                      <div className='mb-6'>
                        <label className='form-label fw-bold fs-7 mb-1'>Reference / Voucher #</label>
                        <input
                          type='text'
                          placeholder='e.g. PO-8891 / Issue Slip #104'
                          value={adjustReference}
                          onChange={(e) => setAdjustReference(e.target.value)}
                          className='form-control form-control-solid'
                        />
                      </div>

                      <div className='separator separator-dashed mb-5'></div>

                      <div className='d-flex justify-content-end gap-3'>
                        <button
                          type='button'
                          onClick={() => setManageModalOpen(false)}
                          className='btn btn-light fw-bold px-5'
                        >
                          Cancel
                        </button>
                        <button
                          type='submit'
                          disabled={submittingAdjust}
                          className='btn btn-primary fw-bold px-6'
                        >
                          {submittingAdjust ? 'Updating...' : 'Confirm Movement'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Tab 2: Edit Item */}
                  {manageTab === 'edit' && (
                    <form onSubmit={handleEditSubmit}>
                      <div className='mb-5'>
                        <label className='form-label fw-bold fs-7 mb-1 required'>Item Name</label>
                        <input
                          type='text'
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className='form-control form-control-solid'
                          required
                        />
                      </div>

                      <div className='row g-4 mb-5'>
                        <div className='col-6'>
                          <label className='form-label fw-bold fs-7 mb-1 required'>Tolerance Limit</label>
                          <input
                            type='number'
                            min='0'
                            value={editTolerance}
                            onChange={(e) => setEditTolerance(Math.max(0, parseInt(e.target.value, 10) || 0))}
                            className='form-control form-control-solid'
                            required
                          />
                        </div>
                        <div className='col-6'>
                          <label className='form-label fw-bold fs-7 mb-1'>Unit</label>
                          <select
                            value={editUnit}
                            onChange={(e) => setEditUnit(e.target.value)}
                            className='form-select form-select-solid'
                          >
                            <option value='Pcs'>Pcs</option>
                            <option value='Kg'>Kg</option>
                            <option value='Mtr'>Mtr</option>
                            <option value='Box'>Box</option>
                            <option value='Set'>Set</option>
                            <option value='Ltr'>Ltr</option>
                            <option value='Roll'>Roll</option>
                          </select>
                        </div>
                      </div>

                      <div className='separator separator-dashed mb-5'></div>

                      <div className='d-flex justify-content-end gap-3'>
                        <button
                          type='button'
                          onClick={() => setManageModalOpen(false)}
                          className='btn btn-light fw-bold px-5'
                        >
                          Cancel
                        </button>
                        <button
                          type='submit'
                          disabled={submittingEdit}
                          className='btn btn-primary fw-bold px-6'
                        >
                          {submittingEdit ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Tab 3: Delete */}
                  {manageTab === 'delete' && (
                    <div className='text-center py-5'>
                      <i className='bi bi-exclamation-triangle fs-3x text-danger d-block mb-4'></i>
                      <h4 className='fw-bolder text-gray-900 mb-2'>Remove "{activeItem.itemName}"?</h4>
                      <p className='text-gray-600 fs-7 mb-6'>
                        This will permanently remove this item from the store inventory. Transaction history will be retained in the audit log.
                      </p>
                      <div className='d-flex justify-content-center gap-3'>
                        <button
                          type='button'
                          onClick={() => setManageModalOpen(false)}
                          className='btn btn-light fw-bold px-5'
                        >
                          Cancel
                        </button>
                        <button
                          type='button'
                          onClick={handleDeleteItem}
                          className='btn btn-danger fw-bold px-6'
                        >
                          <i className='bi bi-trash me-1'></i> Delete Item
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── MODAL 3: STOCK MOVEMENT HISTORY ─── */}
        {historyModalOpen && (
          <div
            className='modal fade show d-block'
            tabIndex={-1}
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1055 }}
            role='dialog'
          >
            <div className='modal-dialog modal-dialog-centered mw-750px'>
              <div className='modal-content border-0 shadow-lg'>
                <div className='modal-header border-0 pb-0 pt-6 px-8'>
                  <div>
                    <h3 className='modal-title fw-bolder text-gray-900 fs-3 mb-0'>Stock Movement History</h3>
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

                <div className='modal-body px-8 pt-4 pb-8'>
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
                            <td colSpan={6} className='text-center py-8 text-muted'>
                              <i className='bi bi-clock-history fs-2x text-gray-400 d-block mb-2'></i>
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
                                    } fw-bold px-3 py-1`}
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

                  <div className='separator separator-dashed my-4'></div>

                  <div className='d-flex justify-content-end'>
                    <button
                      type='button'
                      onClick={() => setHistoryModalOpen(false)}
                      className='btn btn-light fw-bold px-6'
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
