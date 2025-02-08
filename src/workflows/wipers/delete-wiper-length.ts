import {
  createStep,
  StepResponse,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { WIPERS_MODULE } from "../../modules/wipers";
import WipersModuleService from "../../modules/wipers/service";

export type DeleteWiperLengthStepInput = {
  id: string;
};

export const deleteWiperLengthStep = createStep(
  "delete-wiper-length-step",
  async (input: DeleteWiperLengthStepInput, { container }) => {
    const wipersModuleService: WipersModuleService = 
      container.resolve(WIPERS_MODULE);

    const original = await wipersModuleService.retrieveWiperLength(input.id);
    await wipersModuleService.deleteWiperLengths(input.id);

    return new StepResponse(true, { id: input.id, original });
  },
  async (context: { id: string; original: Record<string, any> }, { container }) => {
    const wipersModuleService: WipersModuleService = 
      container.resolve(WIPERS_MODULE);

    await wipersModuleService.createWiperLengths(context.original);
  }
);

type DeleteWiperLengthWorkflowInput = DeleteWiperLengthStepInput;

export const deleteWiperLengthWorkflow = createWorkflow(
  "delete-wiper-length-workflow",
  (input: DeleteWiperLengthWorkflowInput) => {
    const result = deleteWiperLengthStep(input);

    return new WorkflowResponse(result);
  }
);