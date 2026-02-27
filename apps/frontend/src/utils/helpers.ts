import dayjs from 'dayjs'

export function formatCurrency(value: number | string, currency: string = '¥'): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '0.00'
  return `${currency}${num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
}

export function formatDate(date: string | Date, format: string = 'YYYY-MM-DD'): string {
  if (!date) return ''
  return dayjs(date).format(format)
}

export function formatDateTime(date: string | Date, format: string = 'YYYY-MM-DD HH:mm:ss'): string {
  return formatDate(date, format)
}

export function parseDate(dateStr: string): Date {
  return dayjs(dateStr).toDate()
}

export function formatDateRange(start: string | Date, end: string | Date): string {
  if (!start && !end) return ''
  if (!end) return `${formatDate(start)} - 至今`
  return `${formatDate(start)} - ${formatDate(end)}`
}

export function getStartOfMonth(): string {
  return formatDate(dayjs().startOf('month').toDate())
}

export function getEndOfMonth(): string {
  return formatDate(dayjs().endOf('month').toDate())
}

export function getStartOfYear(): string {
  return formatDate(dayjs().startOf('year').toDate())
}

export function getEndOfYear(): string {
  return formatDate(dayjs().endOf('year').toDate())
}

export function addMonths(date: Date | string, months: number): Date {
  return dayjs(date).add(months, 'month').toDate()
}

export function diffDays(date1: Date | string, date2: Date | string): number {
  return dayjs(date1).diff(dayjs(date2), 'day')
}

export function diffMonths(date1: Date | string, date2: Date | string): number {
  return dayjs(date1).diff(dayjs(date2), 'month')
}

export function diffYears(date1: Date | string, date2: Date | string): number {
  return dayjs(date1).diff(dayjs(date2), 'year')
}

export function isDateBefore(date1: Date | string, date2: Date | string): boolean {
  return dayjs(date1).isBefore(dayjs(date2))
}

export function isDateAfter(date1: Date | string, date2: Date | string): boolean {
  return dayjs(date1).isAfter(dayjs(date2))
}

export function isSameDay(date1: Date | string, date2: Date | string): boolean {
  return dayjs(date1).isSame(dayjs(date2), 'day')
}

export function getDaysDiff(start: Date | string, end: Date | string): number {
  return dayjs(end).diff(dayjs(start), 'day') + 1
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: any = null
  return function(this: any, ...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => {
      func.apply(this, args)
    }, wait)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: any = null
  let previous = 0
  return function(this: any, ...args: Parameters<T>) {
    const now = Date.now()
    const remaining = wait - (now - previous)
    
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }
      previous = now
      func.apply(this, args)
    } else if (!timeout) {
      timeout = setTimeout(() => {
        previous = Date.now()
        timeout = null
        func.apply(this, args)
      }, remaining)
    }
  }
}

export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj) as any
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as any
  if (obj instanceof Object) {
    const clonedObj = {} as any
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj
  }
  return obj
}

export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim().length === 0
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

export function getRandomString(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function generateId(): string {
  return `${Date.now()}-${getRandomString(6)}`
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function downloadFile(url: string, filename?: string): void {
  const link = document.createElement('a')
  link.href = url
  if (filename) {
    link.download = filename
  }
  link.click()
}

export function openUrl(url: string, target: '_blank' | '_self' | '_parent' | '_top' = '_blank'): void {
  window.open(url, target)
}

export function copyToClipboard(text: string): Promise<boolean> {
  return navigator.clipboard.writeText(text)
    .then(() => true)
    .catch(() => false)
}

export function scrollToTop(): void {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

export function scrollToElement(element: HTMLElement, offset: number = 0): void {
  const top = element.getBoundingClientRect().top + window.pageYOffset - offset
  window.scrollTo({ top, behavior: 'smooth' })
}

export function getQueryParam(name: string): string | null {
  const params = new URLSearchParams(window.location.search)
  return params.get(name)
}

export function setQueryParam(name: string, value: string): void {
  const url = new URL(window.location.href)
  url.searchParams.set(name, value)
  window.history.replaceState({}, '', url.toString())
}

export function removeQueryParam(name: string): void {
  const url = new URL(window.location.href)
  url.searchParams.delete(name)
  window.history.replaceState({}, '', url.toString())
}

export function getBrowserInfo(): {
  name: string
  version: string
  os: string
} {
  const ua = navigator.userAgent
  let browserName = 'Unknown'
  let browserVersion = 'Unknown'
  
  if (ua.indexOf('Chrome') > -1) {
    browserName = 'Chrome'
    browserVersion = ua.match(/Chrome\/(\d+)/)?.[1] || 'Unknown'
  } else if (ua.indexOf('Firefox') > -1) {
    browserName = 'Firefox'
    browserVersion = ua.match(/Firefox\/(\d+)/)?.[1] || 'Unknown'
  } else if (ua.indexOf('Safari') > -1) {
    browserName = 'Safari'
    browserVersion = ua.match(/Version\/(\d+)/)?.[1] || 'Unknown'
  } else if (ua.indexOf('Edge') > -1) {
    browserName = 'Edge'
    browserVersion = ua.match(/Edge\/(\d+)/)?.[1] || 'Unknown'
  }
  
  let os = 'Unknown'
  if (ua.indexOf('Win') > -1) os = 'Windows'
  else if (ua.indexOf('Mac') > -1) os = 'macOS'
  else if (ua.indexOf('Linux') > -1) os = 'Linux'
  else if (ua.indexOf('Android') > -1) os = 'Android'
  else if (ua.indexOf('like Mac') > -1) os = 'iOS'
  
  return { name: browserName, version: browserVersion, os }
}

export function isMobile(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

export function isTablet(): boolean {
  return /iPad|Android/i.test(navigator.userAgent) && window.innerWidth >= 768
}

export function isDesktop(): boolean {
  return !isMobile() && !isTablet()
}

export function getScreenSize(): 'xs' | 'sm' | 'md' | 'lg' | 'xl' {
  const width = window.innerWidth
  if (width < 600) return 'xs'
  if (width < 1024) return 'sm'
  if (width < 1440) return 'md'
  if (width < 1920) return 'lg'
  return 'xl'
}

export function capitalize(str: string): string {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function camelCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, char) => char ? char.toUpperCase() : '')
    .replace(/^(.)/, (_, char) => char.toLowerCase())
}

export function kebabCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '-$1')
    .replace(/[-_\s]+/g, '-')
    .toLowerCase()
    .replace(/^-/, '')
}

export function truncate(str: string, length: number = 50, suffix: string = '...'): string {
  if (!str || str.length <= length) return str
  return str.substring(0, length) + suffix
}

export function maskPhone(phone: string): string {
  if (!phone || phone.length !== 11) return phone
  return `${phone.substring(0, 3)}****${phone.substring(7)}`
}

export function maskIdCard(idCard: string): string {
  if (!idCard) return idCard
  if (idCard.length === 15) {
    return `${idCard.substring(0, 6)}*******${idCard.substring(12)}`
  } else if (idCard.length === 18) {
    return `${idCard.substring(0, 6)}********${idCard.substring(14)}`
  }
  return idCard
}

export function validatePhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone)
}

export function validateIdCard(idCard: string): boolean {
  return /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/.test(idCard)
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}

export function random(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function round(num: number, precision: number = 2): number {
  const factor = Math.pow(10, precision)
  return Math.round(num * factor) / factor
}

export function sum(arr: number[]): number {
  return arr.reduce((acc, curr) => acc + curr, 0)
}

export function average(arr: number[]): number {
  if (arr.length === 0) return 0
  return sum(arr) / arr.length
}

export function max(arr: number[]): number {
  return Math.max(...arr)
}

export function min(arr: number[]): number {
  return Math.min(...arr)
}

export function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size))
  }
  return result
}

export function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr))
}

export function groupBy<T, K extends keyof any>(arr: T[], key: (item: T) => K): Record<K, T[]> {
  return arr.reduce((result, item) => {
    const group = key(item)
    if (!result[group]) {
      result[group] = []
    }
    result[group].push(item)
    return result
  }, {} as Record<K, T[]>)
}
