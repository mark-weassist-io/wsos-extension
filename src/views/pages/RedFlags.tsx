import type { FC } from "hono/jsx"
import { Layout } from "../layout"
import type { RedFlagRow } from "../../db/queries/red-flags"

interface Props {
  flags: RedFlagRow[]
  editing?: boolean
  editId?: number
  formData?: Record<string, string>
  errors?: Record<string, string>
}

const FlagRow = ({ f }: { f: RedFlagRow }) => (
  <tr>
    <td><span style={`display:inline-block;width:12px;height:12px;border-radius:50%;background:${f.color || '#ccc'};margin-right:6px;vertical-align:middle`}></span>{f.flag_name}</td>
    <td>{f.definition || "—"}</td>
    <td><a href={`/red-flags/${f.id}/edit`}>Edit</a></td>
  </tr>
)

export const RedFlagsPage: FC<Props> = ({ flags = [] }) => {
  return (
    <Layout title="Red Flags" activeNav="red-flags">
      <p>{flags.length} flags</p>
      <table>
        <thead><tr><th>Flag</th><th>Definition</th><th>Actions</th></tr></thead>
        <tbody>{flags.map(f => <FlagRow f={f} />)}</tbody>
      </table>
    </Layout>
  )
}
