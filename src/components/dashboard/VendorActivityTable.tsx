export interface VendorActivityRow {
  id: string;
  name: string;
  category: string;
  invoiceCount: number;
  total: number;
  status: 'paid' | 'pending' | 'overdue';
}

interface VendorActivityTableProps {
  rows: VendorActivityRow[];
}

const STATUS_STYLES: Record<VendorActivityRow['status'], { label: string; className: string }> = {
  paid: { label: 'Paid', className: 'bg-leaf/10 text-leaf' },
  pending: { label: 'Pending', className: 'bg-gold/10 text-gold' },
  overdue: { label: 'Overdue', className: 'bg-clay/10 text-clay' },
};

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function VendorActivityTable({ rows }: VendorActivityTableProps) {
  return (
    <div className="bg-panel border border-edge rounded-2xl shadow-e1 p-5 min-w-0">
      <h3 className="text-title font-semibold text-ink mb-4">Vendor Activity</h3>

      {rows.length === 0 ? (
        <p className="text-body-sm text-ink-3 py-6 text-center">No vendor invoices recorded yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead>
              <tr className="border-b border-edge-soft">
                <th className="text-left text-label uppercase text-ink-3 font-semibold pb-2.5">Vendor</th>
                <th className="text-left text-label uppercase text-ink-3 font-semibold pb-2.5">Category</th>
                <th className="text-right text-label uppercase text-ink-3 font-semibold pb-2.5">Invoices</th>
                <th className="text-right text-label uppercase text-ink-3 font-semibold pb-2.5">Total</th>
                <th className="text-left text-label uppercase text-ink-3 font-semibold pb-2.5 pl-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const status = STATUS_STYLES[row.status];
                return (
                  <tr key={row.id} className="border-b border-edge-soft last:border-0 hover:bg-panel-2 transition-colors">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg,#6FA33C,#3C6B1B)' }}
                        >
                          {initials(row.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-body-sm font-medium text-ink truncate">{row.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-body-sm text-ink-2">{row.category}</td>
                    <td className="py-3 text-body-sm text-ink-2 text-right tabular">{row.invoiceCount}</td>
                    <td className="py-3 text-body-sm font-semibold text-ink text-right tabular">
                      ₹{row.total.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 pl-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold ${status.className}`}>
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
