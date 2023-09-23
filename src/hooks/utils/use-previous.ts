import {useState} from 'react'

export default function usePrevious<Type>(value: Type) {
  const [current, setCurrent] = useState<Type>(value)
  const [previous, setPrevious] = useState<Type>()

  if (value !== current) {
    setPrevious(current)
    setCurrent(value)
  }

  return previous
}
