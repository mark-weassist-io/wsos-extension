import type { FC } from "hono/jsx"
import type { ExistingAccount } from "../../types"
import { Layout } from "../layout"

interface Props {
  accounts: ExistingAccount[]
}

export const ExistingAccountsPage: FC<Props> = ({ accounts }) => {
  return (
    <Layout title="Existing Accounts" activeNav="existing-accounts">
      <p class="text-secondary mb-4">{accounts.length} existing accounts</p>
      <div class="card" style="padding:0">
        <div class="table-container">
          <table>
            <thead>
              <tr><th>Client</th><th>Update Note</th><th>Check-in Frequency</th></tr>
            </thead>
            <tbody>
              {accounts.map(a => (
                <tr>
                  <td><strong>{a.client_name}</strong></td>
                  <td class="text-sm">{a.update_note || "—"}</td>
                  <td class="text-sm">{a.checkin_frequency || "—"}</td>
                </tr>
              ))}
              {accounts.length === 0 && (
                <tr><td colspan="3" style="text-align:center;padding:40px;color:var(--text-secondary)">No existing accounts</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}
