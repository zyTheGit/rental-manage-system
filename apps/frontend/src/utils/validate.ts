export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: RegExp
  email?: boolean
  phone?: boolean
  idCard?: boolean
  custom?: (value: any) => boolean | string
  message?: string
}

const toVantRule = (validator: any): any => validator

export const validators = {
  required: (message?: string) => (val: any) => !!val || (message || '此项为必填项'),
  
  minLength: (min: number, message?: string) => (val: string) => 
    (val && val.length >= min) || (message || `长度不能小于 ${min}`),
  
  maxLength: (max: number, message?: string) => (val: string) => 
    (!val || val.length <= max) || (message || `长度不能大于 ${max}`),
  
  min: (min: number, message?: string) => (val: number) => 
    (val !== null && val !== undefined && val >= min) || (message || `不能小于 ${min}`),
  
  max: (max: number, message?: string) => (val: number) => 
    (val !== null && val !== undefined && val <= max) || (message || `不能大于 ${max}`),
  
  email: (message?: string) => (val: string) => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return (!val || pattern.test(val)) || (message || '请输入有效的邮箱地址')
  },
  
  optionalEmail: (message?: string) => (val: string) => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return (!val || pattern.test(val)) || (message || '请输入有效的邮箱地址（可选）')
  },
  
  phone: (message?: string) => (val: string) => {
    const pattern = /^1[3-9]\d{9}$/
    return (!val || pattern.test(val)) || (message || '请输入有效的手机号码')
  },
  
  idCard: (message?: string) => (val: string) => {
    const pattern = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/
    return (!val || pattern.test(val)) || (message || '请输入有效的身份证号')
  },
  
  number: (message?: string) => (val: any) => 
    (!val || !isNaN(parseFloat(val))) || (message || '请输入有效的数字'),
  
  positiveNumber: (message?: string) => (val: number) => 
    (val === null || val === undefined || val > 0) || (message || '必须大于 0'),
  
  nonNegativeNumber: (message?: string) => (val: number) => 
    (val === null || val === undefined || val >= 0) || (message || '不能为负数'),
  
  url: (message?: string) => (val: string) => {
    try {
      new URL(val)
      return true
    } catch {
      return (message || '请输入有效的 URL')
    }
  },
  
  custom: (fn: (val: any) => boolean | string) => (val: any) => {
    const result = fn(val)
    return result === true ? true : (result === false ? '验证失败' : result)
  }
}

export const fieldValidators = {
  username: [
    toVantRule(validators.required('请输入用户名')),
    toVantRule(validators.minLength(3, '用户名至少 3 个字符')),
    toVantRule(validators.maxLength(20, '用户名最多 20 个字符'))
  ],

  password: [
    toVantRule(validators.required('请输入密码')),
    toVantRule(validators.minLength(6, '密码至少 6 个字符'))
  ],

  email: [
    toVantRule(validators.optionalEmail())
  ],

  phone: [
    toVantRule(validators.phone())
  ],

  idCard: [
    toVantRule(validators.idCard())
  ],

  title: [
    toVantRule(validators.required('请输入标题')),
    toVantRule(validators.maxLength(100, '标题最多 100 个字符'))
  ],

  address: [
    toVantRule(validators.required('请输入地址')),
    toVantRule(validators.maxLength(200, '地址最多 200 个字符'))
  ],

  rent: [
    toVantRule(validators.required('请输入租金')),
    toVantRule(validators.number()),
    toVantRule(validators.positiveNumber())
  ],

  deposit: [
    toVantRule(validators.number()),
    toVantRule(validators.nonNegativeNumber())
  ],

  area: [
    toVantRule(validators.number()),
    toVantRule(validators.positiveNumber())
  ],

  remark: [
    toVantRule(validators.maxLength(500, '备注最多 500 个字符'))
  ]
}
