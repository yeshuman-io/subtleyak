import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { updateWiperWorkflow } from "../../../../../workflows/update-wiper";
import { PostAdminUpdateWiper } from "../validators";

type PostAdminUpdateWiperType = z.infer<
  typeof PostAdminUpdateWiper
>;

export const POST = async (
  req: MedusaRequest<PostAdminUpdateWiperType>,
  res: MedusaResponse
) => {
  const { result } = await updateWiperWorkflow(req.scope).run({
    input: {
      id: req.params.id,
      ...req.validatedBody,
    },
  });

  res.json({ wiper: result });
};