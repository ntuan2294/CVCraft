declare module 'html2pdf.js' {
  interface Options {
    margin?: number | number[]
    filename?: string
    image?: { type?: string; quality?: number }
    html2canvas?: Record<string, unknown>
    jsPDF?: { unit?: string; format?: string; orientation?: string }
    pagebreak?: { mode?: string[]; avoid?: string[] }
  }

  interface Html2Pdf {
    set(options: Options): Html2Pdf
    from(element: Element): Html2Pdf
    save(): Promise<void>
  }

  function html2pdf(): Html2Pdf
  export default html2pdf
}
