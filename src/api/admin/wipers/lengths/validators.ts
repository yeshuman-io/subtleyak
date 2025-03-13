import { z } from "zod";
import { createFindParams } from "@medusajs/medusa/api/utils/validators";
import WiperLength from "../../../../modules/wipers/models/wiper-length";

export const GetWiperLengthSchema = createFindParams();

export const PostAdminCreateWiperLength = z.object({
  value: z.number(),
  unit: z.string(),
});

export const PostAdminUpdateWiperLength = z.object({
  value: z.number().optional(),
  unit: z.string().optional(),
});

export type AdminCreateWiperLengthReq = z.infer<typeof PostAdminCreateWiperLength>;
export type AdminUpdateWiperLengthReq = z.infer<typeof PostAdminUpdateWiperLength>;

export type WiperLengthAdminListRes = {
  items: typeof WiperLength;
  count: number;
  limit: number;
  offset: number;
};