import * as zod from "zod";
import { Drawer, Label, Input, Button, Select } from "@medusajs/ui";
import { FormProvider, Controller, useForm } from "react-hook-form";
import { PostAdminCreateVehicleModel } from "../../../../../api/admin/vehicles/models/validators";
import { sdk } from "../../../../lib/sdk";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Suspense } from "react";

const schema = PostAdminCreateVehicleModel;

const ModelEditForm = ({ 
  model,
  onClose,
  makes,
  isLoading 
}: { 
  model: { id: string; name: string; make_id: string; make?: { name: string } };
  onClose: () => void;
  makes: any[];
  isLoading: boolean;
}) => {
  const navigate = useNavigate();
  
  console.log('Initial model:', model); // Debug initial values
  
  const form = useForm<zod.infer<typeof schema>>({
    defaultValues: {
      name: model.name,
      make_id: model.make?.id || model.make_id,
    },
    values: {
      name: model.name,
      make_id: model.make?.id || model.make_id,
    }
  });

  // Debug form values
  console.log('Form values:', form.watch());

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await sdk.client.fetch(`/admin/vehicles/models/${model.id}`, {
        method: "PUT",
        body: data,
      });
      
      onClose();
      navigate("/vehicles/models");
    } catch (error) {
      console.error("Failed to update model:", error);
    }
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
        <Drawer.Header>
          <Drawer.Title>Edit Vehicle Model</Drawer.Title>
          <span id="edit-model-description" className="sr-only">
            Edit vehicle model details
          </span>
        </Drawer.Header>
        <Drawer.Body className="flex max-w-full flex-1 flex-col gap-y-8 overflow-y-auto">
          <Controller
            control={form.control}
            name="make_id"
            defaultValue={model.make?.id || model.make_id}
            render={({ field }) => {
              console.log('Field value:', field.value);
              return (
                <div className="flex flex-col space-y-2">
                  <Label>Make</Label>
                  <Select 
                    value={field.value || model.make?.id || model.make_id}
                    onValueChange={field.onChange}
                    disabled={isLoading}
                  >
                    <Select.Trigger>
                      <Select.Value>
                        {makes.find(m => m.id === (field.value || model.make?.id || model.make_id))?.name || "Select a make..."}
                      </Select.Value>
                    </Select.Trigger>
                    <Select.Content>
                      {makes.map((make) => (
                        <Select.Item key={make.id} value={make.id}>
                          {make.name}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select>
                </div>
              );
            }}
          />
          <Controller
            control={form.control}
            name="name"
            render={({ field }) => (
              <div className="flex flex-col space-y-2">
                <div className="flex items-center gap-x-1">
                  <Label size="small" weight="plus">
                    Model Name
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
  );
};

export const VehicleModelEdit = ({ model, onClose }) => {
  const { data: makesData, isLoading } = useQuery({
    queryKey: ["vehicle_makes"],
    queryFn: () => sdk.client.fetch("/admin/vehicles/makes"),
    enabled: true,
  });

  const makes = makesData?.vehicle_makes || [];

  return (
    <Drawer.Content aria-describedby="edit-model-description">
      <Suspense fallback={<div>Loading...</div>}>
        <ModelEditForm 
          model={model} 
          onClose={onClose} 
          makes={makes}
          isLoading={isLoading}
        />
      </Suspense>
    </Drawer.Content>
  );
}; 