/**
 * DataTable Component
 * Reusable table component with MUI styling
 */

'use client';

import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';

export interface DataTableColumn {
  id: string;
  label: string;
  align?: 'left' | 'center' | 'right';
}

export interface DataTableRow {
  [key: string]: any;
}

interface DataTableProps {
  title?: string;
  columns: DataTableColumn[];
  rows: DataTableRow[];
  maxHeight?: number;
}

export function DataTable({ title, columns, rows, maxHeight }: DataTableProps) {
  return (
    <Card elevation={2}>
      <CardContent>
        {title && (
          <Typography variant="h6" component="div" gutterBottom>
            {title}
          </Typography>
        )}
        <TableContainer component={Paper} sx={{ maxHeight: maxHeight || 400 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    align={column.align || 'left'}
                    sx={{ fontWeight: 600 }}
                  >
                    {column.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow
                  key={index}
                  hover
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  {columns.map((column) => (
                    <TableCell key={column.id} align={column.align || 'left'}>
                      {row[column.id]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}
