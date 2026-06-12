import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../components/ui/Icon'
import { PartnerHeaderUser } from '../components/partner/PartnerHeaderUser'
import {
  B2B_PROJECT_TYPE_OPTIONS,
  B2B_PROJECT_MANAGER_OPTIONS,
} from '../data/b2bDashboard'
import { AddressAutocompleteInput } from '../components/address/AddressAutocompleteInput'

export function PartnerProjectCreatePage() {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [projectType, setProjectType] = useState('')
  const [startDate, setStartDate] = useState('')
  const [budget, setBudget] = useState('')
  const [manager, setManager] = useState('')
  const [description, setDescription] = useState('')
  const [uploadedFile, setUploadedFile] = useState({ name: 'Ban-ve-ky-thuat-tang-1.pdf', size: '4.2 MB', status: 'Hoàn tất' })

  const handleSubmit = (e) => {
    e.preventDefault()
    // TODO: submit
  }

  const removeFile = () => setUploadedFile(null)

  return (
    <>
      {/* Header - breadcrumb + user */}
      <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center gap-2 text-sm">
          <Icon name="home" className="text-slate-400" />
          <Icon name="chevron_right" className="text-slate-400 text-sm" />
          <Link to="/partner/projects" className="text-slate-500 font-medium hover:text-primary transition-colors">
            Dự án
          </Link>
          <Icon name="chevron_right" className="text-slate-400 text-sm" />
          <span className="text-slate-900 dark:text-slate-100 font-semibold">Tạo công trình mới</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="relative">
            <Icon name="notifications" className="text-slate-500 cursor-pointer text-xl" />
            <span className="absolute top-0 right-0 size-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-800" />
          </div>
          <div className="flex items-center pl-6 border-l border-slate-200 dark:border-slate-700">
            <PartnerHeaderUser size="sm" />
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Tạo công trình mới</h2>
            <p className="text-slate-500 mt-1">Vui lòng điền đầy đủ các thông tin dưới đây để khởi tạo dự án trên hệ thống.</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Thông tin chung */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                <h3 className="font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                  <Icon name="info" className="text-primary text-xl" />
                  Thông tin chung
                </h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Tên công trình/dự án <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nhập tên dự án (VD: Vinhomes Grand Park - Tòa S1)"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-900 focus:ring-primary focus:border-primary text-sm py-2.5 px-4 text-slate-900 dark:text-slate-100 placeholder-slate-400"
                  />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Địa điểm xây dựng <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Icon name="location_on" className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-slate-400" />
                    <AddressAutocompleteInput
                      value={address}
                      onChange={setAddress}
                      rows={1}
                      placeholder="Nhập địa chỉ chi tiết..."
                      className="w-full pl-10 pr-4 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-900 focus:ring-primary focus:border-primary text-sm py-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Loại hình công trình <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-900 focus:ring-primary focus:border-primary text-sm py-2.5 px-4 text-slate-900 dark:text-slate-100"
                  >
                    {B2B_PROJECT_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Ngày khởi công dự kiến
                  </label>
                  <div className="relative">
                    <Icon name="calendar_today" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-900 focus:ring-primary focus:border-primary text-sm py-2.5 pr-10 px-4 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Ngân sách dự kiến thiết bị
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      placeholder="0"
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-900 focus:ring-primary focus:border-primary text-sm py-2.5 pr-12 pl-4 text-right text-slate-900 dark:text-slate-100 placeholder-slate-400"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">VNĐ</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Người phụ trách dự án <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={manager}
                    onChange={(e) => setManager(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-900 focus:ring-primary focus:border-primary text-sm py-2.5 px-4 text-slate-900 dark:text-slate-100"
                  >
                    {B2B_PROJECT_MANAGER_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Mô tả chi tiết dự án
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Mô tả quy mô, yêu cầu đặc biệt về thiết bị..."
                    rows={4}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-900 focus:ring-primary focus:border-primary text-sm py-2.5 px-4 text-slate-900 dark:text-slate-100 placeholder-slate-400 resize-y"
                  />
                </div>
              </div>
            </div>

            {/* Hồ sơ thiết kế & Bản vẽ */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                <h3 className="font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                  <Icon name="upload_file" className="text-primary text-xl" />
                  Hồ sơ thiết kế & Bản vẽ
                </h3>
              </div>
              <div className="p-8">
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-10 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/30 hover:bg-slate-100 dark:hover:bg-slate-900/50 transition-colors cursor-pointer group">
                  <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Icon name="cloud_upload" className="text-3xl text-primary" />
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Click để tải lên hoặc kéo thả tệp tin</p>
                  <p className="text-xs text-slate-500 mt-1">PDF, DWG, JPG, PNG — tối đa 20MB</p>
                  <button
                    type="button"
                    className="mt-4 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold shadow-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Chọn file
                  </button>
                </div>
                {uploadedFile && (
                  <div className="mt-6 space-y-2">
                    <div className="flex items-center justify-between p-3 bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Icon name="description" className="text-primary" />
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{uploadedFile.name}</p>
                          <p className="text-[10px] text-slate-500">{uploadedFile.size} • {uploadedFile.status}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeFile}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                        aria-label="Xóa file"
                      >
                        <Icon name="delete" className="text-lg" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <Link
                to="/partner/projects"
                className="px-6 py-2.5 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Hủy bỏ
              </Link>
              <button
                type="submit"
                className="px-8 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-bold shadow-md shadow-primary/20 transition-all flex items-center gap-2"
              >
                <Icon name="check_circle" className="text-base" />
                Tạo công trình
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
