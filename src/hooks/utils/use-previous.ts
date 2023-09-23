export default function usePrevious<Type>(value: Type) {
  const [current, setCurrent] = React.useState<Type>(value)
  const [previous, setPrevious] = React.useState<Type>()

  if (value !== current) {
    setPrevious(current)
    setCurrent(value)
  }

  return previous
}
