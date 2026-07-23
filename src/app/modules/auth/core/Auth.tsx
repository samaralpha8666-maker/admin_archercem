/* eslint-disable react-refresh/only-export-components */
import { FC, useState, useEffect, createContext, useContext, Dispatch, SetStateAction } from 'react'
import { LayoutSplashScreen } from '../../../../_metronic/layout/core'
import { AuthModel, UserModel } from './_models'
import * as authHelper from './AuthHelpers'
import { getUserByToken } from './_requests'
import { WithChildren } from '../../../../_metronic/helpers'

type AuthContextProps = {
  auth: AuthModel | undefined
  saveAuth: (auth: AuthModel | undefined, linkedStudentsData?: UserModel[]) => void
  currentUser: UserModel | undefined
  setCurrentUser: Dispatch<SetStateAction<UserModel | undefined>>
  logout: () => void
  linkedStudents: UserModel[]
  selectedStudent: UserModel | undefined
  selectStudent: (student: UserModel) => void
  setLinkedStudents: Dispatch<SetStateAction<UserModel[]>>
  setSelectedStudent: Dispatch<SetStateAction<UserModel | undefined>>
}

const initAuthContextPropsState = {
  auth: authHelper.getAuth(),
  saveAuth: () => { },
  currentUser: authHelper.getAuth()?.user || undefined,
  setCurrentUser: () => { },
  logout: () => { },
  linkedStudents: [],
  selectedStudent: undefined,
  selectStudent: () => { },
  setLinkedStudents: () => { },
  setSelectedStudent: () => { },
}

const AuthContext = createContext<AuthContextProps>(initAuthContextPropsState)

const useAuth = () => {
  return useContext(AuthContext)
}

const AuthProvider: FC<WithChildren> = ({ children }) => {
  const [auth, setAuth] = useState<AuthModel | undefined>(authHelper.getAuth())
  const [currentUser, setCurrentUser] = useState<UserModel | undefined>(authHelper.getAuth()?.user || undefined)
  const [linkedStudents, setLinkedStudents] = useState<UserModel[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('kt-auth-linked-students') || '[]')
    } catch {
      return []
    }
  })
  const [selectedStudent, setSelectedStudent] = useState<UserModel | undefined>(() => {
    try {
      const stored = localStorage.getItem('kt-auth-selected-student')
      return stored ? JSON.parse(stored) : undefined
    } catch {
      return undefined
    }
  })

  // ── Dynamic tab title + favicon based on logged-in company ──
  useEffect(() => {
    const defaultTitle = 'Archerchem Instruments'
    const defaultFavicon = '/media/logos/archerchem-favicon.png'

    if (currentUser?.school_name) {
      // Company admin logged in — show company name
      document.title = `${currentUser.school_name} | Archerchem`

      // Update favicon to company logo if available, else keep default favicon
      const faviconHref = currentUser.school_logo || defaultFavicon
      updateFavicon(faviconHref)
    } else if (currentUser?.role === 'super_admin') {
      document.title = 'Super Admin | Archerchem'
      updateFavicon(defaultFavicon)
    } else {
      document.title = defaultTitle
      updateFavicon(defaultFavicon)
    }
  }, [currentUser])

  const saveAuth = (auth: AuthModel | undefined, linkedStudentsData?: UserModel[]) => {
    setAuth(auth)
    if (auth) {
      if (auth.user) {
        setCurrentUser(auth.user)
      }
      authHelper.setAuth(auth)
      if (linkedStudentsData) {
        setLinkedStudents(linkedStudentsData)
        localStorage.setItem('kt-auth-linked-students', JSON.stringify(linkedStudentsData))
        if (linkedStudentsData.length > 0) {
          const defaultStudent = linkedStudentsData[0]
          setSelectedStudent(defaultStudent)
          localStorage.setItem('kt-auth-selected-student', JSON.stringify(defaultStudent))
          localStorage.setItem('kt-auth-selected-student-id', defaultStudent.id.toString())
        }
      }
    } else {
      authHelper.removeAuth()
      setCurrentUser(undefined)
      setLinkedStudents([])
      setSelectedStudent(undefined)
      localStorage.removeItem('kt-auth-linked-students')
      localStorage.removeItem('kt-auth-selected-student')
      localStorage.removeItem('kt-auth-selected-student-id')
      localStorage.removeItem('selected_company')
    }
  }

  const logout = () => {
    saveAuth(undefined)
  }

  const selectStudent = (student: UserModel) => {
    setSelectedStudent(student)
    localStorage.setItem('kt-auth-selected-student', JSON.stringify(student))
    localStorage.setItem('kt-auth-selected-student-id', student.id.toString())
    window.location.reload()
  }

  return (
    <AuthContext.Provider value={{ auth, saveAuth, currentUser, setCurrentUser, logout, linkedStudents, selectedStudent, selectStudent, setLinkedStudents, setSelectedStudent }}>
      {children}
    </AuthContext.Provider>
  )
}

/** Helper: swap out the <link rel="icon"> href dynamically */
function updateFavicon(href: string) {
  // Remove all existing favicon links
  const existing = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]')
  existing.forEach((el) => el.parentNode?.removeChild(el))

  // Create new favicon link
  const link = document.createElement('link')
  link.rel = 'icon'
  link.type = href.endsWith('.svg') ? 'image/svg+xml' : 'image/png'
  link.href = href
  document.head.appendChild(link)
}


const AuthInit: FC<WithChildren> = ({ children }) => {
  const { auth, currentUser, logout, setCurrentUser, setLinkedStudents, setSelectedStudent } = useAuth()
  const [showSplashScreen, setShowSplashScreen] = useState(true)

  // We should request user by authToken (IN OUR EXAMPLE IT'S API_TOKEN) before rendering the application
  useEffect(() => {
    const requestUser = async (apiToken: string) => {
      try {
        if (!currentUser) {
          const { data: response } = await getUserByToken(apiToken)
          if (response && response.success && response.data) {
            const user = response.data.user || response.data.admin
            if (user) {
              setCurrentUser(user)
            } else {
              logout()
            }
          } else {
            logout()
          }
        }
      } catch (error) {
        console.error(error)
        logout()
      } finally {
        setShowSplashScreen(false)
      }
    }

    if (auth && auth.api_token) {
      if (currentUser) {
        setShowSplashScreen(false)
      } else {
        requestUser(auth.api_token)
      }
    } else {
      logout()
      setShowSplashScreen(false)
    }
    // eslint-disable-next-line
  }, [])

  return showSplashScreen ? <LayoutSplashScreen /> : <>{children}</>
}

export { AuthProvider, AuthInit, useAuth }
