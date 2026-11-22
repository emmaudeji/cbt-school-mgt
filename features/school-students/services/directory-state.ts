
export type DirectoryActionState = {
  ok: boolean
  message: string
  count: number
}

export const initialDirectoryActionState:
  DirectoryActionState = {
    ok: false,
    message: "",
    count: 0,
  }
