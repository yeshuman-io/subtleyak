import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { updateFitmentWorkflow } from "../../../../workflows/fitments/update-fitment";
import { PostAdminUpdateFitment } from "../validators";

type PostAdminUpdateFitmentType = z.infer<
  typeof PostAdminUpdateFitment
>;

export const POST = async (
  req: MedusaRequest<PostAdminUpdateFitmentType>,
  res: MedusaResponse
) => {
  const { result } = await updateFitmentWorkflow(req.scope).run({
    input: {
      id: req.params.id,
      ...req.validatedBody,
    },
  });

  res.json({ fitments: result });
};