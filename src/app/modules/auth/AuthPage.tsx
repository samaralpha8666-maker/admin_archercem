import { Route, Routes } from 'react-router-dom'
import { Login } from './components/Login'
import { AuthLayout } from './AuthLayout'

const AuthPage = () => (
  <Routes>
    <Route element={<AuthLayout />}>
      <Route path='login' element={<Login isSuperRoute={false} />} />
      <Route path='superadmin' element={<Login isSuperRoute={true} />} />
      <Route index element={<Login isSuperRoute={false} />} />
    </Route>
  </Routes >
)

export { AuthPage }
