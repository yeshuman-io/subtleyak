import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { updateWiperLengthWorkflow } from "../../../../../workflows/wipers/update-wiper-length";
import { PostAdminUpdateWiperLength } from "../validators";

type PostAdminUpdateWiperLengthType = z.infer<
  typeof PostAdminUpdateWiperLength
>;

export const POST = async (
  req: MedusaRequest<PostAdminUpdateWiperLengthType>,
  res: MedusaResponse
) => {
  const { result } = await updateWiperLengthWorkflow(req.scope).run({
    input: {
      id: req.params.id,
      ...req.validatedBody,
    },
  });

  res.json({ wiper_length: result });
};