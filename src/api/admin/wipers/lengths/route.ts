import { z } from "zod";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createWiperLengthWorkflow } from "../../../../workflows/wipers/create-wiper-length";
import { PostAdminCreateWiperLength } from "./validators";

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
      entity: "wiper_length",
      ...req.queryConfig,
      filters: {
        ...req.queryConfig?.filters,
      },
    };

  try {
    const { data: lengths, metadata } = (await query.graph(
      queryOptions
    )) as QueryResponse;

    res.json({
      lengths,
      count: metadata.count,
      limit: metadata.take,
      offset: metadata.skip,
    });
  } catch (error) {
    console.error("Error fetching Wiper Lengths:", error);
    res.status(500).json({ error: "An error occurred while fetching Wiper Lengths" });
  }
};

type PostAdminCreateWiperLengthReq = z.infer<
  typeof PostAdminCreateWiperLength
>;

export const POST = async (
  req: MedusaRequest<PostAdminCreateWiperLengthReq>,
  res: MedusaResponse
) => {
  const { result } = await createWiperLengthWorkflow(req.scope).run({
    input: req.validatedBody,
  });

  res.json({ wiperLength: result });
};

