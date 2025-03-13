import { z } from "zod";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createWiperArmWorkflow } from "../../../../workflows/wipers/create-wiper-arm";
import { PostAdminCreateWiperArm } from "./validators";

type QueryResponse = {
  data: any[];
  metadata: {
    count: number;
    take: number;
    skip: number;
  };
};

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve("query");
    
    const queryOptions = {
      entity: "wiper_arm",
      ...req.queryConfig,
      filters: {
        ...req.queryConfig?.filters,
      },
    };

  try {
    const { data: arms, metadata } = (await query.graph(
      queryOptions
    )) as QueryResponse;

    res.json({
      arms,
      count: metadata.count,
      limit: metadata.take,
      offset: metadata.skip,
    });
  } catch (error) {
    console.error("Error fetching Wiper Arms:", error);
    res.status(500).json({ error: "An error occurred while fetching Wiper Arms" });
  }
};

type PostAdminCreateWiperArmReq = z.infer<
  typeof PostAdminCreateWiperArm
>;

export const POST = async (
  req: MedusaRequest<PostAdminCreateWiperArmReq>,
  res: MedusaResponse
) => {
  const { result } = await createWiperArmWorkflow(req.scope).run({
    input: req.validatedBody,
  });

  res.json({ wiperArm: result });
};

