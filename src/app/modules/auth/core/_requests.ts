import axios from 'axios'
import {
  AuthModel,
  UserModel,
  LoginResponse,
  TenantModel,
  TenantCreationData,
  DocumentModel,
  LeadModel,
  LeadsListResponse,
  BlogModel,
  BlogsListResponse,
  AIBlogGenerationResponse
} from './_models'

const API_URL = import.meta.env.VITE_APP_API_URL || 'https://api-archerchamp.onrender.com/api'

export const LOGIN_URL = `${API_URL}/tenant/login`
export const SUPERADMIN_LOGIN_URL = `${API_URL}/master/login`
export const GET_USER_BY_TOKEN_URL = `${API_URL}/verify_token`

export function login(email: string, password: string, role: string = 'admin', subdomain?: string) {
  if (role === 'super_admin') {
    return axios.post<LoginResponse>(SUPERADMIN_LOGIN_URL, { email, password })
  } else {
    return axios.post<LoginResponse>(LOGIN_URL, { email, password }, {
      headers: {
        'x-tenant-subdomain': subdomain || 'archerchem'
      }
    })
  }
}

export function getUserByToken(token: string) {
  return axios.get<LoginResponse>(GET_USER_BY_TOKEN_URL, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
}

export function updateProfile(profileData: any, subdomain?: string) {
  return axios.put<{ success: boolean; tenant: any }>(`${API_URL}/tenant/profile`, profileData, {
    headers: subdomain ? { 'x-tenant-subdomain': subdomain } : {}
  })
}

// --- Multi-Tenant API Requests ---

export function getTenants() {
  return axios.get<{ success: boolean; data: { tenants: TenantModel[] } }>(`${API_URL}/tenants`)
}

export function createTenant(tenantData: TenantCreationData) {
  return axios.post<{ success: boolean; tenant: TenantModel }>(`${API_URL}/master/tenants`, tenantData)
}

export function createTenantAdmin(tenantId: number | string, adminData: { name: string; email: string; password: string }) {
  return axios.post<{ success: boolean; user: any }>(`${API_URL}/master/tenants/${tenantId}/admins`, adminData)
}

export function getTenantAdmins(tenantId: number | string) {
  return axios.get<{ success: boolean; admins: any[] }>(`${API_URL}/master/tenants/${tenantId}/admins`)
}

// --- Document Management API Requests ---
export function getDocuments() {
  return axios.get<{ success: boolean; documents: DocumentModel[] }>(`${API_URL}/tenant/documents`)
}

export function createDocument(formData: any) {
  return axios.post<{ success: boolean; document: DocumentModel }>(`${API_URL}/tenant/documents`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// --- User Management API Requests ---
export function getUsers() {
  return axios.get<{ success: boolean; users: UserModel[] }>(`${API_URL}/tenant/users`)
}

export function createUser(userData: Partial<UserModel>) {
  return axios.post<{ success: boolean; user: UserModel }>(`${API_URL}/tenant/users`, userData)
}

export function updateUser(id: string | number, userData: Partial<UserModel>) {
  return axios.put<{ success: boolean; user: UserModel }>(`${API_URL}/tenant/users/${id}`, userData)
}

export function deleteUser(id: string | number) {
  return axios.delete<{ success: boolean; message: string }>(`${API_URL}/tenant/users/${id}`)
}

// --- OIF Orders API Requests ---
export function getOifOrders(params?: any) {
  return axios.get<{ success: boolean; orders: any[] }>(`${API_URL}/tenant/oif`, {
    params: typeof params === 'string' ? { search: params } : params
  })
}

export function createOifOrder(orderData: any) {
  return axios.post<{ success: boolean; order: any }>(`${API_URL}/tenant/oif`, orderData)
}

export function updateOifOrder(id: string | number, orderData: any) {
  return axios.put<{ success: boolean; order: any }>(`${API_URL}/tenant/oif/${id}`, orderData)
}

// Legacy aliases for OIF
export const getOifs = getOifOrders
export const createOif = createOifOrder
export const updateOif = updateOifOrder

// --- Electronics BOM API Requests ---
export function getElectronicsBoards(params?: any) {
  return axios.get<{ success: boolean; boards: any[] }>(`${API_URL}/tenant/electronics`, { params })
}

export function createElectronicsBoard(boardData: any) {
  return axios.post<{ success: boolean; board: any }>(`${API_URL}/tenant/electronics`, boardData)
}

export function updateElectronicsBoard(id: string | number, boardData: any) {
  return axios.put<{ success: boolean; board: any }>(`${API_URL}/tenant/electronics/${id}`, boardData)
}

export function deleteElectronicsBoard(id: string | number) {
  return axios.delete<{ success: boolean; message: string }>(`${API_URL}/tenant/electronics/${id}`)
}

export function manufactureElectronicsBoard(id: string | number, qtyOrPayload: any, actionBy?: string) {
  const payload = typeof qtyOrPayload === 'object' ? qtyOrPayload : { qty: qtyOrPayload, actionBy }
  return axios.post<{ success: boolean; board: any; log: any }>(`${API_URL}/tenant/electronics/${id}/manufacture`, payload)
}

export function getElectronicsLogs(boardId?: any) {
  return axios.get<{ success: boolean; logs: any[] }>(`${API_URL}/tenant/electronics/logs`, {
    params: boardId ? { boardId } : undefined
  })
}

// Legacy aliases for Electronics
export const getElectronics = getElectronicsBoards
export const createElectronicBoard = createElectronicsBoard
export const updateElectronicBoard = updateElectronicsBoard
export const deleteElectronicBoard = deleteElectronicsBoard
export const manufactureElectronicBoard = manufactureElectronicsBoard

// --- Branch Management API Requests ---
export function getBranches() {
  return axios.get<{ success: boolean; branches: any[] }>(`${API_URL}/tenant/branches`)
}

export function createBranch(branchData: any) {
  return axios.post<{ success: boolean; branch: any }>(`${API_URL}/tenant/branches`, branchData)
}

export function updateBranch(id: string | number, branchData: any) {
  return axios.put<{ success: boolean; branch: any }>(`${API_URL}/tenant/branches/${id}`, branchData)
}

export function deleteBranch(id: string | number) {
  return axios.delete<{ success: boolean; message: string }>(`${API_URL}/tenant/branches/${id}`)
}

// --- Brand Management API Requests ---
export function getBrands() {
  return axios.get<{ success: boolean; brands: any[] }>(`${API_URL}/tenant/brands`)
}

export function createBrand(brandData: any) {
  return axios.post<{ success: boolean; brand: any }>(`${API_URL}/tenant/brands`, brandData)
}

export function updateBrand(id: string | number, brandData: any) {
  return axios.put<{ success: boolean; brand: any }>(`${API_URL}/tenant/brands/${id}`, brandData)
}

export function deleteBrand(id: string | number) {
  return axios.delete<{ success: boolean; message: string }>(`${API_URL}/tenant/brands/${id}`)
}

// --- Purchase Requisitions API Requests ---
export function getPurchaseRequisitions(branch?: string) {
  return axios.get<{ success: boolean; requisitions: any[] }>(`${API_URL}/tenant/purchase`, {
    params: { branch }
  })
}

export function createPurchaseRequisition(prData: any) {
  return axios.post<{ success: boolean; requisition: any }>(`${API_URL}/tenant/purchase`, prData)
}

export function updatePurchaseRequisition(id: string | number, prData: any) {
  return axios.put<{ success: boolean; requisition: any }>(`${API_URL}/tenant/purchase/${id}`, prData)
}

export function deletePurchaseRequisition(id: string | number) {
  return axios.delete<{ success: boolean; message: string }>(`${API_URL}/tenant/purchase/${id}`)
}

// --- Calibration Certificates API Requests ---
export function getCalibrationCertificates() {
  return axios.get<{ success: boolean; certificates: any[]; error?: string }>(`${API_URL}/tenant/calibration`)
}

export function createCalibrationCertificate(certData: any) {
  return axios.post<{ success: boolean; certificate: any; error?: string }>(`${API_URL}/tenant/calibration`, certData)
}

export function updateCalibrationCertificate(id: string, certData: any) {
  return axios.put<{ success: boolean; certificate: any; error?: string }>(`${API_URL}/tenant/calibration/${encodeURIComponent(id)}`, certData)
}

export function deleteCalibrationCertificate(id: string) {
  return axios.delete<{ success: boolean; message: string; error?: string }>(`${API_URL}/tenant/calibration/${encodeURIComponent(id)}`)
}

// --- QC Reports API Requests ---
export function getQcReports() {
  return axios.get<{ success: boolean; reports: any[]; error?: string }>(`${API_URL}/tenant/qc`)
}

export function createQcReport(reportData: any) {
  return axios.post<{ success: boolean; report: any; error?: string }>(`${API_URL}/tenant/qc`, reportData)
}

export function updateQcReport(id: string, reportData: any) {
  return axios.put<{ success: boolean; report: any; error?: string }>(`${API_URL}/tenant/qc/${encodeURIComponent(id)}`, reportData)
}

export function deleteQcReport(id: string) {
  return axios.delete<{ success: boolean; message: string; error?: string }>(`${API_URL}/tenant/qc/${encodeURIComponent(id)}`)
}

// --- Reports Summary API Requests ---
export function getReportsSummary(location?: string) {
  return axios.get<{ success: boolean; summary: any }>(`${API_URL}/tenant/reports/summary`, {
    params: { location }
  })
}

// --- OIML Calculation API Requests ---
export function getOimlRecords() {
  return axios.get<{ success: boolean; records: any[] }>(`${API_URL}/tenant/oiml`)
}

export function createOimlRecord(recordData: any) {
  return axios.post<{ success: boolean; record: any }>(`${API_URL}/tenant/oiml`, recordData)
}

// --- Stamping Applications API Requests ---
export function getStampingApplications() {
  return axios.get<{ success: boolean; applications: any[]; error?: string }>(`${API_URL}/tenant/stamping`)
}

export function createStampingApplication(appData: any) {
  return axios.post<{ success: boolean; application: any; error?: string }>(`${API_URL}/tenant/stamping`, appData)
}

export function deleteStampingApplication(id: string | number) {
  return axios.delete<{ success: boolean; message: string; error?: string }>(`${API_URL}/tenant/stamping/${id}`)
}

// --- Notifications API Requests ---
export function getNotifications() {
  return axios.get<{ success: boolean; notifications: any[] }>(`${API_URL}/tenant/notifications`)
}

export function markAllNotificationsRead() {
  return axios.post<{ success: boolean; message: string }>(`${API_URL}/tenant/notifications/mark-read`)
}

// --- Store & Inventory API Requests ---
export interface StoreItemPayload {
  id?: number | string
  itemName: string
  quantity: number
  toleranceLimit: number
  branch?: string
  unit?: string
  category?: string
  location?: string
  notes?: string
}

export function getStoreItems(params?: { search?: string; lowStock?: boolean; branch?: string; itemId?: number | string }) {
  return axios.get<{ success: boolean; items: any[]; error?: string }>(`${API_URL}/tenant/store`, { params })
}

export function createStoreItem(itemData: Partial<StoreItemPayload>) {
  return axios.post<{ success: boolean; item: any; error?: string }>(`${API_URL}/tenant/store`, itemData)
}

export function updateStoreItem(id: number | string, itemData: Partial<StoreItemPayload>) {
  return axios.put<{ success: boolean; item: any; error?: string }>(`${API_URL}/tenant/store/${id}`, itemData)
}

export function adjustStoreStock(id: number | string, payload: { action: 'IN' | 'OUT'; qty: number; reason?: string; reference?: string }) {
  return axios.post<{ success: boolean; item: any; log?: any; message?: string; error?: string }>(`${API_URL}/tenant/store/${id}/adjust`, payload)
}

export function deleteStoreItem(id: number | string) {
  return axios.delete<{ success: boolean; message: string; error?: string }>(`${API_URL}/tenant/store/${id}`)
}

export function getStoreHistory(params?: { itemId?: number | string; branch?: string }) {
  return axios.get<{ success: boolean; logs: any[]; error?: string }>(`${API_URL}/tenant/store/history`, { params })
}

