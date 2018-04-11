import { generateApi } from './swagger'

const myFetch = (url: RequestInfo, request?: RequestInit, options?: any) => {
  if (request !== undefined) {
    request.credentials = 'include'
    request.mode = 'cors'
  }
  return fetch(url, request)
}

export default generateApi((process.env.API_HOST || ''), myFetch).NO_TAG
