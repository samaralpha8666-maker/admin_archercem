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

const API_URL = import.meta.env.VITE_APP_API_URL

export const LOGIN_URL = `${API_URL}/tenant/login`
export const SUPERADMIN_LOGIN_URL = `${API_URL}/master/login`
export const GET_USER_BY_TOKEN_URL = `${API_URL}/verify_token`

export function login(email: string, password: string, role: string = 'admin', subdomain?: string) {
  if (role === 'super_admin') {
    return axios.post<LoginResponse>(SUPERADMIN_LOGIN_URL, { email, password })
  } else {
    return axios.post<LoginResponse>(LOGIN_URL, { email, password }, {
      headers: {
        'x-tenant-subdomain': subdomain || ''
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



export function getDocuments() {
  return axios.get<{ success: boolean; documents: DocumentModel[] }>(`${API_URL}/tenant/documents`)
}

export function createDocument(documentData: { title: string; content: string }) {
  return axios.post<{ success: boolean; document: DocumentModel }>(`${API_URL}/tenant/documents`, documentData)
}

// --- Leads & Demo Requests ---
export const GET_LEADS_URL = `${API_URL}/admin/leads`
export const UPDATE_LEAD_STATUS_URL = (id: string | number) => `${API_URL}/admin/leads/${id}/status`

export function getLeads(page: number, limit: number, type?: string, status?: string) {
  return axios.get<LeadsListResponse>(GET_LEADS_URL, {
    params: {
      limit,
      offset: (page - 1) * limit,
      type: type || undefined,
      status: status || undefined
    }
  })
}

export function updateLeadStatus(id: string | number, status: 'PENDING' | 'CONTACTED' | 'RESOLVED') {
  return axios.patch<any>(UPDATE_LEAD_STATUS_URL(id), { status })
}

// --- Blog Management ---
export const GET_BLOGS_URL = `${API_URL}/admin/blogs`
export const BLOG_DETAIL_URL = (id: string | number) => `${API_URL}/admin/blogs/${id}`
export const GENERATE_BLOG_AI_URL = `${API_URL}/admin/blogs/generate`
export const UPDATE_ADMIN_KEYS_URL = `${API_URL}/admin/api-keys`
export const UPLOAD_BLOG_IMAGE_URL = `${API_URL}/admin/blogs/upload`

export function getBlogs(page: number, limit: number, status?: string) {
  return axios.get<BlogsListResponse>(GET_BLOGS_URL, {
    params: {
      limit,
      offset: (page - 1) * limit,
      status: status || undefined
    }
  })
}

export function createBlog(blogData: Partial<BlogModel>) {
  return axios.post<{ success: boolean; data: BlogModel }>(GET_BLOGS_URL, blogData)
}

export function updateBlog(id: string | number, blogData: Partial<BlogModel>) {
  return axios.put<{ success: boolean; data: BlogModel }>(BLOG_DETAIL_URL(id), blogData)
}

export function deleteBlog(id: string | number) {
  return axios.delete(BLOG_DETAIL_URL(id))
}

export function uploadBlogImage(imageFile: File) {
  const formData = new FormData()
  formData.append('image', imageFile)
  return axios.post<{ success: boolean; data: { imageUrl: string } }>(UPLOAD_BLOG_IMAGE_URL, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export function generateBlogAI(payload: {
  prompt: string
  keywords?: string
  provider: 'GEMINI' | 'OPENAI' | 'GROK'
  custom_key?: string
}) {
  return axios.post<AIBlogGenerationResponse>(GENERATE_BLOG_AI_URL, payload)
}

export function updateAdminKeys(keysData: { gemini_api_key?: string; openai_api_key?: string; grok_api_key?: string }) {
  return axios.put<{ success: boolean; data: any }>(UPDATE_ADMIN_KEYS_URL, keysData)
}

export function updateProfile(profileData: { name?: string; email?: string; password?: string }, role: string = 'admin') {
  if (role === 'super_admin') {
    return axios.put<{ success: boolean; admin: UserModel }>(`${API_URL}/master/profile`, profileData)
  } else {
    return axios.put<{ success: boolean; user: UserModel }>(`${API_URL}/tenant/profile`, profileData)
  }
}

// --- OIF Order API Requests ---
export function getOifs(branch?: string) {
  return axios.get<{ success: boolean; orders: any[] }>(`${API_URL}/tenant/oif`, {
    params: { branch }
  })
}

export function createOif(oifData: any) {
  return axios.post<{ success: boolean; order: any }>(`${API_URL}/tenant/oif`, oifData)
}

export function updateOif(id: string | number, oifData: any) {
  return axios.put<{ success: boolean; order: any }>(`${API_URL}/tenant/oif/${id}`, oifData)
}

// --- Electronics BOM API Requests ---
export function getElectronics(branch?: string) {
  return axios.get<{ success: boolean; boards: any[] }>(`${API_URL}/tenant/electronics`, {
    params: { branch }
  })
}

export function createElectronicBoard(boardData: any) {
  return axios.post<{ success: boolean; board: any }>(`${API_URL}/tenant/electronics`, boardData)
}

export function updateElectronicBoard(id: string | number, boardData: any) {
  return axios.put<{ success: boolean; board: any }>(`${API_URL}/tenant/electronics/${id}`, boardData)
}

export function deleteElectronicBoard(id: string | number) {
  return axios.delete<{ success: boolean; message: string }>(`${API_URL}/tenant/electronics/${id}`)
}

export function manufactureElectronicBoard(id: string | number, qty: number, ref: string) {
  return axios.post<{ success: boolean; board: any }>(`${API_URL}/tenant/electronics/${id}/manufacture`, { qty, ref })
}

export function getElectronicsLogs(boardId?: string | number) {
  return axios.get<{ success: boolean; logs: any[] }>(`${API_URL}/tenant/electronics/logs`, {
    params: { boardId }
  })
}

// --- Dynamic Branches API Requests ---
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

// --- Dynamic Brands API Requests ---
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
