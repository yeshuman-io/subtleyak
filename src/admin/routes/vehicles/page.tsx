import { defineRouteConfig } from "@medusajs/admin-sdk";
import { RocketLaunch } from "@medusajs/icons";
import {
  Container,
  Heading,
  createDataTableColumnHelper,
  DataTable,
  DataTablePaginationState,
  useDataTable,
} from "@medusajs/ui";
import { useQuery } from "@tanstack/react-query";
import { sdk } from "../../lib/sdk";
import { useMemo, useState } from "react";
import { Vehicle, VehicleResponse } from "../../types";

const columnHelper = createDataTableColumnHelper<Vehicle>();

const columns = [
  columnHelper.accessor("id", {
    header: "ID",
  }),
  columnHelper.accessor("make.name", {
    header: "Make",
  }),
  columnHelper.accessor("model.name", {
    header: "Model",
  }),
  columnHelper.accessor("startYear", {
    header: "Start Year",
  }),
  columnHelper.accessor("endYear", {
    header: "End Year",
  }),
];

const VehiclesPage = () => {
  const limit = 25;
  const [pagination, setPagination] = useState<DataTablePaginationState>({
    pageSize: limit,
    pageIndex: 0,
  });
  const offset = useMemo(() => {
    return pagination.pageIndex * limit;
  }, [pagination]);

  const { data, isLoading } = useQuery<VehicleResponse>({
    queryFn: () =>
      sdk.client.fetch("/admin/vehicles", {
        query: {
          limit,
          offset,
        },
      }),
    queryKey: [["brands", limit, offset]],
  });

  const table = useDataTable({
    columns,
    data: data?.vehicles || [],
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
          <Heading>Vehicles</Heading>
        </DataTable.Toolbar>
        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Vehicles",
  icon: RocketLaunch,
});

export default VehiclesPage;
