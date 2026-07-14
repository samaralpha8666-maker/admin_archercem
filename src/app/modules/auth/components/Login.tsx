import { useState, useCallback } from 'react'
import * as Yup from 'yup'
import clsx from 'clsx'
import { useFormik } from 'formik'
import AsyncSelect from 'react-select/async'
import { login, getSchools } from '../core/_requests'
import { AuthModel } from '../core/_models'
import { useAuth } from '../core/Auth'
import { toAbsoluteUrl } from '../../../../_metronic/helpers'

const loginSchema = Yup.object().shape({
  email: Yup.string()
    .min(3, 'Minimum 3 symbols')
    .max(50, 'Maximum 50 symbols')
    .required('Email or Mobile Number is required'),
  password: Yup.string()
    .min(3, 'Minimum 3 symbols')
    .max(50, 'Maximum 50 symbols')
    .required('Password is required'),
  schoolId: Yup.string().when('loginType', {
    is: (val: any) => val === 'admin' || val === 'student' || val === 'parent',
    then: (schema) => schema.required('School is required'),
  }),
})

export interface LoginProps {
  isSuperRoute?: boolean
}

export function Login({ isSuperRoute = false }: LoginProps) {
  // Load saved school from localStorage on initialization
  const getSavedSchool = () => {
    const saved = localStorage.getItem('selected_school')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        console.error('Failed to parse saved school', e)
        return null
      }
    }
    return null
  }

  const savedSchool = getSavedSchool()

  const [loading, setLoading] = useState(false)
  const [loginType, setLoginType] = useState<'super_admin' | 'admin' | 'student' | 'parent'>(isSuperRoute ? 'super_admin' : 'admin')
  const [showPassword, setShowPassword] = useState(false)
  const [selectedSchoolLogo, setSelectedSchoolLogo] = useState<string | null>(savedSchool?.logo || null)
  const [selectedSchoolName, setSelectedSchoolName] = useState<string | null>(savedSchool?.name || null)
  const { saveAuth, setCurrentUser } = useAuth()

  const loadSchoolOptions = useCallback(async (inputValue: string) => {
    try {
      const response = await getSchools(1, 10, inputValue, true)
      if (response?.data?.data?.schools) {
        return response.data.data.schools.map((school: any) => ({
          value: school.id,
          label: `${school.name} (${school.code})`,
          logo: school.logoPath || null,
          name: school.name,
        }))
      }
      return []
    } catch (error) {
      console.error('Error fetching schools', error)
      return []
    }
  }, [])

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
      schoolId: savedSchool?.id || '',
      loginType: (isSuperRoute ? 'super_admin' : 'admin') as 'super_admin' | 'admin' | 'student' | 'parent',
    },
    validationSchema: loginSchema,
    onSubmit: async (values, { setStatus, setSubmitting }) => {
      setLoading(true)
      try {
        const { data: response } = await login(values.email, values.password, values.loginType, values.schoolId)
        if (response.success) {
          const user = response.data.user || response.data.admin || response.data.parent || (response.data.student ? { ...response.data.student, role: 'student' } : undefined)
          const auth: AuthModel = { api_token: response.data.token, user }
          saveAuth(auth, response.data.linkedStudents)
          if (user) setCurrentUser(user)
        } else {
          saveAuth(undefined)
          setStatus(response.message || 'Invalid credentials. Please try again.')
          setSubmitting(false)
          setLoading(false)
        }
      } catch (error) {
        console.error(error)
        saveAuth(undefined)
        setStatus('Something went wrong. Please try again.')
        setSubmitting(false)
        setLoading(false)
      }
    },
  })

  // react-select styles that mirror Metronic's form-control look using CSS variables
  const selectStyles = {
    control: (base: any, state: any) => ({
      ...base,
      backgroundColor: 'var(--kt-input-bg)',
      borderColor:
        formik.touched.schoolId && formik.errors.schoolId
          ? 'var(--kt-danger)'
          : state.isFocused
            ? 'var(--kt-primary)'
            : 'var(--kt-input-border-color)',
      borderRadius: '0.475rem',
      padding: '0.1rem 0.25rem',
      minHeight: '43.59px',
      boxShadow: state.isFocused
        ? '0 0 0 0.25rem color-mix(in srgb, var(--kt-primary) 25%, transparent)'
        : 'none',
      transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
      '&:hover': { borderColor: 'var(--kt-primary)' },
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: 'var(--kt-dropdown-bg, #fff)',
      border: '1px solid var(--kt-dropdown-border-color, #eff2f5)',
      borderRadius: '0.475rem',
      boxShadow: 'var(--kt-dropdown-box-shadow, 0px 0px 50px 0px rgba(82,63,105,0.15))',
      zIndex: 9999,
    }),
    menuList: (base: any) => ({ ...base, padding: '0.5rem 0' }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected
        ? 'var(--kt-primary)'
        : state.isFocused
          ? 'var(--kt-component-hover-bg, #f9f9f9)'
          : 'transparent',
      color: state.isSelected ? '#fff' : 'var(--kt-input-color)',
      padding: '0.65rem 1rem',
      fontSize: '1rem',
      cursor: 'pointer',
    }),
    singleValue: (base: any) => ({
      ...base,
      color: 'var(--kt-input-color)',
      fontSize: '1rem',
    }),
    placeholder: (base: any) => ({
      ...base,
      color: 'var(--kt-input-placeholder-color)',
      fontSize: '1rem',
    }),
    input: (base: any) => ({ ...base, color: 'var(--kt-input-color)' }),
    indicatorSeparator: () => ({ display: 'none' }),
    dropdownIndicator: (base: any) => ({
      ...base,
      color: 'var(--kt-gray-500)',
      '&:hover': { color: 'var(--kt-gray-700)' },
    }),
    loadingMessage: (base: any) => ({
      ...base,
      color: 'var(--kt-text-muted)',
      fontSize: '0.9rem',
    }),
    noOptionsMessage: (base: any) => ({
      ...base,
      color: 'var(--kt-text-muted)',
      fontSize: '0.9rem',
    }),
  }

  return (
    <form
      className='form w-100'
      onSubmit={formik.handleSubmit}
      noValidate
      id='kt_login_signin_form'
    >
      {/* ── Heading ── */}
      <div className='text-center mb-11'>
        <div className='d-flex justify-content-center mb-5'>
          <img
            alt={selectedSchoolName || 'apnacampus'}
            src={selectedSchoolLogo || toAbsoluteUrl('media/logos/apnacampus.svg')}
            style={{
              height: selectedSchoolLogo ? '160px' : '70px',
              width: 'auto',
              borderRadius: selectedSchoolLogo ? '8px' : '0',
              objectFit: 'contain',
              transition: 'all 0.3s ease',
            }}
          />
        </div>
        <h1 className='text-gray-900 fw-bolder mb-2' style={{ fontSize: '1.9rem', letterSpacing: '-0.5px' }}>
          {selectedSchoolName ? selectedSchoolName : 'Welcome back'}
        </h1>
        <div className='text-gray-500 fw-semibold fs-6'>
          {selectedSchoolName ? 'School Admin Portal' : 'apnacampus School Portal'}
        </div>
      </div>

      {/* ── Status / Info Banner ── */}
      {formik.status ? (
        <div className='alert alert-danger d-flex align-items-center gap-3 mb-8 py-4 px-5 rounded-3'>
          <i className='ki-duotone ki-information-5 fs-2hx text-danger flex-shrink-0'>
            <span className='path1'></span>
            <span className='path2'></span>
            <span className='path3'></span>
          </i>
          <div>
            <div className='fw-bold fs-6 text-danger'>Login Failed</div>
            <div className='fw-semibold fs-7'>{formik.status}</div>
          </div>
        </div>
      ) : (
        <div
          className='notice d-flex bg-light-primary rounded-3 border border-primary border-dashed mb-9 p-4'
        >
          <i className='ki-duotone ki-information fs-2tx text-primary me-4 flex-shrink-0'>
            <span className='path1'></span>
            <span className='path2'></span>
            <span className='path3'></span>
          </i>
          <div className='d-flex flex-stack flex-grow-1'>
            <div className='fw-semibold'>
              <div className='fs-7 text-gray-700'>
                Use{' '}
                <span className='fw-bolder text-gray-900'>
                  {isSuperRoute ? 'admin@myapp.com' : 'admin@sunbeam.com'}
                </span>{' '}
                 to sign in as {isSuperRoute ? 'Super Admin' : 'School Staff / Teacher'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── School Selector (School Admin only) ── */}
      {loginType === 'admin' && (
        <div className='fv-row mb-8'>
          <label className='form-label fs-6 fw-bold text-gray-900 required'>
            Select School
          </label>
          <AsyncSelect
            cacheOptions
            defaultOptions
            loadOptions={loadSchoolOptions}
            placeholder='Search school by name or code...'
            value={formik.values.schoolId ? {
              value: formik.values.schoolId,
              label: selectedSchoolName || '',
              logo: selectedSchoolLogo,
              name: selectedSchoolName
            } : null}
            onChange={(option: any) => {
              if (option) {
                formik.setFieldValue('schoolId', option.value.toString())
                setSelectedSchoolLogo(option.logo || null)
                setSelectedSchoolName(option.name || null)
                localStorage.setItem('selected_school', JSON.stringify({
                  id: option.value.toString(),
                  logo: option.logo || null,
                  name: option.name || null
                }))
              } else {
                formik.setFieldValue('schoolId', '')
                setSelectedSchoolLogo(null)
                setSelectedSchoolName(null)
                localStorage.removeItem('selected_school')
              }
            }}
            onBlur={() => formik.setFieldTouched('schoolId', true)}
            styles={selectStyles}
          />
          {formik.touched.schoolId && formik.errors.schoolId && (
            <div className='fv-plugins-message-container mt-2'>
              <div className='fv-help-block d-flex align-items-center gap-1'>
                <i className='ki-duotone ki-information-5 fs-6 text-danger'>
                  <span className='path1'></span>
                  <span className='path2'></span>
                  <span className='path3'></span>
                </i>
                <span role='alert' className='text-danger fw-semibold fs-7'>
                  {formik.errors.schoolId as string}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Email ── */}
      <div className='fv-row mb-8'>
        <label className='form-label fw-bold text-gray-900 fs-6 required'>
          {loginType === 'super_admin' ? 'Email Address' : 'Email Address / Mobile Number'}
        </label>
        <div className='position-relative'>
          <input
            type='text'
            placeholder={loginType === 'super_admin' ? 'Enter your email' : 'Enter email or mobile number'}
            autoComplete='off'
            {...formik.getFieldProps('email')}
            className={clsx(
              'form-control bg-transparent pe-10',
              { 'is-invalid': formik.touched.email && formik.errors.email },
              { 'is-valid': formik.touched.email && !formik.errors.email }
            )}
          />
          {/* Trailing state icon */}
          <span
            className='position-absolute top-50 end-0 translate-middle-y pe-3'
            style={{ pointerEvents: 'none' }}
          >
            {formik.touched.email && formik.errors.email ? (
              <i className='ki-duotone ki-cross-circle fs-3 text-danger'>
                <span className='path1'></span>
                <span className='path2'></span>
              </i>
            ) : formik.touched.email && !formik.errors.email ? (
              <i className='ki-duotone ki-check-circle fs-3 text-success'>
                <span className='path1'></span>
                <span className='path2'></span>
              </i>
            ) : (
              <i className='ki-duotone ki-sms fs-3 text-gray-400'>
                <span className='path1'></span>
                <span className='path2'></span>
              </i>
            )}
          </span>
        </div>
        {formik.touched.email && formik.errors.email && (
          <div className='fv-plugins-message-container mt-2'>
            <div className='fv-help-block d-flex align-items-center gap-1'>
              <i className='ki-duotone ki-information-5 fs-6 text-danger'>
                <span className='path1'></span>
                <span className='path2'></span>
                <span className='path3'></span>
              </i>
              <span role='alert' className='text-danger fw-semibold fs-7'>
                {formik.errors.email}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Password ── */}
      <div className='fv-row mb-3'>
        <label className='form-label fw-bold text-gray-900 fs-6 required'>Password</label>
        <div className='position-relative'>
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder='Enter your password'
            autoComplete='off'
            {...formik.getFieldProps('password')}
            className={clsx(
              'form-control bg-transparent pe-10',
              { 'is-invalid': formik.touched.password && formik.errors.password },
              { 'is-valid': formik.touched.password && !formik.errors.password }
            )}
          />
          {/* Show / Hide password toggle */}
          <span
            className='position-absolute top-50 end-0 translate-middle-y pe-3 cursor-pointer'
            onClick={() => setShowPassword((v) => !v)}
            title={showPassword ? 'Hide password' : 'Show password'}
            style={{ zIndex: 5 }}
          >
            {showPassword ? (
              <i className='ki-duotone ki-eye-slash fs-3 text-gray-400'>
                <span className='path1'></span>
                <span className='path2'></span>
                <span className='path3'></span>
                <span className='path4'></span>
              </i>
            ) : (
              <i className='ki-duotone ki-eye fs-3 text-gray-400'>
                <span className='path1'></span>
                <span className='path2'></span>
                <span className='path3'></span>
              </i>
            )}
          </span>
        </div>
        {formik.touched.password && formik.errors.password && (
          <div className='fv-plugins-message-container mt-2'>
            <div className='fv-help-block d-flex align-items-center gap-1'>
              <i className='ki-duotone ki-information-5 fs-6 text-danger'>
                <span className='path1'></span>
                <span className='path2'></span>
                <span className='path3'></span>
              </i>
              <span role='alert' className='text-danger fw-semibold fs-7'>
                {formik.errors.password}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Submit ── */}
      <div className='d-grid mb-10 mt-8'>
        <button
          type='submit'
          id='kt_sign_in_submit'
          className='btn btn-primary py-3 fs-6 fw-bolder'
          disabled={formik.isSubmitting || !formik.isValid}
        >
          {loading ? (
            <span className='indicator-progress d-flex align-items-center justify-content-center gap-2'>
              <span className='spinner-border spinner-border-sm align-middle'></span>
              Signing in...
            </span>
          ) : (
            <span className='indicator-label d-flex align-items-center justify-content-center gap-2'>
              Sign In
              <i className='ki-duotone ki-arrow-right fs-4'>
                <span className='path1'></span>
                <span className='path2'></span>
              </i>
            </span>
          )}
        </button>
      </div>

      {/* ── Footer note ── */}
      <div className='text-center'>
        <span className='text-muted fw-semibold fs-8 text-uppercase ls-1'>
          Secure access · EduAdmin portal
        </span>
      </div>
    </form>
  )
}