/**
 * Reference type — local definition matching darwin-MFC/lib/types/references.
 * Avoids cross-repo relative imports that break CI.
 */
export interface Reference {
  id: string
  type?: string
  title: string
  journal?: string
  year?: number
  volume?: string
  pages?: string
  doi?: string
  authors?: string[]
  url?: string
  accessDate?: string
  publisher?: string
  isbn?: string
  edition?: string
  note?: string
}
