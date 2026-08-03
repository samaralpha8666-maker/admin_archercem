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
  role: 'super_admin' | 'admin' | 'manager' | 'rnd' | 'service' | 'accounts' | 'store' | 'custom' | string
  department?: string
  is_active?: boolean
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

export interface LoginResponse {
  success: boolean
  message: string
  token: string
  user?: UserModel
  admin?: UserModel
  linkedStudents?: UserModel[]
  data?: {
    user?: UserModel
    admin?: UserModel
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

export interface TenantModel {
  id: number
  name: string
  subdomain: string
  schema_name?: string
  is_active?: boolean
  settings?: any
  createdAt?: string
  updatedAt?: string
}

export interface TenantCreationData {
  name: string
  subdomain: string
  settings?: any
  adminName?: string
  adminEmail?: string
  adminPassword?: string
  logo?: string
}

export interface DocumentModel {
  id: number
  title: string
  content?: string
  created_by_id?: number
  createdAt?: string
  updatedAt?: string
  creator?: {
    id: number
    name: string
    email: string
  }
}

