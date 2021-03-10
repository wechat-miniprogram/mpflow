export const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}
