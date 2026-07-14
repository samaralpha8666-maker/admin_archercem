import axios from 'axios'
import { AuthModel, UserModel, LoginResponse, SchoolCreationData, SchoolModel, SchoolResponse, SchoolsListResponse, ProfessionModel, ProfessionCreationData, ProfessionResponse, ProfessionsListResponse, StaffModel, StaffCreationData, StaffResponse, StaffListResponse, LeadModel, LeadsListResponse, BlogModel, BlogsListResponse, AIBlogGenerationResponse } from './_models'

const API_URL = import.meta.env.VITE_APP_API_URL

export const LOGIN_URL = `${API_URL}/login`
export const SUPERADMIN_LOGIN_URL = `${API_URL}/admin/login`
export const GET_USER_BY_TOKEN_URL = `${API_URL}/verify_token`
export const CREATE_SCHOOL_URL = `${API_URL}/admin/schools`
export const GET_SCHOOLS_URL = `${API_URL}/admin/schools`
export const SCHOOL_URL = (id: string | number) => `${API_URL}/admin/schools/${id}`

export const GET_PROFESSIONS_URL = (schoolId: string | number) => `${API_URL}/school/${schoolId}/professions`
export const PROFESSION_URL = (schoolId: string | number, id: string | number) => `${API_URL}/school/${schoolId}/professions/${id}`

export const GET_STAFF_URL = (schoolId: string | number) => `${API_URL}/school/${schoolId}/administration`
export const STAFF_URL = (schoolId: string | number, id: string | number) => `${API_URL}/school/${schoolId}/administration/${id}`

export function login(email: string, password: string, role: string = 'admin', schoolId?: string) {
  let url = role === 'super_admin' 
    ? SUPERADMIN_LOGIN_URL 
    : role === 'student'
      ? `${API_URL}/school/${schoolId}/student-login`
      : role === 'parent'
        ? `${API_URL}/school/${schoolId}/parent-login`
        : `${API_URL}/school/${schoolId}/login`

  const payload = role === 'parent' ? { username: email, password } : { email, password };

  return axios.post<LoginResponse>(url, payload)
}

export function createSchool(schoolData: SchoolCreationData) {
  return axios.post<SchoolResponse>(CREATE_SCHOOL_URL, schoolData)
}

export function getSchools(page: number, limit: number, search: string = '', isActive: boolean = true) {
  return axios.get<SchoolsListResponse>(GET_SCHOOLS_URL, {
    params: {
      page,
      limit,
      search,
      is_active: isActive
    }
  })
}

export function updateSchool(id: string | number, schoolData: Partial<SchoolCreationData> | FormData) {
  return axios.put<SchoolResponse>(SCHOOL_URL(id), schoolData);
}

export function getSchoolById(id: string | number) {
  return axios.get<SchoolResponse>(SCHOOL_URL(id));
}


export function toggleSchoolStatus(id: string | number) {
  return axios.patch<SchoolResponse>(`${SCHOOL_URL(id)}/toggle-status`)
}

export function deleteSchool(id: string | number, permanent: boolean = false) {
  return axios.delete(SCHOOL_URL(id), { params: { permanent } })
}

// Server should return AuthModel
export function register(
  email: string,
  firstname: string,
  lastname: string,
  password: string,
  password_confirmation: string
) {
  // Mock registration or throw error since we are removing it
  return new Promise((_, reject) => {
    reject(new Error("Registration is disabled"))
  })
}

// Server should return object => { result: boolean } (Is Email in DB)
export function requestPassword(email: string) {
  return new Promise((_, reject) => {
    reject(new Error("Forgot Password is disabled"))
  })
}

export function getUserByToken(token: string) {
  return axios.get<LoginResponse>(GET_USER_BY_TOKEN_URL, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
}

// --- Profession Requests ---
export function getProfessions(schoolId: string | number) {
  return axios.get<ProfessionsListResponse>(GET_PROFESSIONS_URL(schoolId))
}

export function createProfession(schoolId: string | number, data: ProfessionCreationData) {
  return axios.post<ProfessionResponse>(GET_PROFESSIONS_URL(schoolId), data)
}

export function updateProfession(schoolId: string | number, id: string | number, data: Partial<ProfessionCreationData>) {
  return axios.put<ProfessionResponse>(PROFESSION_URL(schoolId, id), data)
}

export function toggleProfessionStatus(schoolId: string | number, id: string | number) {
  return axios.patch<ProfessionResponse>(`${PROFESSION_URL(schoolId, id)}/toggle-status`)
}

export function deleteProfession(schoolId: string | number, id: string | number) {
  return axios.delete(PROFESSION_URL(schoolId, id))
}

// --- Staff Requests ---
export function getSchoolStaff(schoolId: string | number, page: number = 1, limit: number = 10,) {
  return axios.get<StaffListResponse>(GET_STAFF_URL(schoolId), {
    params: { page, limit, }
  })
}

export function createSchoolStaff(schoolId: string | number, data: StaffCreationData, imageFile?: File | null) {
  const formData = new FormData();
  Object.keys(data).forEach(key => {
    if (key === 'permissions' && Array.isArray((data as any)[key])) {
      (data as any)[key].forEach((p: string) => formData.append('permissions[]', p));
    } else if ((data as any)[key] !== undefined && (data as any)[key] !== null) {
      formData.append(key, (data as any)[key]);
    }
  });
  if (imageFile) {
    formData.append('profile_image', imageFile);
  }

  return axios.post<StaffResponse>(GET_STAFF_URL(schoolId), formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}

export function updateSchoolStaff(schoolId: string | number, id: string | number, data: Partial<StaffCreationData>, imageFile?: File | null) {
  const formData = new FormData();
  Object.keys(data).forEach(key => {
    if (key === 'permissions' && Array.isArray((data as any)[key])) {
      (data as any)[key].forEach((p: string) => formData.append('permissions[]', p));
    } else if ((data as any)[key] !== undefined && (data as any)[key] !== null) {
      formData.append(key, (data as any)[key]);
    }
  });
  if (imageFile) {
    formData.append('profile_image', imageFile);
  }

  return axios.put<StaffResponse>(STAFF_URL(schoolId, id), formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}

export function updateStaffPermissions(schoolId: string | number, id: string | number, permissions: string[]) {
  return axios.patch<StaffResponse>(`${STAFF_URL(schoolId, id)}/permissions`, { permissions })
}

export function toggleStaffStatus(schoolId: string | number, id: string | number) {
  return axios.patch<StaffResponse>(`${STAFF_URL(schoolId, id)}/toggle-status`)
}

export function deleteSchoolStaff(schoolId: string | number, id: string | number) {
  return axios.delete(STAFF_URL(schoolId, id))
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

