import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { updateVehiclesWorkflow } from "../../../../../workflows/update-vehicles";
import { PostAdminUpdateVehicles } from "../validators";

type PostAdminUpdateVehiclesType = z.infer<
  typeof PostAdminUpdateVehicles
>;
//fasdfsdfasdfsdfadasdflkj;jlkasdf
export const POST = async (
  req: MedusaRequest<PostAdminUpdateVehiclesType>,
  res: MedusaResponse
) => {
  const { result } = await updateVehiclesWorkflow(req.scope).run({
    input: {
      id: req.params.id,
      ...req.validatedBody,
    },
  });

  // asdfasdfasdf

  res.json({ vehicles: result });
}; 