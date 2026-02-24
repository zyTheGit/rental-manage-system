export const localStorage = {
  getToken: (): string | null => {
    return window.localStorage.getItem('token')
  },
  setToken: (token: string) => {
    window.localStorage.setItem('token', token)
  },
  removeToken: () => {
    window.localStorage.removeItem('token')
  },
  getUser: () => {
    const user = window.localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  },
  setUser: (user: any) => {
    window.localStorage.setItem('user', JSON.stringify(user))
  },
  removeUser: () => {
    window.localStorage.removeItem('user')
  }
}
