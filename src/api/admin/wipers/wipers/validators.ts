import { z } from "zod";
import { createFindParams } from "@medusajs/medusa/api/utils/validators";

export const GetWiperSchema = createFindParams();

export const PostAdminCreateWiper = z.object({
  name: z.string(),
  code: z.string(),
  kits_ids: z.array(z.string().min(1)),
});

export const PostAdminUpdateWiper = z.object({
  name: z.string().optional(),
  code: z.string().optional(),
  kits_ids: z.array(z.string().min(1)).optional(),
});

export type AdminCreateWiperReq = z.infer<typeof PostAdminCreateWiper>;
export type AdminUpdateWiperReq = z.infer<typeof PostAdminUpdateWiper>;

export type AdminListRes = {
  items: any[];
  count: number;
  limit: number;
  offset: number;
}; 