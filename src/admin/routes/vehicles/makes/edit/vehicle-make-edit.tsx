import * as zod from "zod";
import { Drawer, Label, Input, Button } from "@medusajs/ui";
import { FormProvider, Controller, useForm } from "react-hook-form";
import { PostAdminCreateVehicleMake } from "../../../../../api/admin/vehicles/makes/validators";
import { sdk } from "../../../../lib/sdk";
import { useNavigate } from "react-router-dom";

const schema = PostAdminCreateVehicleMake;

export const VehicleMakeEdit = ({ 
  make,
  onClose 
}: { 
  make: { id: string; name: string };
  onClose: () => void;
}) => {
  const navigate = useNavigate();
  
  const form = useForm<zod.infer<typeof schema>>({
    defaultValues: {
      name: make.name,
    },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await sdk.client.fetch(`/admin/vehicles/makes/${make.id}`, {
        method: "POST",
        body: data,
      });
      
      onClose();
      navigate("/vehicles/makes");
    } catch (error) {
      console.error("Failed to update make:", error);
    }
  });

  return (
    <Drawer.Content>
      <FormProvider {...form}>
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <Drawer.Header>
            <Drawer.Title>Edit Vehicle Make</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body className="flex max-w-full flex-1 flex-col gap-y-8 overflow-y-auto">
            <Controller
              control={form.control}
              name="name"
              render={({ field }) => (
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center gap-x-1">
                    <Label size="small" weight="plus">
                      Name
                    </Label>
                  </div>
                  <Input {...field} />
                </div>
              )}
            />
          </Drawer.Body>
          <Drawer.Footer>
            <div className="flex items-center justify-end gap-x-2">
              <Drawer.Close asChild>
                <Button size="small" variant="secondary">
                  Cancel
                </Button>
              </Drawer.Close>
              <Button size="small" type="submit">
                Save
              </Button>
            </div>
          </Drawer.Footer>
        </form>
      </FormProvider>
    </Drawer.Content>
  );
}; 