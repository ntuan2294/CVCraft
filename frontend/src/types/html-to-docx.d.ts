declare module 'html-to-docx' {
  type LengthValue = number | `${number}px` | `${number}cm` | `${number}in` | `${number}pt`

  type DocumentOptions = {
    orientation?: 'portrait' | 'landscape'
    pageSize?: {
      width?: LengthValue
      height?: LengthValue
    }
    margins?: {
      top?: LengthValue
      right?: LengthValue
      bottom?: LengthValue
      left?: LengthValue
      header?: LengthValue
      footer?: LengthValue
      gutter?: LengthValue
    }
    title?: string
    creator?: string
    font?: string
    fontSize?: LengthValue
    complexScriptFontSize?: LengthValue
    decodeUnicode?: boolean
    lang?: string
    table?: {
      row?: {
        cantSplit?: boolean
      }
    }
  }

  export default function HTMLtoDOCX(
    htmlString: string,
    headerHTMLString?: string,
    documentOptions?: DocumentOptions,
    footerHTMLString?: string,
  ): Promise<Buffer | Blob>
}
