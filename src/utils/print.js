export function printElement(elementId) {
  const element = document.getElementById(elementId)
  if (!element) {
    console.error(`Element with id "${elementId}" not found`)
    return
  }

  window.print()
}

export function printContent(content) {
  const printWindow = window.open('', '_blank')
  printWindow.document.write(content)
  printWindow.document.close()
  printWindow.print()
}
