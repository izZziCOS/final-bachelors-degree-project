import { useState, useEffect } from 'react'
import axios from 'axios'
import backend from '../apis/index'

const { CancelToken } = axios
export const useDataApi = (initialUrl, initialData, onGetData) => {
  const [data, setData] = useState(initialData)
  const [refresh, setRefresh] = useState(0)
  const [url, setUrl] = useState(initialUrl)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const forceRefresh = () => {
    setRefresh(refresh + 1)
  }

  useEffect(() => {
    const source = CancelToken.source()

    const fetchData = async () => {
      setError(false)
      setIsLoading(true)

      backend
        .get(url, {
          cancelToken: source.token,
        })
        .then((res) => {
          setData(res.data)
          if (onGetData) onGetData(res.data)
          setIsLoading(false)
        })
        .catch((err) => {
          if (axios.isCancel(err)) {
            console.log(
              `Get request for url ${url} canceled due to:`,
              err.message,
            )
          } else {
            setIsLoading(false)
            setError(err)
          }
        })
    }

    fetchData()
    return () => {
      source.cancel('object was destroyed')
    }
  }, [url, refresh, onGetData])

  return [{
    data, isLoading, error, forceRefresh,
  }, setUrl]
}
