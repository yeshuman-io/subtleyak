import * as zod from "zod"
import { 
  FocusModal,
  Heading,
  Label,
  Input,
  Button,
} from "@medusajs/ui"
import { 
  FormProvider,
  Controller,
  useForm,
} from "react-hook-form"
import { PostAdminCreateVehicleMake } from "../../../../../api/admin/vehicles/makes/validators"
import { sdk } from "../../../../lib/sdk"
import { useNavigate } from "react-router-dom"

// We can reuse our existing validator schema
const schema = PostAdminCreateVehicleMake;

export const VehicleMakeCreate = ({ onClose }: { onClose: () => void }) => {
  const navigate = useNavigate()
  const form = useForm<zod.infer<typeof schema>>({
    defaultValues: {
      name: "",
    },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await sdk.client.fetch("/admin/vehicles/makes", {
        method: "POST",
        body: data
      });
      
      // Close modal and refresh page
      onClose()
      navigate("/vehicles/makes")
    } catch (error) {
      console.error("Failed to create make:", error)
    }
  });

  return (
    <FocusModal.Content>
      <FormProvider {...form}>
        <form onSubmit={handleSubmit} className="flex h-full flex-col overflow-hidden">
          <FocusModal.Header>
            <FocusModal.Title>
              Create Vehicle Make
            </FocusModal.Title>
            <div className="flex items-center justify-end gap-x-2">
              <FocusModal.Close asChild>
                <Button size="small" variant="secondary">
                  Cancel
                </Button>
              </FocusModal.Close>
              <Button type="submit" size="small">
                Save
              </Button>
            </div>
          </FocusModal.Header>
          <FocusModal.Body>
            <div className="flex flex-1 flex-col items-center overflow-y-auto">
              <div className="mx-auto flex w-full max-w-[720px] flex-col gap-y-8 px-2 py-16">
                <div className="grid grid-cols-2 gap-4">
                  <Controller
                    control={form.control}
                    name="name"
                    render={({ field }) => {
                      return (
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center gap-x-1">
                            <Label size="small" weight="plus">
                              Name
                            </Label>
                          </div>
                          <Input {...field} />
                        </div>
                      )
                    }}
                  />
                </div>
              </div>
            </div>
          </FocusModal.Body>
        </form>
      </FormProvider>
    </FocusModal.Content>
  );
}; 