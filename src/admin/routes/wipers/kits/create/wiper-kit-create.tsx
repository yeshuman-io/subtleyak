import { useAdminCreateMutation } from "@medusajs/admin";
import { Form } from "@medusajs/admin-ui";

export const WiperKitCreate = () => {
  const { mutate, isLoading } = useAdminCreateMutation(
    "wipers/kits"
  );

  const handleSubmit = (data: any) => {
    mutate(data);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Field
        label="Wiper"
        name="wiper_id"
        type="select"
        required=
      />
      <Form.Submit isLoading={isLoading}>Create</Form.Submit>
    </Form>
  );
}; 