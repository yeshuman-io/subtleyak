import { z } from "zod";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createWiperKitWorkflow } from "../../../../workflows/wipers/create-wiper-kit";
import { PostAdminCreateWiperKit } from "./validators";

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
      entity: "wiper_kit",
      ...req.queryConfig,
      filters: {
        ...req.queryConfig?.filters,
      },
    };

  try {
    const { data: kits, metadata } = (await query.graph(
      queryOptions
    )) as QueryResponse;

    res.json({
      kits,
      count: metadata.count,
      limit: metadata.take,
      offset: metadata.skip,
    });
  } catch (error) {
    console.error("Error fetching Wiper Kits:", error);
    res.status(500).json({ error: "An error occurred while fetching Wiper Kits" });
  }
};

type PostAdminCreateWiperKitReq = z.infer<
  typeof PostAdminCreateWiperKit
>;

export const POST = async (
  req: MedusaRequest<PostAdminCreateWiperKitReq>,
  res: MedusaResponse
) => {
  const { result } = await createWiperKitWorkflow(req.scope).run({
    input: req.validatedBody,
  });

  res.json({ wiperKit: result });
};

