'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminApi } from '@/lib/backendApi'
import { useAuth } from '@/lib/authContext'
import { useI18n } from '@/lib/i18n'
import type { CvTemplate, AdminDashboardStats, AdminUser, PageResponse, UserRole } from '@/lib/types'

type UserFormState = {
  role: UserRole
  isActive: boolean
}

const EMPTY_USER_FORM: UserFormState = {
  role: 'CANDIDATE',
  isActive: true,
}


export default function AdminDashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { locale } = useI18n()
  const [stats, setStats] = useState<AdminDashboardStats | null>(null)
  const [users, setUsers] = useState<PageResponse<AdminUser> | null>(null)
  const [cvTemplates, setCvTemplates] = useState<PageResponse<CvTemplate> | null>(null)
  const [tab, setTab] = useState<'users' | 'templates'>('users')
  const [userSearch, setUserSearch] = useState('')
  const [userQuery, setUserQuery] = useState('')
  const [templateSearch, setTemplateSearch] = useState('')
  const [templateQuery, setTemplateQuery] = useState('')
  const [userPage, setUserPage] = useState(0)
  const [templatePage, setTemplatePage] = useState(0)
  const pageSize = 10
  const [userForm, setUserForm] = useState<UserFormState>(EMPTY_USER_FORM)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [error, setError] = useState('')
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void | Promise<void>
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  })

  const text = useMemo(() => (
    locale === 'vi'
      ? {
        title: 'Quản trị hệ thống',
        subtitle: 'Quản lý người dùng, cấu hình các biểu mẫu CV và theo dõi số CV đã được tạo.',
        users: 'Người dùng',
        templates: 'Biểu mẫu CV',
        refresh: 'Tải lại',
        createUser: 'Thêm người dùng',
        updateUser: 'Cập nhật',
        searchUsers: 'Tìm theo email hoặc tên',
        searchTemplates: 'Tìm theo tên hoặc mô tả biểu mẫu',
        noUsers: 'Chưa có người dùng nào.',
        noTemplates: 'Chưa có biểu mẫu nào được cấu hình.',
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
        cancelEdit: 'Hủy',
        role: 'Vai trò',
        email: 'Email',
        password: 'Mật khẩu',
        fullName: 'Họ tên',
        phone: 'Số điện thoại',
        createdAt: 'Tạo lúc',
        totalCv: 'Số CV',
        confirmDeleteUser: 'Xóa người dùng này?',
        confirmDeleteTemplate: 'Xóa biểu mẫu này?',
        listUsers: 'Danh sách người dùng',
        listTemplates: 'Danh sách biểu mẫu CV',
        userEditor: 'Sửa tài khoản',
        createHint: 'Quản lý thông tin và phân quyền người dùng trong hệ thống.',
        editTemplateHint: 'Tìm kiếm hoặc xóa biểu mẫu khỏi hệ thống.',
      }
      : {
        title: 'System Administration',
        subtitle: 'Manage users, configure CV templates, and monitor how many CVs have been created.',
        users: 'Users',
        templates: 'CV Templates',
        refresh: 'Refresh',
        createUser: 'Create User',
        updateUser: 'Update',
        searchUsers: 'Search by email or name',
        searchTemplates: 'Search by template name or description',
        noUsers: 'No users found.',
        noTemplates: 'No templates found.',
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
        cancelEdit: 'Cancel',
        role: 'Role',
        email: 'Email',
        password: 'Password',
        fullName: 'Full Name',
        phone: 'Phone',
        createdAt: 'Created At',
        totalCv: 'CV Count',
        confirmDeleteUser: 'Delete this user?',
        confirmDeleteTemplate: 'Delete this template?',
        listUsers: 'User List',
        listTemplates: 'CV Templates List',
        userEditor: 'Edit Account',
        createHint: 'Manage user accounts and permissions in the system.',
        editTemplateHint: 'Search or remove templates from the system.',
      }
  ), [locale])

  // Auth and initial stats check
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

  // Debounced search term updater for users
  useEffect(() => {
    const handler = setTimeout(() => {
      setUserQuery(userSearch)
      setUserPage(0) // Reset to first page on search
    }, 500)
    return () => clearTimeout(handler)
  }, [userSearch])

  // Debounced search term updater for CV templates
  useEffect(() => {
    const handler = setTimeout(() => {
      setTemplateQuery(templateSearch)
      setTemplatePage(0) // Reset to first page on search
    }, 500)
    return () => clearTimeout(handler)
  }, [templateSearch])

  // Effect to load users when query or page changes
  useEffect(() => {
    if (authLoading || !user || user.role !== 'ADMIN') return
    void reloadUsers(userQuery, userPage)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userQuery, userPage, authLoading, user])

  // Effect to load templates when query or page changes
  useEffect(() => {
    if (authLoading || !user || user.role !== 'ADMIN') return
    void reloadTemplates(templateQuery, templatePage)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateQuery, templatePage, authLoading, user])

  async function loadAll() {
    setLoadingData(true)
    setError('')
    try {
      const statsData = await adminApi.getDashboardStats()
      setStats(statsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats')
    } finally {
      setLoadingData(false)
    }
  }

  async function reloadUsers(query = userQuery, page = userPage) {
    setLoadingUsers(true)
    try {
      const data = await adminApi.getUsers(query, page, pageSize)
      setUsers(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoadingUsers(false)
    }
  }

  async function reloadTemplates(query = templateQuery, page = templatePage) {
    setLoadingTemplates(true)
    try {
      const data = await adminApi.getCvTemplates(query, page, pageSize)
      setCvTemplates(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates')
    } finally {
      setLoadingTemplates(false)
    }
  }

  const handleEditUser = (item: AdminUser) => {
    setEditingUser(item)
    setUserForm({
      role: item.role,
      isActive: item.isActive,
    })
  }

  const resetUserForm = () => {
    setEditingUser(null)
    setUserForm(EMPTY_USER_FORM)
  }


  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    setSubmitting(true)
    setError('')
    try {
      await adminApi.updateUser(editingUser.id, {
        email: editingUser.email,
        fullName: editingUser.fullName,
        phone: editingUser.phone ?? undefined,
        role: userForm.role,
        isActive: userForm.isActive,
        isEmailVerified: editingUser.isEmailVerified,
      })
      resetUserForm()
      await Promise.all([reloadUsers(userQuery, userPage), refreshStats()])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save user')
    } finally {
      setSubmitting(false)
    }
  }



  const handleDeleteUser = async (id: number) => {
    try {
      await adminApi.deleteUser(id)
      if (editingUser?.id === id) resetUserForm()
      await Promise.all([reloadUsers(userQuery, userPage), refreshStats()])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user')
    }
  }

  const handleDeleteTemplate = async (id: number) => {
    try {
      await adminApi.deleteCvTemplate(id)
      await Promise.all([reloadTemplates(templateQuery, templatePage), refreshStats()])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete template')
    }
  }

  const handleDeleteUserClick = (id: number) => {
    setConfirmModal({
      isOpen: true,
      title: text.confirmDeleteUser,
      message: 'Hành động này không thể hoàn tác. Người dùng sẽ bị xóa vĩnh viễn khỏi hệ thống.',
      onConfirm: () => void handleDeleteUser(id),
    })
  }

  const handleDeleteTemplateClick = (id: number) => {
    setConfirmModal({
      isOpen: true,
      title: text.confirmDeleteTemplate,
      message: 'Hành động này không thể hoàn tác. Cấu hình biểu mẫu này sẽ bị xóa vĩnh viễn khỏi hệ thống.',
      onConfirm: () => void handleDeleteTemplate(id),
    })
  }

  const handleRefresh = async () => {
    setLoadingData(true)
    setError('')
    try {
      await Promise.all([
        refreshStats(),
        reloadUsers(userQuery, userPage),
        reloadTemplates(templateQuery, templatePage)
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh data')
    } finally {
      setLoadingData(false)
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
          onClick={() => void handleRefresh()}
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

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {[
          { 
            label: text.statsUsers, 
            value: stats?.totalUsers ?? 0,
            color: 'text-blue-600 bg-blue-50 border-blue-100',
            icon: (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )
          },
          { 
            label: text.statsCandidates, 
            value: stats?.totalCandidates ?? 0,
            color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
            icon: (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
              </svg>
            )
          },
          { 
            label: text.statsAdmins, 
            value: stats?.totalAdmins ?? 0,
            color: 'text-purple-600 bg-purple-50 border-purple-100',
            icon: (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            )
          },
          { 
            label: text.statsCv, 
            value: stats?.totalCvDocuments ?? 0,
            color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
            icon: (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )
          },
          { 
            label: text.statsNewCv, 
            value: stats?.cvsCreatedLast7Days ?? 0,
            color: 'text-orange-600 bg-orange-50 border-orange-100',
            icon: (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )
          },
          { 
            label: text.statsInactive, 
            value: stats?.inactiveUsers ?? 0,
            color: 'text-red-600 bg-red-50 border-red-100',
            icon: (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            )
          },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${item.color}`}>
              {item.icon}
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{item.value}</div>
              <div className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-gray-400">{item.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-6 flex w-fit gap-1 rounded-2xl bg-gray-100 p-1">
        {(['users', 'templates'] as const).map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setTab(name)}
            className={`rounded-2xl px-5 py-2.5 text-sm font-semibold transition-colors ${
              tab === name ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {name === 'users' ? text.users : text.templates}
          </button>
        ))}
      </div>

      {tab === 'users' ? (
        <div className="w-full">
          <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{text.listUsers}</h2>
                <p className="mt-1 text-sm text-gray-500">{text.createHint}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder={text.searchUsers}
                    className="min-w-0 w-64 rounded-2xl border border-gray-200 pl-10 pr-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                  />
                  <div className="absolute left-3.5 top-3 text-gray-400">
                    {loadingUsers ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {loadingUsers ? (
                <SkeletonList />
              ) : users?.content.length ? (
                <>
                  {users.content.map((item) => (
                    <div key={item.id} className="rounded-3xl border border-gray-100 bg-gray-50/70 p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-semibold text-gray-900">{item.fullName}</h3>
                            <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">{item.role}</span>
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                              {item.isActive ? text.active : text.inactive}
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
                            onClick={() => handleDeleteUserClick(item.id)}
                            className="rounded-2xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
                          >
                            {text.delete}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Pagination
                    currentPage={userPage}
                    totalPages={users.totalPages}
                    totalElements={users.totalElements}
                    pageSize={pageSize}
                    onPageChange={(page) => setUserPage(page)}
                  />
                </>
              ) : (
                <div className="rounded-3xl border border-dashed border-gray-200 px-6 py-12 text-center text-sm text-gray-500">
                  {text.noUsers}
                </div>
              )}
            </div>
          </section>
        </div>
      ) : (
        <div className="w-full">
          <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{text.listTemplates}</h2>
                <p className="mt-1 text-sm text-gray-500">{text.editTemplateHint}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    value={templateSearch}
                    onChange={(e) => setTemplateSearch(e.target.value)}
                    placeholder={text.searchTemplates}
                    className="min-w-0 w-64 rounded-2xl border border-gray-200 pl-10 pr-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                  />
                  <div className="absolute left-3.5 top-3 text-gray-400">
                    {loadingTemplates ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {loadingTemplates ? (
                <SkeletonList />
              ) : cvTemplates?.content.length ? (
                <>
                  {cvTemplates.content.map((item) => (
                    <div key={item.id} className="rounded-3xl border border-gray-100 bg-gray-50/70 p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex items-start gap-4">
                          {item.thumbnail ? (
                            <img
                              src={item.thumbnail}
                              alt={item.name}
                              className="h-20 w-14 shrink-0 rounded-md border border-gray-200 object-cover object-top shadow-sm bg-white"
                            />
                          ) : (
                            <div className="h-20 w-14 shrink-0 rounded-md border border-dashed border-gray-300 bg-gray-100 flex items-center justify-center text-xs text-gray-400 font-semibold">
                              No pic
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base font-semibold text-gray-900">{item.name}</h3>
                              <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">ID: {item.id}</span>
                              {item.supportsPhotoUpload && (
                                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">Ảnh</span>
                              )}
                            </div>
                            <p className="mt-1.5 text-sm text-gray-600">{item.description}</p>
                            <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                              <span>Fields: <strong className="text-gray-800">{item.fields.join(', ')}</strong></span>
                              {item.summaryLabel && (
                                <span>Summary Label: <strong className="text-gray-800">{item.summaryLabel}</strong></span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleDeleteTemplateClick(item.id)}
                            className="rounded-2xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
                          >
                            {text.delete}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Pagination
                    currentPage={templatePage}
                    totalPages={cvTemplates.totalPages}
                    totalElements={cvTemplates.totalElements}
                    pageSize={pageSize}
                    onPageChange={(page) => setTemplatePage(page)}
                  />
                </>
              ) : (
                <div className="rounded-3xl border border-dashed border-gray-200 px-6 py-12 text-center text-sm text-gray-500">
                  {text.noTemplates}
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      <EditUserModal
        isOpen={editingUser !== null}
        user={editingUser}
        role={userForm.role}
        isActive={userForm.isActive}
        onRoleChange={(role) => setUserForm(prev => ({ ...prev, role }))}
        onIsActiveChange={(active) => setUserForm(prev => ({ ...prev, isActive: active }))}
        onSubmit={handleUserSubmit}
        onClose={resetUserForm}
        submitting={submitting}
        text={text}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}

function EditUserModal({
  isOpen,
  user,
  role,
  isActive,
  onRoleChange,
  onIsActiveChange,
  onSubmit,
  onClose,
  submitting,
  text,
}: {
  isOpen: boolean
  user: AdminUser | null
  role: UserRole
  isActive: boolean
  onRoleChange: (role: UserRole) => void
  onIsActiveChange: (active: boolean) => void
  onSubmit: (e: React.FormEvent) => void
  onClose: () => void
  submitting: boolean
  text: any
}) {
  if (!isOpen || !user) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      {/* Modal Content */}
      <form 
        onSubmit={onSubmit}
        className="relative w-full max-w-md scale-100 transform rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl transition-all duration-200 space-y-4"
      >
        <h3 className="text-lg font-bold text-gray-900">
          {text.userEditor}
        </h3>
        <p className="text-sm text-gray-500">
          {text.email}: <span className="font-medium text-gray-700">{user.email}</span>
        </p>

        <label className="block text-sm font-medium text-gray-700">
          {text.role}
          <select
            value={role}
            onChange={(e) => onRoleChange(e.target.value as UserRole)}
            className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-blue-400"
          >
            <option value="CANDIDATE">CANDIDATE</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </label>

        <ToggleField
          label={text.active}
          checked={isActive}
          onChange={onIsActiveChange}
        />

        <div className="mt-6 flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            {text.cancelEdit}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 shadow-sm disabled:opacity-60"
          >
            {text.updateUser}
          </button>
        </div>
      </form>
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
    <label className="flex items-center justify-between rounded-2xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 cursor-pointer transition-colors hover:border-gray-300">
      <span>{label}</span>
      <div className="relative">
        <input 
          type="checkbox" 
          checked={checked} 
          onChange={(e) => onChange(e.target.checked)} 
          className="sr-only peer" 
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
      </div>
    </label>
  )
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString()
}

function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onClose,
}: {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void | Promise<void>
  onClose: () => void
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      {/* Modal Content */}
      <div className="relative w-full max-w-md scale-100 transform rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl transition-all duration-200">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <p className="mt-2 text-sm text-gray-500">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={() => {
              void onConfirm()
              onClose()
            }}
            className="rounded-2xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 shadow-sm"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  )
}

function Pagination({
  currentPage,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
}: {
  currentPage: number
  totalPages: number
  totalElements: number
  pageSize: number
  onPageChange: (page: number) => void
}) {
  if (totalPages <= 1) return null

  const startIdx = currentPage * pageSize + 1
  const endIdx = Math.min((currentPage + 1) * pageSize, totalElements)

  return (
    <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-gray-100 pt-6 sm:flex-row">
      <p className="text-xs font-medium text-gray-500">
        Hiển thị <span className="font-bold text-gray-900">{startIdx}–{endIdx}</span> trong tổng số <span className="font-bold text-gray-900">{totalElements}</span> bản ghi
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={currentPage === 0}
          onClick={() => onPageChange(currentPage - 1)}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition-colors hover:border-blue-300 hover:text-blue-600 disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-gray-500"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {Array.from({ length: totalPages }).map((_, idx) => {
          if (
            idx === 0 ||
            idx === totalPages - 1 ||
            Math.abs(idx - currentPage) <= 1
          ) {
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onPageChange(idx)}
                className={`flex h-9 min-w-9 items-center justify-center rounded-xl px-2 text-sm font-semibold transition-colors ${
                  currentPage === idx
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'border border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:text-blue-600'
                }`}
              >
                {idx + 1}
              </button>
            )
          }
          if (
            (idx === 1 && currentPage > 2) ||
            (idx === totalPages - 2 && currentPage < totalPages - 3)
          ) {
            return (
              <span key={idx} className="px-1 text-gray-400">
                ...
              </span>
            )
          }
          return null
        })}

        <button
          type="button"
          disabled={currentPage === totalPages - 1}
          onClick={() => onPageChange(currentPage + 1)}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition-colors hover:border-blue-300 hover:text-blue-600 disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-gray-500"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function SkeletonList() {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: 3 }).map((_, idx) => (
        <div key={idx} className="rounded-3xl border border-gray-100 bg-gray-50/40 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-5 w-32 rounded bg-gray-200" />
                <div className="h-5 w-16 rounded-full bg-gray-200" />
                <div className="h-5 w-16 rounded-full bg-gray-200" />
              </div>
              <div className="h-4 w-48 rounded bg-gray-200" />
              <div className="h-3 w-64 rounded bg-gray-200" />
            </div>
            <div className="flex gap-2">
              <div className="h-9 w-16 rounded-2xl bg-gray-200" />
              <div className="h-9 w-16 rounded-2xl bg-gray-200" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
