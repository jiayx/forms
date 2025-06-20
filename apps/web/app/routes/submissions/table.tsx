import type { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Eye } from 'lucide-react'
import { Link } from 'react-router'
import type { FieldSelect, SubmissionExt } from '@forms/db/zod'
import { formatDate } from '@/lib/utils'

export function getColumns(fields: FieldSelect[]) {
  const extFields = fields.map(
    (field) =>
      ({
        id: field.name,
        header: field.name,
        accessorFn: (r) => r.data[field.name],
        cell: ({ getValue }) => <span className="text-muted-foreground">{getValue() as string}</span>,
      } as ColumnDef<SubmissionExt>)
  )
  return [...extFields, ...columns]
}

let columns: ColumnDef<SubmissionExt>[] = [
  {
    accessorKey: 'createdAt',
    header: 'Submitted At',
    cell: ({ getValue }) => <span className="text-muted-foreground">{formatDate(getValue() as string)}</span>,
  },
  {
    accessorKey: 'ip',
    header: 'IP',
    cell: ({ getValue }) => <code className="text-xs bg-muted px-2 py-1 rounded">{getValue() as string}</code>,
  },
  {
    id: 'actions',
    header: () => 'Actions',
    cell: ({ row }) => (
      <Link to={`/forms/${row.original.formId}/submissions/${row.original.id}`}>
        <Button variant="ghost" size="sm" className="gap-2">
          <Eye className="h-4 w-4" />
          View
        </Button>
      </Link>
    ),
    meta: {
      align: 'right',
    },
    enableSorting: false,
  },
]
