'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminApi } from '@/lib/backendApi'
import { useAuth } from '@/lib/authContext'
import { useI18n } from '@/lib/i18n'
import type { AdminCvDocument, AdminDashboardStats, AdminUser, PageResponse, UserRole } from '@/lib/types'

type UserFormState = {
  email: string
  password: string
  fullName: string
  phone: string
  role: UserRole
  isActive: boolean
  isEmailVerified: boolean
}

type CvFormState = {
  title: string
  templateId: string
  fileName: string
  downloadUrl: string
  atsScore: string
  jdTitle: string
  isPrimary: boolean
}

const EMPTY_USER_FORM: UserFormState = {
  email: '',
  password: '',
  fullName: '',
  phone: '',
  role: 'CANDIDATE',
  isActive: true,
  isEmailVerified: false,
}

const EMPTY_CV_FORM: CvFormState = {
  title: '',
  templateId: '',
  fileName: '',
  downloadUrl: '',
  atsScore: '',
  jdTitle: '',
  isPrimary: false,
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { locale } = useI18n()
  const [stats, setStats] = useState<AdminDashboardStats | null>(null)
  const [users, setUsers] = useState<PageResponse<AdminUser> | null>(null)
  const [cvDocs, setCvDocs] = useState<PageResponse<AdminCvDocument> | null>(null)
  const [tab, setTab] = useState<'users' | 'cvs'>('users')
  const [userQuery, setUserQuery] = useState('')
  const [cvQuery, setCvQuery] = useState('')
  const [userForm, setUserForm] = useState<UserFormState>(EMPTY_USER_FORM)
  const [cvForm, setCvForm] = useState<CvFormState>(EMPTY_CV_FORM)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [editingCv, setEditingCv] = useState<AdminCvDocument | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState('')

  const text = useMemo(() => (
    locale === 'vi'
      ? {
        title: 'Quản trị hệ thống',
        subtitle: 'Quản lý người dùng, thư viện CV và theo dõi số CV đã được tạo.',
        users: 'Người dùng',
        cvs: 'CV Library',
        refresh: 'Tải lại',
        createUser: 'Thêm người dùng',
        updateUser: 'Cập nhật người dùng',
        saveCv: 'Lưu chỉnh sửa CV',
        reset: 'Làm mới form',
        searchUsers: 'Tìm theo email hoặc tên',
        searchCvs: 'Tìm theo CV, JD hoặc người dùng',
        noUsers: 'Chưa có người dùng nào.',
        noCvs: 'Chưa có CV nào được lưu.',
        statsUsers: 'Tổng người dùng',
        statsCandidates: 'Candidates',
        statsAdmins: 'Admins',
        statsCv: 'Tổng CV',
        statsNewCv: 'CV 7 ngày qua',
        statsInactive: 'Tài khoản bị khóa',
        active: 'Đang hoạt động',
        inactive: 'Đã khóa',
        verified: 'Đã xác minh',
        notVerified: 'Chưa xác minh',
        edit: 'Sửa',
        delete: 'Xóa',
        cancelEdit: 'Bỏ chọn',
        role: 'Vai trò',
        email: 'Email',
        password: 'Mật khẩu',
        fullName: 'Họ tên',
        phone: 'Số điện thoại',
        titleField: 'Tiêu đề CV',
        template: 'Template',
        fileName: 'Tên file',
        downloadUrl: 'Link tải',
        atsScore: 'Điểm ATS',
        jdTitle: 'Tiêu đề JD',
        primary: 'CV chính',
        owner: 'Chủ sở hữu',
        createdAt: 'Tạo lúc',
        totalCv: 'Số CV',
        confirmDeleteUser: 'Xóa người dùng này?',
        confirmDeleteCv: 'Xóa CV này?',
        listUsers: 'Danh sách người dùng',
        listCvs: 'Danh sách CV',
        userEditor: 'Biểu mẫu người dùng',
        cvEditor: 'Biểu mẫu CV',
        createHint: 'Tạo candidate hoặc admin mới trực tiếp từ khu quản trị.',
        editHint: 'Chỉnh sửa metadata CV hoặc xóa CV lỗi khỏi hệ thống.',
        chooseCv: 'Chọn một CV để chỉnh sửa.',
      }
      : {
        title: 'System Administration',
        subtitle: 'Manage users, the CV library, and monitor how many CVs have been created.',
        users: 'Users',
        cvs: 'CV Library',
        refresh: 'Refresh',
        createUser: 'Create User',
        updateUser: 'Update User',
        saveCv: 'Save CV Changes',
        reset: 'Reset Form',
        searchUsers: 'Search by email or name',
        searchCvs: 'Search by CV, JD, or owner',
        noUsers: 'No users found.',
        noCvs: 'No CVs found.',
        statsUsers: 'Total Users',
        statsCandidates: 'Candidates',
        statsAdmins: 'Admins',
        statsCv: 'Total CVs',
        statsNewCv: 'CVs in 7 days',
        statsInactive: 'Inactive Users',
        active: 'Active',
        inactive: 'Inactive',
        verified: 'Verified',
        notVerified: 'Not Verified',
        edit: 'Edit',
        delete: 'Delete',
        cancelEdit: 'Clear Selection',
        role: 'Role',
        email: 'Email',
        password: 'Password',
        fullName: 'Full Name',
        phone: 'Phone',
        titleField: 'CV Title',
        template: 'Template',
        fileName: 'File Name',
        downloadUrl: 'Download URL',
        atsScore: 'ATS Score',
        jdTitle: 'JD Title',
        primary: 'Primary CV',
        owner: 'Owner',
        createdAt: 'Created At',
        totalCv: 'CV Count',
        confirmDeleteUser: 'Delete this user?',
        confirmDeleteCv: 'Delete this CV?',
        listUsers: 'User List',
        listCvs: 'CV List',
        userEditor: 'User Form',
        cvEditor: 'CV Form',
        createHint: 'Create candidate or admin accounts directly from the admin area.',
        editHint: 'Edit CV metadata or remove broken CVs from the system.',
        chooseCv: 'Select a CV to edit.',
      }
  ), [locale])

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace('/auth/login')
      return
    }
    if (user.role !== 'ADMIN') {
      router.replace('/dashboard/candidate')
      return
    }
    void loadAll()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, router])

  async function loadAll() {
    setLoadingData(true)
    setError('')
    try {
      const [statsData, userData, cvData] = await Promise.all([
        adminApi.getDashboardStats(),
        adminApi.getUsers(userQuery),
        adminApi.getCvDocuments(cvQuery),
      ])
      setStats(statsData)
      setUsers(userData)
      setCvDocs(cvData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admin data')
    } finally {
      setLoadingData(false)
    }
  }

  async function reloadUsers(query = userQuery) {
    const data = await adminApi.getUsers(query)
    setUsers(data)
  }

  async function reloadCvs(query = cvQuery) {
    const data = await adminApi.getCvDocuments(query)
    setCvDocs(data)
  }

  const handleEditUser = (item: AdminUser) => {
    setEditingUser(item)
    setUserForm({
      email: item.email,
      password: '',
      fullName: item.fullName,
      phone: item.phone ?? '',
      role: item.role,
      isActive: item.isActive,
      isEmailVerified: item.isEmailVerified,
    })
  }

  const handleEditCv = (item: AdminCvDocument) => {
    setEditingCv(item)
    setCvForm({
      title: item.title,
      templateId: item.templateId ?? '',
      fileName: item.fileName ?? '',
      downloadUrl: item.downloadUrl ?? '',
      atsScore: item.atsScore?.toString() ?? '',
      jdTitle: item.jdTitle ?? '',
      isPrimary: item.isPrimary,
    })
  }

  const resetUserForm = () => {
    setEditingUser(null)
    setUserForm(EMPTY_USER_FORM)
  }

  const resetCvForm = () => {
    setEditingCv(null)
    setCvForm(EMPTY_CV_FORM)
  }

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      if (editingUser) {
        await adminApi.updateUser(editingUser.id, {
          ...userForm,
          phone: userForm.phone || undefined,
          password: userForm.password || undefined,
        })
      } else {
        await adminApi.createUser({
          ...userForm,
          phone: userForm.phone || undefined,
        })
      }
      resetUserForm()
      await Promise.all([reloadUsers(), refreshStats()])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save user')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCvSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCv) return
    setSubmitting(true)
    setError('')
    try {
      await adminApi.updateCvDocument(editingCv.id, {
        title: cvForm.title,
        templateId: cvForm.templateId || undefined,
        fileName: cvForm.fileName || undefined,
        downloadUrl: cvForm.downloadUrl || undefined,
        atsScore: cvForm.atsScore ? Number(cvForm.atsScore) : undefined,
        jdTitle: cvForm.jdTitle || undefined,
        isPrimary: cvForm.isPrimary,
      })
      await Promise.all([reloadCvs(), refreshStats()])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save CV')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteUser = async (id: number) => {
    if (!window.confirm(text.confirmDeleteUser)) return
    try {
      await adminApi.deleteUser(id)
      if (editingUser?.id === id) resetUserForm()
      await Promise.all([reloadUsers(), refreshStats()])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user')
    }
  }

  const handleDeleteCv = async (id: number) => {
    if (!window.confirm(text.confirmDeleteCv)) return
    try {
      await adminApi.deleteCvDocument(id)
      if (editingCv?.id === id) resetCvForm()
      await Promise.all([reloadCvs(), refreshStats()])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete CV')
    }
  }

  const refreshStats = async () => {
    const data = await adminApi.getDashboardStats()
    setStats(data)
  }

  if (authLoading || loadingData || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Admin</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">{text.title}</h1>
          <p className="mt-2 max-w-3xl text-sm text-gray-500">{text.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={() => void loadAll()}
          className="rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition-colors hover:border-blue-300 hover:text-blue-700"
        >
          {text.refresh}
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {[
          { label: text.statsUsers, value: stats?.totalUsers ?? 0 },
          { label: text.statsCandidates, value: stats?.totalCandidates ?? 0 },
          { label: text.statsAdmins, value: stats?.totalAdmins ?? 0 },
          { label: text.statsCv, value: stats?.totalCvDocuments ?? 0 },
          { label: text.statsNewCv, value: stats?.cvsCreatedLast7Days ?? 0 },
          { label: text.statsInactive, value: stats?.inactiveUsers ?? 0 },
        ].map((item) => (
          <div key={item.label} className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="text-2xl font-bold text-gray-900">{item.value}</div>
            <div className="mt-1 text-xs font-medium uppercase tracking-wide text-gray-500">{item.label}</div>
          </div>
        ))}
      </div>

      <div className="mb-6 flex w-fit gap-1 rounded-2xl bg-gray-100 p-1">
        {(['users', 'cvs'] as const).map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setTab(name)}
            className={`rounded-2xl px-5 py-2.5 text-sm font-semibold transition-colors ${
              tab === name ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {name === 'users' ? text.users : text.cvs}
          </button>
        ))}
      </div>

      {tab === 'users' ? (
        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
          <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{text.listUsers}</h2>
                <p className="mt-1 text-sm text-gray-500">{text.createHint}</p>
              </div>
              <div className="flex gap-2">
                <input
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  placeholder={text.searchUsers}
                  className="min-w-0 rounded-2xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-blue-400"
                />
                <button
                  type="button"
                  onClick={() => void reloadUsers()}
                  className="rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  Search
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {users?.content.length ? users.content.map((item) => (
                <div key={item.id} className="rounded-3xl border border-gray-100 bg-gray-50/70 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-gray-900">{item.fullName}</h3>
                        <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">{item.role}</span>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {item.isActive ? text.active : text.inactive}
                        </span>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.isEmailVerified ? 'bg-violet-100 text-violet-700' : 'bg-gray-200 text-gray-700'}`}>
                          {item.isEmailVerified ? text.verified : text.notVerified}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-600">{item.email}</p>
                      {item.phone && <p className="mt-1 text-sm text-gray-500">{item.phone}</p>}
                      <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
                        <span>{text.totalCv}: <strong className="text-gray-800">{item.cvCount}</strong></span>
                        <span>{text.createdAt}: {formatDate(item.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditUser(item)}
                        className="rounded-2xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-blue-300 hover:text-blue-700"
                      >
                        {text.edit}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteUser(item.id)}
                        className="rounded-2xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
                      >
                        {text.delete}
                      </button>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="rounded-3xl border border-dashed border-gray-200 px-6 py-12 text-center text-sm text-gray-500">
                  {text.noUsers}
                </div>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{text.userEditor}</h2>
                <p className="mt-1 text-sm text-gray-500">{editingUser ? editingUser.email : text.createHint}</p>
              </div>
              <button
                type="button"
                onClick={resetUserForm}
                className="rounded-2xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600"
              >
                {text.reset}
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleUserSubmit}>
              <FormInput label={text.fullName} value={userForm.fullName} onChange={(value) => setUserForm(prev => ({ ...prev, fullName: value }))} required />
              <FormInput label={text.email} type="email" value={userForm.email} onChange={(value) => setUserForm(prev => ({ ...prev, email: value }))} required />
              <FormInput label={text.password} type="password" value={userForm.password} onChange={(value) => setUserForm(prev => ({ ...prev, password: value }))} placeholder={editingUser ? 'Leave blank to keep current password' : ''} required={!editingUser} />
              <FormInput label={text.phone} value={userForm.phone} onChange={(value) => setUserForm(prev => ({ ...prev, phone: value }))} />

              <label className="block text-sm font-medium text-gray-700">
                {text.role}
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value as UserRole }))}
                  className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-blue-400"
                >
                  <option value="CANDIDATE">CANDIDATE</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <ToggleField
                  label={text.active}
                  checked={userForm.isActive}
                  onChange={(checked) => setUserForm(prev => ({ ...prev, isActive: checked }))}
                />
                <ToggleField
                  label={text.verified}
                  checked={userForm.isEmailVerified}
                  onChange={(checked) => setUserForm(prev => ({ ...prev, isEmailVerified: checked }))}
                />
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
                >
                  {editingUser ? text.updateUser : text.createUser}
                </button>
                {editingUser && (
                  <button
                    type="button"
                    onClick={resetUserForm}
                    className="rounded-2xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-600"
                  >
                    {text.cancelEdit}
                  </button>
                )}
              </div>
            </form>
          </section>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
          <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{text.listCvs}</h2>
                <p className="mt-1 text-sm text-gray-500">{text.editHint}</p>
              </div>
              <div className="flex gap-2">
                <input
                  value={cvQuery}
                  onChange={(e) => setCvQuery(e.target.value)}
                  placeholder={text.searchCvs}
                  className="min-w-0 rounded-2xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-blue-400"
                />
                <button
                  type="button"
                  onClick={() => void reloadCvs()}
                  className="rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  Search
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {cvDocs?.content.length ? cvDocs.content.map((item) => (
                <div key={item.id} className="rounded-3xl border border-gray-100 bg-gray-50/70 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-gray-900">{item.title}</h3>
                        {item.isPrimary && (
                          <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700">{text.primary}</span>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-gray-600">{text.owner}: {item.userFullName} ({item.userEmail})</p>
                      {item.jdTitle && <p className="mt-1 text-sm text-gray-500">{text.jdTitle}: {item.jdTitle}</p>}
                      <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
                        <span>ATS: <strong className="text-gray-800">{item.atsScore ?? '-'}</strong></span>
                        <span>{text.template}: <strong className="text-gray-800">{item.templateId ?? '-'}</strong></span>
                        <span>{text.createdAt}: {formatDate(item.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditCv(item)}
                        className="rounded-2xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-blue-300 hover:text-blue-700"
                      >
                        {text.edit}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteCv(item.id)}
                        className="rounded-2xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
                      >
                        {text.delete}
                      </button>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="rounded-3xl border border-dashed border-gray-200 px-6 py-12 text-center text-sm text-gray-500">
                  {text.noCvs}
                </div>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{text.cvEditor}</h2>
                <p className="mt-1 text-sm text-gray-500">{editingCv ? `${editingCv.userEmail}` : text.chooseCv}</p>
              </div>
              <button
                type="button"
                onClick={resetCvForm}
                className="rounded-2xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600"
              >
                {text.reset}
              </button>
            </div>

            {editingCv ? (
              <form className="space-y-4" onSubmit={handleCvSubmit}>
                <FormInput label={text.titleField} value={cvForm.title} onChange={(value) => setCvForm(prev => ({ ...prev, title: value }))} />
                <FormInput label={text.template} value={cvForm.templateId} onChange={(value) => setCvForm(prev => ({ ...prev, templateId: value }))} />
                <FormInput label={text.fileName} value={cvForm.fileName} onChange={(value) => setCvForm(prev => ({ ...prev, fileName: value }))} />
                <FormInput label={text.downloadUrl} value={cvForm.downloadUrl} onChange={(value) => setCvForm(prev => ({ ...prev, downloadUrl: value }))} />
                <FormInput label={text.atsScore} type="number" value={cvForm.atsScore} onChange={(value) => setCvForm(prev => ({ ...prev, atsScore: value }))} />
                <FormInput label={text.jdTitle} value={cvForm.jdTitle} onChange={(value) => setCvForm(prev => ({ ...prev, jdTitle: value }))} />
                <ToggleField
                  label={text.primary}
                  checked={cvForm.isPrimary}
                  onChange={(checked) => setCvForm(prev => ({ ...prev, isPrimary: checked }))}
                />

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
                  >
                    {text.saveCv}
                  </button>
                  <button
                    type="button"
                    onClick={resetCvForm}
                    className="rounded-2xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-600"
                  >
                    {text.cancelEdit}
                  </button>
                </div>
              </form>
            ) : (
              <div className="rounded-3xl border border-dashed border-gray-200 px-6 py-12 text-center text-sm text-gray-500">
                {text.chooseCv}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

function FormInput({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
  required?: boolean
}) {
  return (
    <label className="block text-sm font-medium text-gray-700">
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-blue-400"
      />
    </label>
  )
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex items-center justify-between rounded-2xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4" />
    </label>
  )
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString()
}
