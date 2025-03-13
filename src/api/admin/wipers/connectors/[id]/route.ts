import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { updateWiperConnectorWorkflow } from "../../../../../workflows/wipers/update-wiper-connector";
import { PostAdminUpdateWiperConnector } from "../validators";

type PostAdminUpdateWiperConnectorType = z.infer<
  typeof PostAdminUpdateWiperConnector
>;

export const POST = async (
  req: MedusaRequest<PostAdminUpdateWiperConnectorType>,
  res: MedusaResponse
) => {
  const { result } = await updateWiperConnectorWorkflow(req.scope).run({
    input: {
      id: req.params.id,
      ...req.validatedBody,
    },
  });

  res.json({ wiper_connector: result });
};