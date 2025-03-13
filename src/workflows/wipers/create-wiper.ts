import {
  createStep,
  StepResponse,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { WIPERS_MODULE } from "../../modules/wipers";
import WipersModuleService from "../../modules/wipers/service";

export type CreateWiperStepInput = {
  name?: false;
  code?: false;
  kits_ids?: string[];
};

export const createWiperStep = createStep(
  "create-wiper-step",
  async (input: CreateWiperStepInput, { container }) => {
    const wipersModuleService: WipersModuleService = 
      container.resolve(WIPERS_MODULE);

    const wiper = await wipersModuleService.createWipers(input);

    return new StepResponse(wiper, wiper.id);
  },
  async (id: string, { container }) => {
    const wipersModuleService: WipersModuleService = 
      container.resolve(WIPERS_MODULE);

    await wipersModuleService.deleteWipers(id);
  }
);

type CreateWiperWorkflowInput = CreateWiperStepInput;

export const createWiperWorkflow = createWorkflow(
  "create-wiper-workflow",
  (input: CreateWiperWorkflowInput) => {
    const wiper = createWiperStep(input);

    return new WorkflowResponse(wiper);
  }
); 