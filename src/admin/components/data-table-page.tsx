import {
  Container,
  createDataTableColumnHelper,
  DataTable,
  DataTablePaginationState,
  useDataTable,
} from "@medusajs/ui";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { sdk } from "../lib/sdk";
import { Header } from "./header";

type DataTablePageProps<T> = {
  title: string;
  subtitle: string;
  endpoint: string;
  columns: ReturnType<typeof createDataTableColumnHelper<T>>[] | any[];
  queryKey: string;
  dataKey: string;
  actions?: Array<{
    type: "button";
    props: any;
    link?: {
      to: string;
    };
  }>;
};

export function DataTablePage<T extends { id: string }>({
  title,
  subtitle,
  endpoint,
  columns,
  queryKey,
  dataKey,
  actions = [],
}: DataTablePageProps<T>) {
  const limit = 25;
  const [pagination, setPagination] = useState<DataTablePaginationState>({
    pageSize: limit,
    pageIndex: 0,
  });
  
  const offset = useMemo(() => {
    return pagination.pageIndex * limit;
  }, [pagination]);

  const { data, isLoading } = useQuery({
    queryFn: () =>
      sdk.client.fetch(endpoint, {
        query: {
          limit,
          offset,
        },
      }),
    queryKey: [[queryKey, limit, offset]],
  });

  const table = useDataTable({
    columns,
    data: data?.[dataKey] || [],
    getRowId: (row) => row.id,
    rowCount: data?.count || 0,
    isLoading,
    pagination: {
      state: pagination,
      onPaginationChange: setPagination,
    },
  });

  return (
    <Container className="divide-y p-0">
      <Header
        title={title}
        subtitle={subtitle}
        actions={actions}
      />
      <DataTable instance={table}>
        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>
    </Container>
  );
} 