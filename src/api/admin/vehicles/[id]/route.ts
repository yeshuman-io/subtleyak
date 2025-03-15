import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { updateVehicleWorkflow } from "../../../../workflows/vehicles/update-vehicle";
import { PostAdminUpdateVehicle } from "../validators";

type PostAdminUpdateVehicleType = z.infer<
  typeof PostAdminUpdateVehicle
>;

export const POST = async (
  req: MedusaRequest<PostAdminUpdateVehicleType>,
  res: MedusaResponse
) => {
  const { result } = await updateVehicleWorkflow(req.scope).run({
    input: {
      id: req.params.id,
      ...req.validatedBody,
    },
  });

  res.json({ vehicles: result });
};