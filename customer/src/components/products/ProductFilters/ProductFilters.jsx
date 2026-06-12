import { Icon } from '../../ui/Icon'
import { FilterGroup } from './FilterGroup'
import { FILTER_PRICE_RANGES } from '../../../data/productListingFilters'

/**
 * @typedef {{ id: number, value: string }} AttributeValueChip
 * @typedef {{ attributeName?: string, name?: string, values: AttributeValueChip[] }} AttributeGroupDto
 */

/**
 * @param {object} props
 * @param {string} props.selectedPriceBandId
 * @param {(bandId: string) => void} props.onPriceBandChange
 * @param {AttributeGroupDto[]} props.attributeGroups
 * @param {number[]} props.selectedAttributeIds
 * @param {(valueId: number) => void} props.onToggleAttributeValue
 * @param {() => void} props.onClearFilters
 */
export function ProductFilters({
  selectedPriceBandId,
  onPriceBandChange,
  attributeGroups,
  selectedAttributeIds,
  onToggleAttributeValue,
  onClearFilters,
}) {
  const selectedIds =
    selectedPriceBandId === 'custom' ? [] : [selectedPriceBandId]

  return (
    <aside className="w-full lg:w-64 flex-shrink-0 space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold flex items-center gap-2">
            <Icon name="filter_list" className="text-primary" />
            Bộ lọc
          </h3>
          <button
            type="button"
            onClick={onClearFilters}
            className="text-xs text-primary font-semibold hover:underline"
          >
            Xóa bộ lọc
          </button>
        </div>

        {attributeGroups?.length === 0 ? (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4 rounded-lg bg-slate-50 dark:bg-slate-800/80 px-2 py-1.5 border border-slate-100 dark:border-slate-700">
            Chưa có thuộc tính lọc trong phạm vi này.
          </p>
        ) : null}

        {(attributeGroups || []).map((grp) => {
          const attrName =
            grp.attributeName ||
            grp.name ||
            'Thuộc tính'
          const seen = new Set()
          const opts = []
          for (const v of grp.values || []) {
            const label = String(v.value ?? '').trim()
            if (!label) continue
            const dedupeKey = label.toLowerCase()
            if (seen.has(dedupeKey)) continue
            seen.add(dedupeKey)
            opts.push({ id: String(v.id), label })
          }
          if (opts.length === 0) return null

          const selectedStrings = selectedAttributeIds.map(String)

          return (
            <FilterGroup
              key={attrName}
              title={attrName}
              type="checkbox"
              options={opts}
              selectedIds={selectedStrings}
              onToggle={(idStr) =>
                onToggleAttributeValue(Number.parseInt(idStr, 10))
              }
            />
          )
        })}

        <FilterGroup
          title="Khoảng giá (VND)"
          type="button"
          options={FILTER_PRICE_RANGES}
          selectedIds={selectedIds}
          onToggle={(id) => onPriceBandChange(id)}
        />
        {selectedPriceBandId === 'custom' ? (
          <p className="text-xs text-amber-700 dark:text-amber-300 mb-4 -mt-2">
            Đang lọc theo khoảng giá tùy chỉnh trên địa chỉ (min/max).
          </p>
        ) : null}
      </div>
    </aside>
  )
}
