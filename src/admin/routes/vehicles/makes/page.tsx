import { defineRouteConfig } from "@medusajs/admin-sdk";
import {
  Container,
  Heading,
  createDataTableColumnHelper,
  DataTable,
  DataTablePaginationState,
  useDataTable,
} from "@medusajs/ui";
import { useQuery } from "@tanstack/react-query";
import { sdk } from "../../../lib/sdk";
import { useMemo, useState } from "react";
import { VehicleMake, VehicleMakeResponse } from "../../../types";

const columnHelper = createDataTableColumnHelper<VehicleMake>();

const columns = [
  columnHelper.accessor("id", {
    header: "ID",
  }),
  columnHelper.accessor("name", {
    header: "Make",
  }),
  columnHelper.accessor("models", {
    header: "Models",
  }),
];

const VehicleMakesPage = () => {
  const limit = 25;
  const [pagination, setPagination] = useState<DataTablePaginationState>({
    pageSize: limit,
    pageIndex: 0,
  });
  const offset = useMemo(() => {
    return pagination.pageIndex * limit;
  }, [pagination]);

  const { data, isLoading } = useQuery<VehicleMakeResponse>({
    queryFn: () =>
      sdk.client.fetch("/admin/vehicles/makes", {
        query: {
          limit,
          offset,
        },
      }),
    queryKey: [["vehicle_makes", limit, offset]],
  });

  const table = useDataTable({
    columns,
    data: data?.vehicle_makes || [],
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
      <DataTable instance={table}>
        <DataTable.Toolbar className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
          <Heading>Vehicle Makes</Heading>
        </DataTable.Toolbar>
        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Vehicle Makes"
});

export default VehicleMakesPage;
