/**
 * Sidebar navigation categories and sub-links
 */
export const SIDEBAR_NAV = [
  {
    id: 'sanitary',
    icon: 'shower',
    label: 'Thiết bị vệ sinh',
    children: [
      { label: 'TOTO Japan', href: '#' },
      { label: 'INAX Global', href: '#' },
      { label: 'Bồn cầu thông minh', href: '#' },
    ],
  },
  {
    id: 'kitchen',
    icon: 'cooking',
    label: 'Thiết bị nhà bếp',
    children: [
      { label: 'BOSCH Germany', href: '#' },
      { label: 'HAFELE Gia đình', href: '#' },
      { label: 'Bếp từ & Hút mùi', href: '#' },
    ],
  },
  {
    id: 'water-filter',
    icon: 'water_drop',
    label: 'Máy lọc nước',
    children: null,
  },
  {
    id: 'solar',
    icon: 'solar_power',
    label: 'Năng lượng mặt trời',
    children: null,
  },
  {
    id: 'smart-home',
    icon: 'home_iot_device',
    label: 'Smart Home Ariston',
    children: null,
  },
]
