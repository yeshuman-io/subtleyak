import {
  createStep,
  StepResponse,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { WIPERS_MODULE } from "../../modules/wipers";
import WipersModuleService from "../../modules/wipers/service";

export type DeleteWiperStepInput = {
  id: string;
};

export const deleteWiperStep = createStep(
  "delete-wiper-step",
  async (input: DeleteWiperStepInput, { container }) => {
    const wipersModuleService: WipersModuleService = 
      container.resolve(WIPERS_MODULE);

    const original = await wipersModuleService.retrieveWiper(input.id);
    await wipersModuleService.deleteWipers(input.id);

    return new StepResponse(true, { id: input.id, original });
  },
  async (context: { id: string; original: Record<string, any> }, { container }) => {
    const wipersModuleService: WipersModuleService = 
      container.resolve(WIPERS_MODULE);

    await wipersModuleService.createWipers(context.original);
  }
);

type DeleteWiperWorkflowInput = DeleteWiperStepInput;

export const deleteWiperWorkflow = createWorkflow(
  "delete-wiper-workflow",
  (input: DeleteWiperWorkflowInput) => {
    const result = deleteWiperStep(input);

    return new WorkflowResponse(result);
  }
);