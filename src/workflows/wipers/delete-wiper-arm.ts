import {
  createStep,
  StepResponse,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { WIPERS_MODULE } from "../../modules/wipers";
import WipersModuleService from "../../modules/wipers/service";

export type DeleteWiperArmStepInput = {
  id: string;
};

export const deleteWiperArmStep = createStep(
  "delete-wiper-arm-step",
  async (input: DeleteWiperArmStepInput, { container }) => {
    const wipersModuleService: WipersModuleService = 
      container.resolve(WIPERS_MODULE);

    const original = await wipersModuleService.retrieveWiperArm(input.id);
    await wipersModuleService.deleteWiperArms(input.id);

    return new StepResponse(true, { id: input.id, original });
  },
  async (context: { id: string; original: Record<string, any> }, { container }) => {
    const wipersModuleService: WipersModuleService = 
      container.resolve(WIPERS_MODULE);

    await wipersModuleService.createWiperArms(context.original);
  }
);

type DeleteWiperArmWorkflowInput = DeleteWiperArmStepInput;

export const deleteWiperArmWorkflow = createWorkflow(
  "delete-wiper-arm-workflow",
  (input: DeleteWiperArmWorkflowInput) => {
    const result = deleteWiperArmStep(input);

    return new WorkflowResponse(result);
  }
);