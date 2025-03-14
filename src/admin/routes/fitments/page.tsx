import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Pencil, Link } from "@medusajs/icons";
import { createDataTableColumnHelper, FocusModal, Drawer } from "@medusajs/ui";
import { Fitment } from "../../types";
import { DataTablePage } from "../../components/data-table-page";
import { ActionMenu } from "../../components/action-menu";
import { FitmentCreate } from "./create/fitment-create";
import { FitmentEdit } from "./edit/fitment-edit";
import { useState } from "react";

const columnHelper = createDataTableColumnHelper<Fitment>();

const FitmentsPage = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [editingFitment, setEditingFitment] = useState<Fitment | null>(null);
  const columns = [
    columnHelper.accessor("id", {
      header: "ID",
    }),
    columnHelper.accessor("code", {
          header: "Code",
      enableSorting: true,
    }),
    columnHelper.accessor("actions", {
      header: "",
      cell: ({ row }) => {
        const model = row.original;
        return (
          <ActionMenu
            groups={[
              {
                actions: [
                  {
                    label: "Edit",
                    icon: <Pencil />,
                    onClick: () => setEditingFitment(model),
                  },
                ],
              },
            ]}
          />
        );
      },
    }),
  ];
  return (
    <>
      <DataTablePage<Fitment>
        title="Fitments"
        subtitle="Manage your fitments"
        endpoint="/admin/fitments"
        columns={columns}
        queryKey="fitments"
        dataKey="fitments"
        actions={[
          {
            type: "button",
            props: {
              variant: "secondary",
              size: "small",
              children: "Export",
              disabled: true,
            },
          },
          {
            type: "button",
            props: {
              variant: "secondary",
              size: "small",
              children: "Import",
              disabled: true,
            },
          },
          {
            type: "button",
            props: {
              variant: "secondary",
              size: "small",
              children: "Create",
              onClick: () => setShowCreate(true),
            },
          },
        ]}
      />
      {showCreate && (
        <FocusModal open={showCreate} onOpenChange={setShowCreate}>
          <FitmentCreate onClose={() => setShowCreate(false)} />
        </FocusModal>
      )}
      {editingFitment && (
        <Drawer open onOpenChange={() => setEditingFitment(null)}>
          <FitmentEdit 
            fitment={editingFitment}
            onClose={() => setEditingFitment(null)}
          />
        </Drawer>
      )}
    </>
  );
};

export const config = defineRouteConfig({
  label: "Fitments",
  icon: Link
});//asdf

export default FitmentsPage; 