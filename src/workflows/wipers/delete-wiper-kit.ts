import {
  createStep,
  StepResponse,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { WIPERS_MODULE } from "../../modules/wipers";
import WipersModuleService from "../../modules/wipers/service";

export type DeleteWiperKitStepInput = {
  id: string;
};

export const deleteWiperKitStep = createStep(
  "delete-wiper-kit-step",
  async (input: DeleteWiperKitStepInput, { container }) => {
    const wipersModuleService: WipersModuleService = 
      container.resolve(WIPERS_MODULE);

    const original = await wipersModuleService.retrieveWiperKit(input.id);
    await wipersModuleService.deleteWiperKits(input.id);

    return new StepResponse(true, { id: input.id, original });
  },
  async (context: { id: string; original: Record<string, any> }, { container }) => {
    const wipersModuleService: WipersModuleService = 
      container.resolve(WIPERS_MODULE);

    await wipersModuleService.createWiperKits(context.original);
  }
);

type DeleteWiperKitWorkflowInput = DeleteWiperKitStepInput;

export const deleteWiperKitWorkflow = createWorkflow(
  "delete-wiper-kit-workflow",
  (input: DeleteWiperKitWorkflowInput) => {
    const result = deleteWiperKitStep(input);

    return new WorkflowResponse(result);
  }
);