import { defineRouteConfig } from "@medusajs/admin-sdk";
import { FocusModal, Button } from "@medusajs/ui";
import { VehicleMakeCreate } from "./vehicle-make-create";

const CreateVehicleMakePage = () => {
  return (
    <FocusModal>
      <FocusModal.Trigger asChild>
        <Button>Create Make</Button>
      </FocusModal.Trigger>
      <VehicleMakeCreate />
    </FocusModal>
  );
};

export const config = defineRouteConfig({
  label: "Create Vehicle Make",
});

export default CreateVehicleMakePage; 