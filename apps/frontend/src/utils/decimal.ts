import Decimal from 'decimal.js'

/**
 * Decimal.js 通用工具函数
 * 用于解决浮点数精度问题
 */

/**
 * 加法运算
 * @param values 数值数组
 * @returns 计算结果
 */
export function sum(...values: (number | string)[]): number {
  return values
    .map(v => new Decimal(v || 0))
    .reduce((total, current) => total.plus(current), new Decimal(0))
    .toNumber()
}

/**
 * 减法运算
 * @param minuend 被减数
 * @param subtrahend 减数
 * @returns 计算结果
 */
export function subtract(minuend: number | string, subtrahend: number | string): number {
  return new Decimal(minuend || 0)
    .minus(new Decimal(subtrahend || 0))
    .toNumber()
}

/**
 * 乘法运算
 * @param multiplicand 被乘数
 * @param multiplier 乘数
 * @param precision 精度（默认2位小数）
 * @returns 计算结果
 */
export function multiply(
  multiplicand: number | string,
  multiplier: number | string,
  precision: number = 2
): number {
  return Number(
    new Decimal(multiplicand || 0)
      .times(new Decimal(multiplier || 0))
      .toFixed(precision)
  )
}

/**
 * 除法运算
 * @param dividend 被除数
 * @param divisor 除数
 * @param precision 精度（默认2位小数）
 * @returns 计算结果
 */
export function divide(
  dividend: number | string,
  divisor: number | string,
  precision: number = 2
): number {
  if (new Decimal(divisor || 0).isZero()) {
    return 0
  }
  return Number(
    new Decimal(dividend || 0)
      .div(new Decimal(divisor))
      .toFixed(precision)
  )
}

/**
 * 计算用量（结束读数 - 起始读数）
 * @param endRead 结束读数
 * @param startRead 起始读数
 * @returns 用量
 */
export function calculateUsage(endRead: number | string, startRead: number | string): number {
  return subtract(endRead, startRead)
}

/**
 * 计算费用（用量 × 单价）
 * @param usage 用量
 * @param rate 单价
 * @returns 费用（保留2位小数）
 */
export function calculateAmount(usage: number | string, rate: number | string): number {
  return multiply(usage, rate, 2)
}

/**
 * 数组求和
 * @param values 数值数组
 * @param getter 获取数值的函数（可选）
 * @returns 总和
 */
export function sumArray<T>(
  values: T[],
  getter?: (item: T) => number | string
): number {
  return values.reduce((total, item) => {
    const value = getter ? getter(item) : (item as number | string)
    return total.plus(new Decimal(value || 0))
  }, new Decimal(0)).toNumber()
}

/**
 * 格式化数值（保留指定小数位）
 * @param value 数值
 * @param precision 精度（默认2位小数）
 * @returns 格式化后的数值
 */
export function format(value: number | string, precision: number = 2): number {
  return Number(new Decimal(value || 0).toFixed(precision))
}

/**
 * 计算百分比
 * @param value 数值
 * @param total 总数
 * @param precision 精度（默认2位小数）
 * @returns 百分比
 */
export function calculatePercentage(
  value: number | string,
  total: number | string,
  precision: number = 2
): number {
  if (new Decimal(total || 0).isZero()) {
    return 0
  }
  return Number(
    new Decimal(value || 0)
      .div(new Decimal(total))
      .times(100)
      .toFixed(precision)
  )
}

/**
 * 比较大小
 * @param a 数值a
 * @param b 数值b
 * @returns 1表示a>b, 0表示a=b, -1表示a<b
 */
export function compare(a: number | string, b: number | string): -1 | 0 | 1 {
  return new Decimal(a || 0).comparedTo(new Decimal(b || 0)) as -1 | 0 | 1
}

/**
 * 判断是否相等
 * @param a 数值a
 * @param b 数值b
 * @returns 是否相等
 */
export function equals(a: number | string, b: number | string): boolean {
  return new Decimal(a || 0).equals(new Decimal(b || 0))
}

/**
 * 判断是否大于
 * @param a 数值a
 * @param b 数值b
 * @returns 是否大于
 */
export function greaterThan(a: number | string, b: number | string): boolean {
  return new Decimal(a || 0).greaterThan(new Decimal(b || 0))
}

/**
 * 判断是否小于
 * @param a 数值a
 * @param b 数值b
 * @returns 是否小于
 */
export function lessThan(a: number | string, b: number | string): boolean {
  return new Decimal(a || 0).lessThan(new Decimal(b || 0))
}