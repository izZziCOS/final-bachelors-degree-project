import axios from 'axios'

export const baseURL = `https://2e25-195-14-164-86.eu.ngrok.io`

const options = {
  baseURL: baseURL,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
}

const instance = axios.create(options)

export default instance
