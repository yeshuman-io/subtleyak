import {
  createStep,
  StepResponse,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { WIPERS_MODULE } from "../../modules/wipers";
import WipersModuleService from "../../modules/wipers/service";

export type CreateWiperLengthStepInput = {
  value?: false;
  unit?: false;
};

export const createWiperLengthStep = createStep(
  "create-wiper-length-step",
  async (input: CreateWiperLengthStepInput, { container }) => {
    const wipersModuleService: WipersModuleService = 
      container.resolve(WIPERS_MODULE);

    const wiperLength = await wipersModuleService.createWiperLengths(input);

    return new StepResponse(wiperLength, wiperLength.id);
  },
  async (id: string, { container }) => {
    const wipersModuleService: WipersModuleService = 
      container.resolve(WIPERS_MODULE);

    await wipersModuleService.deleteWiperLengths(id);
  }
);

type CreateWiperLengthWorkflowInput = CreateWiperLengthStepInput;

export const createWiperLengthWorkflow = createWorkflow(
  "create-wiper-length-workflow",
  (input: CreateWiperLengthWorkflowInput) => {
    const wiperLength = createWiperLengthStep(input);

    return new WorkflowResponse(wiperLength);
  }
); 