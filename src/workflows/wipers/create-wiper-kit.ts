import {
  createStep,
  StepResponse,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { WIPERS_MODULE } from "../../modules/wipers";
import WipersModuleService from "../../modules/wipers/service";

export type CreateWiperKitStepInput = {
  name?: false;
  code?: false;
  wiper_ids?: string[];
};

export const createWiperKitStep = createStep(
  "create-wiper-kit-step",
  async (input: CreateWiperKitStepInput, { container }) => {
    const wipersModuleService: WipersModuleService = 
      container.resolve(WIPERS_MODULE);

    const wiperKit = await wipersModuleService.createWiperKits(input);

    return new StepResponse(wiperKit, wiperKit.id);
  },
  async (id: string, { container }) => {
    const wipersModuleService: WipersModuleService = 
      container.resolve(WIPERS_MODULE);

    await wipersModuleService.deleteWiperKits(id);
  }
);

type CreateWiperKitWorkflowInput = CreateWiperKitStepInput;

export const createWiperKitWorkflow = createWorkflow(
  "create-wiper-kit-workflow",
  (input: CreateWiperKitWorkflowInput) => {
    const wiperKit = createWiperKitStep(input);

    return new WorkflowResponse(wiperKit);
  }
); 