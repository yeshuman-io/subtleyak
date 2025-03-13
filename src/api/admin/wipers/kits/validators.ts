import { z } from "zod";
import { createFindParams } from "@medusajs/medusa/api/utils/validators";
import WiperKit from "../../../../modules/wipers/models/wiper-kit";

export const GetWiperKitSchema = createFindParams();

export const PostAdminCreateWiperKit = z.object({
  name: z.string(),
  code: z.string(),
  wiper_id: z.string().min(1),
});

export const PostAdminUpdateWiperKit = z.object({
  name: z.string().optional(),
  code: z.string().optional(),
  wiper_id: z.string().min(1).optional(),
});

export type AdminCreateWiperKitReq = z.infer<typeof PostAdminCreateWiperKit>;
export type AdminUpdateWiperKitReq = z.infer<typeof PostAdminUpdateWiperKit>;

export type WiperKitAdminListRes = {
  items: typeof WiperKit;
  count: number;
  limit: number;
  offset: number;
};