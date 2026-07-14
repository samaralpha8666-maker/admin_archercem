export interface AuthModel {
  api_token: string
  refreshToken?: string
  user?: UserModel
}

export interface UserAddressModel {
  addressLine: string
  city: string
  state: string
  postCode: string
}

export interface UserCommunicationModel {
  email: boolean
  sms: boolean
  phone: boolean
}

export interface UserEmailSettingsModel {
  emailNotification?: boolean
  sendCopyToPersonalEmail?: boolean
  activityRelatesEmail?: {
    youHaveNewNotifications?: boolean
    youAreSentADirectMessage?: boolean
    someoneAddsYouAsAsAConnection?: boolean
    uponNewOrder?: boolean
    newMembershipApproval?: boolean
    memberRegistration?: boolean
  }
  updatesFromKeenthemes?: {
    newsAboutKeenthemesProductsAndFeatureUpdates?: boolean
    tipsOnGettingMoreOutOfKeen?: boolean
    thingsYouMissedSindeYouLastLoggedIntoKeen?: boolean
    newsAboutPartnerProductsAndOtherServices?: boolean
    tipsOnStartBusinessProducts?: boolean
  }
}

export interface UserSocialNetworksModel {
  linkedIn: string
  facebook: string
  twitter: string
  instagram: string
}

export interface UserModel {
  id: number
  name: string
  email: string
  role: 'super_admin' | 'admin' | 'manager' | 'staff' | string
  gemini_api_key?: string
  openai_api_key?: string
  grok_api_key?: string
  permissions?: string[]
  schoolId?: number
  school_name?: string
  school_logo?: string
  school_code?: string
  institution_type?: 'SCHOOL' | 'COLLEGE' | 'COACHING' | string
  is_area_wise?: boolean
  username?: string
  password?: string
  first_name?: string
  last_name?: string
  fullname?: string
  occupation?: string
  companyName?: string
  phone?: string
  roles?: Array<number>
  pic?: string
  profile_image?: string
  language?: 'en' | 'de' | 'es' | 'fr' | 'ja' | 'zh' | 'ru'
  timeZone?: string
  website?: string
  emailSettings?: UserEmailSettingsModel
  auth?: AuthModel
  communication?: UserCommunicationModel
  address?: UserAddressModel
  socialNetworks?: UserSocialNetworksModel
  enrollment?: {
    class?: string
    section?: string
    roll_number?: string | number
  }
}

export interface SchoolModel {
  id: number
  code: string
  name: string
  subdomain: string
  institution_type?: 'SCHOOL' | 'COLLEGE' | 'COACHING' | string
  is_area_wise?: boolean
  db_host?: string
  db_port?: number
  db_username?: string
  db_password?: string
  schema?: string
  database?: string
  app_url?: string
  is_active: boolean
  setup_completed: boolean
  createdAt?: string
  principalName?: string
  phone?: string
  email?: string
  address?: string
  logoPath?: string
  bannerPath?: string
  establishedYear?: string | number
  gemini_api_key?: string
  openai_api_key?: string
  grok_api_key?: string
  latitude?: string | number
  interview_questions?: boolean
  interview_schedule?: boolean
  certifications?: boolean
  longitude?: string | number
  geofence_radius?: string | number
  enable_geofence?: boolean
}

export interface SchoolCreationData {
  code: string
  name: string
  subdomain: string
  institution_type?: 'SCHOOL' | 'COLLEGE' | 'COACHING' | string
  is_area_wise?: boolean
  db_name: string
  db_host: string
  db_port: number
  db_username: string
  db_password: string
  address: string
  phone: string
  email: string
  logoPath?: string
  gemini_api_key?: string
  openai_api_key?: string
  grok_api_key?: string
  latitude?: string | number
  longitude?: string | number
  geofence_radius?: string | number
  enable_geofence?: boolean
}

export interface SchoolResponse {
  success: boolean
  message: string
  data: {
    school: SchoolModel
  }
}

export interface LoginResponse {
  success: boolean
  message: string
  data: {
    token: string
    user?: UserModel
    admin?: UserModel
    student?: UserModel
    parent?: UserModel
    linkedStudents?: UserModel[]
  }
}

export interface SchoolsListResponse {
  success: boolean
  message: string
  data: {
    schools: SchoolModel[]
  }
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

export interface ProfessionModel {
  id: number
  name: string
  description?: string
  category: "teaching" | "administrative" | "support" | "technical" | "other" | string
  is_active: boolean
  created_by?: number | null
  createdAt?: string
  updatedAt?: string
}

export interface ProfessionCreationData {
  name: string
  description?: string
  category: string
  is_active?: boolean
}

export interface ProfessionResponse {
  success: boolean
  message: string
  data: {
    profession?: ProfessionModel
  }
}

export interface ProfessionsListResponse {
  success: boolean
  message: string
  data: {
    professions: ProfessionModel[]
  }
  pagination?: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

export interface StaffModel {
  id: number
  name: string
  email: string
  role: string
  is_active: boolean
  profession_id?: number | null
  createdAt?: string
  updatedAt?: string
  permissions?: string[]
}

export interface StaffCreationData {
  name: string
  email: string
  password?: string
  role: string
  profession_id?: number
  is_active?: boolean
}

export interface StaffResponse {
  success: boolean
  message: string
  data: {
    staff?: StaffModel
    admin?: StaffModel
  }
}

export interface StaffListResponse {
  success: boolean
  message: string
  data: {
    staff: StaffModel[]
  }
  pagination?: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

export interface LeadModel {
  id: number
  type: 'DEMO' | 'SUPPORT'
  name: string
  email: string
  phone?: string | null
  school_name?: string | null
  student_strength?: string | null
  demo_date?: string | null
  subject?: string | null
  priority?: string | null
  message?: string | null
  status: 'PENDING' | 'CONTACTED' | 'RESOLVED'
  createdAt: string
  updatedAt: string
}

export interface LeadsListResponse {
  success: boolean
  message: string
  data: {
    leads: LeadModel[]
    total: number
  }
}

export interface BlogModel {
  id: number
  title: string
  slug: string
  content: string
  summary?: string | null
  featured_image?: string | null
  meta_title?: string | null
  meta_description?: string | null
  keywords?: string | null
  status: 'DRAFT' | 'PUBLISHED'
  author?: string
  publishedAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface BlogsListResponse {
  success: boolean
  message: string
  data: {
    blogs: BlogModel[]
    total: number
  }
}

export interface AIBlogGenerationResponse {
  success: boolean
  message: string
  data: {
    title: string
    summary: string
    content: string
    meta_title: string
    meta_description: string
    keywords: string
  }
}
