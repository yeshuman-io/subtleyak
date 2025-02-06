import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { updateVehicleMakeWorkflow } from "../../../../../workflows/update-vehicle-make";
import { PostAdminUpdateVehicleMake } from "../validators";

type PostAdminUpdateVehicleMakeType = z.infer<
  typeof PostAdminUpdateVehicleMake
>;

export const POST = async (
  req: MedusaRequest<PostAdminUpdateVehicleMakeType>,
  res: MedusaResponse
) => {
  const { result } = await updateVehicleMakeWorkflow(req.scope).run({
    input: {
      id: req.params.id,
      ...req.validatedBody,
    },
  });

  res.json({ vehicle_make: result });
}; 